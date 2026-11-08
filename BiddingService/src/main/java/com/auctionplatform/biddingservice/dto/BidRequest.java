package com.auctionplatform.biddingservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class BidRequest {

    @NotNull(message = "Bidder ID cannot be null")
    private Long bidderId;

    @NotNull(message = "Bid amount cannot be null")
    @DecimalMin(value = "0.01", inclusive = true, message = "Bid amount must be greater than 0")
    private BigDecimal amount;

    public BidRequest() {
    }

    public BidRequest(Long bidderId, BigDecimal amount) {
        this.bidderId = bidderId;
        this.amount = amount;
    }

    public Long getBidderId() {
        return bidderId;
    }

    public void setBidderId(Long bidderId) {
        this.bidderId = bidderId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
