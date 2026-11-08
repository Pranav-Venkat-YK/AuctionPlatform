package com.auctionplatform.userservice.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LoginRequest(
        @NotBlank(message = "Username or email is required")
        @JsonAlias({"usernameOrEmail", "email"})
        String username,

        @NotBlank(message = "Password is required")
        String password
) {
}
