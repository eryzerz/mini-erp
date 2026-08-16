-- Create the test database alongside the main one so e2e tests can run
-- against a throwaway schema without polluting dev data.
SELECT 'CREATE DATABASE slm_erp_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'slm_erp_test')\gexec
