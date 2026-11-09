package com.auctionplatform.paymentservice.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class AuctionClosedEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long auctionId;
    private String title;
    private Long sellerId;
    private BigDecimal finalPrice;
    private Long winningBidderId;
    private String status;
    private String timestamp;
}

