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
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

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

    @PostMapping("/search-by-image")
    public ResponseEntity<?> searchByImage(@RequestParam("image") MultipartFile image) {
        log.info("Processing image search with uploaded file");
        
        try {
            // Validate image file
            if (image.isEmpty()) {
                return ResponseEntity.badRequest().body(new MessageResponse("No image file provided"));
            }
            
            if (!image.getContentType().startsWith("image/")) {
                return ResponseEntity.badRequest().body(new MessageResponse("File must be an image"));
            }

            // Save uploaded image temporarily
            String tempImagePath = saveTemporaryImage(image);
            if (tempImagePath == null) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(new MessageResponse("Failed to save uploaded image"));
            }
            
            log.info("Saved uploaded image to: {}", tempImagePath);

            // Get all items from database for comparison (search in both LOST and FOUND items)
            Page<ItemDto> itemsPage = itemService.getAllItems(PageRequest.of(0, 1000), null, null, null);
            List<ItemDto> allItems = itemsPage.getContent();
            log.info("Found {} total items in database for matching", allItems.size());

            if (allItems.isEmpty()) {
                cleanup(tempImagePath);
                return ResponseEntity.ok(Map.of(
                    "message", "No items available for matching",
                    "matches", Collections.emptyList()
                ));
            }

            // Filter items with images only
            List<ItemDto> itemsWithImages = allItems.stream()
                    .filter(item -> item.getImageUrl() != null && !item.getImageUrl().isEmpty())
                    .collect(Collectors.toList());

            if (itemsWithImages.isEmpty()) {
                cleanup(tempImagePath);
                return ResponseEntity.ok(Map.of(
                    "message", "No items with images available for matching",
                    "matches", Collections.emptyList()
                ));
            }

            log.info("Processing image matching against {} items with images", itemsWithImages.size());

            // Perform image matching
            List<SearchMatchResult> matchResults = performImageSearch(tempImagePath, itemsWithImages);

            // Clean up temporary file
            cleanup(tempImagePath);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Image search completed successfully");
            response.put("itemsChecked", itemsWithImages.size());
            response.put("matchesFound", matchResults.size());
            response.put("matches", matchResults);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error processing image search: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Error processing image search: " + e.getMessage()));
        }
    }

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
        
        // Build Python command using virtual environment
        List<String> command = new ArrayList<>();
        command.add("../matching-service/venv/bin/python");
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
                
                // Parse results line (format: "image_path:match_count matches (confidence: xx%)")
                if (line.contains(":") && line.contains("matches") && !line.startsWith("Comparing") && !line.startsWith("Processing") && !line.startsWith("Result for")) {
                    log.info("Parsing potential match line: {}", line);
                    String[] parts = line.split(":", 2); // Limit to 2 parts to handle Windows paths with colons
                    if (parts.length == 2) {
                        try {
                            String imagePath = parts[0].trim();
                            String matchPart = parts[1].trim();
                            // Extract match count from "42 matches (confidence: 71.3%)"
                            String[] matchWords = matchPart.split(" ");
                            if (matchWords.length >= 2) {
                                int matchCount = Integer.parseInt(matchWords[0]);
                                
                                ImageMatchResult result = new ImageMatchResult();
                                result.imagePath = imagePath;
                                result.matchCount = matchCount;
                                results.add(result);
                                log.info("Parsed match result: {} -> {} matches", imagePath, matchCount);
                            } else {
                                log.warn("Match line does not have expected format: {}", matchPart);
                            }
                        } catch (NumberFormatException e) {
                            log.warn("Could not parse match count from line: {}", line);
                        }
                    } else {
                        log.warn("Line does not split correctly on colon: {}", line);
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
            String fileName = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
            
            // List of possible paths to check
            String[] possiblePaths = {
                // Public uploads directory (relative to spring-backend) - MOST LIKELY
                "../public/uploads/" + fileName,
                // Current directory uploads (spring-backend/uploads)
                "uploads/" + fileName,
                // Parent directory uploads 
                "../uploads/" + fileName,
                // Absolute path to public uploads
                System.getProperty("user.dir") + "/../public/uploads/" + fileName,
                // Try with absolute project root
                System.getProperty("user.dir").replace("/spring-backend", "") + "/public/uploads/" + fileName,
                // Spring backend uploads
                "spring-backend/uploads/" + fileName
            };
            
            for (String pathStr : possiblePaths) {
                Path imagePath = Paths.get(pathStr);
                if (Files.exists(imagePath)) {
                    String absolutePath = imagePath.toAbsolutePath().toString();
                    try {
                        // Normalize the path to its real, canonical form
                        String realPath = imagePath.toRealPath().toString();
                        log.info("Found image at path: {} (resolved to: {})", absolutePath, realPath);
                        return realPath;
                    } catch (IOException ioException) {
                        log.warn("Could not resolve real path for {}: {}", absolutePath, ioException.getMessage());
                        return absolutePath; // Fallback to absolute path if real path cannot be resolved
                    }
                }
            }

            // If no file found, log all attempted paths for debugging
            log.warn("Image file not found for URL: {}. Attempted paths:", imageUrl);
            for (String pathStr : possiblePaths) {
                log.warn("  - {}", Paths.get(pathStr).toAbsolutePath().toString());
            }
            
            return null;

        } catch (Exception e) {
            log.error("Error getting image path for URL {}: {}", imageUrl, e.getMessage());
            return null;
        }
    }

    private double calculateConfidence(int matchCount) {
        // Improved confidence calculation that better handles identical images
        if (matchCount >= 100) return 99.0;  // Very high confidence for many matches (likely identical)
        if (matchCount >= 50) return 95.0;
        if (matchCount >= 30) return 85.0;
        if (matchCount >= 20) return 75.0;
        if (matchCount >= 15) return 65.0;
        if (matchCount >= 10) return 55.0;
        if (matchCount >= 5) return 45.0;
        return Math.max(matchCount * 5, 20.0);  // Scale smaller match counts
    }

    private String saveTemporaryImage(MultipartFile image) {
        try {
            // Create uploads directory if it doesn't exist
            Path uploadsDir = Paths.get("../public/uploads");
            if (!Files.exists(uploadsDir)) {
                Files.createDirectories(uploadsDir);
            }

            // Generate unique filename
            String originalFilename = image.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String uniqueFilename = "search_" + System.currentTimeMillis() + extension;
            
            Path filePath = uploadsDir.resolve(uniqueFilename);
            Files.copy(image.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            log.info("Saved temporary image to: {}", filePath.toAbsolutePath());
            return filePath.toAbsolutePath().toString();

        } catch (IOException e) {
            log.error("Error saving temporary image: {}", e.getMessage());
            return null;
        }
    }

    private void cleanup(String tempImagePath) {
        try {
            if (tempImagePath != null) {
                Files.deleteIfExists(Paths.get(tempImagePath));
                log.info("Cleaned up temporary image: {}", tempImagePath);
            }
        } catch (IOException e) {
            log.warn("Failed to cleanup temporary image {}: {}", tempImagePath, e.getMessage());
        }
    }

    private List<SearchMatchResult> performImageSearch(String queryImagePath, List<ItemDto> items) {
        List<SearchMatchResult> results = new ArrayList<>();
        
        try {
            // Prepare image paths for Python script
            log.info("Preparing image paths for {} items", items.size());
            
            List<String> imagePaths = new ArrayList<>();
            for (ItemDto item : items) {
                String imagePath = getImagePath(item.getImageUrl());
                if (imagePath != null) {
                    imagePaths.add(imagePath);
                    log.info("Added image path for item {}: {} -> {}", item.getId(), item.getImageUrl(), imagePath);
                } else {
                    log.warn("Could not resolve image path for item {}: {}", item.getId(), item.getImageUrl());
                }
            }

            if (imagePaths.isEmpty()) {
                log.warn("No valid image paths found for search");
                return results;
            }
            
            log.info("Found {} valid image paths for matching", imagePaths.size());

            // Call Python matching service
            List<ImageMatchResult> pythonResults = callPythonMatchingService(queryImagePath, imagePaths);
            log.info("Python matching service returned {} results", pythonResults.size());

            // Real Python matching logic with debug
            log.info("Processing {} Python results", pythonResults.size());
            for (ImageMatchResult pythonResult : pythonResults) {
                log.info("Processing Python result: {} with {} matches", pythonResult.imagePath, pythonResult.matchCount);
                
                // Find the corresponding item - simple filename-based matching
                ItemDto matchedItem = items.stream()
                        .filter(item -> {
                            if (item.getImageUrl() == null) return false;
                            
                            // Extract filename from both paths for comparison
                            String itemFilename = Paths.get(item.getImageUrl()).getFileName().toString();
                            String pythonFilename = Paths.get(pythonResult.imagePath).getFileName().toString();
                            
                            boolean matches = itemFilename.equals(pythonFilename);
                            if (matches) {
                                log.info("Found match: item {} ({}) matches Python result ({})", 
                                        item.getId(), itemFilename, pythonFilename);
                            }
                            return matches;
                        })
                        .findFirst()
                        .orElse(null);

                if (matchedItem == null) {
                    log.warn("No matching item found for Python result path: {}", pythonResult.imagePath);
                } else {
                    log.info("Found matching item: {} for path: {}", matchedItem.getName(), pythonResult.imagePath);
                }

                if (matchedItem != null && pythonResult.matchCount >= 1) { // Lowered minimum threshold to 1 for any potential match
                    log.info("Creating search result for matched item: {} with {} matches", matchedItem.getName(), pythonResult.matchCount);
                    SearchMatchResult searchResult = new SearchMatchResult();
                    searchResult.itemId = matchedItem.getId();
                    searchResult.itemName = matchedItem.getName();
                    searchResult.itemDescription = matchedItem.getDescription();
                    searchResult.itemImageUrl = matchedItem.getImageUrl();
                    searchResult.category = matchedItem.getCategory().toString();
                    searchResult.location = matchedItem.getLocation();
                    searchResult.reportedAt = matchedItem.getReportedAt();
                    searchResult.matchScore = pythonResult.matchCount;
                    searchResult.confidence = calculateConfidence(pythonResult.matchCount);
                    
                    results.add(searchResult);
                    log.info("Found potential match: {} with {} feature matches", 
                            matchedItem.getName(), pythonResult.matchCount);
                }
            }

            // Sort by match score (highest first)
            results.sort((a, b) -> Integer.compare(b.matchScore, a.matchScore));

        } catch (Exception e) {
            log.error("Error in image search: {}", e.getMessage(), e);
        }

        return results;
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

    public static class SearchMatchResult {
        public Long itemId;
        public String itemName;
        public String itemDescription;
        public String itemImageUrl;
        public String category;
        public String location;
        public java.time.LocalDateTime reportedAt;
        public int matchScore;
        public double confidence;
    }

    public static class ImageMatchResult {
        public String imagePath;
        public int matchCount;
    }
}