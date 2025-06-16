package com.recovr.api.dto;

import com.recovr.api.entity.ItemCategory;
import com.recovr.api.entity.SearchStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class SearchRequestDto {
    
    private Long id;
    
    @NotNull(message = "Search image is required")
    private String searchImageUrl;
    
    private String description;
    
    private ItemCategory expectedCategory;
    
    private SearchStatus status;
    
    @Min(value = 0, message = "Matching threshold must be between 0 and 1")
    @Max(value = 1, message = "Matching threshold must be between 0 and 1")
    private Double matchingThreshold;
    
    // Location information
    private String searchLocation;
    private Double searchLatitude;
    private Double searchLongitude;
    
    @Min(value = 0, message = "Search radius must be positive")
    private Double searchRadius;
    
    // Time window for search
    private LocalDateTime dateLostFrom;
    private LocalDateTime dateLostTo;
    
    // Results
    private List<ImageMatchingDto> matchingResults;
    private Integer totalMatchesFound;
    
    // User information
    private Long userId;
    private String username;
    
    // Timestamps
    private LocalDateTime processedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 