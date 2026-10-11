package com.auctionplatform.biddingservice.kafka;

import com.auctionplatform.biddingservice.event.BidPlacedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class BidEventProducer {

    private static final Logger log = LoggerFactory.getLogger(BidEventProducer.class);

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final String bidPlacedTopic;

    public BidEventProducer(
            KafkaTemplate<String, Object> kafkaTemplate,
            @Value("${app.kafka.topics.bid-placed:bid-placed-topic}") String bidPlacedTopic) {
        this.kafkaTemplate = kafkaTemplate;
        this.bidPlacedTopic = bidPlacedTopic;
    }

    public void publishBidPlacedEvent(BidPlacedEvent event) {
        String key = String.valueOf(event.getAuctionId());
        log.info("Publishing BidPlacedEvent to topic {} with key {}: {}", bidPlacedTopic, key, event);
        
        kafkaTemplate.send(bidPlacedTopic, key, event)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("Successfully published BidPlacedEvent for auctionId={} offset={}",
                                event.getAuctionId(), result.getRecordMetadata().offset());
                    } else {
                        log.error("Failed to publish BidPlacedEvent for auctionId={}: {}",
                                event.getAuctionId(), ex.getMessage(), ex);
                    }
                });
    }
}
