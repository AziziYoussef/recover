package com.recovr.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "detected_objects")
public class DetectedObject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tracking information
    @Column(name = "tracking_id", unique = true)
    private String trackingId;  // Unique ID for object tracking

    @Enumerated(EnumType.STRING)
    private ItemCategory category;

    @Column(name = "confidence_score")
    private Double confidenceScore; // Detection confidence (0.0 - 1.0)

    // Temporal tracking
    @Column(name = "first_detected")
    private LocalDateTime firstDetected;

    @Column(name = "last_seen")
    private LocalDateTime lastSeen;

    @Column(name = "stationary_duration")
    private Long stationaryDuration; // Seconds the object has been stationary

    @Column(name = "is_abandoned")
    private Boolean isAbandoned = false; // True if stationary > N seconds

    @Column(name = "abandon_threshold")
    private Long abandonThreshold = 300L; // Default 5 minutes in seconds

    // Location information
    @Column(name = "camera_location")
    private String cameraLocation;

    @Column(name = "bounding_box_x")
    private Integer boundingBoxX;

    @Column(name = "bounding_box_y")
    private Integer boundingBoxY;

    @Column(name = "bounding_box_width")
    private Integer boundingBoxWidth;

    @Column(name = "bounding_box_height")
    private Integer boundingBoxHeight;

    // Image data
    @Column(name = "snapshot_url")
    private String snapshotUrl; // URL to the detection snapshot

    @Column(name = "frame_timestamp")
    private LocalDateTime frameTimestamp;

    // Status
    @Enumerated(EnumType.STRING)
    private DetectionStatus status = DetectionStatus.DETECTED;

    // Relationship to detection session
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "detection_session_id")
    private DetectionSession detectionSession;

    // Link to reported item if claimed
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_item_id")
    private Item linkedItem;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
            firstDetected = LocalDateTime.now();
        lastSeen = LocalDateTime.now();
        frameTimestamp = LocalDateTime.now();
        stationaryDuration = 0L;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        
        // Update stationary duration if object is still in the same position
        if (frameTimestamp != null) {
            long secondsSinceLastUpdate = ChronoUnit.SECONDS.between(lastSeen, frameTimestamp);
            if (secondsSinceLastUpdate < 5) { // If less than 5 seconds between updates
                stationaryDuration += secondsSinceLastUpdate;
            
                // Check if object has been stationary long enough to be considered abandoned
                if (!isAbandoned && stationaryDuration >= abandonThreshold) {
                isAbandoned = true;
                }
            } else {
                // Object has moved or been out of frame for too long
                stationaryDuration = 0L;
                isAbandoned = false;
            }
        }
        
        lastSeen = frameTimestamp;
    }

    // Helper method to check if object is considered lost
    public boolean isConsideredLost() {
        return isAbandoned && status == DetectionStatus.ABANDONED;
    }
} 