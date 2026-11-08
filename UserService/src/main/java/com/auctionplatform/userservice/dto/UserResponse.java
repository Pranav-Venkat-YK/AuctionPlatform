package com.auctionplatform.userservice.dto;

import com.auctionplatform.userservice.entity.User;

public record UserResponse(Long id, String username, String email, String role) {
    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getUsername(), u.getEmail(), u.getRole());
    }
}
