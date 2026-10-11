package com.auctionplatform.biddingservice.client.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AuctionResponse {
    private Long id;
    private String title;
    private String status;
    private BigDecimal startingPrice;
    private BigDecimal currentPrice;
    private BigDecimal minBidIncrement;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    public AuctionResponse() {
    }

    public AuctionResponse(Long id, String title, String status, BigDecimal startingPrice, BigDecimal currentPrice, BigDecimal minBidIncrement, LocalDateTime startTime, LocalDateTime endTime) {
        this.id = id;
        this.title = title;
        this.status = status;
        this.startingPrice = startingPrice;
        this.currentPrice = currentPrice;
        this.minBidIncrement = minBidIncrement;
        this.startTime = startTime;
        this.endTime = endTime;
    }

    public boolean isOpen() {
        return "ACTIVE".equalsIgnoreCase(this.status) || "OPEN".equalsIgnoreCase(this.status);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getStartingPrice() {
        return startingPrice;
    }

    public void setStartingPrice(BigDecimal startingPrice) {
        this.startingPrice = startingPrice;
    }

    public BigDecimal getCurrentPrice() {
        return currentPrice;
    }

    public void setCurrentPrice(BigDecimal currentPrice) {
        this.currentPrice = currentPrice;
    }

    public BigDecimal getMinBidIncrement() {
        return minBidIncrement;
    }

    public void setMinBidIncrement(BigDecimal minBidIncrement) {
        this.minBidIncrement = minBidIncrement;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
}
