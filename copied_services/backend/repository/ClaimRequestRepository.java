package com.recovr.api.repository;

import com.recovr.api.entity.ClaimRequest;
import com.recovr.api.entity.ClaimStatus;
import com.recovr.api.entity.Item;
import com.recovr.api.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClaimRequestRepository extends JpaRepository<ClaimRequest, Long> {
    List<ClaimRequest> findByItem(Item item);
    
    Page<ClaimRequest> findByUser(User user, Pageable pageable);
    
    Page<ClaimRequest> findByStatus(ClaimStatus status, Pageable pageable);
    
    Page<ClaimRequest> findByUserAndStatus(User user, ClaimStatus status, Pageable pageable);
    
    Page<ClaimRequest> findByItemAndStatus(Item item, ClaimStatus status, Pageable pageable);
    
    boolean existsByItemAndUser(Item item, User user);
    
    Optional<ClaimRequest> findByItemAndUserAndStatus(Item item, User user, ClaimStatus status);
} 