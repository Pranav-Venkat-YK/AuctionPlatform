package com.auctionplatform.biddingservice.repository;

import com.auctionplatform.biddingservice.model.CurrentHighestBid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CurrentHighestBidRepository extends JpaRepository<CurrentHighestBid, Long> {
}
