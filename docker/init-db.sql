-- Create isolated databases for both microservices
SELECT 'CREATE DATABASE identity_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'identity_db')\gexec

SELECT 'CREATE DATABASE queue_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'queue_db')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE identity_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE queue_db TO postgres;
