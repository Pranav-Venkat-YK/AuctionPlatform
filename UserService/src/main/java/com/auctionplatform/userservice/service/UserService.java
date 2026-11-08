package com.auctionplatform.userservice.service;

import com.auctionplatform.userservice.dto.*;
import com.auctionplatform.userservice.entity.User;
import com.auctionplatform.userservice.exception.UnauthorizedException;
import com.auctionplatform.userservice.repository.UserRepository;
import com.auctionplatform.userservice.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository repo;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public UserService(UserRepository repo, PasswordEncoder encoder, JwtService jwt) {
        this.repo = repo;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    public UserResponse register(RegisterRequest req) {
        if (repo.existsByUsername(req.username())) {
            throw new IllegalArgumentException("Username already taken");
        }
        if (repo.existsByEmail(req.email())) {
            throw new IllegalArgumentException("Email already registered");
        }
        User u = new User();
        u.setUsername(req.username());
        u.setEmail(req.email());
        u.setPasswordHash(encoder.encode(req.password()));
        return UserResponse.from(repo.save(u));
    }

    public AuthResponse login(LoginRequest req) {
        String identifier = req.username().trim();
        User u = repo.findByUsername(identifier)
                .or(() -> repo.findByEmail(identifier))
                .orElseThrow(() -> new UnauthorizedException("Invalid username or password"));
        if (!encoder.matches(req.password(), u.getPasswordHash())) {
            throw new UnauthorizedException("Invalid username or password");
        }
        return new AuthResponse(jwt.generateToken(u), u.getId(), u.getId(), u.getUsername(), u.getEmail(), u.getRole());
    }

    public UserResponse update(Long id, UpdateUserRequest req) {
        User u = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (req.username() != null && !req.username().isBlank() && !req.username().equals(u.getUsername())) {
            if (repo.existsByUsername(req.username())) {
                throw new IllegalArgumentException("Username already taken");
            }
            u.setUsername(req.username());
        }
        if (req.email() != null && !req.email().isBlank() && !req.email().equals(u.getEmail())) {
            if (repo.existsByEmail(req.email())) {
                throw new IllegalArgumentException("Email already registered");
            }
            u.setEmail(req.email());
        }
        if (req.password() != null && !req.password().isBlank()) {
            u.setPasswordHash(encoder.encode(req.password()));
        }
        return UserResponse.from(repo.save(u));
    }

    public UserResponse getByUsername(String username) {
        return repo.findByUsername(username).map(UserResponse::from)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public UserResponse getById(Long id) {
        return repo.findById(id).map(UserResponse::from)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
}
