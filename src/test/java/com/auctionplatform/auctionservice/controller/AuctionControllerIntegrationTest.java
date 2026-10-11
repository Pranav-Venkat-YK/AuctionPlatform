package com.auctionplatform.auctionservice.controller;

import com.auctionplatform.auctionservice.dto.CreateAuctionRequest;
import com.auctionplatform.auctionservice.entity.Auction;
import com.auctionplatform.auctionservice.entity.AuctionStatus;
import com.auctionplatform.auctionservice.repository.AuctionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuctionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuctionRepository auctionRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private KafkaTemplate<String, Object> kafkaTemplate;

    @BeforeEach
    void setUp() {
        auctionRepository.deleteAll();
    }

    @Test
    @DisplayName("POST /auctions - Create auction successfully with valid payload")
    void testCreateAuction_Success() throws Exception {
        CreateAuctionRequest request = CreateAuctionRequest.builder()
                .title("Vintage Camera")
                .description("Rare 1970s SLR camera in working condition")
                .sellerId(101L)
                .startingPrice(new BigDecimal("150.00"))
                .minBidIncrement(new BigDecimal("10.00"))
                .startTime(LocalDateTime.now().plusHours(1))
                .endTime(LocalDateTime.now().plusDays(2))
                .itemAttributes(Map.of("brand", "Leica", "condition", "Used"))
                .build();

        mockMvc.perform(post("/auctions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.title", is("Vintage Camera")))
                .andExpect(jsonPath("$.sellerId", is(101)))
                .andExpect(jsonPath("$.startingPrice", is(150.0)))
                .andExpect(jsonPath("$.status", is("DRAFT")));
    }

    @Test
    @DisplayName("POST /auctions - Reject creation with invalid starting price (<= 0)")
    void testCreateAuction_InvalidPrice_BadRequest() throws Exception {
        CreateAuctionRequest request = CreateAuctionRequest.builder()
                .title("Invalid Item")
                .sellerId(101L)
                .startingPrice(new BigDecimal("0.00"))
                .startTime(LocalDateTime.now().plusHours(1))
                .endTime(LocalDateTime.now().plusDays(1))
                .build();

        mockMvc.perform(post("/auctions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.startingPrice", notNullValue()));
    }

    @Test
    @DisplayName("GET /auctions/{id} - Return existing auction details")
    void testGetAuctionById_Success() throws Exception {
        Auction auction = Auction.builder()
                .title("Luxury Watch")
                .sellerId(202L)
                .status(AuctionStatus.ACTIVE)
                .startingPrice(new BigDecimal("500.00"))
                .currentPrice(new BigDecimal("500.00"))
                .minBidIncrement(new BigDecimal("25.00"))
                .startTime(LocalDateTime.now().minusHours(1))
                .endTime(LocalDateTime.now().plusHours(5))
                .build();
        Auction saved = auctionRepository.save(auction);

        mockMvc.perform(get("/auctions/" + saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(saved.getId().intValue())))
                .andExpect(jsonPath("$.title", is("Luxury Watch")))
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andExpect(jsonPath("$.currentPrice", is(500.0)));
    }

    @Test
    @DisplayName("GET /internal/auctions/{id}/status - Synchronous status check for Bidding Service")
    void testGetInternalAuctionStatus_Success() throws Exception {
        Auction auction = Auction.builder()
                .title("Rare Artwork")
                .sellerId(303L)
                .status(AuctionStatus.ACTIVE)
                .startingPrice(new BigDecimal("1000.00"))
                .currentPrice(new BigDecimal("1200.00"))
                .minBidIncrement(new BigDecimal("50.00"))
                .startTime(LocalDateTime.now().minusHours(2))
                .endTime(LocalDateTime.now().plusHours(3))
                .build();
        Auction saved = auctionRepository.save(auction);

        mockMvc.perform(get("/internal/auctions/" + saved.getId() + "/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(saved.getId().intValue())))
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andExpect(jsonPath("$.open", is(true)))
                .andExpect(jsonPath("$.currentPrice", is(1200.0)));
    }
}
