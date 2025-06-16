package com.recovr.api.service;

import com.recovr.api.dto.ItemDto;
import com.recovr.api.entity.Item;
import com.recovr.api.entity.ItemCategory;
import com.recovr.api.entity.ItemStatus;
import com.recovr.api.entity.User;
import com.recovr.api.exception.ResourceNotFoundException;
import com.recovr.api.repository.ItemRepository;
import com.recovr.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ItemService {
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private static final Logger log = LoggerFactory.getLogger(ItemService.class);

    public Page<ItemDto> getAllItems(Pageable pageable, String query, String category, String status) {
        return searchItems(pageable, query, category, status, null, null, null, null);
    }

    public Page<ItemDto> searchItems(Pageable pageable, String query, String category, String status, 
                                   String location, String dateFrom, String dateTo, String sortBy) {
        Specification<Item> spec = Specification.where(null);
        
        // Text search in name, description, and location
        if (query != null && !query.isEmpty()) {
            String lowerCaseQuery = query.toLowerCase();
            spec = spec.and((root, q, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), "%" + lowerCaseQuery + "%"),
                cb.like(cb.lower(root.get("description")), "%" + lowerCaseQuery + "%"),
                cb.like(cb.lower(root.get("location")), "%" + lowerCaseQuery + "%")
            ));
        }

        // Category filter
        if (category != null && !category.isEmpty() && !"ALL".equalsIgnoreCase(category)) {
            try {
                final ItemCategory categoryEnum = ItemCategory.valueOf(category.toUpperCase());
                spec = spec.and((root, q, cb) -> cb.equal(root.get("category"), categoryEnum));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid category value: {}", category);
            }
        }
        
        // Status filter (LOST, FOUND, CLAIMED)
        if (status != null && !status.isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            try {
                final ItemStatus statusEnum = ItemStatus.valueOf(status.toUpperCase());
                spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), statusEnum));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status value: {}", status);
            }
        }

        // Location filter
        if (location != null && !location.isEmpty()) {
            String lowerCaseLocation = location.toLowerCase();
            spec = spec.and((root, q, cb) -> 
                cb.like(cb.lower(root.get("location")), "%" + lowerCaseLocation + "%")
            );
        }

        // Date range filter
        if (dateFrom != null && !dateFrom.isEmpty()) {
            try {
                LocalDateTime fromDate = LocalDateTime.parse(dateFrom + "T00:00:00");
                spec = spec.and((root, q, cb) -> cb.greaterThanOrEqualTo(root.get("reportedAt"), fromDate));
            } catch (Exception e) {
                log.warn("Invalid dateFrom format: {}", dateFrom);
            }
        }

        if (dateTo != null && !dateTo.isEmpty()) {
            try {
                LocalDateTime toDate = LocalDateTime.parse(dateTo + "T23:59:59");
                spec = spec.and((root, q, cb) -> cb.lessThanOrEqualTo(root.get("reportedAt"), toDate));
            } catch (Exception e) {
                log.warn("Invalid dateTo format: {}", dateTo);
            }
        }

        // Apply sorting
        Pageable sortedPageable = applySorting(pageable, sortBy);
        
        return itemRepository.findAll(spec, sortedPageable).map(this::convertToDto);
    }

    private Pageable applySorting(Pageable pageable, String sortBy) {
        if (sortBy == null || sortBy.isEmpty()) {
            return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), 
                                Sort.by("reportedAt").descending());
        }

        Sort sort;
        switch (sortBy.toLowerCase()) {
            case "name":
                sort = Sort.by("name").ascending();
                break;
            case "date_asc":
                sort = Sort.by("reportedAt").ascending();
                break;
            case "date_desc":
            case "newest":
                sort = Sort.by("reportedAt").descending();
                break;
            case "category":
                sort = Sort.by("category").ascending().and(Sort.by("reportedAt").descending());
                break;
            case "location":
                sort = Sort.by("location").ascending().and(Sort.by("reportedAt").descending());
                break;
            default:
                sort = Sort.by("reportedAt").descending();
        }

        return PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
    }

    public ItemDto getItemById(Long id) {
        Item item = itemRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));
        return convertToDto(item);
    }

    public java.util.List<ItemDto> getItemsByStatus(String status) {
        try {
            ItemStatus statusEnum = ItemStatus.valueOf(status.toUpperCase());
            return itemRepository.findByStatus(statusEnum)
                    .stream()
                    .map(this::convertToDto)
                    .collect(java.util.stream.Collectors.toList());
        } catch (IllegalArgumentException e) {
            log.error("Invalid status value: {}", status);
            throw new IllegalArgumentException("Invalid status: " + status);
        }
    }

    @Transactional
    public ItemDto createItem(ItemDto itemDto, User user) {
        Item item = new Item();
        updateItemFromDto(item, itemDto);
        item.setReportedBy(user);
        item.setReportedAt(LocalDateTime.now());
        item.setStatus(ItemStatus.FOUND);
        Item savedItem = itemRepository.save(item);
        return convertToDto(savedItem);
    }

    @Transactional
    public ItemDto updateItem(Long id, ItemDto itemDto) {
        Item item = itemRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + id));
        updateItemFromDto(item, itemDto);
        return convertToDto(itemRepository.save(item));
    }

    @Transactional
    public void deleteItem(Long id) {
        if (!itemRepository.existsById(id)) {
            throw new RuntimeException("Item not found");
        }
        itemRepository.deleteById(id);
    }

    @Transactional
    public ItemDto claimItem(Long id, User user) {
        Item item = itemRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Item not found"));

        if (item.getStatus() != ItemStatus.FOUND) {
            throw new RuntimeException("Item cannot be claimed");
        }

        item.setStatus(ItemStatus.CLAIMED);
        item.setClaimedBy(user);
        item.setClaimedAt(LocalDateTime.now());
        item.setUpdatedAt(LocalDateTime.now());

        Item updatedItem = itemRepository.save(item);
        return convertToDto(updatedItem);
    }

    public void updateItemFromDto(Item item, ItemDto dto) {
        log.info("updateItemFromDto received ItemDto: {}", dto);
        try {
            item.setName(dto.getName());
            item.setDescription(dto.getDescription());
            item.setCategory(dto.getCategory());
            item.setStatus(dto.getStatus());
            item.setLocation(dto.getLocation());
            item.setImageUrl(dto.getImageUrl());
            item.setLatitude(dto.getLatitude());
            item.setLongitude(dto.getLongitude());
        } catch (Exception e) {
            log.error("Error in updateItemFromDto: ", e);
            throw e;
        }
    }

    protected ItemDto convertToDto(Item item) {
        ItemDto dto = new ItemDto();
        dto.setId(item.getId());
        dto.setName(item.getName());
        dto.setDescription(item.getDescription());
        dto.setCategory(item.getCategory());
        dto.setStatus(item.getStatus());
        dto.setLocation(item.getLocation());
        dto.setImageUrl(item.getImageUrl());
        dto.setLatitude(item.getLatitude());
        dto.setLongitude(item.getLongitude());
        
        if (item.getReportedBy() != null) {
            dto.setReportedById(item.getReportedBy().getId());
            dto.setReportedByUsername(item.getReportedBy().getUsername());
            dto.setReportedAt(item.getReportedAt());
        }
        
        if (item.getClaimedBy() != null) {
            dto.setClaimedById(item.getClaimedBy().getId());
            dto.setClaimedByUsername(item.getClaimedBy().getUsername());
            dto.setClaimedAt(item.getClaimedAt());
        }
        
        dto.setCreatedAt(item.getCreatedAt());
        dto.setUpdatedAt(item.getUpdatedAt());
        
        return dto;
    }
} 