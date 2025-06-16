package com.recovr.api.repository;

import com.recovr.api.entity.ImageMatching;
import com.recovr.api.entity.SearchRequest;
import com.recovr.api.entity.Item;
import com.recovr.api.entity.DetectedObject;
import com.recovr.api.entity.MatchingMethod;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ImageMatchingRepository extends JpaRepository<ImageMatching, Long> {

    // Find by search request
    List<ImageMatching> findBySearchRequest(SearchRequest searchRequest);
    Page<ImageMatching> findBySearchRequest(SearchRequest searchRequest, Pageable pageable);

    // Find by matched item
    List<ImageMatching> findByItem(Item item);

    // Find by matched detected object
    List<ImageMatching> findByDetectedObject(DetectedObject detectedObject);

    // Find by matching method
    List<ImageMatching> findByMethod(MatchingMethod method);

    // Find high similarity matches
    @Query("SELECT m FROM ImageMatching m WHERE m.similarityScore >= :threshold ORDER BY m.similarityScore DESC")
    List<ImageMatching> findHighSimilarityMatches(@Param("threshold") Double threshold);

    // Find high confidence matches
    @Query("SELECT m FROM ImageMatching m WHERE m.confidenceLevel >= :threshold ORDER BY m.confidenceLevel DESC")
    List<ImageMatching> findHighConfidenceMatches(@Param("threshold") Double threshold);

    // Find confirmed matches by users
    List<ImageMatching> findByUserConfirmedTrue();

    // Find false positives
    List<ImageMatching> findByIsFalsePositiveTrue();

    // Find matches for search request above threshold
    @Query("SELECT m FROM ImageMatching m WHERE m.searchRequest = :searchRequest AND m.similarityScore >= :threshold ORDER BY m.similarityScore DESC")
    List<ImageMatching> findMatchesAboveThreshold(@Param("searchRequest") SearchRequest searchRequest, @Param("threshold") Double threshold);

    // Find best match for search request
    @Query("SELECT m FROM ImageMatching m WHERE m.searchRequest = :searchRequest ORDER BY m.similarityScore DESC, m.confidenceLevel DESC")
    List<ImageMatching> findBestMatches(@Param("searchRequest") SearchRequest searchRequest, Pageable pageable);

    // Find matches by creation time
    List<ImageMatching> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    // Count matches by search request
    Long countBySearchRequest(SearchRequest searchRequest);

    // Count confirmed matches
    Long countByUserConfirmedTrue();

    // Count false positives
    Long countByIsFalsePositiveTrue();

    // Get accuracy statistics
    @Query("SELECT m.method, COUNT(m), " +
           "SUM(CASE WHEN m.userConfirmed = true THEN 1 ELSE 0 END), " +
           "SUM(CASE WHEN m.isFalsePositive = true THEN 1 ELSE 0 END) " +
           "FROM ImageMatching m GROUP BY m.method")
    List<Object[]> getAccuracyStatsByMethod();

    // Find matches needing user feedback
    @Query("SELECT m FROM ImageMatching m WHERE m.userConfirmed IS NULL AND m.similarityScore >= :threshold")
    List<ImageMatching> findMatchesNeedingFeedback(@Param("threshold") Double threshold);

    // Find geometric verified matches (for ORB/FLANN method)
    List<ImageMatching> findByGeometricVerificationPassedTrue();

    // Find recent matches
    @Query("SELECT m FROM ImageMatching m ORDER BY m.createdAt DESC")
    List<ImageMatching> findRecentMatches(Pageable pageable);
} 