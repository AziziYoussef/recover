package com.recovr.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "image_matchings")
public class ImageMatching {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "search_request_id")
    private SearchRequest searchRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "detected_object_id")
    private DetectedObject detectedObject;

    @Column(name = "similarity_score")
    private Double similarityScore;

    @Column(name = "confidence_level")
    private Double confidenceLevel;

    @Column(name = "is_false_positive")
    private Boolean isFalsePositive = false;

    @Column(name = "user_confirmed")
    private Boolean userConfirmed;

    @Enumerated(EnumType.STRING)
    @Column(name = "method")
    private MatchingMethod method;

    @Column(name = "geometric_verification_passed")
    private Boolean geometricVerificationPassed;

    @Column(name = "keypoints_matched")
    private Integer keypointsMatched;

    @Column(name = "total_keypoints_search")
    private Integer totalKeypointsSearch;

    @Column(name = "total_keypoints_matched")
    private Integer totalKeypointsMatched;

    @Column(name = "geographical_distance")
    private Double geographicalDistance;

    @Column(name = "temporal_distance")
    private Integer temporalDistance;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private Item item;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 