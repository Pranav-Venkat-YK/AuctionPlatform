package com.auctionplatform.paymentservice.dto;

import com.auctionplatform.paymentservice.entity.Payment;
import com.auctionplatform.paymentservice.entity.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {
    private Long id;
    private Long auctionId;
    private Long buyerId;
    private Long sellerId;
    private BigDecimal amount;
    private String currency;
    private PaymentStatus status;
    private String stripeSessionId;
    private String stripePaymentIntentId;
    private String paymentMethod;
    private String receiptUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PaymentResponse fromEntity(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .auctionId(payment.getAuctionId())
                .buyerId(payment.getBuyerId())
                .sellerId(payment.getSellerId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .stripeSessionId(payment.getStripeSessionId())
                .stripePaymentIntentId(payment.getStripePaymentIntentId())
                .paymentMethod(payment.getPaymentMethod())
                .receiptUrl(payment.getReceiptUrl())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .build();
    }
}

