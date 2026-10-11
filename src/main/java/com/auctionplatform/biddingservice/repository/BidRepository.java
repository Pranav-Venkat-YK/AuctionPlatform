package com.auctionplatform.biddingservice.repository;

import com.auctionplatform.biddingservice.model.Bid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BidRepository extends JpaRepository<Bid, Long> {
    Page<Bid> findByAuctionIdOrderByTimestampDesc(Long auctionId, Pageable pageable);
    List<Bid> findByAuctionIdOrderByTimestampDesc(Long auctionId);
    List<Bid> findByBidderIdOrderByTimestampDesc(Long bidderId);
}
