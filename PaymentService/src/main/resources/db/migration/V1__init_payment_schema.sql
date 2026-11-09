-- liquibase formatted sql

-- changeset auctionplatform:1
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    auction_id BIGINT NOT NULL UNIQUE,
    buyer_id BIGINT NOT NULL,
    seller_id BIGINT NOT NULL,
    amount NUMERIC(19, 4) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'inr',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    stripe_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    payment_method VARCHAR(50),
    receipt_url VARCHAR(512),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_buyer_id ON payments(buyer_id);
CREATE INDEX idx_payments_auction_id ON payments(auction_id);
CREATE INDEX idx_payments_stripe_session_id ON payments(stripe_session_id);
CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);

