package com.recovr.api.dto;

import com.recovr.api.entity.ItemCategory;
import com.recovr.api.entity.DetectionStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DetectedObjectDto {
    
    private Long id;
    private String trackingId;
    private ItemCategory category;
    private Double confidenceScore;
    
    // Temporal information
    private LocalDateTime firstDetected;
    private LocalDateTime lastSeen;
    private Long stationaryDuration;
    private Boolean isAbandoned;
    private Long abandonThreshold;
    
    // Location information
    private String cameraLocation;
    private Integer boundingBoxX;
    private Integer boundingBoxY;
    private Integer boundingBoxWidth;
    private Integer boundingBoxHeight;
    
    // Image data
    private String snapshotUrl;
    private LocalDateTime frameTimestamp;
    
    // Status
    private DetectionStatus status;
    
    // Session information
    private Long detectionSessionId;
    private String sessionId;
    
    // Linked item (if claimed)
    private Long linkedItemId;
    private String linkedItemName;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 