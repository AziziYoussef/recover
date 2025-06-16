package com.recovr.api.dto;

import com.recovr.api.entity.ClaimStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ClaimRequestDto {
    private Long id;
    
    @NotNull(message = "Item ID is required")
    private Long itemId;
    
    private String itemName;
    
    private Long userId;
    
    private String username;
    
    @NotBlank(message = "Claim message is required")
    private String claimMessage;
    
    private String contactInfo;
    
    private ClaimStatus status;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
} 