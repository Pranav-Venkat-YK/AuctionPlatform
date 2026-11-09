package com.auctionplatform.biddingservice;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.retry.annotation.EnableRetry;

import java.util.TimeZone;

@SpringBootApplication
@EnableFeignClients
@EnableRetry
public class BiddingServiceApplication {

	@PostConstruct
	public void init() {
		String tz = System.getenv("TZ");
		TimeZone.setDefault(TimeZone.getTimeZone(tz != null && !tz.isBlank() ? tz : "Asia/Kolkata"));
	}

	public static void main(String[] args) {
		SpringApplication.run(BiddingServiceApplication.class, args);
	}

}
