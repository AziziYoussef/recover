package com.recovr.api.entity;

public enum DetectionStatus {
    DETECTED,    // Object has been detected
    TRACKING,    // Object is being tracked
    ABANDONED,   // Object has been stationary for too long
    CLAIMED,     // Object has been claimed by someone
    RETURNED     // Object has been returned to its owner
} 