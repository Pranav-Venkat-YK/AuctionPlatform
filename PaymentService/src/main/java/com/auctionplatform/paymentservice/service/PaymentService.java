package com.auctionplatform.paymentservice.service;

import com.auctionplatform.paymentservice.dto.CheckoutSessionResponse;
import com.auctionplatform.paymentservice.dto.PaymentResponse;
import com.auctionplatform.paymentservice.entity.Payment;
import com.auctionplatform.paymentservice.entity.PaymentStatus;
import com.auctionplatform.paymentservice.event.AuctionClosedEvent;
import com.auctionplatform.paymentservice.event.PaymentCompletedEvent;
import com.auctionplatform.paymentservice.exception.PaymentNotFoundException;
import com.auctionplatform.paymentservice.exception.PaymentProcessingException;
import com.auctionplatform.paymentservice.kafka.PaymentEventProducer;
import com.auctionplatform.paymentservice.repository.PaymentRepository;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final StripeService stripeService;
    private final PaymentEventProducer paymentEventProducer;
    private final org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();

    @Value("${stripe.currency:inr}")
    private String defaultCurrency;

    @Value("${app.auction-service.url:http://auction-service:8083}")
    private String auctionServiceUrl;

    public PaymentService(
            PaymentRepository paymentRepository,
            StripeService stripeService,
            PaymentEventProducer paymentEventProducer) {
        this.paymentRepository = paymentRepository;
        this.stripeService = stripeService;
        this.paymentEventProducer = paymentEventProducer;
    }

    /**
     * Creates a PENDING payment record when an auction closes with a winner.
     */
    @Transactional
    public Payment createPendingPayment(AuctionClosedEvent event) {
        if (event.getAuctionId() == null || event.getWinningBidderId() == null || event.getFinalPrice() == null) {
            log.warn("Skipping payment creation: missing required fields in AuctionClosedEvent (auctionId={}, winnerId={})",
                    event.getAuctionId(), event.getWinningBidderId());
            return null;
        }

        if (paymentRepository.existsByAuctionId(event.getAuctionId())) {
            log.info("Payment already exists for auctionId={}, skipping creation.", event.getAuctionId());
            return paymentRepository.findByAuctionId(event.getAuctionId()).orElse(null);
        }

        Payment payment = Payment.builder()
                .auctionId(event.getAuctionId())
                .buyerId(event.getWinningBidderId())
                .sellerId(event.getSellerId() != null ? event.getSellerId() : 0L)
                .amount(event.getFinalPrice())
                .currency(defaultCurrency.toLowerCase())
                .status(PaymentStatus.PENDING)
                .build();

        Payment saved = paymentRepository.save(payment);
        log.info("Created PENDING payment record id={} for auctionId={} buyerId={} amount={}",
                saved.getId(), saved.getAuctionId(), saved.getBuyerId(), saved.getAmount());
        return saved;
    }

    /**
     * Initiates a Stripe Checkout Session for a winning payment.
     */
    @Transactional
    public CheckoutSessionResponse initiateCheckout(Long paymentId, String auctionTitle) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found with id: " + paymentId));

        if (payment.getStatus() == PaymentStatus.SUCCEEDED) {
            throw new PaymentProcessingException("Payment has already been completed for auction #" + payment.getAuctionId());
        }

        Session session = stripeService.createCheckoutSession(payment, auctionTitle);

        payment.setStripeSessionId(session.getId());
        payment.setStatus(PaymentStatus.PROCESSING);
        paymentRepository.save(payment);

        return CheckoutSessionResponse.builder()
                .paymentId(payment.getId())
                .auctionId(payment.getAuctionId())
                .sessionId(session.getId())
                .checkoutUrl(session.getUrl())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .build();
    }

    /**
     * Initiates checkout directly by auctionId. Auto-creates pending payment from auction-service if not yet present.
     */
    @Transactional
    public CheckoutSessionResponse initiateCheckoutForAuction(Long auctionId, String auctionTitle) {
        Payment payment = paymentRepository.findByAuctionId(auctionId)
                .orElseGet(() -> fetchAndCreatePaymentFromAuction(auctionId));

        return initiateCheckout(payment.getId(), auctionTitle);
    }

    private Payment fetchAndCreatePaymentFromAuction(Long auctionId) {
        log.info("Payment record not found locally for auctionId={}. Attempting fetch from auction-service at {}...",
                auctionId, auctionServiceUrl);
        try {
            java.util.Map<?, ?> auctionData = restClientFetchAuction(auctionId);
            if (auctionData != null) {
                Object statusObj = auctionData.get("status");
                Object winnerObj = auctionData.get("highestBidderId");
                Object priceObj = auctionData.get("currentPrice");
                Object sellerObj = auctionData.get("sellerId");

                if (statusObj != null && "CLOSED".equalsIgnoreCase(statusObj.toString()) && winnerObj != null && priceObj != null) {
                    Long winnerId = Long.valueOf(winnerObj.toString());
                    java.math.BigDecimal amount = new java.math.BigDecimal(priceObj.toString());
                    Long sellerId = sellerObj != null ? Long.valueOf(sellerObj.toString()) : 0L;

                    Payment payment = Payment.builder()
                            .auctionId(auctionId)
                            .buyerId(winnerId)
                            .sellerId(sellerId)
                            .amount(amount)
                            .currency(defaultCurrency.toLowerCase())
                            .status(PaymentStatus.PENDING)
                            .build();

                    Payment saved = paymentRepository.save(payment);
                    log.info("Auto-created missing PENDING payment id={} for auctionId={} winnerId={} amount={}",
                            saved.getId(), auctionId, winnerId, amount);
                    return saved;
                }
            }
        } catch (Exception e) {
            log.warn("Could not retrieve auction {} from auction-service: {}", auctionId, e.getMessage());
        }
        throw new PaymentNotFoundException("No payment record found for auctionId: " + auctionId);
    }

    private java.util.Map<?, ?> restClientFetchAuction(Long auctionId) {
        return restTemplate.getForObject(auctionServiceUrl + "/auctions/" + auctionId, java.util.Map.class);
    }

    /**
     * Processes inbound Stripe webhooks.
     */
    @Transactional
    public String processWebhook(String payload, String sigHeader) {
        Event event = stripeService.constructWebhookEvent(payload, sigHeader);
        log.info("Processing Stripe webhook event type: {}", event.getType());

        EventDataObjectDeserializer dataObjectDeserializer = event.getDataObjectDeserializer();
        StripeObject stripeObject = null;
        if (dataObjectDeserializer.getObject().isPresent()) {
            stripeObject = dataObjectDeserializer.getObject().get();
        }

        switch (event.getType()) {
            case "checkout.session.completed":
                if (stripeObject instanceof Session session) {
                    handleCheckoutSessionCompleted(session);
                }
                break;
            case "payment_intent.payment_failed":
                handlePaymentIntentFailed(stripeObject);
                break;
            default:
                log.debug("Unhandled Stripe event type: {}", event.getType());
        }

        return "Webhook processed";
    }

    private void handleCheckoutSessionCompleted(Session session) {
        String paymentIdStr = session.getMetadata() != null ? session.getMetadata().get("payment_id") : null;
        Optional<Payment> paymentOpt = Optional.empty();

        if (paymentIdStr != null) {
            try {
                paymentOpt = paymentRepository.findById(Long.parseLong(paymentIdStr));
            } catch (NumberFormatException ignored) {}
        }

        if (paymentOpt.isEmpty() && session.getId() != null) {
            paymentOpt = paymentRepository.findByStripeSessionId(session.getId());
        }

        if (paymentOpt.isEmpty()) {
            log.error("Could not locate Payment for Stripe Session id={} metadata={}", session.getId(), session.getMetadata());
            return;
        }

        Payment payment = paymentOpt.get();
        payment.setStatus(PaymentStatus.SUCCEEDED);
        payment.setStripePaymentIntentId(session.getPaymentIntent());
        payment.setPaymentMethod("stripe");
        paymentRepository.save(payment);

        log.info("Payment id={} for auctionId={} marked as SUCCEEDED!", payment.getId(), payment.getAuctionId());

        // Emit PaymentCompletedEvent to Kafka
        PaymentCompletedEvent completedEvent = PaymentCompletedEvent.builder()
                .paymentId(payment.getId())
                .auctionId(payment.getAuctionId())
                .buyerId(payment.getBuyerId())
                .sellerId(payment.getSellerId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .stripePaymentIntentId(session.getPaymentIntent())
                .status("SUCCEEDED")
                .timestamp(LocalDateTime.now())
                .build();

        paymentEventProducer.publishPaymentCompleted(completedEvent);
    }

    /**
     * Fallback and synchronous verification when the customer is redirected back from Stripe Checkout.
     */
    @Transactional
    public PaymentResponse confirmPaymentSession(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            throw new PaymentProcessingException("Missing sessionId");
        }

        Session session = stripeService.retrieveSession(sessionId);
        if ("paid".equalsIgnoreCase(session.getPaymentStatus())) {
            handleCheckoutSessionCompleted(session);
        }

        return paymentRepository.findByStripeSessionId(sessionId)
                .map(PaymentResponse::fromEntity)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found for session: " + sessionId));
    }

    private void handlePaymentIntentFailed(StripeObject stripeObject) {
        log.warn("Stripe payment intent failed event received: {}", stripeObject);
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long id) {
        return paymentRepository.findById(id)
                .map(PaymentResponse::fromEntity)
                .orElseThrow(() -> new PaymentNotFoundException("Payment not found with id: " + id));
    }

    @Transactional
    public PaymentResponse getPaymentByAuctionId(Long auctionId) {
        return paymentRepository.findByAuctionId(auctionId)
                .map(PaymentResponse::fromEntity)
                .orElseGet(() -> {
                    try {
                        Payment payment = fetchAndCreatePaymentFromAuction(auctionId);
                        return PaymentResponse.fromEntity(payment);
                    } catch (Exception e) {
                        throw new PaymentNotFoundException("Payment not found for auctionId: " + auctionId);
                    }
                });
    }

    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByBuyerId(Long buyerId) {
        return paymentRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId)
                .stream()
                .map(PaymentResponse::fromEntity)
                .collect(Collectors.toList());
    }
}

