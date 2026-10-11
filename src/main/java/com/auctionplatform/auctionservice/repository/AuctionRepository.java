package com.auctionplatform.auctionservice.repository;

import com.auctionplatform.auctionservice.entity.Auction;
import com.auctionplatform.auctionservice.entity.AuctionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuctionRepository extends JpaRepository<Auction, Long> {

    List<Auction> findByStatus(AuctionStatus status);

    Page<Auction> findByStatus(AuctionStatus status, Pageable pageable);

    Page<Auction> findBySellerId(Long sellerId, Pageable pageable);

    @Query("SELECT a FROM Auction a WHERE a.status = :status AND a.startTime <= :now")
    List<Auction> findPendingAuctionsToStart(@Param("status") AuctionStatus status, @Param("now") LocalDateTime now);

    @Query("SELECT a FROM Auction a WHERE a.status = :status AND a.endTime <= :now")
    List<Auction> findActiveAuctionsToEnd(@Param("status") AuctionStatus status, @Param("now") LocalDateTime now);

    @Query(value = "SELECT * FROM auctions WHERE status = :status AND start_time <= :now ORDER BY start_time ASC LIMIT :batchSize FOR UPDATE SKIP LOCKED", nativeQuery = true)
    List<Auction> findAuctionsToStartForUpdateSkipLocked(@Param("status") String status, @Param("now") LocalDateTime now, @Param("batchSize") int batchSize);

    @Query(value = "SELECT * FROM auctions WHERE status = :status AND end_time <= :now ORDER BY end_time ASC LIMIT :batchSize FOR UPDATE SKIP LOCKED", nativeQuery = true)
    List<Auction> findAuctionsToEndForUpdateSkipLocked(@Param("status") String status, @Param("now") LocalDateTime now, @Param("batchSize") int batchSize);
}

