-- Initialize the database
CREATE DATABASE IF NOT EXISTS chatgpt_clone;

-- Create user if not exists (for development)
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'chatgpt_user') THEN
      CREATE ROLE chatgpt_user LOGIN PASSWORD 'chatgpt_password';
   END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE chatgpt_clone TO chatgpt_user;
