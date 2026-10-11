package com.auctionplatform.biddingservice.service;

import com.auctionplatform.biddingservice.client.AuctionClient;
import com.auctionplatform.biddingservice.client.dto.AuctionResponse;
import com.auctionplatform.biddingservice.dto.BidRequest;
import com.auctionplatform.biddingservice.dto.BidResponse;
import com.auctionplatform.biddingservice.dto.HighestBidDto;
import com.auctionplatform.biddingservice.event.BidPlacedEvent;
import com.auctionplatform.biddingservice.exception.BidConflictException;
import com.auctionplatform.biddingservice.exception.InvalidBidException;
import com.auctionplatform.biddingservice.kafka.BidEventProducer;
import com.auctionplatform.biddingservice.model.Bid;
import com.auctionplatform.biddingservice.model.BidStatus;
import com.auctionplatform.biddingservice.model.CurrentHighestBid;
import com.auctionplatform.biddingservice.repository.BidRepository;
import com.auctionplatform.biddingservice.repository.CurrentHighestBidRepository;
import feign.FeignException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class BidService {

    private static final Logger log = LoggerFactory.getLogger(BidService.class);
    private static final String HIGHEST_BID_KEY_PREFIX = "auction:highest_bid:";
    private static final Duration CACHE_TTL = Duration.ofHours(24);

    private final BidRepository bidRepository;
    private final CurrentHighestBidRepository currentHighestBidRepository;
    private final AuctionClient auctionClient;
    private final RedisTemplate<String, Object> redisTemplate;
    private final BidEventProducer bidEventProducer;

    public BidService(
            BidRepository bidRepository,
            CurrentHighestBidRepository currentHighestBidRepository,
            AuctionClient auctionClient,
            RedisTemplate<String, Object> redisTemplate,
            BidEventProducer bidEventProducer) {
        this.bidRepository = bidRepository;
        this.currentHighestBidRepository = currentHighestBidRepository;
        this.auctionClient = auctionClient;
        this.redisTemplate = redisTemplate;
        this.bidEventProducer = bidEventProducer;
    }

    /**
     * Places a bid using JPA Optimistic Locking on PostgreSQL as the source of truth.
     * Updates Redis cache and publishes BidPlaced event to Kafka right after successful DB commit.
     */
    @Retryable(
        retryFor = { 
            OptimisticLockingFailureException.class, 
            ObjectOptimisticLockingFailureException.class,
            org.springframework.dao.DataIntegrityViolationException.class 
        },
        maxAttempts = 5,
        backoff = @Backoff(delay = 50, multiplier = 1.5)
    )
    @Transactional
    public BidResponse placeBid(Long auctionId, BidRequest bidRequest) {
        log.info("Attempting to place bid: bidder={}, amount={}, auctionId={}",
                bidRequest.getBidderId(), bidRequest.getAmount(), auctionId);

        // 1. Validate the auction is open via Auction Service Feign client
        AuctionResponse auction = fetchAndValidateAuction(auctionId);

        BigDecimal bidAmount = bidRequest.getAmount();
        Long bidderId = bidRequest.getBidderId();

        // 2. Read current highest bid from PostgreSQL (Source of Truth for writes)
        Optional<CurrentHighestBid> currentHighestBidOpt = currentHighestBidRepository.findById(auctionId);

        BigDecimal currentHighestAmount = currentHighestBidOpt
                .map(CurrentHighestBid::getCurrentAmount)
                .orElse(auction.getStartingPrice() != null ? auction.getStartingPrice() : BigDecimal.ZERO);

        Long previousBidderId = currentHighestBidOpt
                .map(CurrentHighestBid::getCurrentBidderId)
                .orElse(null);

        // 3. Validation: Reject self-outbidding (if current highest bidder is this bidder)
        if (bidderId.equals(previousBidderId)) {
            Bid rejectedBid = new Bid(auctionId, bidderId, bidAmount, LocalDateTime.now(), BidStatus.REJECTED);
            bidRepository.save(rejectedBid);
            throw new InvalidBidException("You are already the highest bidder for this auction.");
        }

        // 4. Validation: Check minimum increment requirement
        BigDecimal minIncrement = auction.getMinBidIncrement() != null && auction.getMinBidIncrement().compareTo(BigDecimal.ZERO) > 0
                ? auction.getMinBidIncrement()
                : BigDecimal.ONE; // default minimum increment of $1.00

        BigDecimal minRequiredBid = currentHighestAmount.add(minIncrement);
        if (bidAmount.compareTo(minRequiredBid) < 0) {
            Bid rejectedBid = new Bid(auctionId, bidderId, bidAmount, LocalDateTime.now(), BidStatus.REJECTED);
            bidRepository.save(rejectedBid);
            throw new InvalidBidException(
                    String.format("Bid amount %s is below the required minimum bid of %s (current: %s, minimum increment: %s)",
                            bidAmount, minRequiredBid, currentHighestAmount, minIncrement));
        }

        // 5. Update or insert CurrentHighestBid (optimistic locking enforced via @Version)
        CurrentHighestBid currentHighestBid;
        if (currentHighestBidOpt.isPresent()) {
            currentHighestBid = currentHighestBidOpt.get();
            currentHighestBid.setCurrentAmount(bidAmount);
            currentHighestBid.setCurrentBidderId(bidderId);
        } else {
            currentHighestBid = new CurrentHighestBid(auctionId, bidAmount, bidderId);
        }

        // Flushes to PostgreSQL to immediately detect version conflicts in this transaction step
        CurrentHighestBid savedHighestBid = currentHighestBidRepository.saveAndFlush(currentHighestBid);

        // 5. Save the accepted bid into the audit log in PostgreSQL
        LocalDateTime now = LocalDateTime.now();
        Bid acceptedBid = new Bid(auctionId, bidderId, bidAmount, now, BidStatus.ACCEPTED);
        Bid savedBid = bidRepository.save(acceptedBid);

        // 6. Update Redis cache right after successful DB write
        updateRedisHighestBid(savedHighestBid);

        // 7. Publish BidPlaced event to Kafka for Notification Service and Auction Service
        BidPlacedEvent event = new BidPlacedEvent(
                auctionId,
                bidderId,
                bidAmount,
                previousBidderId,
                now
        );
        bidEventProducer.publishBidPlacedEvent(event);

        log.info("Bid successfully placed, cached, and published to Kafka for auctionId={}, amount={}", auctionId, bidAmount);
        return BidResponse.fromEntity(savedBid, "Bid successfully placed");
    }

    /**
     * Reads current highest bid from Redis first; if missing (cache miss), reads from Postgres
     * (the source of truth) and populates Redis.
     */
    @Transactional(readOnly = true)
    public HighestBidDto getCurrentHighestBid(Long auctionId) {
        String cacheKey = HIGHEST_BID_KEY_PREFIX + auctionId;

        // Try reading from Redis cache
        try {
            Object cached = redisTemplate.opsForValue().get(cacheKey);
            if (cached instanceof HighestBidDto) {
                return (HighestBidDto) cached;
            }
        } catch (Exception e) {
            log.warn("Redis read failed for key {}. Falling back to PostgreSQL: {}", cacheKey, e.getMessage());
        }

        // Fallback to PostgreSQL (Source of Truth)
        Optional<CurrentHighestBid> highestBidOpt = currentHighestBidRepository.findById(auctionId);
        if (highestBidOpt.isEmpty()) {
            return null;
        }

        CurrentHighestBid entity = highestBidOpt.get();
        HighestBidDto dto = new HighestBidDto(
                entity.getAuctionId(),
                entity.getCurrentAmount(),
                entity.getCurrentBidderId(),
                entity.getVersion()
        );

        // Populate Redis cache asynchronously/safely
        updateRedisHighestBid(entity);

        return dto;
    }

    /**
     * Returns paginated bid history for an auction from PostgreSQL.
     */
    @Transactional(readOnly = true)
    public Page<Bid> getBidHistory(Long auctionId, Pageable pageable) {
        return bidRepository.findByAuctionIdOrderByTimestampDesc(auctionId, pageable);
    }

    /**
     * Returns complete bid history for an auction from PostgreSQL.
     */
    @Transactional(readOnly = true)
    public List<Bid> getBidHistory(Long auctionId) {
        return bidRepository.findByAuctionIdOrderByTimestampDesc(auctionId);
    }

    /**
     * Fallback recovery method if all retry attempts fail due to optimistic locking contention.
     */
    @Recover
    public BidResponse recoverOptimisticLock(Exception e, Long auctionId, BidRequest bidRequest) {
        log.warn("All retry attempts exhausted for placing bid on auctionId={} due to optimistic lock contention", auctionId);
        throw new BidConflictException("Concurrent bid conflict: Another bidder placed a higher bid during processing. Please check the latest price and retry.", e);
    }

    private void updateRedisHighestBid(CurrentHighestBid entity) {
        try {
            String cacheKey = HIGHEST_BID_KEY_PREFIX + entity.getAuctionId();
            HighestBidDto dto = new HighestBidDto(
                    entity.getAuctionId(),
                    entity.getCurrentAmount(),
                    entity.getCurrentBidderId(),
                    entity.getVersion()
            );
            redisTemplate.opsForValue().set(cacheKey, dto, CACHE_TTL);
        } catch (Exception e) {
            // Redis failures should not fail the DB transaction, Postgres is the source of truth
            log.error("Failed to update Redis cache for auctionId {}: {}", entity.getAuctionId(), e.getMessage());
        }
    }

    private AuctionResponse fetchAndValidateAuction(Long auctionId) {
        AuctionResponse auction;
        try {
            auction = auctionClient.getAuctionById(auctionId);
        } catch (FeignException.NotFound e) {
            throw new InvalidBidException("Auction not found with ID: " + auctionId);
        } catch (FeignException e) {
            throw new InvalidBidException("Failed to verify auction status with Auction Service: " + e.getMessage());
        }

        if (auction == null) {
            throw new InvalidBidException("Auction not found with ID: " + auctionId);
        }

        if (!auction.isOpen()) {
            throw new InvalidBidException("Auction is not open for bidding. Current status: " + auction.getStatus());
        }

        if (auction.getEndTime() != null && auction.getEndTime().isBefore(LocalDateTime.now())) {
            throw new InvalidBidException("Auction has already ended at: " + auction.getEndTime());
        }

        return auction;
    }
}
