package com.auctionplatform.paymentservice.kafka;

import com.auctionplatform.paymentservice.event.AuctionClosedEvent;
import com.auctionplatform.paymentservice.service.PaymentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class AuctionClosedConsumer {

    private static final Logger log = LoggerFactory.getLogger(AuctionClosedConsumer.class);

    private final PaymentService paymentService;
    private final ObjectMapper objectMapper;

    public AuctionClosedConsumer(PaymentService paymentService, ObjectMapper objectMapper) {
        this.paymentService = paymentService;
        this.objectMapper = objectMapper;
    }

    /**
     * Consumes AuctionClosedEvent published by AuctionService when an auction ends.
     * Automatically creates a PENDING payment record for the winning bidder.
     */
    @KafkaListener(
            topics = "${app.kafka.topics.auction-closed:auction-closed-topic}",
            groupId = "${spring.kafka.consumer.group-id:payment-group}",
            autoStartup = "${app.kafka.enabled:true}"
    )
    public void consumeAuctionClosed(String message) {
        log.info("Received message on auction-closed-topic: {}", message);

        AuctionClosedEvent event;
        try {
            String json = message;
            if (json != null && json.startsWith("\"") && json.endsWith("\"")) {
                json = objectMapper.readValue(json, String.class);
            }
            event = objectMapper.readValue(json, AuctionClosedEvent.class);
        } catch (Exception e) {
            log.error("Failed to deserialize auction closed message {}: {}", message, e.getMessage(), e);
            return;
        }

        if (event == null || event.getAuctionId() == null) {
            log.warn("Ignoring invalid or empty AuctionClosedEvent: {}", message);
            return;
        }

        log.info("Processing AuctionClosedEvent: auctionId={}, winnerId={}, finalPrice={}",
                event.getAuctionId(), event.getWinningBidderId(), event.getFinalPrice());

        paymentService.createPendingPayment(event);
    }
}

