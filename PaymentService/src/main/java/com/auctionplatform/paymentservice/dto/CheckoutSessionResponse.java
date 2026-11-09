package com.auctionplatform.paymentservice.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutSessionResponse {
    private Long paymentId;
    private Long auctionId;
    private String sessionId;
    private String checkoutUrl;
    private BigDecimal amount;
    private String currency;
}

