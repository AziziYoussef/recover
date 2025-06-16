package com.recovr.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "detection_sessions")
public class DetectionSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", unique = true)
    private String sessionId; // Unique identifier for the detection session

    @Column(name = "camera_id")
    private String cameraId; // Identifier for the camera

    @Column(name = "camera_location")
    private String cameraLocation; // Physical location of the camera

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "model_version")
    private String modelVersion; // Version of the detection model used

    @Column(name = "confidence_threshold")
    private Double confidenceThreshold = 0.5; // Minimum confidence for detection

    @Column(name = "total_detections")
    private Integer totalDetections = 0;

    @Column(name = "abandoned_objects_count")
    private Integer abandonedObjectsCount = 0;

    // Relationship to detected objects
    @OneToMany(mappedBy = "detectionSession", cascade = CascadeType.ALL)
    private List<DetectedObject> detectedObjects;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (startTime == null) {
            startTime = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Helper method to end the session
    public void endSession() {
        isActive = false;
        endTime = LocalDateTime.now();
    }

    // Helper method to increment detection count
    public void incrementDetections() {
        totalDetections++;
    }

    // Helper method to increment abandoned objects count
    public void incrementAbandonedObjects() {
        abandonedObjectsCount++;
    }
} 