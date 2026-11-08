package com.auctionplatform.auctionservice.service;

import com.auctionplatform.auctionservice.entity.*;
import com.auctionplatform.auctionservice.repository.AuctionHistoryRepository;
import com.auctionplatform.auctionservice.repository.AuctionRepository;
import com.auctionplatform.auctionservice.repository.OutboxEventRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
public class LifecycleSchedulerIntegrationTest {

    @Autowired
    private LifecycleScheduler lifecycleScheduler;

    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private AuctionHistoryRepository auctionHistoryRepository;

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @MockBean
    private KafkaTemplate<String, Object> kafkaTemplate;

    @BeforeEach
    void setUp() {
        outboxEventRepository.deleteAll();
        auctionHistoryRepository.deleteAll();
        auctionRepository.deleteAll();
    }

    @Test
    @DisplayName("LifecycleScheduler: Auto-activate DRAFT auction whose startTime has elapsed and write to outbox")
    void testAutoActivateDraftAuction() {
        Auction draftAuction = Auction.builder()
                .title("Gaming Console")
                .sellerId(404L)
                .status(AuctionStatus.DRAFT)
                .startingPrice(new BigDecimal("300.00"))
                .currentPrice(new BigDecimal("300.00"))
                .minBidIncrement(new BigDecimal("15.00"))
                .startTime(LocalDateTime.now().minusMinutes(5)) // past start time
                .endTime(LocalDateTime.now().plusHours(2))
                .build();
        Auction saved = auctionRepository.save(draftAuction);

        // Execute lifecycle transitions
        lifecycleScheduler.processAuctionLifecycleTransitions();

        // Verify entity status updated to ACTIVE
        Auction updated = auctionRepository.findById(saved.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(AuctionStatus.ACTIVE);

        // Verify audit history created
        List<AuctionHistory> history = auctionHistoryRepository.findByAuctionIdOrderByCreatedAtDesc(saved.getId());
        assertThat(history).hasSize(1);
        assertThat(history.get(0).getStatus()).isEqualTo(AuctionStatus.ACTIVE);
        assertThat(history.get(0).getChangedBy()).isEqualTo("SCHEDULER");

        // Verify outbox event written
        List<OutboxEvent> outboxEvents = outboxEventRepository.findAll();
        assertThat(outboxEvents).hasSize(1);
        assertThat(outboxEvents.get(0).getEventType()).isEqualTo("AUCTION_STARTED");
        assertThat(outboxEvents.get(0).getStatus()).isEqualTo(OutboxStatus.PENDING);
    }

    @Test
    @DisplayName("LifecycleScheduler: Auto-close ACTIVE auction whose endTime has elapsed and write to outbox")
    void testAutoCloseActiveAuction() {
        Auction activeAuction = Auction.builder()
                .title("Antique Vase")
                .sellerId(505L)
                .status(AuctionStatus.ACTIVE)
                .startingPrice(new BigDecimal("200.00"))
                .currentPrice(new BigDecimal("450.00"))
                .highestBidderId(777L)
                .minBidIncrement(new BigDecimal("20.00"))
                .startTime(LocalDateTime.now().minusHours(5))
                .endTime(LocalDateTime.now().minusMinutes(1)) // past end time
                .build();
        Auction saved = auctionRepository.save(activeAuction);

        // Execute lifecycle transitions
        lifecycleScheduler.processAuctionLifecycleTransitions();

        // Verify entity status updated to CLOSED
        Auction updated = auctionRepository.findById(saved.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(AuctionStatus.CLOSED);

        // Verify audit history created
        List<AuctionHistory> history = auctionHistoryRepository.findByAuctionIdOrderByCreatedAtDesc(saved.getId());
        assertThat(history).hasSize(1);
        assertThat(history.get(0).getStatus()).isEqualTo(AuctionStatus.CLOSED);

        // Verify outbox event written
        List<OutboxEvent> outboxEvents = outboxEventRepository.findAll();
        assertThat(outboxEvents).hasSize(1);
        assertThat(outboxEvents.get(0).getEventType()).isEqualTo("AUCTION_ENDED");
        assertThat(outboxEvents.get(0).getStatus()).isEqualTo(OutboxStatus.PENDING);
    }
}
