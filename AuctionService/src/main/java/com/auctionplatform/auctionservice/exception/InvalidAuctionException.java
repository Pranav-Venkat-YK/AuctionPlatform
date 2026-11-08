package com.auctionplatform.auctionservice.exception;

public class InvalidAuctionException extends RuntimeException {
    public InvalidAuctionException(String message) {
        super(message);
    }
}
