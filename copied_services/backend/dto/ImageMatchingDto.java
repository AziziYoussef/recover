package com.recovr.api.dto;

import com.recovr.api.entity.ItemCategory;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ImageMatchingDto {
    private Long detectedObjectId;
    private double similarityScore;
    private ItemCategory category;
    private String location;
    private LocalDateTime detectedAt;
    private String imageUrl;
} 