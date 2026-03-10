-- Migration: Create PostgreSQL extensions
-- Required before any UUID generation or cryptographic functions

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
