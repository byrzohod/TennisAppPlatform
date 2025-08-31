-- Initialize Tennis App Database
-- This script sets up the initial database configuration

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'UTC';

-- Create any additional configurations here
-- (Entity Framework will handle the table creation via migrations)