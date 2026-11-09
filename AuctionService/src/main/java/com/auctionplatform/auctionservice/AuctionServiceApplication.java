package com.auctionplatform.auctionservice;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableDiscoveryClient
@EnableScheduling
public class AuctionServiceApplication {

	@PostConstruct
	public void init() {
		String tz = System.getenv("TZ");
		TimeZone.setDefault(TimeZone.getTimeZone(tz != null && !tz.isBlank() ? tz : "Asia/Kolkata"));
	}

	public static void main(String[] args) {
		SpringApplication.run(AuctionServiceApplication.class, args);
	}

}


