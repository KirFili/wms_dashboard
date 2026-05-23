-- Init script for WMS Dashboard PostgreSQL
-- Creates extensions and schema on first container start

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS wms;
SET search_path TO wms;

-- Seed admin user (password: admin, SHA-256)
INSERT INTO wms.users (id, username, password_hash, role, is_active, created_at, updated_at)
VALUES (
  uuid_generate_v4(), 'admin',
  '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
  'admin', true, now(), now()
)
ON CONFLICT (username) DO NOTHING;