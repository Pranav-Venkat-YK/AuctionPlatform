package com.auctionplatform.userservice.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record UpdateUserRequest(
        String username,
        String email,
        String password
) {
}

