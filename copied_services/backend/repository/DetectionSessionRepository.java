package com.recovr.api.repository;

import com.recovr.api.entity.DetectionSession;
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
public interface DetectionSessionRepository extends JpaRepository<DetectionSession, Long> {

    // Find by session ID
    Optional<DetectionSession> findBySessionId(String sessionId);

    // Find by camera ID
    List<DetectionSession> findByCameraId(String cameraId);
    Page<DetectionSession> findByCameraId(String cameraId, Pageable pageable);

    // Find active sessions
    List<DetectionSession> findByIsActiveTrue();

    // Find by camera location
    List<DetectionSession> findByCameraLocation(String cameraLocation);

    // Find sessions by time range
    List<DetectionSession> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);

    // Find sessions with most detections
    @Query("SELECT d FROM DetectionSession d ORDER BY d.totalDetections DESC")
    List<DetectionSession> findSessionsOrderByDetections(Pageable pageable);

    // Find sessions with abandoned objects
    @Query("SELECT d FROM DetectionSession d WHERE d.abandonedObjectsCount > 0")
    List<DetectionSession> findSessionsWithAbandonedObjects();

    // Get statistics by camera
    @Query("SELECT d.cameraId, COUNT(d), SUM(d.totalDetections), SUM(d.abandonedObjectsCount) " +
           "FROM DetectionSession d GROUP BY d.cameraId")
    List<Object[]> getDetectionStatsByCamera();

    // Find long-running sessions
    @Query("SELECT d FROM DetectionSession d WHERE d.isActive = true AND d.startTime <= :threshold")
    List<DetectionSession> findLongRunningSessions(@Param("threshold") LocalDateTime threshold);
} 