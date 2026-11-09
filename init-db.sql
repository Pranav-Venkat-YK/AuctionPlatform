-- Create databases for microservices if they don't already exist
SELECT 'CREATE DATABASE user_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'user_db')\gexec

SELECT 'CREATE DATABASE auction_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'auction_db')\gexec

SELECT 'CREATE DATABASE bidding_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'bidding_db')\gexec

SELECT 'CREATE DATABASE payment_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'payment_db')\gexec

