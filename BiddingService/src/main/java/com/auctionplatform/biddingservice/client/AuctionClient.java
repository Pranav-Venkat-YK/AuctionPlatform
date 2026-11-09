package com.auctionplatform.biddingservice.client;

import com.auctionplatform.biddingservice.client.dto.AuctionResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "auction-service", url = "${app.auction-service.url:http://localhost:8083}")
public interface AuctionClient {

    @GetMapping("/auctions/{id}")
    AuctionResponse getAuctionById(@PathVariable("id") Long id);
}
