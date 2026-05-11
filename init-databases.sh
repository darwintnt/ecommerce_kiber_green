#!/bin/bash
set -e

# Connect to default postgres database for server-level commands
echo "Setting up extensions..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname=postgres <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOSQL

# Create service-specific databases
echo "Creating orders_db..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname=postgres -c "CREATE DATABASE orders_db" 2>/dev/null || echo "orders_db already exists"

echo "Creating products_db..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname=postgres -c "CREATE DATABASE products_db" 2>/dev/null || echo "products_db already exists"

echo "Creating inventory_db..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname=postgres -c "CREATE DATABASE inventory_db" 2>/dev/null || echo "inventory_db already exists"

echo "Creating payments_db..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname=postgres -c "CREATE DATABASE payments_db" 2>/dev/null || echo "payments_db already exists"

echo "Databases initialized successfully"