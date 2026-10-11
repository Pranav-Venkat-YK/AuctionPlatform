package com.auctionplatform.auctionservice.service;

import com.auctionplatform.auctionservice.entity.OutboxEvent;
import com.auctionplatform.auctionservice.entity.OutboxStatus;
import com.auctionplatform.auctionservice.repository.OutboxEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OutboxPublisher {

    private static final Logger log = LoggerFactory.getLogger(OutboxPublisher.class);

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.kafka.topics.auction-activated:auction-activated-topic}")
    private String auctionActivatedTopic;

    @Value("${app.kafka.topics.auction-closed:auction-closed-topic}")
    private String auctionClosedTopic;

    public OutboxPublisher(
            OutboxEventRepository outboxEventRepository,
            KafkaTemplate<String, Object> kafkaTemplate) {
        this.outboxEventRepository = outboxEventRepository;
        this.kafkaTemplate = kafkaTemplate;
    }

    /**
     * Periodically polls pending outbox events and publishes them to Kafka.
     * Guarantees fail-safe, resilient at-least-once event streaming.
     */
    @Scheduled(fixedDelayString = "${app.outbox.fixed-delay-ms:2000}")
    @Transactional
    public void publishPendingOutboxEvents() {
        List<OutboxEvent> pendingEvents = outboxEventRepository.findByStatusOrderByCreatedAtAsc(
                OutboxStatus.PENDING, PageRequest.of(0, 50));

        if (pendingEvents.isEmpty()) {
            return;
        }

        log.debug("Polling outbox: found {} pending events to publish", pendingEvents.size());

        for (OutboxEvent event : pendingEvents) {
            String topic = resolveTopic(event.getEventType());
            String key = event.getAggregateId();

            if (topic == null) {
                log.warn("Unknown event type {} for outbox event id={}", event.getEventType(), event.getId());
                continue;
            }

            try {
                kafkaTemplate.send(topic, key, event.getPayload())
                        .whenComplete((result, ex) -> {
                            if (ex == null) {
                                log.info("Successfully published outbox event id={} to topic={} partition={} offset={}",
                                        event.getId(), topic, result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
                                markAsProcessed(event.getId());
                            } else {
                                log.error("Failed to publish outbox event id={} to topic={}: {}",
                                        event.getId(), topic, ex.getMessage(), ex);
                                markAsFailed(event.getId());
                            }
                        });
            } catch (Exception e) {
                log.error("Exception initiating Kafka send for outbox event id={}: {}", event.getId(), e.getMessage(), e);
                markAsFailed(event.getId());
            }
        }
    }

    private String resolveTopic(String eventType) {
        if ("AUCTION_STARTED".equalsIgnoreCase(eventType) || "AUCTION_ACTIVATED".equalsIgnoreCase(eventType)) {
            return auctionActivatedTopic;
        } else if ("AUCTION_ENDED".equalsIgnoreCase(eventType) || "AUCTION_CLOSED".equalsIgnoreCase(eventType)) {
            return auctionClosedTopic;
        }
        return null;
    }

    @Transactional
    public void markAsProcessed(Long eventId) {
        outboxEventRepository.findById(eventId).ifPresent(event -> {
            event.setStatus(OutboxStatus.PROCESSED);
            event.setProcessedAt(LocalDateTime.now());
            outboxEventRepository.save(event);
        });
    }

    @Transactional
    public void markAsFailed(Long eventId) {
        outboxEventRepository.findById(eventId).ifPresent(event -> {
            event.setStatus(OutboxStatus.FAILED);
            outboxEventRepository.save(event);
        });
    }
}
