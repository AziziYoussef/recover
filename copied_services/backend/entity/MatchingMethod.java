package com.recovr.api.entity;

public enum MatchingMethod {
    CNN_EMBEDDING,    // Using CNN embeddings for similarity
    ORB_FLANN,       // Using ORB keypoints + FLANN matcher
    SIFT_FLANN,      // Using SIFT keypoints + FLANN matcher
    HISTOGRAM,       // Using color histogram comparison
    HYBRID           // Combination of multiple methods
} 