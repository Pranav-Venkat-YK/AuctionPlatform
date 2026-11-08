package com.auctionplatform.biddingservice.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

@Entity
@Table(name = "current_highest_bids")
public class CurrentHighestBid {

    @Id
    @Column(name = "auction_id", nullable = false)
    private Long auctionId;

    @NotNull
    @DecimalMin(value = "0.01", inclusive = true)
    @Column(name = "current_amount", nullable = false, precision = 19, scale = 4)
    private BigDecimal currentAmount;

    @NotNull
    @Column(name = "current_bidder_id", nullable = false)
    private Long currentBidderId;

    @Version
    @Column(name = "version")
    private Long version;

    public CurrentHighestBid() {
    }

    public CurrentHighestBid(Long auctionId, BigDecimal currentAmount, Long currentBidderId) {
        this.auctionId = auctionId;
        this.currentAmount = currentAmount;
        this.currentBidderId = currentBidderId;
    }

    // Getters and Setters

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
