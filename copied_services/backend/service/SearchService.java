package com.recovr.api.service;

import com.recovr.api.dto.SearchRequestDto;
import com.recovr.api.dto.ImageMatchingDto;
import com.recovr.api.entity.*;
import com.recovr.api.repository.DetectedObjectRepository;
import com.recovr.api.repository.ItemRepository;
import com.recovr.api.repository.SearchRequestRepository;
import com.recovr.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchService {

    private final SearchRequestRepository searchRequestRepository;
    private final DetectedObjectRepository detectedObjectRepository;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;

    /**
     * Create a new search request
     */
    @Transactional
    public SearchRequestDto createSearchRequest(SearchRequestDto requestDto, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        SearchRequest request = new SearchRequest();
        request.setUser(user);
        request.setSearchImageUrl(requestDto.getSearchImageUrl());
        request.setDescription(requestDto.getDescription());
        request.setExpectedCategory(requestDto.getExpectedCategory());
        request.setMatchingThreshold(requestDto.getMatchingThreshold() != null ? 
            requestDto.getMatchingThreshold() : 0.7);
        request.setSearchLocation(requestDto.getSearchLocation());
        request.setSearchLatitude(requestDto.getSearchLatitude());
        request.setSearchLongitude(requestDto.getSearchLongitude());
        request.setSearchRadius(requestDto.getSearchRadius());
        request.setDateLostFrom(requestDto.getDateLostFrom());
        request.setDateLostTo(requestDto.getDateLostTo());
        request.setStatus(SearchStatus.PENDING);
        request.setTotalMatchesFound(0);

        SearchRequest savedRequest = searchRequestRepository.save(request);
        return convertToDto(savedRequest);
    }

    /**
     * Get search results for a request
     */
    @Transactional(readOnly = true)
    public SearchRequestDto getSearchResults(Long searchRequestId) {
        SearchRequest request = searchRequestRepository.findById(searchRequestId)
                .orElseThrow(() -> new RuntimeException("Search request not found"));

        if (request.getStatus() == SearchStatus.PENDING) {
            // Process the search request
            List<ImageMatching> matches = findMatchingItems(request);
            request.setMatchingResults(matches);
            request.setTotalMatchesFound(matches.size());
            request.setStatus(SearchStatus.COMPLETED);
            request.setProcessedAt(LocalDateTime.now());
            searchRequestRepository.save(request);
        }

        return convertToDto(request);
    }

    /**
     * Find items matching the search request
     */
    private List<ImageMatching> findMatchingItems(SearchRequest request) {
        // Get all detected objects within the time window
        List<DetectedObject> candidates = detectedObjectRepository.findByFirstDetectedBetween(
            request.getDateLostFrom() != null ? request.getDateLostFrom() : LocalDateTime.now().minusMonths(1),
            request.getDateLostTo() != null ? request.getDateLostTo() : LocalDateTime.now()
        );

        // Filter by category if specified
        if (request.getExpectedCategory() != null) {
            candidates = candidates.stream()
                .filter(obj -> obj.getCategory() == request.getExpectedCategory())
                .collect(Collectors.toList());
        }

        // Filter by location if specified
        if (request.getSearchLocation() != null && request.getSearchLatitude() != null && 
            request.getSearchLongitude() != null && request.getSearchRadius() != null) {
            // TODO: Implement location-based filtering
            // This would require adding location coordinates to DetectedObject
        }

        // Calculate similarity scores and create matches
        List<ImageMatching> matches = new ArrayList<>();
        for (DetectedObject candidate : candidates) {
            double similarityScore = calculateImageSimilarity(
                request.getSearchImageUrl(),
                candidate.getSnapshotUrl()
            );

            // Lower the matching threshold from default to be more lenient
            double threshold = request.getMatchingThreshold() != null ? 
                             Math.min(request.getMatchingThreshold(), 0.6) : 0.6;

            if (similarityScore >= threshold) {
                ImageMatching match = new ImageMatching();
                match.setSearchRequest(request);
                match.setDetectedObject(candidate);
                match.setSimilarityScore(similarityScore);
                match.setConfidenceLevel(calculateConfidence(similarityScore));
                matches.add(match);
            }
        }

        // Sort by similarity score
        matches.sort((a, b) -> Double.compare(b.getSimilarityScore(), a.getSimilarityScore()));

        return matches;
    }

    /**
     * Calculate similarity between two images
     * This is a placeholder - in a real implementation, this would use a proper image similarity algorithm
     */
    private double calculateImageSimilarity(String image1Url, String image2Url) {
        // TODO: Implement proper image similarity calculation
        // For now, return a random score for demonstration
        return Math.random();
    }

    /**
     * Calculate confidence level based on similarity score
     */
    private double calculateConfidence(double similarityScore) {
        // More lenient confidence calculation
        if (similarityScore >= 0.9) return 1.0;
        if (similarityScore >= 0.8) return 0.9;
        if (similarityScore >= 0.7) return 0.8;
        if (similarityScore >= 0.6) return 0.7;
        return similarityScore;
    }

    /**
     * Convert entity to DTO
     */
    private SearchRequestDto convertToDto(SearchRequest request) {
        SearchRequestDto dto = new SearchRequestDto();
        dto.setId(request.getId());
        dto.setSearchImageUrl(request.getSearchImageUrl());
        dto.setDescription(request.getDescription());
        dto.setExpectedCategory(request.getExpectedCategory());
        dto.setMatchingThreshold(request.getMatchingThreshold());
        dto.setSearchLocation(request.getSearchLocation());
        dto.setSearchLatitude(request.getSearchLatitude());
        dto.setSearchLongitude(request.getSearchLongitude());
        dto.setSearchRadius(request.getSearchRadius());
        dto.setDateLostFrom(request.getDateLostFrom());
        dto.setDateLostTo(request.getDateLostTo());
        dto.setStatus(request.getStatus());
        dto.setTotalMatchesFound(request.getTotalMatchesFound());
        dto.setUserId(request.getUser().getId());
        dto.setUsername(request.getUser().getUsername());
        dto.setProcessedAt(request.getProcessedAt());
        dto.setCreatedAt(request.getCreatedAt());
        dto.setUpdatedAt(request.getUpdatedAt());

        // Convert matching results to DTOs
        if (request.getMatchingResults() != null) {
            List<ImageMatchingDto> matchingDtos = request.getMatchingResults().stream()
                .map(match -> {
                    ImageMatchingDto matchDto = new ImageMatchingDto();
                    matchDto.setDetectedObjectId(match.getDetectedObject().getId());
                    matchDto.setSimilarityScore(match.getSimilarityScore());
                    matchDto.setCategory(match.getDetectedObject().getCategory());
                    matchDto.setLocation(match.getDetectedObject().getCameraLocation());
                    matchDto.setDetectedAt(match.getDetectedObject().getFirstDetected());
                    matchDto.setImageUrl(match.getDetectedObject().getSnapshotUrl());
                    return matchDto;
                })
                .collect(Collectors.toList());
            dto.setMatchingResults(matchingDtos);
        }

        return dto;
    }
} 