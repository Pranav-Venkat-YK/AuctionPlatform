package com.auctionplatform.auctionservice.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "outbox",
    indexes = {
        @Index(name = "idx_outbox_status", columnList = "status")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutboxEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Column(name = "aggregate_type", nullable = false, length = 100)
    private String aggregateType;

    @NotNull
    @Column(name = "aggregate_id", nullable = false, length = 100)
    private String aggregateId;

    @NotNull
    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @NotNull
    @Column(name = "payload", nullable = false, columnDefinition = "TEXT")
    private String payload;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private OutboxStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = OutboxStatus.PENDING;
        }
    }
}
