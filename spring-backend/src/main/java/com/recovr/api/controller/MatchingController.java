package com.recovr.api.controller;

import com.recovr.api.dto.ItemDto;
import com.recovr.api.dto.MessageResponse;
import com.recovr.api.entity.Item;
import com.recovr.api.entity.User;
import com.recovr.api.entity.Notification;
import com.recovr.api.entity.ItemStatus;
import com.recovr.api.service.ItemService;
import com.recovr.api.service.NotificationService;
import com.recovr.api.repository.UserRepository;
import com.recovr.api.security.services.UserDetailsImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/matching")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"}, allowCredentials = "true")
public class MatchingController {
    private static final Logger log = LoggerFactory.getLogger(MatchingController.class);

    @Autowired
    private ItemService itemService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/process-item/{itemId}")
    public ResponseEntity<?> processItemMatching(@PathVariable Long itemId) {
        log.info("Processing item matching for item ID: {}", itemId);
        
        try {
            // Get the item that was just reported
            ItemDto reportedItem = itemService.getItemById(itemId);
            if (reportedItem == null) {
                return ResponseEntity.notFound().build();
            }

            // Only process FOUND items for matching against LOST items
            if (!"FOUND".equals(reportedItem.getStatus())) {
                log.info("Item {} is not a FOUND item, skipping matching", itemId);
                return ResponseEntity.ok(new MessageResponse("Item is not a found item, no matching performed"));
            }

            // Get all LOST items from database for comparison
            List<ItemDto> lostItems = itemService.getItemsByStatus("LOST");
            log.info("Found {} lost items in database for matching", lostItems.size());

            if (lostItems.isEmpty()) {
                log.info("No lost items found in database, no matching to perform");
                return ResponseEntity.ok(new MessageResponse("No lost items found for matching"));
            }

            // Filter items with images only
            List<ItemDto> lostItemsWithImages = lostItems.stream()
                    .filter(item -> item.getImageUrl() != null && !item.getImageUrl().isEmpty())
                    .collect(Collectors.toList());

            if (lostItemsWithImages.isEmpty()) {
                log.info("No lost items with images found, no image matching to perform");
                return ResponseEntity.ok(new MessageResponse("No lost items with images found for matching"));
            }

            log.info("Processing image matching for {} lost items with images", lostItemsWithImages.size());

            // Perform image matching
            List<MatchResult> matchResults = performImageMatching(reportedItem, lostItemsWithImages);

            // Process and notify users of potential matches
            int notificationsSent = processMatchResults(reportedItem, matchResults);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Matching completed successfully");
            response.put("reportedItemId", itemId);
            response.put("lostItemsChecked", lostItemsWithImages.size());
            response.put("matchesFound", matchResults.size());
            response.put("notificationsSent", notificationsSent);
            response.put("matches", matchResults);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error processing item matching for item {}: {}", itemId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error processing item matching: " + e.getMessage()));
        }
    }

    private List<MatchResult> performImageMatching(ItemDto reportedItem, List<ItemDto> lostItems) {
        List<MatchResult> results = new ArrayList<>();
        
        try {
            // Prepare image paths for Python script
            String reportedImagePath = getImagePath(reportedItem.getImageUrl());
            List<String> lostImagePaths = lostItems.stream()
                    .map(item -> getImagePath(item.getImageUrl()))
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            if (reportedImagePath == null || lostImagePaths.isEmpty()) {
                log.warn("No valid image paths found for matching");
                return results;
            }

            // Call Python matching service
            List<ImageMatchResult> pythonResults = callPythonMatchingService(reportedImagePath, lostImagePaths);

            // Convert Python results to match results
            for (ImageMatchResult pythonResult : pythonResults) {
                // Find the corresponding lost item
                ItemDto matchedItem = lostItems.stream()
                        .filter(item -> getImagePath(item.getImageUrl()).equals(pythonResult.imagePath))
                        .findFirst()
                        .orElse(null);

                if (matchedItem != null && pythonResult.matchCount >= 10) { // Minimum threshold for a potential match
                    MatchResult matchResult = new MatchResult();
                    matchResult.lostItemId = matchedItem.getId();
                    matchResult.lostItemName = matchedItem.getName();
                    matchResult.lostItemDescription = matchedItem.getDescription();
                    matchResult.lostItemImageUrl = matchedItem.getImageUrl();
                    matchResult.matchScore = pythonResult.matchCount;
                    matchResult.confidence = calculateConfidence(pythonResult.matchCount);
                    matchResult.reportedByUserId = matchedItem.getReportedById();
                    
                    results.add(matchResult);
                    log.info("Found potential match: {} with {} feature matches", 
                            matchedItem.getName(), pythonResult.matchCount);
                }
            }

            // Sort by match score (highest first)
            results.sort((a, b) -> Integer.compare(b.matchScore, a.matchScore));

        } catch (Exception e) {
            log.error("Error in image matching: {}", e.getMessage(), e);
        }

        return results;
    }

    private List<ImageMatchResult> callPythonMatchingService(String userImagePath, List<String> dbImagePaths) throws Exception {
        List<ImageMatchResult> results = new ArrayList<>();
        
        // Build Python command
        List<String> command = new ArrayList<>();
        command.add("python3");
        command.add("../matching-service/image_matcher_api.py");
        command.add(userImagePath);
        command.addAll(dbImagePaths);

        log.info("Calling Python matching service with command: {}", String.join(" ", command));

        ProcessBuilder pb = new ProcessBuilder(command);
        pb.directory(new File(System.getProperty("user.dir")));
        pb.redirectErrorStream(true);

        Process process = pb.start();
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                log.info("Python output: {}", line);
                
                // Parse results line (format: "image_path:match_count")
                if (line.contains(":") && !line.startsWith("Comparing") && !line.startsWith("Erreur")) {
                    String[] parts = line.split(":");
                    if (parts.length == 2) {
                        try {
                            String imagePath = parts[0].trim();
                            int matchCount = Integer.parseInt(parts[1].trim().split(" ")[0]);
                            
                            ImageMatchResult result = new ImageMatchResult();
                            result.imagePath = imagePath;
                            result.matchCount = matchCount;
                            results.add(result);
                        } catch (NumberFormatException e) {
                            log.warn("Could not parse match count from line: {}", line);
                        }
                    }
                }
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            log.warn("Python matching service exited with code: {}", exitCode);
        }

        return results;
    }

    private int processMatchResults(ItemDto reportedItem, List<MatchResult> matchResults) {
        int notificationsSent = 0;

        for (MatchResult match : matchResults) {
            try {
                // Create notification for the user who reported the lost item
                if (match.reportedByUserId != null) {
                    User user = userRepository.findById(match.reportedByUserId).orElse(null);
                    if (user != null) {
                        String title = "Potential Match Found!";
                        String message = String.format(
                                "A found item '%s' might match your lost item '%s'. " +
                                "Match confidence: %.1f%%. Check the details to verify.",
                                reportedItem.getName(),
                                match.lostItemName,
                                match.confidence
                        );

                        Notification notification = notificationService.createNotification(
                                user, title, message, "MATCH_FOUND"
                        );

                        log.info("Created notification {} for user {} about potential match", 
                                notification.getId(), user.getId());
                        notificationsSent++;
                    }
                }
            } catch (Exception e) {
                log.error("Error creating notification for match result: {}", e.getMessage(), e);
            }
        }

        return notificationsSent;
    }

    private String getImagePath(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) {
            return null;
        }

        try {
            // Convert URL to local file path
            // Assuming images are stored in uploads directory
            String fileName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
            Path imagePath = Paths.get("uploads", fileName);
            
            if (Files.exists(imagePath)) {
                return imagePath.toAbsolutePath().toString();
            }

            // Try alternative paths
            Path altPath = Paths.get("../uploads", fileName);
            if (Files.exists(altPath)) {
                return altPath.toAbsolutePath().toString();
            }

            // Try public uploads path
            Path publicPath = Paths.get("../public/uploads", fileName);
            if (Files.exists(publicPath)) {
                return publicPath.toAbsolutePath().toString();
            }

            log.warn("Image file not found for URL: {}", imageUrl);
            return null;

        } catch (Exception e) {
            log.error("Error getting image path for URL {}: {}", imageUrl, e.getMessage());
            return null;
        }
    }

    private double calculateConfidence(int matchCount) {
        // Simple confidence calculation based on feature matches
        // You can adjust this formula based on your requirements
        if (matchCount >= 50) return 95.0;
        if (matchCount >= 30) return 85.0;
        if (matchCount >= 20) return 75.0;
        if (matchCount >= 15) return 65.0;
        if (matchCount >= 10) return 55.0;
        return 40.0;
    }

    // DTOs for matching results
    public static class MatchResult {
        public Long lostItemId;
        public String lostItemName;
        public String lostItemDescription;
        public String lostItemImageUrl;
        public int matchScore;
        public double confidence;
        public Long reportedByUserId;
    }

    public static class ImageMatchResult {
        public String imagePath;
        public int matchCount;
    }
}