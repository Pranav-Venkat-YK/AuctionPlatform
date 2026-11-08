package com.auctionplatform.auctionservice.event;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionActivatedEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long auctionId;
    private String title;
    private Long sellerId;
    private BigDecimal startingPrice;
    private BigDecimal minBidIncrement;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime timestamp;
}
