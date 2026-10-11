package com.auctionplatform.auctionservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAuctionRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Seller ID is required")
    private Long sellerId;

    @NotNull(message = "Starting price is required")
    @DecimalMin(value = "0.01", message = "Starting price must be greater than 0")
    private BigDecimal startingPrice;

    @DecimalMin(value = "0.00", message = "Reserve price cannot be negative")
    private BigDecimal reservePrice;

    @DecimalMin(value = "0.01", message = "Minimum bid increment must be greater than 0")
    private BigDecimal minBidIncrement;

    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    private LocalDateTime endTime;

    private Map<String, Object> itemAttributes;
}
