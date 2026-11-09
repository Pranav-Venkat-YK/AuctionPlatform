package com.auctionplatform.paymentservice.event;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentCompletedEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long paymentId;
    private Long auctionId;
    private Long buyerId;
    private Long sellerId;
    private BigDecimal amount;
    private String currency;
    private String stripePaymentIntentId;
    private String status;
    private LocalDateTime timestamp;
}

