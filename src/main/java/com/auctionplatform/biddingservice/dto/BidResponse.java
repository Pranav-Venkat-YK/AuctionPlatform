package com.auctionplatform.biddingservice.dto;

import com.auctionplatform.biddingservice.model.Bid;
import com.auctionplatform.biddingservice.model.BidStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class BidResponse {
    private Long id;
    private Long auctionId;
    private Long bidderId;
    private BigDecimal amount;
    private LocalDateTime timestamp;
    private BidStatus status;
    private String message;

    public BidResponse() {
    }

    public BidResponse(Long id, Long auctionId, Long bidderId, BigDecimal amount, LocalDateTime timestamp, BidStatus status, String message) {
        this.id = id;
        this.auctionId = auctionId;
        this.bidderId = bidderId;
        this.amount = amount;
        this.timestamp = timestamp;
        this.status = status;
        this.message = message;
    }

    public static BidResponse fromEntity(Bid bid, String message) {
        return new BidResponse(
            bid.getId(),
            bid.getAuctionId(),
            bid.getBidderId(),
            bid.getAmount(),
            bid.getTimestamp(),
            bid.getStatus(),
            message
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public BidStatus getStatus() {
        return status;
    }

    public void setStatus(BidStatus status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
