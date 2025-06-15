package com.recovr.api.service;

import com.recovr.api.entity.Notification;
import com.recovr.api.entity.User;
import com.recovr.api.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private NotificationRepository notificationRepository;

    public Notification createNotification(User user, String title, String message, String type) {
        try {
            Notification notification = new Notification();
            notification.setUser(user);
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setType(type);
            notification.setRead(false);
            notification.setCreatedAt(LocalDateTime.now());

            Notification saved = notificationRepository.save(notification);
            log.info("Created notification {} for user {}", saved.getId(), user.getId());
            return saved;

        } catch (Exception e) {
            log.error("Error creating notification for user {}: {}", user.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to create notification", e);
        }
    }

    public Notification createMatchNotification(User user, String foundItemName, String lostItemName, 
                                              double confidence, Long foundItemId, Long lostItemId) {
        String title = "Potential Match Found!";
        String message = String.format(
                "A found item '%s' might match your lost item '%s'. " +
                "Match confidence: %.1f%%. Click to view details and verify if this is your item.",
                foundItemName, lostItemName, confidence
        );

        Notification notification = createNotification(user, title, message, "MATCH_FOUND");
        notification.setRelatedItemId(foundItemId);
        return notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public Page<Notification> getUserNotifications(User user, Pageable pageable) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user, pageable);
    }

    public List<Notification> getUnreadNotifications(User user) {
        return notificationRepository.findByUserAndReadFalseOrderByCreatedAtDesc(user);
    }

    public long getUnreadCount(User user) {
        return notificationRepository.countByUserAndReadFalse(user);
    }

    public Notification markAsRead(Long notificationId, User user) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        
        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            
            // Verify the notification belongs to the user
            if (!notification.getUser().getId().equals(user.getId())) {
                throw new SecurityException("Notification does not belong to user");
            }
            
            notification.markAsRead();
            return notificationRepository.save(notification);
        }
        
        throw new RuntimeException("Notification not found");
    }

    public void markAllAsRead(User user) {
        List<Notification> unreadNotifications = getUnreadNotifications(user);
        for (Notification notification : unreadNotifications) {
            notification.markAsRead();
        }
        notificationRepository.saveAll(unreadNotifications);
        log.info("Marked {} notifications as read for user {}", unreadNotifications.size(), user.getId());
    }

    public void deleteNotification(Long notificationId, User user) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        
        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            
            // Verify the notification belongs to the user
            if (!notification.getUser().getId().equals(user.getId())) {
                throw new SecurityException("Notification does not belong to user");
            }
            
            notificationRepository.delete(notification);
            log.info("Deleted notification {} for user {}", notificationId, user.getId());
        } else {
            throw new RuntimeException("Notification not found");
        }
    }

    public void deleteReadNotifications(User user) {
        notificationRepository.deleteByUserAndReadTrue(user);
        log.info("Deleted read notifications for user {}", user.getId());
    }
}