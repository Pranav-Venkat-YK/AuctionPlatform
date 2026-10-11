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
public class BidPlacedEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long auctionId;
    private Long bidderId;
    private BigDecimal amount;
    private Long previousBidderId;
    private LocalDateTime timestamp;
}
