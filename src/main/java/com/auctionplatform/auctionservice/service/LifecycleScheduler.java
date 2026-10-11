package com.auctionplatform.auctionservice.service;

import com.auctionplatform.auctionservice.entity.*;
import com.auctionplatform.auctionservice.repository.AuctionHistoryRepository;
import com.auctionplatform.auctionservice.repository.AuctionRepository;
import com.auctionplatform.auctionservice.repository.OutboxEventRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class LifecycleScheduler {

    private static final Logger log = LoggerFactory.getLogger(LifecycleScheduler.class);

    private final AuctionRepository auctionRepository;
    private final AuctionHistoryRepository auctionHistoryRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final AuctionService auctionService;
    private final ObjectMapper objectMapper;

    @Value("${app.scheduler.batch-size:50}")
    private int batchSize;

    public LifecycleScheduler(
            AuctionRepository auctionRepository,
            AuctionHistoryRepository auctionHistoryRepository,
            OutboxEventRepository outboxEventRepository,
            AuctionService auctionService,
            ObjectMapper objectMapper) {
        this.auctionRepository = auctionRepository;
        this.auctionHistoryRepository = auctionHistoryRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.auctionService = auctionService;
        this.objectMapper = objectMapper;
    }

    /**
     * Executes every 5 seconds to transition scheduled auctions to ACTIVE and expired live auctions to CLOSED.
     * Uses SELECT ... FOR UPDATE SKIP LOCKED and batching to guarantee horizontal scaling safety and lock isolation.
     */
    @Scheduled(fixedDelayString = "${app.scheduler.fixed-delay-ms:5000}")
    @Transactional
    public void processAuctionLifecycleTransitions() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Process Pending/Draft auctions ready to start
        processAuctionsToStart(now);

        // 2. Process Active auctions ready to close
        processAuctionsToEnd(now);
    }

    private void processAuctionsToStart(LocalDateTime now) {
        List<Auction> toStart = auctionRepository.findAuctionsToStartForUpdateSkipLocked(
                AuctionStatus.DRAFT.name(), now, batchSize);

        if (toStart.isEmpty()) {
            return;
        }

        log.info("Scheduler starting {} auctions", toStart.size());

        for (Auction auction : toStart) {
            auction.setStatus(AuctionStatus.ACTIVE);
            auctionRepository.save(auction);

            // Record history
            AuctionHistory history = AuctionHistory.builder()
                    .auctionId(auction.getId())
                    .status(AuctionStatus.ACTIVE)
                    .price(auction.getCurrentPrice())
                    .changedBy("SCHEDULER")
                    .changeReason("Auto-activated by lifecycle scheduler")
                    .build();
            auctionHistoryRepository.save(history);

            // Evict cache
            auctionService.evictAuctionCache(auction.getId());

            // Enqueue Transactional Outbox Event
            saveOutboxEvent(auction, "AUCTION_STARTED");
        }
    }

    private void processAuctionsToEnd(LocalDateTime now) {
        List<Auction> toEnd = auctionRepository.findAuctionsToEndForUpdateSkipLocked(
                AuctionStatus.ACTIVE.name(), now, batchSize);

        if (toEnd.isEmpty()) {
            return;
        }

        log.info("Scheduler closing {} auctions", toEnd.size());

        for (Auction auction : toEnd) {
            auction.setStatus(AuctionStatus.CLOSED);
            auctionRepository.save(auction);

            // Record history
            AuctionHistory history = AuctionHistory.builder()
                    .auctionId(auction.getId())
                    .status(AuctionStatus.CLOSED)
                    .price(auction.getCurrentPrice())
                    .changedBy("SCHEDULER")
                    .changeReason("Auto-closed by lifecycle scheduler at end_time")
                    .build();
            auctionHistoryRepository.save(history);

            // Evict cache
            auctionService.evictAuctionCache(auction.getId());

            // Enqueue Transactional Outbox Event
            saveOutboxEvent(auction, "AUCTION_ENDED");
        }
    }

    private void saveOutboxEvent(Auction auction, String eventType) {
        try {
            Map<String, Object> payloadMap = new HashMap<>();
            payloadMap.put("auctionId", auction.getId());
            payloadMap.put("title", auction.getTitle());
            payloadMap.put("status", auction.getStatus().name());
            payloadMap.put("finalPrice", auction.getCurrentPrice());
            payloadMap.put("winningBidderId", auction.getHighestBidderId());
            payloadMap.put("sellerId", auction.getSellerId());
            payloadMap.put("timestamp", LocalDateTime.now().toString());

            String payloadJson = objectMapper.writeValueAsString(payloadMap);

            OutboxEvent event = OutboxEvent.builder()
                    .aggregateType("AUCTION")
                    .aggregateId(String.valueOf(auction.getId()))
                    .eventType(eventType)
                    .payload(payloadJson)
                    .status(OutboxStatus.PENDING)
                    .build();

            outboxEventRepository.save(event);
        } catch (Exception e) {
            log.error("Failed to serialize outbox event for auctionId={}: {}", auction.getId(), e.getMessage(), e);
        }
    }
}
