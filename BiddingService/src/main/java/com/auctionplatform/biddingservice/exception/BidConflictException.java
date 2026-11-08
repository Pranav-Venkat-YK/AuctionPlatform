package com.auctionplatform.biddingservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class BidConflictException extends RuntimeException {
    public BidConflictException(String message) {
        super(message);
    }

    public BidConflictException(String message, Throwable cause) {
        super(message, cause);
    }
}
