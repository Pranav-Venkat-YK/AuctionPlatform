package com.auctionplatform.auctionservice.dto;

import com.auctionplatform.auctionservice.entity.Auction;
import com.auctionplatform.auctionservice.entity.AuctionStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionStatusResponse {

    private Long id;
    private String status;
    private boolean open;
    private BigDecimal startingPrice;
    private BigDecimal currentPrice;
    private BigDecimal minBidIncrement;
    private LocalDateTime endTime;

    public static AuctionStatusResponse fromEntity(Auction auction) {
        if (auction == null) {
            return null;
        }
        boolean isOpen = auction.getStatus() == AuctionStatus.ACTIVE &&
                (auction.getEndTime() == null || auction.getEndTime().isAfter(LocalDateTime.now()));

        return AuctionStatusResponse.builder()
                .id(auction.getId())
                .status(auction.getStatus() != null ? auction.getStatus().name() : null)
                .open(isOpen)
                .startingPrice(auction.getStartingPrice())
                .currentPrice(auction.getCurrentPrice())
                .minBidIncrement(auction.getMinBidIncrement())
                .endTime(auction.getEndTime())
                .build();
    }
}
