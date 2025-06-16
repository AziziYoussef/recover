package com.recovr.api.controller;

import com.recovr.api.dto.SearchRequestDto;
import com.recovr.api.dto.ImageMatchingDto;
import com.recovr.api.service.SearchService;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
@Tag(name = "Search", description = "Search API for lost items")
@SecurityRequirement(name = "bearerAuth")
public class SearchController {

    private final SearchService searchService;

    /**
     * Create a new search request (POST /search_request)
     * Upload photo for matching as specified in project requirements
     */
    @PostMapping
    @Operation(
        summary = "Create a new search request",
        description = "Creates a new search request for finding lost items using image or text search"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Search request created successfully",
            content = @Content(schema = @Schema(implementation = SearchRequestDto.class))
        ),
        @ApiResponse(responseCode = "400", description = "Invalid request parameters"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<SearchRequestDto> createSearchRequest(
        @RequestBody SearchRequestDto request,
        @Parameter(description = "Authenticated user") @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(searchService.createSearchRequest(request, userDetails.getUsername()));
    }

    /**
     * Get search results for a search request
     * GET /api/search/results/{searchRequestId}
     */
    @GetMapping("/{searchRequestId}")
    @Operation(
        summary = "Get search results",
        description = "Retrieves the results of a search request by its ID"
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Search results retrieved successfully",
            content = @Content(schema = @Schema(implementation = SearchRequestDto.class))
        ),
        @ApiResponse(responseCode = "404", description = "Search request not found"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<SearchRequestDto> getSearchResults(
        @Parameter(description = "ID of the search request") @PathVariable Long searchRequestId
    ) {
        return ResponseEntity.ok(searchService.getSearchResults(searchRequestId));
    }

    /**
     * Get user's search history
     * GET /api/search/history
     */
    @GetMapping("/history")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getUserSearchHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        
        try {
            Pageable pageable = PageRequest.of(page, size);
            // TODO: Implement when SearchService method is ready
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "searches", List.of(),
                "totalElements", 0,
                "totalPages", 0
            ));
            
        } catch (Exception e) {
            log.error("Error getting search history", e);
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Failed to get search history: " + e.getMessage()
            ));
        }
    }

    /**
     * Cancel a search request
     * POST /api/search/{searchRequestId}/cancel
     */
    @PostMapping("/{searchRequestId}/cancel")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> cancelSearchRequest(
            @PathVariable Long searchRequestId,
            Authentication authentication) {
        
        try {
            // TODO: Implement search cancellation
            log.info("Cancelling search request {} for user: {}", searchRequestId, authentication.getName());
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Search request cancelled successfully"
            ));
            
        } catch (Exception e) {
            log.error("Error cancelling search request", e);
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Failed to cancel search request: " + e.getMessage()
            ));
        }
    }

    /**
     * Provide feedback on a match result
     * POST /api/search/feedback/{matchingId}
     */
    @PostMapping("/feedback/{matchingId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> provideFeedback(
            @PathVariable Long matchingId,
            @RequestBody Map<String, Object> feedbackData,
            Authentication authentication) {
        
        try {
            Boolean confirmed = (Boolean) feedbackData.get("confirmed");
            String feedback = (String) feedbackData.get("feedback");
            
            log.info("User {} providing feedback for match {}: confirmed={}", 
                    authentication.getName(), matchingId, confirmed);
            
            // TODO: Implement feedback processing
            
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Feedback recorded successfully"
            ));
            
        } catch (Exception e) {
            log.error("Error processing feedback", e);
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Failed to process feedback: " + e.getMessage()
            ));
        }
    }

    /**
     * Get search statistics (admin only)
     * GET /api/search/stats
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getSearchStats() {
        
        try {
            // TODO: Implement search statistics
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "stats", Map.of(
                    "totalSearches", 0,
                    "successfulMatches", 0,
                    "averageProcessingTime", 0.0,
                    "accuracyRate", 0.0
                )
            ));
            
        } catch (Exception e) {
            log.error("Error getting search stats", e);
            return ResponseEntity.badRequest().body(Map.of(
                "status", "error",
                "message", "Failed to get search statistics: " + e.getMessage()
            ));
        }
    }
} 