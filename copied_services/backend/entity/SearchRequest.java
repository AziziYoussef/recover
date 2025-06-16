package com.recovr.api.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "search_requests")
public class SearchRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "search_image_url")
    private String searchImageUrl;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "expected_category")
    private ItemCategory expectedCategory;

    @Column(name = "matching_threshold")
    private Double matchingThreshold = 0.7;

    @Column(name = "search_location")
    private String searchLocation;

    @Column(name = "search_latitude")
    private Double searchLatitude;

    @Column(name = "search_longitude")
    private Double searchLongitude;

    @Column(name = "search_radius")
    private Double searchRadius;

    @Column(name = "date_lost_from")
    private LocalDateTime dateLostFrom;

    @Column(name = "date_lost_to")
    private LocalDateTime dateLostTo;

    @Enumerated(EnumType.STRING)
    private SearchStatus status = SearchStatus.PENDING;

    @Column(name = "total_matches_found")
    private Integer totalMatchesFound = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "searchRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ImageMatching> matchingResults = new ArrayList<>();

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Helper method to mark as processed
    public void markAsProcessed() {
        status = SearchStatus.COMPLETED;
        processedAt = LocalDateTime.now();
    }
} 