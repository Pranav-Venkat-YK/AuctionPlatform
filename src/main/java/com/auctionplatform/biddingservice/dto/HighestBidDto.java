package com.auctionplatform.biddingservice.dto;

import java.io.Serializable;
import java.math.BigDecimal;

public class HighestBidDto implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long auctionId;
    private BigDecimal currentAmount;
    private Long currentBidderId;
    private Long version;

    public HighestBidDto() {
    }

    public HighestBidDto(Long auctionId, BigDecimal currentAmount, Long currentBidderId, Long version) {
        this.auctionId = auctionId;
        this.currentAmount = currentAmount;
        this.currentBidderId = currentBidderId;
        this.version = version;
    }

    public Long getAuctionId() {
        return auctionId;
    }

    public void setAuctionId(Long auctionId) {
        this.auctionId = auctionId;
    }

    public BigDecimal getCurrentAmount() {
        return currentAmount;
    }

    public void setCurrentAmount(BigDecimal currentAmount) {
        this.currentAmount = currentAmount;
    }

    public Long getCurrentBidderId() {
        return currentBidderId;
    }

    public void setCurrentBidderId(Long currentBidderId) {
        this.currentBidderId = currentBidderId;
    }

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }
}
