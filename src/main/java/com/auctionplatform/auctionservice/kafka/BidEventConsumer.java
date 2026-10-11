package com.auctionplatform.auctionservice.kafka;

import com.auctionplatform.auctionservice.entity.Auction;
import com.auctionplatform.auctionservice.entity.AuctionHistory;
import com.auctionplatform.auctionservice.event.BidPlacedEvent;
import com.auctionplatform.auctionservice.repository.AuctionHistoryRepository;
import com.auctionplatform.auctionservice.repository.AuctionRepository;
import com.auctionplatform.auctionservice.service.AuctionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class BidEventConsumer {

    private static final Logger log = LoggerFactory.getLogger(BidEventConsumer.class);

    private final AuctionRepository auctionRepository;
    private final AuctionHistoryRepository auctionHistoryRepository;
    private final AuctionService auctionService;

    public BidEventConsumer(
            AuctionRepository auctionRepository,
            AuctionHistoryRepository auctionHistoryRepository,
            AuctionService auctionService) {
        this.auctionRepository = auctionRepository;
        this.auctionHistoryRepository = auctionHistoryRepository;
        this.auctionService = auctionService;
    }

    /**
     * Listens to BidPlacedEvent published by Bidding Service to synchronize currentPrice and highestBidderId in Auction Service.
     */
    @KafkaListener(
            topics = "${app.kafka.topics.bid-placed:bid-placed-topic}",
            groupId = "${spring.kafka.consumer.group-id:auction-group}"
    )
    @Transactional
    public void consumeBidPlacedEvent(BidPlacedEvent event) {
        log.info("Received BidPlacedEvent for auctionId={}, bidderId={}, amount={}",
                event.getAuctionId(), event.getBidderId(), event.getAmount());

        Optional<Auction> auctionOpt = auctionRepository.findById(event.getAuctionId());
        if (auctionOpt.isEmpty()) {
            log.warn("Auction not found for incoming BidPlacedEvent: auctionId={}", event.getAuctionId());
            return;
        }

        Auction auction = auctionOpt.get();

        // Update current price & highest bidder id
        auction.setCurrentPrice(event.getAmount());
        auction.setHighestBidderId(event.getBidderId());
        auctionRepository.save(auction);

        // Record history log
        AuctionHistory history = AuctionHistory.builder()
                .auctionId(auction.getId())
                .status(auction.getStatus())
                .price(event.getAmount())
                .changedBy("BIDDER_" + event.getBidderId())
                .changeReason("Bid placed successfully")
                .build();
        auctionHistoryRepository.save(history);

        // Evict cache
        auctionService.evictAuctionCache(auction.getId());

        log.info("Successfully updated auctionId={} with new currentPrice={} and highestBidderId={}",
                auction.getId(), event.getAmount(), event.getBidderId());
    }
}
