-- liquibase formatted sql

-- changeset auctionplatform:2
ALTER TABLE auctions ADD COLUMN IF NOT EXISTS img TEXT;

