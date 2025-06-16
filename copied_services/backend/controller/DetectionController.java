package com.recovr.api.controller;

import com.recovr.api.dto.DetectedObjectDto;
import com.recovr.api.entity.DetectionSession;
import com.recovr.api.entity.DetectionStatus;
import com.recovr.api.entity.ItemCategory;
import com.recovr.api.service.DetectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/detection")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
@Tag(name = "Detection", description = "Detection API for managing object detection sessions and results")
public class DetectionController {

    private final DetectionService detectionService;

    /**
     * Start a new detection session
     * POST /api/detection/sessions/start
     */
    @PostMapping("/sessions/start")
    @Operation(
        summary = "Start a new detection session",
        description = "Creates a new detection session for a camera"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Detection session started successfully",
            content = @Content(schema = @Schema(implementation = DetectionSession.class))
        ),
        @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<DetectionSession> startDetectionSession(
            @RequestParam String cameraId,
            @RequestParam String cameraLocation,
            @RequestParam(defaultValue = "stable_model_epoch_30") String modelVersion) {

        log.info("Starting detection session for camera: {} at location: {}", cameraId, cameraLocation);
        
        try {
            DetectionSession session = detectionService.startDetectionSession(cameraId, cameraLocation, modelVersion);
            return ResponseEntity.ok(session);
        } catch (Exception e) {
            log.error("Error starting detection session", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * End a detection session
     * POST /api/detection/sessions/{sessionId}/end
     */
    @PostMapping("/sessions/{sessionId}/end")
    @Operation(
        summary = "End a detection session",
        description = "Ends an active detection session and processes its results"
    )
    public ResponseEntity<Void> endDetectionSession(@PathVariable String sessionId) {
        
        log.info("Ending detection session: {}", sessionId);
        try {
            detectionService.endDetectionSession(sessionId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error ending detection session", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Process detection result from PyTorch model
     * POST /api/detection/process
     * 
     * This endpoint will be called by your Python detection service
     */
    @PostMapping("/process")
    @Operation(
        summary = "Process detection results",
        description = "Processes the detection results for a session and updates the database"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Detection results processed successfully",
            content = @Content(schema = @Schema(implementation = Map.class))
        ),
        @ApiResponse(responseCode = "404", description = "Detection session not found"),
        @ApiResponse(responseCode = "400", description = "Invalid request data"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<Map<String, Object>> processDetection(
            @RequestBody Map<String, Object> detectionData) {
        
        try {
            log.info("Processing detection data: {}", detectionData);
            
            // Validate required fields
            String sessionId = (String) detectionData.get("sessionId");
            String trackingId = (String) detectionData.get("trackingId");
            String categoryStr = (String) detectionData.get("category");
            Object confidenceObj = detectionData.get("confidence");
            Object xObj = detectionData.get("x");
            Object yObj = detectionData.get("y");
            Object widthObj = detectionData.get("width");
            Object heightObj = detectionData.get("height");
            String snapshotUrl = (String) detectionData.get("snapshotUrl");

            if (sessionId == null || trackingId == null || categoryStr == null || 
                confidenceObj == null || xObj == null || yObj == null || 
                widthObj == null || heightObj == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Missing required fields"
                ));
            }

            // Convert and validate data types
            Double confidence = convertToDouble(confidenceObj);
            Integer x = convertToInteger(xObj);
            Integer y = convertToInteger(yObj);
            Integer width = convertToInteger(widthObj);
            Integer height = convertToInteger(heightObj);

            if (confidence == null || x == null || y == null || width == null || height == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "status", "error",
                    "message", "Invalid data types for numeric fields"
                ));
            }

            // Convert category string to enum
            ItemCategory category;
            try {
                category = ItemCategory.valueOf(categoryStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Unknown category: {}, defaulting to MISCELLANEOUS", categoryStr);
                category = ItemCategory.MISCELLANEOUS;
            }

            // Process the detection
            detectionService.processDetection(sessionId, trackingId, category, confidence, 
                    x, y, width, height, snapshotUrl);

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Detection processed successfully",
                "trackingId", trackingId
            ));

        } catch (Exception e) {
            log.error("Error processing detection", e);
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Failed to process detection: " + e.getMessage()
            ));
        }
    }

    private Double convertToDouble(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Double) return (Double) obj;
        if (obj instanceof Number) return ((Number) obj).doubleValue();
        try {
            return Double.parseDouble(obj.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer convertToInteger(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Integer) return (Integer) obj;
        if (obj instanceof Number) return ((Number) obj).intValue();
        try {
            return Integer.parseInt(obj.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * Get all abandoned objects (potential lost items)
     * GET /api/detection/abandoned
     */
    @GetMapping("/abandoned")
    @Operation(
        summary = "Get abandoned objects",
        description = "Retrieves a list of objects that have been detected as abandoned"
    )
    public ResponseEntity<List<DetectedObjectDto>> getAbandonedObjects() {
        try {
            List<DetectedObjectDto> abandonedObjects = detectionService.getAbandonedObjects();
            return ResponseEntity.ok(abandonedObjects);
        } catch (Exception e) {
            log.error("Error getting abandoned objects", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get recent detections
     * GET /api/detection/recent
     */
    @GetMapping("/recent")
    @Operation(
        summary = "Get recent detections",
        description = "Retrieves a list of recent object detections"
    )
    public ResponseEntity<List<DetectedObjectDto>> getRecentDetections(
            @RequestParam(defaultValue = "24") int hoursBack) {
        
        try {
            List<DetectedObjectDto> recentDetections = detectionService.getRecentDetections(hoursBack);
            return ResponseEntity.ok(recentDetections);
        } catch (Exception e) {
            log.error("Error getting recent detections", e);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Link detected object to a reported item
     * POST /api/detection/{detectedObjectId}/link/{itemId}
     */
    @PostMapping("/{detectedObjectId}/link/{itemId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> linkDetectedObjectToItem(
            @PathVariable Long detectedObjectId,
            @PathVariable Long itemId) {
        
        try {
            detectionService.linkDetectedObjectToItem(detectedObjectId, itemId);
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Detected object linked to item successfully"
            ));
        } catch (Exception e) {
            log.error("Error linking detected object to item", e);
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Failed to link objects: " + e.getMessage()
            ));
        }
    }

    /**
     * Get detection statistics
     * GET /api/detection/stats
     */
    @GetMapping("/stats")
    @Operation(
        summary = "Get detection statistics",
        description = "Retrieves statistics about object detections"
    )
    public ResponseEntity<Map<String, Object>> getDetectionStats() {
        try {
            Map<String, Object> stats = detectionService.getDetectionStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting detection statistics", e);
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Failed to get detection statistics: " + e.getMessage()
            ));
        }
    }

    /**
     * Health check endpoint for the detection system
     */
    @GetMapping("/health")
    @Operation(summary = "Health check for detection system")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "healthy",
            "timestamp", System.currentTimeMillis(),
            "service", "detection"
        ));
    }
}