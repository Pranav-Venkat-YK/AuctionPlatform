package com.auctionplatform.auctionservice.dto;

import com.auctionplatform.auctionservice.entity.Auction;
import com.auctionplatform.auctionservice.entity.AuctionStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionResponse {

    private Long id;
    private String title;
    private String description;
    private Long sellerId;
    private String status;
    private BigDecimal startingPrice;
    private BigDecimal currentPrice;
    private BigDecimal reservePrice;
    private BigDecimal minBidIncrement;
    private Long highestBidderId;
    private Map<String, Object> itemAttributes;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public boolean isOpen() {
        return "ACTIVE".equalsIgnoreCase(this.status) || "OPEN".equalsIgnoreCase(this.status);
    }

    public static AuctionResponse fromEntity(Auction auction) {
        if (auction == null) {
            return null;
        }
        return AuctionResponse.builder()
                .id(auction.getId())
                .title(auction.getTitle())
                .description(auction.getDescription())
                .sellerId(auction.getSellerId())
                .status(auction.getStatus() != null ? auction.getStatus().name() : null)
                .startingPrice(auction.getStartingPrice())
                .currentPrice(auction.getCurrentPrice())
                .reservePrice(auction.getReservePrice())
                .minBidIncrement(auction.getMinBidIncrement())
                .highestBidderId(auction.getHighestBidderId())
                .itemAttributes(auction.getItemAttributes())
                .startTime(auction.getStartTime())
                .endTime(auction.getEndTime())
                .createdAt(auction.getCreatedAt())
                .updatedAt(auction.getUpdatedAt())
                .build();
    }
}
