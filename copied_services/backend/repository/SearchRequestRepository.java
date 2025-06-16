package com.recovr.api.repository;

import com.recovr.api.entity.SearchRequest;
import com.recovr.api.entity.SearchStatus;
import com.recovr.api.entity.ItemCategory;
import com.recovr.api.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SearchRequestRepository extends JpaRepository<SearchRequest, Long> {

    // Find by user
    List<SearchRequest> findByUser(User user);
    Page<SearchRequest> findByUser(User user, Pageable pageable);

    // Find by status
    List<SearchRequest> findByStatus(SearchStatus status);
    Page<SearchRequest> findByStatus(SearchStatus status, Pageable pageable);

    // Find by user and status
    Page<SearchRequest> findByUserAndStatus(User user, SearchStatus status, Pageable pageable);

    // Find by expected category
    List<SearchRequest> findByExpectedCategory(ItemCategory category);

    // Find processing requests (for background processing)
    List<SearchRequest> findByStatusOrderByCreatedAtAsc(SearchStatus status);

    // Find searches in location radius
    @Query("SELECT s FROM SearchRequest s WHERE " +
           "s.searchLatitude IS NOT NULL AND s.searchLongitude IS NOT NULL AND " +
           "s.searchLocation = :location")
    List<SearchRequest> findBySearchLocation(@Param("location") String location);

    // Find searches by time range
    List<SearchRequest> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    // Find searches with matches found
    @Query("SELECT s FROM SearchRequest s WHERE s.totalMatchesFound > 0")
    List<SearchRequest> findSearchesWithMatches();

    // Find searches without matches
    @Query("SELECT s FROM SearchRequest s WHERE s.totalMatchesFound = 0 AND s.status = 'COMPLETED'")
    List<SearchRequest> findSearchesWithoutMatches();

    // Count searches by status
    Long countByStatus(SearchStatus status);

    // Count searches by user
    Long countByUser(User user);

    // Get search statistics
    @Query("SELECT s.status, COUNT(s) FROM SearchRequest s GROUP BY s.status")
    List<Object[]> getSearchStatsByStatus();

    // Find recent searches
    @Query("SELECT s FROM SearchRequest s ORDER BY s.createdAt DESC")
    List<SearchRequest> findRecentSearches(Pageable pageable);

    // Find searches needing reprocessing (failed searches older than threshold)
    @Query("SELECT s FROM SearchRequest s WHERE s.status = 'FAILED' AND s.createdAt <= :threshold")
    List<SearchRequest> findSearchesNeedingReprocessing(@Param("threshold") LocalDateTime threshold);
} 