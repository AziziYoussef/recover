package com.recovr.api.entity;

public enum ItemStatus {
    LOST,      // Item has been reported as lost
    FOUND,     // Item has been found but not claimed
    CLAIMED,   // Item has been claimed by its owner
    RETURNED,  // Item has been returned to its owner
    EXPIRED,   // Item has been in the system for too long
    ABANDONED  // Item has been abandoned (stationary for too long)
} 