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
public class AuctionClosedEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long auctionId;
    private String title;
    private Long sellerId;
    private BigDecimal finalPrice;
    private Long winningBidderId;
    private String status;
    private LocalDateTime timestamp;
}
