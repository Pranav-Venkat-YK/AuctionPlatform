package com.auctionplatform.userservice;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class UserServiceApplication {

    @PostConstruct
    public void init() {
        String tz = System.getenv("TZ");
        TimeZone.setDefault(TimeZone.getTimeZone(tz != null && !tz.isBlank() ? tz : "Asia/Kolkata"));
    }

    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}
