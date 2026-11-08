package com.auctionplatform.userservice.controller;

import com.auctionplatform.userservice.dto.*;
import com.auctionplatform.userservice.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/users", "/api/users"})
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest req) {
        return service.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return service.login(req);
    }

    @GetMapping("/me")
    public UserResponse me(Authentication auth) {
        return service.getByUsername(auth.getName());
    }

    // Other services (auction/bidding) can call this to check that a user exists.
    @GetMapping("/{id}")
    public UserResponse byId(@PathVariable Long id) {
        return service.getById(id);
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable Long id, @RequestBody UpdateUserRequest req) {
        return service.update(id, req);
    }
}
