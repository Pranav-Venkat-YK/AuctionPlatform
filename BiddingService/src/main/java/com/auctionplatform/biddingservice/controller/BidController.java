package com.auctionplatform.biddingservice.controller;

import com.auctionplatform.biddingservice.dto.BidRequest;
import com.auctionplatform.biddingservice.dto.BidResponse;
import com.auctionplatform.biddingservice.dto.HighestBidDto;
import com.auctionplatform.biddingservice.model.Bid;
import com.auctionplatform.biddingservice.service.BidService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auctions")
public class BidController {

    private final BidService bidService;

    public BidController(BidService bidService) {
        this.bidService = bidService;
    }

    @PostMapping("/{id}/bids")
    public ResponseEntity<BidResponse> placeBid(
            @PathVariable("id") Long id,
            @Valid @RequestBody BidRequest bidRequest) {
        BidResponse response = bidService.placeBid(id, bidRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}/highest-bid")
    public ResponseEntity<HighestBidDto> getHighestBid(@PathVariable("id") Long id) {
        HighestBidDto highestBid = bidService.getCurrentHighestBid(id);
        if (highestBid == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(highestBid);
    }

    @GetMapping("/{id}/bids")
    public ResponseEntity<Page<Bid>> getBidHistory(
            @PathVariable("id") Long id,
            @PageableDefault(page = 0, size = 20, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<Bid> bids = bidService.getBidHistory(id, pageable);
        return ResponseEntity.ok(bids);
    }
}
