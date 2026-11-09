package com.auctionplatform.paymentservice.kafka;

import com.auctionplatform.paymentservice.event.PaymentCompletedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class PaymentEventProducer {

    private static final Logger log = LoggerFactory.getLogger(PaymentEventProducer.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.kafka.topics.payment-completed:payment-completed-topic}")
    private String paymentCompletedTopic;

    @Value("${app.kafka.enabled:true}")
    private boolean kafkaEnabled;

    public PaymentEventProducer(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishPaymentCompleted(PaymentCompletedEvent event) {
        if (!kafkaEnabled) {
            log.info("Kafka is disabled. Skipping payment completed event for auctionId={}", event.getAuctionId());
            return;
        }

        String key = String.valueOf(event.getAuctionId());
        log.info("Publishing PaymentCompletedEvent to topic={} for auctionId={}", paymentCompletedTopic, key);

        kafkaTemplate.send(paymentCompletedTopic, key, event)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("Successfully published PaymentCompletedEvent for auctionId={} offset={}",
                                event.getAuctionId(), result.getRecordMetadata().offset());
                    } else {
                        log.error("Failed to publish PaymentCompletedEvent for auctionId={}: {}",
                                event.getAuctionId(), ex.getMessage(), ex);
                    }
                });
    }
}

