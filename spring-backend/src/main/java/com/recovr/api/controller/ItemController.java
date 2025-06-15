package com.recovr.api.controller;

import com.recovr.api.dto.ItemDto;
import com.recovr.api.entity.Item;
import com.recovr.api.entity.User;
import com.recovr.api.exception.ResourceNotFoundException;
import com.recovr.api.repository.UserRepository;
import com.recovr.api.security.services.UserDetailsImpl;
import com.recovr.api.service.ItemService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.web.client.RestTemplate;
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

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/items")
public class ItemController {
    private static final Logger log = LoggerFactory.getLogger(ItemController.class);

    @Autowired
    private ItemService itemService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RestTemplate restTemplate;

    @GetMapping
    public ResponseEntity<?> getAllItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status) {
        try {
            Pageable paging = PageRequest.of(page, size, Sort.by("createdAt").descending());
            Page<ItemDto> pageItems = itemService.getAllItems(paging, category, status);

            Map<String, Object> response = new HashMap<>();
            response.put("items", pageItems.getContent());
            response.put("currentPage", pageItems.getNumber());
            response.put("totalItems", pageItems.getTotalElements());
            response.put("totalPages", pageItems.getTotalPages());

            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getItemById(@PathVariable Long id) {
        try {
            ItemDto item = itemService.getItemById(id);
            return new ResponseEntity<>(item, HttpStatus.OK);
        } catch (ResourceNotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping
    public ResponseEntity<?> createItem(@Valid @RequestBody ItemDto itemDto) {
        log.info("Received POST /api/items request body: {}", itemDto);
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User user = null;
            if (authentication != null && authentication.isAuthenticated() && !(authentication.getPrincipal() instanceof String)) {
                UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
                user = userRepository.findById(userDetails.getId())
                        .orElse(null);
            }
            if (user == null) {
                log.info("Creating item anonymously (no authenticated user)");
            }
            ItemDto createdItem = itemService.createItem(itemDto, user);
            
            // Trigger matching service if the item has an image
            if (createdItem.getImageUrl() != null && !createdItem.getImageUrl().trim().isEmpty()) {
                triggerMatchingService(createdItem.getId());
            }
            
            return new ResponseEntity<>(createdItem, HttpStatus.CREATED);
        } catch (Exception e) {
            log.error("Error in createItem: ", e);
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> updateItem(
            @PathVariable Long id,
            @Valid @RequestBody ItemDto itemDto) {
        try {
            ItemDto updatedItem = itemService.updateItem(id, itemDto);
            return new ResponseEntity<>(updatedItem, HttpStatus.OK);
        } catch (ResourceNotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteItem(@PathVariable Long id) {
        try {
            itemService.deleteItem(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } catch (ResourceNotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{id}/claim")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    public ResponseEntity<?> claimItem(@PathVariable Long id) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            
            User user = userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            
            ItemDto claimedItem = itemService.claimItem(id, user);
            return new ResponseEntity<>(claimedItem, HttpStatus.OK);
        } catch (ResourceNotFoundException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        } catch (IllegalStateException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private void triggerMatchingService(Long itemId) {
        try {
            String matchingUrl = "http://localhost:8080/api/matching/process-item/" + itemId;
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            restTemplate.exchange(matchingUrl, HttpMethod.POST, entity, String.class);
            log.info("Triggered matching service for item ID: {}", itemId);
        } catch (Exception e) {
            log.warn("Failed to trigger matching service for item ID {}: {}", itemId, e.getMessage());
        }
    }
} 