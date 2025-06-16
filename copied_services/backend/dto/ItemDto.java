package com.recovr.api.dto;

import com.recovr.api.entity.ItemCategory;
import com.recovr.api.entity.ItemType;
import com.recovr.api.entity.ItemStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ItemDto {
    private Long id;
    
    @NotBlank(message = "Item name is required")
    private String name;
    
    private String description;
    
    @NotNull(message = "Item type is required")
    private ItemType type;
    
    @NotNull(message = "Item category is required")
    private ItemCategory category;
    
    @NotNull(message = "Item status is required")
    private ItemStatus status;
    
    private LocalDateTime dateFound;
    
    private LocalDateTime dateLost;
    
    private String location;
    
    private String imageUrl;
    
    private List<String> images;
    
    private Double latitude;
    
    private Double longitude;
    
    private Long userId;
    
    private String username;
    
    private boolean claimed;
    
    // User who reported the item
    private Long reportedById;
    private String reportedByUsername;
    private LocalDateTime reportedAt;
    
    // User who claimed the item (if any)
    private Long claimedById;
    private String claimedByUsername;
    private LocalDateTime claimedAt;
    
    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 