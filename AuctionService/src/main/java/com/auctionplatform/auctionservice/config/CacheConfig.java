package com.auctionplatform.auctionservice.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String AUCTION_STATUS_CACHE = "auctionStatusCache";
    public static final String AUCTION_CACHE = "auctionCache";

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(AUCTION_STATUS_CACHE, AUCTION_CACHE);
    }
}
