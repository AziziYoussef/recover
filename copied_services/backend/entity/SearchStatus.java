package com.recovr.api.entity;

public enum SearchStatus {
    PENDING,
    PROCESSING,  // Search is being processed
    COMPLETED,   // Search has been completed
    FAILED,      // Search failed due to error
    CANCELLED    // Search was cancelled by user
} 