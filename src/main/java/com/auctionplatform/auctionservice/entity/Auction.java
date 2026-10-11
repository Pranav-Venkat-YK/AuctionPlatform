package com.auctionplatform.auctionservice.entity;

import com.auctionplatform.auctionservice.entity.converter.JsonAttributeConverter;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(
    name = "auctions",
    indexes = {
        @Index(name = "idx_auctions_status", columnList = "status"),
        @Index(name = "idx_auctions_seller_id", columnList = "seller_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Auction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Column(name = "seller_id", nullable = false)
    private Long sellerId;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private AuctionStatus status;

    @NotNull
    @DecimalMin(value = "0.00", inclusive = true)
    @Column(name = "starting_price", nullable = false, precision = 19, scale = 4)
    private BigDecimal startingPrice;

    @NotNull
    @DecimalMin(value = "0.00", inclusive = true)
    @Column(name = "current_price", nullable = false, precision = 19, scale = 4)
    private BigDecimal currentPrice;

    @Column(name = "reserve_price", precision = 19, scale = 4)
    private BigDecimal reservePrice;

    @NotNull
    @DecimalMin(value = "0.01", inclusive = true)
    @Column(name = "min_bid_increment", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal minBidIncrement = BigDecimal.ONE;

    @Column(name = "highest_bidder_id")
    private Long highestBidderId;

    @Convert(converter = JsonAttributeConverter.class)
    @Column(name = "item_attributes", columnDefinition = "jsonb")
    private Map<String, Object> itemAttributes;

    @NotNull
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @NotNull
    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Version
    @Column(name = "version")
    private Long version;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        this.updatedAt = now;
        if (this.status == null) {
            this.status = AuctionStatus.DRAFT;
        }
        if (this.currentPrice == null && this.startingPrice != null) {
            this.currentPrice = this.startingPrice;
        }
        if (this.minBidIncrement == null) {
            this.minBidIncrement = BigDecimal.ONE;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
