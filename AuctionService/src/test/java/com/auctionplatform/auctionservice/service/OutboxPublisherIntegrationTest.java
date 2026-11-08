package com.auctionplatform.auctionservice.service;

import com.auctionplatform.auctionservice.entity.OutboxEvent;
import com.auctionplatform.auctionservice.entity.OutboxStatus;
import com.auctionplatform.auctionservice.repository.OutboxEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.concurrent.CompletableFuture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
public class OutboxPublisherIntegrationTest {

    @Autowired
    private OutboxPublisher outboxPublisher;

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @MockBean
    private KafkaTemplate<String, Object> kafkaTemplate;

    @BeforeEach
    void setUp() {
        outboxEventRepository.deleteAll();
    }

    @Test
    @DisplayName("OutboxPublisher: Read PENDING outbox events and publish to Kafka topic")
    void testPublishPendingOutboxEvents() {
        OutboxEvent pendingEvent = OutboxEvent.builder()
                .aggregateType("AUCTION")
                .aggregateId("1001")
                .eventType("AUCTION_STARTED")
                .payload("{\"auctionId\":1001, \"status\":\"ACTIVE\"}")
                .status(OutboxStatus.PENDING)
                .build();
        OutboxEvent saved = outboxEventRepository.save(pendingEvent);

        SendResult<String, Object> mockSendResult = mock(SendResult.class, RETURNS_DEEP_STUBS);
        when(kafkaTemplate.send(eq("auction-activated-topic"), eq("1001"), anyString()))
                .thenReturn(CompletableFuture.completedFuture(mockSendResult));

        outboxPublisher.publishPendingOutboxEvents();

        verify(kafkaTemplate, times(1)).send(eq("auction-activated-topic"), eq("1001"), anyString());
    }
}
