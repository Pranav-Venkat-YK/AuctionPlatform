package com.auctionplatform.auctionservice.controller;

import com.auctionplatform.auctionservice.dto.AuctionResponse;
import com.auctionplatform.auctionservice.dto.CreateAuctionRequest;
import com.auctionplatform.auctionservice.entity.AuctionStatus;
import com.auctionplatform.auctionservice.service.AuctionService;
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
public class AuctionController {

    private final AuctionService auctionService;

    public AuctionController(AuctionService auctionService) {
        this.auctionService = auctionService;
    }

    @PostMapping
    public ResponseEntity<AuctionResponse> createAuction(@Valid @RequestBody CreateAuctionRequest request) {
        AuctionResponse response = auctionService.createAuction(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuctionResponse> getAuctionById(@PathVariable("id") Long id) {
        AuctionResponse response = auctionService.getAuctionById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Page<AuctionResponse>> getAllAuctions(
            @RequestParam(name = "status", required = false) AuctionStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AuctionResponse> auctions = auctionService.getAllAuctions(status, pageable);
        return ResponseEntity.ok(auctions);
    }

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<Page<AuctionResponse>> getAuctionsBySeller(
            @PathVariable("sellerId") Long sellerId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<AuctionResponse> auctions = auctionService.getAuctionsBySeller(sellerId, pageable);
        return ResponseEntity.ok(auctions);
    }
}
