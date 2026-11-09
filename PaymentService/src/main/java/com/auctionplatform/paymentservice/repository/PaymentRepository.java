package com.auctionplatform.paymentservice.repository;

import com.auctionplatform.paymentservice.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByAuctionId(Long auctionId);

    List<Payment> findByBuyerIdOrderByCreatedAtDesc(Long buyerId);

    Optional<Payment> findByStripeSessionId(String stripeSessionId);

    Optional<Payment> findByStripePaymentIntentId(String stripePaymentIntentId);

    boolean existsByAuctionId(Long auctionId);
}

