-- Init script for WMS Dashboard PostgreSQL
-- Creates extensions and schema on first container start

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SCHEMA IF NOT EXISTS wms;
SET search_path TO wms;