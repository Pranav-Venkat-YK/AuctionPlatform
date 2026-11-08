package com.auctionplatform.biddingservice.concurrent;

import com.auctionplatform.biddingservice.client.AuctionClient;
import com.auctionplatform.biddingservice.client.dto.AuctionResponse;
import com.auctionplatform.biddingservice.dto.BidRequest;
import com.auctionplatform.biddingservice.dto.BidResponse;
import com.auctionplatform.biddingservice.kafka.BidEventProducer;
import com.auctionplatform.biddingservice.model.Bid;
import com.auctionplatform.biddingservice.model.BidStatus;
import com.auctionplatform.biddingservice.model.CurrentHighestBid;
import com.auctionplatform.biddingservice.repository.BidRepository;
import com.auctionplatform.biddingservice.repository.CurrentHighestBidRepository;
import com.auctionplatform.biddingservice.service.BidService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("test")
public class ConcurrentBiddingIntegrationTest {

    @Autowired
    private BidService bidService;

    @Autowired
    private BidRepository bidRepository;

    @Autowired
    private CurrentHighestBidRepository currentHighestBidRepository;

    @MockBean
    private AuctionClient auctionClient;

    @MockBean
    private RedisTemplate<String, Object> redisTemplate;

    @MockBean
    private ValueOperations<String, Object> valueOperations;

    @MockBean
    private BidEventProducer bidEventProducer;

    private static final Long AUCTION_ID = 1001L;

    @BeforeEach
    void setUp() {
        bidRepository.deleteAll();
        currentHighestBidRepository.deleteAll();

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        // Mock Auction Service response: Auction is active, starts at $100, min increment is $10
        AuctionResponse mockAuction = new AuctionResponse(
                AUCTION_ID,
                "Vintage Watch",
                "ACTIVE",
                new BigDecimal("100.00"),
                new BigDecimal("100.00"),
                new BigDecimal("10.00"),
                LocalDateTime.now().minusHours(1),
                LocalDateTime.now().plusHours(2)
        );

        when(auctionClient.getAuctionById(AUCTION_ID)).thenReturn(mockAuction);

        // Pre-create current highest bid row at starting price
        CurrentHighestBid initialHighest = new CurrentHighestBid(AUCTION_ID, new BigDecimal("100.00"), 999L);
        currentHighestBidRepository.saveAndFlush(initialHighest);
    }

    @Test
    @DisplayName("Simultaneous Identical Bids: 10 threads bid the exact same amount ($150) -> Exactly 1 succeeds, 9 fail/rejected")
    void testSimultaneousIdenticalBids_OnlyOneWins() throws InterruptedException {
        int threadCount = 10;
        ExecutorService executorService = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        BigDecimal simultaneousBidAmount = new BigDecimal("150.00");

        for (int i = 1; i <= threadCount; i++) {
            final long bidderId = 2000L + i;
            executorService.submit(() -> {
                readyLatch.countDown();
                try {
                    // Wait for all threads to be ready for true concurrency
                    startLatch.await();

                    BidRequest request = new BidRequest(bidderId, simultaneousBidAmount);
                    BidResponse response = bidService.placeBid(AUCTION_ID, request);

                    if (response != null && response.getStatus() == BidStatus.ACCEPTED) {
                        successCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        // Release all threads simultaneously
        readyLatch.await();
        startLatch.countDown();

        // Wait for all threads to finish
        boolean finished = finishLatch.await(10, TimeUnit.SECONDS);
        executorService.shutdown();

        assertThat(finished).isTrue();

        // 1. Assert exactly 1 bid won
        assertThat(successCount.get())
                .as("Only 1 simultaneous bid of $150 should be accepted")
                .isEqualTo(1);

        // 2. Assert other 9 bids failed
        assertThat(failureCount.get())
                .as("9 competing bids should be rejected due to optimistic lock / price check")
                .isEqualTo(9);

        // 3. Verify PostgreSQL CurrentHighestBid source of truth
        CurrentHighestBid highest = currentHighestBidRepository.findById(AUCTION_ID).orElseThrow();
        assertThat(highest.getCurrentAmount()).isEqualByComparingTo(simultaneousBidAmount);

        // 4. Verify Bid audit table contains exactly 1 ACCEPTED bid
        List<Bid> acceptedBids = bidRepository.findAll().stream()
                .filter(b -> b.getStatus() == BidStatus.ACCEPTED)
                .toList();
        assertThat(acceptedBids).hasSize(1);
        assertThat(acceptedBids.get(0).getAmount()).isEqualByComparingTo(simultaneousBidAmount);
    }

    @Test
    @DisplayName("Simultaneous Incremental Bids: 10 threads submit ascending bids concurrently -> Highest bid wins")
    void testSimultaneousAscendingBids_HighestBidWins() throws InterruptedException {
        int threadCount = 8;
        ExecutorService executorService = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(threadCount);

        for (int i = 1; i <= threadCount; i++) {
            final long bidderId = 3000L + i;
            // Bids: $120, $140, $160, $180, $200, $220, $240, $260
            final BigDecimal bidAmount = new BigDecimal(100 + (i * 20));

            executorService.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    BidRequest request = new BidRequest(bidderId, bidAmount);
                    bidService.placeBid(AUCTION_ID, request);
                } catch (Exception ignored) {
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        readyLatch.await();
        startLatch.countDown();

        boolean finished = finishLatch.await(10, TimeUnit.SECONDS);
        executorService.shutdown();

        assertThat(finished).isTrue();

        // Verify the final highest bid in DB equals the highest submitted valid bid ($260)
        CurrentHighestBid finalHighest = currentHighestBidRepository.findById(AUCTION_ID).orElseThrow();
        assertThat(finalHighest.getCurrentAmount()).isEqualByComparingTo(new BigDecimal("260.00"));
        assertThat(finalHighest.getCurrentBidderId()).isEqualTo(3008L);
    }
}
