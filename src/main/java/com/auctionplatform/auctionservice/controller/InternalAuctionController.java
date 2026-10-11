package com.auctionplatform.auctionservice.controller;

import com.auctionplatform.auctionservice.dto.AuctionStatusResponse;
import com.auctionplatform.auctionservice.service.AuctionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/auctions")
public class InternalAuctionController {

    private final AuctionService auctionService;

    public InternalAuctionController(AuctionService auctionService) {
        this.auctionService = auctionService;
    }

    /**
     * Synchronous status check endpoint called on the hot path by Bidding Service.
     */
    @GetMapping("/{id}/status")
    public ResponseEntity<AuctionStatusResponse> getAuctionStatus(@PathVariable("id") Long id) {
        AuctionStatusResponse statusResponse = auctionService.getAuctionStatus(id);
        return ResponseEntity.ok(statusResponse);
    }
}
