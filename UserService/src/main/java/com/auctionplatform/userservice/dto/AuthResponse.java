package com.auctionplatform.userservice.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthResponse(
        String token,
        Long userId,
        Long id,
        String username,
        String email,
        String role
) {
    public AuthResponse(String token, Long userId, String username, String role) {
        this(token, userId, userId, username, null, role);
    }
}
