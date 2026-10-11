package com.auctionplatform.auctionservice.service;

import com.auctionplatform.auctionservice.config.CacheConfig;
import com.auctionplatform.auctionservice.dto.AuctionResponse;
import com.auctionplatform.auctionservice.dto.AuctionStatusResponse;
import com.auctionplatform.auctionservice.dto.CreateAuctionRequest;
import com.auctionplatform.auctionservice.entity.Auction;
import com.auctionplatform.auctionservice.entity.AuctionHistory;
import com.auctionplatform.auctionservice.entity.AuctionStatus;
import com.auctionplatform.auctionservice.exception.AuctionNotFoundException;
import com.auctionplatform.auctionservice.exception.InvalidAuctionException;
import com.auctionplatform.auctionservice.repository.AuctionHistoryRepository;
import com.auctionplatform.auctionservice.repository.AuctionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class AuctionService {

    private static final Logger log = LoggerFactory.getLogger(AuctionService.class);

    private final AuctionRepository auctionRepository;
    private final AuctionHistoryRepository auctionHistoryRepository;

    public AuctionService(
            AuctionRepository auctionRepository,
            AuctionHistoryRepository auctionHistoryRepository) {
        this.auctionRepository = auctionRepository;
        this.auctionHistoryRepository = auctionHistoryRepository;
    }

    /**
     * Creates a new auction record and initializes audit history.
     */
    @Transactional
    public AuctionResponse createAuction(CreateAuctionRequest request) {
        log.info("Creating auction titled: '{}' for sellerId: {}", request.getTitle(), request.getSellerId());

        if (request.getEndTime().isBefore(request.getStartTime())) {
            throw new InvalidAuctionException("End time must be after start time");
        }

        if (request.getEndTime().isBefore(LocalDateTime.now())) {
            throw new InvalidAuctionException("End time must be in the future");
        }

        LocalDateTime now = LocalDateTime.now();
        AuctionStatus initialStatus = request.getStartTime().isBefore(now) || request.getStartTime().isEqual(now)
                ? AuctionStatus.ACTIVE
                : AuctionStatus.DRAFT;

        BigDecimal minIncrement = request.getMinBidIncrement() != null && request.getMinBidIncrement().compareTo(BigDecimal.ZERO) > 0
                ? request.getMinBidIncrement()
                : BigDecimal.ONE;

        Auction auction = Auction.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .sellerId(request.getSellerId())
                .status(initialStatus)
                .startingPrice(request.getStartingPrice())
                .currentPrice(request.getStartingPrice())
                .reservePrice(request.getReservePrice())
                .minBidIncrement(minIncrement)
                .itemAttributes(request.getItemAttributes())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .build();

        Auction savedAuction = auctionRepository.save(auction);

        // Record initial history log
        AuctionHistory history = AuctionHistory.builder()
                .auctionId(savedAuction.getId())
                .status(savedAuction.getStatus())
                .price(savedAuction.getCurrentPrice())
                .changedBy("SYSTEM")
                .changeReason("Auction created")
                .build();
        auctionHistoryRepository.save(history);

        log.info("Auction successfully created with id={} status={}", savedAuction.getId(), savedAuction.getStatus());
        return AuctionResponse.fromEntity(savedAuction);
    }

    /**
     * Reads complete details of an auction with caching support.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.AUCTION_CACHE, key = "#id")
    public AuctionResponse getAuctionById(Long id) {
        log.debug("Fetching auction from DB for id={}", id);
        Auction auction = auctionRepository.findById(id)
                .orElseThrow(() -> new AuctionNotFoundException("Auction not found with ID: " + id));
        return AuctionResponse.fromEntity(auction);
    }

    /**
     * Internal status check method optimized for low-latency synchronous calls from Bidding Service.
     */
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.AUCTION_STATUS_CACHE, key = "#id")
    public AuctionStatusResponse getAuctionStatus(Long id) {
        log.debug("Fetching auction status from DB for id={}", id);
        Auction auction = auctionRepository.findById(id)
                .orElseThrow(() -> new AuctionNotFoundException("Auction not found with ID: " + id));
        return AuctionStatusResponse.fromEntity(auction);
    }

    /**
     * Returns paginated list of auctions with optional status filtering.
     */
    @Transactional(readOnly = true)
    public Page<AuctionResponse> getAllAuctions(AuctionStatus status, Pageable pageable) {
        Page<Auction> page = (status != null)
                ? auctionRepository.findByStatus(status, pageable)
                : auctionRepository.findAll(pageable);
        return page.map(AuctionResponse::fromEntity);
    }

    /**
     * Returns paginated list of auctions created by a seller.
     */
    @Transactional(readOnly = true)
    public Page<AuctionResponse> getAuctionsBySeller(Long sellerId, Pageable pageable) {
        return auctionRepository.findBySellerId(sellerId, pageable).map(AuctionResponse::fromEntity);
    }

    /**
     * Internal helper to evict cache entries when auction state changes.
     */
    @CacheEvict(value = {CacheConfig.AUCTION_CACHE, CacheConfig.AUCTION_STATUS_CACHE}, key = "#id")
    public void evictAuctionCache(Long id) {
        log.debug("Evicted cache for auctionId={}", id);
    }
}
