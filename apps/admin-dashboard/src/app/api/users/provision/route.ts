/**
 * POST /api/users/provision
 *
 * Austin — Single protected endpoint that provisions a new internal user
 * across ALL required database tables atomically:
 *
 *   1. auth_db → svc_auth.users       (login credentials)
 *   2. auth_db → svc_auth.user_roles  (role assignment)
 *   3. user_db → svc_users.users      (user profile for user-management-service)
 *
 * This ensures the user is created once and appears everywhere immediately.
 * Protected by httpOnly session cookie — only authenticated admins can call this.
 *
 * Returns the generated Access ID so the admin can share it with the new user.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// ─── Austin — Role prefix mapping for Access ID generation ─────────────────
const ROLE_PREFIX: Record<string, string> = {
	SUPER_ADMIN: 'VR-A',
	ADMIN: 'VR-A',
	DISPATCHER: 'VR-DP',
	CUSTOMER_SUPPORT: 'VR-CC',
	SYSTEM_SUPPORT: 'VR-SC',
	PARTNER: 'VR-P',
	DRIVER: 'VR-D',
	FLEET_MANAGER: 'VR-FM',
};

// Austin — Role name → svc_auth.roles.id mapping (seeded by setup-database.sql)
const ROLE_ID_MAP: Record<string, number> = {
	SUPER_ADMIN: 1,
	ADMIN: 2,
	DISPATCHER: 3,
	CUSTOMER_SUPPORT: 4,
	SYSTEM_SUPPORT: 5,
	PARTNER: 6,
	DRIVER: 7,
	FLEET_MANAGER: 8,
};

const SESSION_COOKIE = '__volteryde_session';

// ─── Helpers ───────────────────────────────────────────────────────────────

function decodeJwtPayload(token: string): Record<string, unknown> | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;
		const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
		const json = Buffer.from(base64, 'base64').toString('utf-8');
		return JSON.parse(json);
	} catch {
		return null;
	}
}

function generateAccessId(role: string): string {
	const prefix = ROLE_PREFIX[role] || 'VR-X';
	const num = Math.floor(100000 + Math.random() * 900000); // 6-digit random
	return `${prefix}${num}`;
}

function createDbPool(database: string): Pool {
	return new Pool({
		host: process.env.POSTGRES_HOST || 'localhost',
		port: Number(process.env.POSTGRES_PORT || 5432),
		database,
		user: process.env.POSTGRES_USER || 'postgres',
		password: process.env.POSTGRES_PASSWORD || 'isOpgtfdc.volteryde_2026',
		max: 1,
		idleTimeoutMillis: 5_000,
		connectionTimeoutMillis: 5_000,
	});
}

// ─── POST handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
	// Austin — Auth guard: require valid session with ADMIN or SUPER_ADMIN role
	const token = request.cookies.get(SESSION_COOKIE)?.value;
	if (!token) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const payload = decodeJwtPayload(token);
	if (!payload) {
		return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
	}

	const roles = (payload.roles as string[]) || [];
	if (!roles.includes('ADMIN') && !roles.includes('SUPER_ADMIN')) {
		return NextResponse.json(
			{ error: 'Forbidden — only ADMIN or SUPER_ADMIN can provision users' },
			{ status: 403 },
		);
	}

	// Parse request body
	let body: {
		firstName: string;
		lastName: string;
		email: string;
		phoneNumber?: string;
		password: string;
		role: string;
		organizationId?: string;
	};

	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { firstName, lastName, email, password, role, phoneNumber, organizationId } = body;

	// Validate required fields
	if (!firstName || !lastName || !email || !password || !role) {
		return NextResponse.json(
			{ error: 'Missing required fields: firstName, lastName, email, password, role' },
			{ status: 400 },
		);
	}

	if (!ROLE_PREFIX[role]) {
		return NextResponse.json(
			{ error: `Invalid role: ${role}. Must be one of: ${Object.keys(ROLE_PREFIX).join(', ')}` },
			{ status: 400 },
		);
	}

	if (password.length < 8) {
		return NextResponse.json(
			{ error: 'Password must be at least 8 characters' },
			{ status: 400 },
		);
	}

	// Austin — Generate unique identifiers
	const authUserId = crypto.randomUUID();
	const profileUserId = crypto.randomUUID();
	const accessId = generateAccessId(role);

	// Austin — Debug: log password metadata to diagnose hashing mismatches.
	// Never log the full password — only length and first/last char for verification.
	console.log(`[provision] Creating ${role} user: ${email}, accessId: ${accessId}, pw length: ${password.length}, pw preview: ${password[0]}..${password[password.length - 1]}`);

	// Austin — bcryptjs generates $2b$ hashes, but Spring Boot's BCryptPasswordEncoder
	// only accepts $2a$ prefix. The algorithms are identical; only the prefix differs.
	// We replace $2b$ → $2a$ so the auth-service (Java) can verify passwords correctly.
	const rawHash = await bcrypt.hash(password, 12);
	const passwordHash = rawHash.replace(/^\$2b\$/, '$2a$');

	const roleId = ROLE_ID_MAP[role];

	const authPool = createDbPool('auth_db');
	const userPool = createDbPool('user_db');

	try {
		// ─── Step 1: Check for duplicate email in auth_db ─────────────
		const existing = await authPool.query(
			'SELECT id FROM svc_auth.users WHERE email = $1',
			[email],
		);
		if (existing.rows.length > 0) {
			return NextResponse.json(
				{ error: `User with email ${email} already exists` },
				{ status: 409 },
			);
		}

		// ─── Step 2: Insert into svc_auth.users (auth_db) ─────────────
		await authPool.query(
			`INSERT INTO svc_auth.users (
				id, access_id, email, password_hash,
				first_name, last_name, phone_number,
				organization_id, enabled, email_verified,
				created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, true, NOW(), NOW())`,
			[authUserId, accessId, email, passwordHash, firstName, lastName, phoneNumber || null, organizationId || null],
		);

		// ─── Step 3: Assign role in svc_auth.user_roles (auth_db) ─────
		await authPool.query(
			'INSERT INTO svc_auth.user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
			[authUserId, roleId],
		);

		// Austin — SUPER_ADMIN also gets the ADMIN role
		if (role === 'SUPER_ADMIN') {
			await authPool.query(
				'INSERT INTO svc_auth.user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
				[authUserId, ROLE_ID_MAP.ADMIN],
			);
		}

		// ─── Step 4: Insert into svc_users.users (user_db) ────────────
		await userPool.query(
			`INSERT INTO svc_users.users (
				id, user_id, auth_id, email, first_name, last_name,
				phone_number, role, status, created_at, created_by
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE', NOW(), $9)`,
			[profileUserId, accessId, authUserId, email, firstName, lastName, phoneNumber || null, role, 'ADMIN_PROVISION'],
		);

		return NextResponse.json({
			success: true,
			user: {
				id: profileUserId,
				authId: authUserId,
				accessId,
				email,
				firstName,
				lastName,
				role,
				status: 'ACTIVE',
			},
		}, { status: 201 });

	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		console.error('[provision] Failed to create user:', message);

		// Austin — Best-effort rollback: remove partial data if one DB succeeded
		try {
			await authPool.query('DELETE FROM svc_auth.user_roles WHERE user_id = $1', [authUserId]);
			await authPool.query('DELETE FROM svc_auth.users WHERE id = $1', [authUserId]);
		} catch { /* ignore rollback errors */ }
		try {
			await userPool.query('DELETE FROM svc_users.users WHERE id = $1', [profileUserId]);
		} catch { /* ignore rollback errors */ }

		return NextResponse.json(
			{ error: `Failed to provision user: ${message}` },
			{ status: 500 },
		);
	} finally {
		await authPool.end();
		await userPool.end();
	}
}
