-- liquibase formatted sql

-- changeset auctionplatform:1
CREATE TABLE auctions (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    seller_id BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL,
    starting_price NUMERIC(19, 4) NOT NULL,
    current_price NUMERIC(19, 4) NOT NULL,
    reserve_price NUMERIC(19, 4),
    min_bid_increment NUMERIC(19, 4) NOT NULL DEFAULT 1.0000,
    highest_bidder_id BIGINT,
    item_attributes JSONB,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX idx_auctions_item_attributes ON auctions USING gin (item_attributes);
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_seller_id ON auctions(seller_id);

CREATE TABLE auction_history (
    id BIGSERIAL PRIMARY KEY,
    auction_id BIGINT NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    price NUMERIC(19, 4) NOT NULL,
    changed_by VARCHAR(100),
    change_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auction_history_auction_id ON auction_history(auction_id);

CREATE TABLE outbox (
    id BIGSERIAL PRIMARY KEY,
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

CREATE INDEX idx_outbox_status ON outbox(status);
