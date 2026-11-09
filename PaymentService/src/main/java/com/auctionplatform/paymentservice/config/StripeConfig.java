package com.auctionplatform.paymentservice.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class StripeConfig {

    private static final Logger log = LoggerFactory.getLogger(StripeConfig.class);

    @Value("${stripe.api-key:}")
    private String apiKey;

    @PostConstruct
    public void init() {
        if (apiKey != null && !apiKey.isBlank()) {
            Stripe.apiKey = apiKey;
            log.info("Stripe API key configured successfully (starts with {})",
                    apiKey.substring(0, Math.min(7, apiKey.length())));
        } else {
            log.warn("Stripe API key is not configured. Real Stripe checkout requests will require STRIPE_API_KEY.");
        }
    }
}

