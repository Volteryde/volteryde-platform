-- ============================================================================
-- VolteRyde Database Setup Script
-- ============================================================================
-- Single setup script for initialising roles, constraints, and admin user.
--
-- Works on:
--   • Local Docker Postgres (volteryde-postgres)
--   • AWS RDS Production
--
-- The script is fully idempotent — safe to run multiple times.
-- It auto-detects which database it is connected to and runs only
-- the relevant section (auth_db vs user_db).
--
-- Usage (local):
--   docker exec volteryde-postgres psql -U postgres -d auth_db -f /tmp/setup-database.sql
--   docker exec volteryde-postgres psql -U postgres -d user_db -f /tmp/setup-database.sql
--
-- Usage (AWS RDS):
--   psql -h <RDS_HOST> -U <USER> -d auth_db -f setup-database.sql
--   psql -h <RDS_HOST> -U <USER> -d user_db -f setup-database.sql
--
-- NOTE: Services do NOT auto-seed on startup. This script is the only
--       way to provision roles and the initial admin user.
-- ============================================================================


-- ============================================================================
-- SECTION A: auth_db
-- Runs only when connected to auth_db (detected by 'roles' table)
-- Targets the svc_auth schema (used by auth-service via DATABASE_SCHEMA env).
-- Falls back to public schema if svc_auth does not exist.
-- ============================================================================
DO $$
DECLARE
  _schema text;
BEGIN
  -- Determine the target schema: prefer svc_auth, fall back to public
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'svc_auth' AND table_name = 'roles'
  ) THEN
    _schema := 'svc_auth';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'roles'
  ) THEN
    _schema := 'public';
  ELSE
    RAISE NOTICE 'Not connected to auth_db — skipping Section A';
    RETURN;
  END IF;

  -- Set search_path so all unqualified table references resolve to _schema
  EXECUTE format('SET LOCAL search_path TO %I, public', _schema);

  RAISE NOTICE '=== auth_db setup (schema: %) ===', _schema;

  -- 1. Fix roles check constraint -------------------------------------------
  EXECUTE format('ALTER TABLE %I.roles DROP CONSTRAINT IF EXISTS roles_name_check', _schema);
  EXECUTE format('ALTER TABLE %I.roles ADD CONSTRAINT roles_name_check
    CHECK (name::text = ANY (ARRAY[
      ''SUPER_ADMIN''::text, ''ADMIN''::text, ''DISPATCHER''::text,
      ''CUSTOMER_SUPPORT''::text, ''SYSTEM_SUPPORT''::text,
      ''PARTNER''::text, ''DRIVER''::text, ''FLEET_MANAGER''::text
    ]))', _schema);
  RAISE NOTICE '  ✓ roles_name_check constraint updated';

  -- 2. Remove deprecated SUPPORT_AGENT (if leftover) ------------------------
  DELETE FROM user_roles
    WHERE role_id IN (SELECT id FROM roles WHERE name = 'SUPPORT_AGENT');
  DELETE FROM roles WHERE name = 'SUPPORT_AGENT';

  -- 3. Seed roles (upsert) --------------------------------------------------
  INSERT INTO roles (name, description) VALUES
    ('SUPER_ADMIN',       'Full system access with all permissions'),
    ('ADMIN',             'Administrative access with most permissions'),
    ('DISPATCHER',        'Dispatch and routing management'),
    ('CUSTOMER_SUPPORT',  'External customer care for end-users'),
    ('SYSTEM_SUPPORT',    'Internal system support for drivers and operations'),
    ('PARTNER',           'Business intelligence and partner portal access'),
    ('DRIVER',            'Driver app access and route management'),
    ('FLEET_MANAGER',     'Fleet and vehicle management')
  ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;
  RAISE NOTICE '  ✓ 8 roles seeded';

  -- 4. Create admin user (only if not exists) --------------------------------
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@volteryde.com') THEN
    INSERT INTO users (
      id, access_id, email, password_hash,
      first_name, last_name, phone_number,
      enabled, email_verified, created_at, updated_at
    ) VALUES (
      gen_random_uuid()::text,
      'VR-A' || lpad((floor(random() * 900000 + 100000))::int::text, 6, '0'),
      'admin@volteryde.com',
      -- BCrypt(12) hash of V0lt3ryd3@Adm1n!2026
      '$2a$12$tQ103IRa2I/pbZR3TuwlROUVfTqkXBx/n1U7r.ofx7u.KKWzeqEEi',
      'VolteRyde', 'Admin', '+233000000000',
      true, true, NOW(), NOW()
    );
    RAISE NOTICE '  ✓ Admin user created (admin@volteryde.com)';
  ELSE
    RAISE NOTICE '  • Admin user already exists — skipped';
  END IF;

  -- 5. Assign SUPER_ADMIN + ADMIN roles to admin ----------------------------
  INSERT INTO user_roles (user_id, role_id)
  SELECT u.id, r.id
  FROM users u, roles r
  WHERE u.email = 'admin@volteryde.com'
    AND r.name IN ('SUPER_ADMIN', 'ADMIN')
  ON CONFLICT (user_id, role_id) DO NOTHING;
  RAISE NOTICE '  ✓ Admin roles assigned';

  -- 6. Clean up legacy test user --------------------------------------------
  DELETE FROM user_roles
    WHERE user_id IN (SELECT id FROM users WHERE email = 'test@volteryde.com');
  DELETE FROM refresh_tokens
    WHERE user_id IN (SELECT id FROM users WHERE email = 'test@volteryde.com');
  DELETE FROM activity_logs
    WHERE user_id IN (SELECT id FROM users WHERE email = 'test@volteryde.com');
  DELETE FROM users WHERE email = 'test@volteryde.com';
  RAISE NOTICE '  ✓ Cleaned up test@volteryde.com';

  RAISE NOTICE '=== auth_db setup complete ===';
END $$;


-- ============================================================================
-- SECTION B: user_db
-- Runs only when connected to user_db (detected by 'users' table with auth_id)
-- Austin — Targets the svc_users schema (used by user-management-service via
-- DATABASE_SCHEMA env). Falls back to public schema if svc_users does not exist.
-- ============================================================================
DO $$
DECLARE
  _schema text;
BEGIN
  -- Austin — Determine the target schema: prefer svc_users, fall back to public
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'svc_users' AND table_name = 'users' AND column_name = 'auth_id'
  ) THEN
    _schema := 'svc_users';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'auth_id'
  ) THEN
    _schema := 'public';
  ELSE
    RAISE NOTICE 'Not connected to user_db — skipping Section B';
    RETURN;
  END IF;

  -- Set search_path so all unqualified table references resolve to _schema
  EXECUTE format('SET LOCAL search_path TO %I, public', _schema);

  RAISE NOTICE '=== user_db setup (schema: %) ===', _schema;

  -- 1. Fix users role check constraint --------------------------------------
  EXECUTE format('ALTER TABLE %I.users DROP CONSTRAINT IF EXISTS users_role_check', _schema);
  EXECUTE format('ALTER TABLE %I.users ADD CONSTRAINT users_role_check
    CHECK (role::text = ANY (ARRAY[
      ''CLIENT''::character varying, ''DRIVER''::character varying,
      ''FLEET_MANAGER''::character varying, ''DISPATCHER''::character varying,
      ''PARTNER''::character varying, ''CUSTOMER_SUPPORT''::character varying,
      ''SYSTEM_SUPPORT''::character varying, ''ADMIN''::character varying,
      ''SUPER_ADMIN''::character varying
    ]::text[]))', _schema);
  RAISE NOTICE '  ✓ users_role_check constraint updated';

  -- 2. Create admin profile (only if not exists) ----------------------------
  --    Austin — auth_id links back to svc_auth.users.id in auth_db.
  --    The access_id must match the one generated in Section A for auth_db.
  IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@volteryde.com') THEN
    INSERT INTO users (
      id, user_id, auth_id, email, first_name, last_name,
      phone_number, role, status, created_at, created_by
    ) VALUES (
      gen_random_uuid(),
      'VR-A' || lpad((floor(random() * 900000 + 100000))::int::text, 6, '0'),
      'pending-auth-sync',
      'admin@volteryde.com',
      'VolteRyde', 'Admin', '+233000000000',
      'SUPER_ADMIN', 'ACTIVE', NOW(), 'SETUP_SCRIPT'
    );
    RAISE NOTICE '  ✓ Admin profile created in schema %', _schema;
  ELSE
    RAISE NOTICE '  • Admin profile already exists in schema % — skipped', _schema;
  END IF;

  -- 3. Clean up legacy test user --------------------------------------------
  DELETE FROM users WHERE email = 'test@volteryde.com';
  RAISE NOTICE '  ✓ Cleaned up test@volteryde.com';

  RAISE NOTICE '=== user_db setup complete (schema: %) ===', _schema;
END $$;


-- ============================================================================
-- Verification (run manually)
-- ============================================================================
-- auth_db (use svc_auth schema if it exists, else public):
--   SELECT name, description FROM svc_auth.roles ORDER BY id;
--   SELECT u.email, u.access_id, u.email_verified,
--          array_agg(r.name) AS roles
--   FROM svc_auth.users u
--   JOIN svc_auth.user_roles ur ON u.id = ur.user_id
--   JOIN svc_auth.roles r ON ur.role_id = r.id
--   WHERE u.email = 'admin@volteryde.com'
--   GROUP BY u.email, u.access_id, u.email_verified;
--
-- user_db (use svc_users schema if it exists, else public):
--   SELECT user_id, email, role, status, auth_id FROM svc_users.users
--   WHERE email = 'admin@volteryde.com';
-- ============================================================================
