package com.recovr.api.repository;

import com.recovr.api.entity.Item;
import com.recovr.api.entity.ItemCategory;
import com.recovr.api.entity.ItemStatus;
import com.recovr.api.entity.ItemType;
import com.recovr.api.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long>, JpaSpecificationExecutor<Item> {
    Page<Item> findByReportedBy(User user, Pageable pageable);
    
    Page<Item> findByClaimedBy(User user, Pageable pageable);
    
    Page<Item> findByClaimedAtIsNotNull(Pageable pageable);
    Page<Item> findByClaimedAtIsNull(Pageable pageable);
    
    long countByStatus(ItemStatus status);
    
    long countByCategory(ItemCategory category);
    
    List<Item> findByStatus(ItemStatus status);
} 