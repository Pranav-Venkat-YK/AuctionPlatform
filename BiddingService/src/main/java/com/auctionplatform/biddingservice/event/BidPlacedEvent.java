package com.auctionplatform.biddingservice.event;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class BidPlacedEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long auctionId;
    private Long bidderId;
    private BigDecimal amount;
    private Long previousBidderId;
    private LocalDateTime timestamp;

    public BidPlacedEvent() {
    }

    public BidPlacedEvent(Long auctionId, Long bidderId, BigDecimal amount, Long previousBidderId, LocalDateTime timestamp) {
        this.auctionId = auctionId;
        this.bidderId = bidderId;
        this.amount = amount;
        this.previousBidderId = previousBidderId;
        this.timestamp = timestamp;
    }

    public Long getAuctionId() {
        return auctionId;
    }

    public void setAuctionId(Long auctionId) {
        this.auctionId = auctionId;
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

    public Long getPreviousBidderId() {
        return previousBidderId;
    }

    public void setPreviousBidderId(Long previousBidderId) {
        this.previousBidderId = previousBidderId;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    @Override
    public String toString() {
        return "BidPlacedEvent{" +
                "auctionId=" + auctionId +
                ", bidderId=" + bidderId +
                ", amount=" + amount +
                ", previousBidderId=" + previousBidderId +
                ", timestamp=" + timestamp +
                '}';
    }
}
