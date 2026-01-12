-- Initialize Asset Management System Database

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "timescaledb";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS timescale;

-- Grant permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA timescale TO postgres;

-- Create initial database structure will be handled by Prisma migrations
-- This file sets up extensions and schemas only

-- Log setup completion
DO $$
BEGIN
    RAISE NOTICE 'Asset Management System database initialized successfully';
    RAISE NOTICE 'Extensions enabled: uuid-ossp, pgcrypto, timescaledb, postgis';
END $$;
