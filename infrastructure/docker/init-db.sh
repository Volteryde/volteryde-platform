#!/bin/bash
# ============================================================================
# PostgreSQL Multiple Databases Initialization Script with PostGIS
# ============================================================================

set -e
set -u

function create_user_and_database() {
	local database=$1
	echo "Creating database '$database' (if not exists)"
	
	# Check if database exists before creating
	local exists=$(psql -U "$POSTGRES_USER" -tAc "SELECT 1 FROM pg_database WHERE datname='$database'")
	
	if [ "$exists" != "1" ]; then
		psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
		    CREATE DATABASE $database;
		    GRANT ALL PRIVILEGES ON DATABASE $database TO $POSTGRES_USER;
EOSQL
		echo "Database '$database' created successfully"
	else
		echo "Database '$database' already exists, skipping creation"
	fi

	# Enable PostGIS on each database
	echo "Enabling PostGIS extension on '$database'"
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$database" <<-EOSQL
	    CREATE EXTENSION IF NOT EXISTS postgis;
	    CREATE EXTENSION IF NOT EXISTS postgis_topology;
EOSQL
}

function run_migrations() {
	local migrations_dir="/docker-entrypoint-initdb.d/migrations"
	
	if [ -d "$migrations_dir" ]; then
		echo "Running database migrations from $migrations_dir"
		for migration_file in "$migrations_dir"/*.sql; do
			if [ -f "$migration_file" ]; then
				echo "Executing migration: $(basename $migration_file)"
				psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$migration_file"
			fi
		done
		echo "All migrations completed"
	else
		echo "No migrations directory found at $migrations_dir"
	fi
}

if [ -n "$POSTGRES_MULTIPLE_DATABASES" ]; then
	echo "Multiple database creation requested: $POSTGRES_MULTIPLE_DATABASES"
	for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
		create_user_and_database $db
	done
	echo "Multiple databases created with PostGIS enabled"
fi

# Run migrations on the main database after all databases are created
run_migrations
