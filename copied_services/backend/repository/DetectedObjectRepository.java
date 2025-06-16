package com.recovr.api.repository;

import com.recovr.api.entity.DetectedObject;
import com.recovr.api.entity.DetectionSession;
import com.recovr.api.entity.DetectionStatus;
import com.recovr.api.entity.ItemCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DetectedObjectRepository extends JpaRepository<DetectedObject, Long> {

    // Find by tracking ID
    Optional<DetectedObject> findByTrackingId(String trackingId);

    // Find by status
    List<DetectedObject> findByStatus(DetectionStatus status);
    Page<DetectedObject> findByStatus(DetectionStatus status, Pageable pageable);

    // Find abandoned objects
    List<DetectedObject> findByIsAbandonedTrue();
    Page<DetectedObject> findByIsAbandonedTrue(Pageable pageable);

    // Find by detection session
    List<DetectedObject> findByDetectionSession(DetectionSession session);
    Page<DetectedObject> findByDetectionSession(DetectionSession session, Pageable pageable);

    // Find by category
    List<DetectedObject> findByCategory(ItemCategory category);
    Page<DetectedObject> findByCategory(ItemCategory category, Pageable pageable);

    // Find by camera location
    List<DetectedObject> findByCameraLocation(String cameraLocation);
    Page<DetectedObject> findByCameraLocation(String cameraLocation, Pageable pageable);

    // Find objects detected in time range
    List<DetectedObject> findByFirstDetectedBetween(LocalDateTime start, LocalDateTime end);

    // Find long-stationary objects (potential lost items)
    @Query("SELECT d FROM DetectedObject d WHERE d.stationaryDuration >= :threshold AND d.status = :status")
    List<DetectedObject> findLongStationaryObjects(@Param("threshold") Long threshold, @Param("status") DetectionStatus status);

    // Find objects by confidence above threshold
    @Query("SELECT d FROM DetectedObject d WHERE d.confidenceScore >= :threshold")
    List<DetectedObject> findHighConfidenceDetections(@Param("threshold") Double threshold);

    // Count detections by session
    Long countByDetectionSession(DetectionSession session);

    // Count abandoned objects by location
    @Query("SELECT COUNT(d) FROM DetectedObject d WHERE d.cameraLocation = :location AND d.isAbandoned = true")
    Long countAbandonedByLocation(@Param("location") String location);

    // Find recent detections
    @Query("SELECT d FROM DetectedObject d WHERE d.lastSeen >= :since ORDER BY d.lastSeen DESC")
    List<DetectedObject> findRecentDetections(@Param("since") LocalDateTime since);

    // Find unlinked abandoned objects (not yet linked to any Item)
    @Query("SELECT d FROM DetectedObject d WHERE d.isAbandoned = true AND d.linkedItem IS NULL")
    List<DetectedObject> findUnlinkedAbandonedObjects();
} 