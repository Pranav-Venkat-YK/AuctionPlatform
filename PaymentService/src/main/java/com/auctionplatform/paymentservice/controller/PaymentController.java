package com.auctionplatform.paymentservice.controller;

import com.auctionplatform.paymentservice.dto.CheckoutSessionResponse;
import com.auctionplatform.paymentservice.dto.PaymentResponse;
import com.auctionplatform.paymentservice.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponse> getPaymentById(@PathVariable("id") Long id) {
        PaymentResponse response = paymentService.getPaymentById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/auction/{auctionId}")
    public ResponseEntity<PaymentResponse> getPaymentByAuctionId(@PathVariable("auctionId") Long auctionId) {
        PaymentResponse response = paymentService.getPaymentByAuctionId(auctionId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByBuyerId(@PathVariable("userId") Long userId) {
        List<PaymentResponse> responses = paymentService.getPaymentsByBuyerId(userId);
        return ResponseEntity.ok(responses);
    }

    @PostMapping("/checkout-session/{paymentId}")
    public ResponseEntity<CheckoutSessionResponse> createCheckoutSession(
            @PathVariable("paymentId") Long paymentId,
            @RequestBody(required = false) Map<String, String> body) {
        String title = (body != null && body.containsKey("title")) ? body.get("title") : null;
        CheckoutSessionResponse sessionResponse = paymentService.initiateCheckout(paymentId, title);
        return ResponseEntity.ok(sessionResponse);
    }

    @PostMapping("/checkout-session/auction/{auctionId}")
    public ResponseEntity<CheckoutSessionResponse> createCheckoutSessionForAuction(
            @PathVariable("auctionId") Long auctionId,
            @RequestBody(required = false) Map<String, String> body) {
        String title = (body != null && body.containsKey("title")) ? body.get("title") : null;
        CheckoutSessionResponse sessionResponse = paymentService.initiateCheckoutForAuction(auctionId, title);
        return ResponseEntity.ok(sessionResponse);
    }

    @PostMapping("/confirm-session")
    public ResponseEntity<PaymentResponse> confirmSession(@RequestParam("sessionId") String sessionId) {
        PaymentResponse response = paymentService.confirmPaymentSession(sessionId);
        return ResponseEntity.ok(response);
    }
}

