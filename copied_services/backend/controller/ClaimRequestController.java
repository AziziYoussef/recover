package com.recovr.api.controller;

import com.recovr.api.dto.ClaimRequestDto;
import com.recovr.api.entity.ClaimRequest;
import com.recovr.api.entity.ClaimStatus;
import com.recovr.api.entity.Item;
import com.recovr.api.entity.ItemStatus;
import com.recovr.api.entity.User;
import com.recovr.api.repository.ClaimRequestRepository;
import com.recovr.api.repository.ItemRepository;
import com.recovr.api.repository.UserRepository;
import com.recovr.api.security.services.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/claims")
public class ClaimRequestController {
    @Autowired
    private ClaimRequestRepository claimRequestRepository;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getUserClaimRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) ClaimStatus status) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            User user = userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            Pageable paging = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<ClaimRequest> pageRequests;
            
            if (status != null) {
                pageRequests = claimRequestRepository.findByUserAndStatus(user, status, paging);
            } else {
                pageRequests = claimRequestRepository.findByUser(user, paging);
            }
            
            List<ClaimRequestDto> claims = pageRequests.getContent().stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("claims", claims);
            response.put("currentPage", pageRequests.getNumber());
            response.put("totalItems", pageRequests.getTotalElements());
            response.put("totalPages", pageRequests.getTotalPages());

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/item/{itemId}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> getClaimRequestsByItem(
            @PathVariable("itemId") long itemId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) ClaimStatus status) {
        try {
            Item item = itemRepository.findById(itemId)
                    .orElseThrow(() -> new RuntimeException("Item not found"));
            
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            // Only the item owner or admin can see claims
            if (!item.getReportedBy().getId().equals(userDetails.getId()) && 
                    !authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                return new ResponseEntity<>("You are not authorized to view these claims", HttpStatus.FORBIDDEN);
            }
            
            Pageable paging = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<ClaimRequest> pageRequests;
            
            if (status != null) {
                pageRequests = claimRequestRepository.findByItemAndStatus(item, status, paging);
            } else {
                pageRequests = claimRequestRepository.findAll(paging);
            }
            
            List<ClaimRequestDto> claims = pageRequests.getContent().stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("claims", claims);
            response.put("currentPage", pageRequests.getNumber());
            response.put("totalItems", pageRequests.getTotalElements());
            response.put("totalPages", pageRequests.getTotalPages());

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> createClaimRequest(@Valid @RequestBody ClaimRequestDto claimRequestDto) {
        try {
            Item item = itemRepository.findById(claimRequestDto.getItemId())
                    .orElseThrow(() -> new RuntimeException("Item not found"));
            
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            User user = userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Check if the user has already claimed this item
            if (claimRequestRepository.existsByItemAndUser(item, user)) {
                return new ResponseEntity<>("You have already submitted a claim for this item", HttpStatus.BAD_REQUEST);
            }
            
            // Check if user is trying to claim their own item
            if (item.getReportedBy().getId().equals(user.getId())) {
                return new ResponseEntity<>("You cannot claim your own item", HttpStatus.BAD_REQUEST);
            }
            
            ClaimRequest claimRequest = new ClaimRequest();
            claimRequest.setItem(item);
            claimRequest.setUser(user);
            claimRequest.setClaimMessage(claimRequestDto.getClaimMessage());
            claimRequest.setContactInfo(claimRequestDto.getContactInfo());
            claimRequest.setStatus(ClaimStatus.PENDING);
            
            ClaimRequest savedRequest = claimRequestRepository.save(claimRequest);
            
            return new ResponseEntity<>(convertToDto(savedRequest), HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateClaimRequestStatus(
            @PathVariable("id") long id,
            @RequestParam ClaimStatus status) {
        try {
            ClaimRequest claimRequest = claimRequestRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Claim request not found"));
            
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            // For CANCELLED status, only the claim owner can cancel it
            if (status == ClaimStatus.CANCELLED) {
                if (!claimRequest.getUser().getId().equals(userDetails.getId())) {
                    return new ResponseEntity<>("You are not authorized to cancel this claim", HttpStatus.FORBIDDEN);
                }
            } 
            // For other statuses, only the item owner or admin can update them
            else if (!claimRequest.getItem().getReportedBy().getId().equals(userDetails.getId()) && 
                    !authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                return new ResponseEntity<>("You are not authorized to update this claim", HttpStatus.FORBIDDEN);
            }
            
            claimRequest.setStatus(status);
            
            // If status is APPROVED, update the item as claimed
            if (status == ClaimStatus.APPROVED) {
                Item item = claimRequest.getItem();
                item.setStatus(ItemStatus.CLAIMED);
                item.setClaimedBy(claimRequest.getUser());
                item.setClaimedAt(LocalDateTime.now());
                itemRepository.save(item);
            }
            
            ClaimRequest updatedRequest = claimRequestRepository.save(claimRequest);
            
            return new ResponseEntity<>(convertToDto(updatedRequest), HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private ClaimRequestDto convertToDto(ClaimRequest claimRequest) {
        ClaimRequestDto dto = new ClaimRequestDto();
        dto.setId(claimRequest.getId());
        dto.setItemId(claimRequest.getItem().getId());
        dto.setItemName(claimRequest.getItem().getName());
        dto.setUserId(claimRequest.getUser().getId());
        dto.setUsername(claimRequest.getUser().getUsername());
        dto.setClaimMessage(claimRequest.getClaimMessage());
        dto.setContactInfo(claimRequest.getContactInfo());
        dto.setStatus(claimRequest.getStatus());
        dto.setCreatedAt(claimRequest.getCreatedAt());
        dto.setUpdatedAt(claimRequest.getUpdatedAt());
        
        return dto;
    }
} 