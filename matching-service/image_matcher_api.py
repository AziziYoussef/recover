#!/usr/bin/env python3
"""
Image Matching API for RECOVR Lost & Found System
Uses ORB + FLANN for fast, training-free image matching
"""

import cv2
import numpy as np
import sys
import os
import json
from typing import List, Tuple, Optional

class EnhancedImageMatcher:
    def __init__(self):
        """Initialize the ORB + FLANN matcher with optimized parameters."""
        # Initialize ORB with more features for better matching
        self.orb = cv2.ORB_create(
            nfeatures=1000,  # Increase number of features
            scaleFactor=1.2,
            nlevels=8,
            edgeThreshold=31,
            firstLevel=0,
            WTA_K=2,
            scoreType=cv2.ORB_HARRIS_SCORE,
            patchSize=31,
            fastThreshold=20
        )
        
        # FLANN parameters for binary descriptors (ORB)
        FLANN_INDEX_LSH = 6
        index_params = dict(
            algorithm=FLANN_INDEX_LSH,
            table_number=6,
            key_size=12,
            multi_probe_level=1
        )
        search_params = dict(checks=50)
        
        self.flann = cv2.FlannBasedMatcher(index_params, search_params)
        
        # Matching thresholds
        self.ratio_threshold = 0.75  # Lowe's ratio test threshold
        self.min_match_count = 10    # Minimum matches for a valid match
        
    def preprocess_image(self, image_path: str) -> Optional[np.ndarray]:
        """
        Load and preprocess image for feature detection.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Preprocessed grayscale image or None if loading fails
        """
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                print(f"Error: Could not load image from {image_path}")
                return None
            
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
            # This improves feature detection in varying lighting conditions
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(gray)
            
            # Optional: Gaussian blur to reduce noise
            processed = cv2.GaussianBlur(enhanced, (3, 3), 0)
            
            return processed
            
        except Exception as e:
            print(f"Error preprocessing image {image_path}: {str(e)}")
            return None
    
    def extract_features(self, image: np.ndarray) -> Tuple[Optional[List], Optional[np.ndarray]]:
        """
        Extract ORB features from an image.
        
        Args:
            image: Preprocessed grayscale image
            
        Returns:
            Tuple of (keypoints, descriptors)
        """
        try:
            keypoints, descriptors = self.orb.detectAndCompute(image, None)
            
            if descriptors is None:
                return None, None
                
            return keypoints, descriptors
            
        except Exception as e:
            print(f"Error extracting features: {str(e)}")
            return None, None
    
    def match_features(self, desc1: np.ndarray, desc2: np.ndarray) -> List:
        """
        Match features between two sets of descriptors using FLANN.
        
        Args:
            desc1: Descriptors from first image
            desc2: Descriptors from second image
            
        Returns:
            List of good matches after ratio test
        """
        try:
            # Ensure descriptors are in correct format
            if desc1 is None or desc2 is None:
                return []
            
            if len(desc1) < 2 or len(desc2) < 2:
                return []
            
            # Perform knn matching with k=2 for ratio test
            matches = self.flann.knnMatch(desc1, desc2, k=2)
            
            # Apply Lowe's ratio test
            good_matches = []
            for match_pair in matches:
                if len(match_pair) == 2:
                    m, n = match_pair
                    if m.distance < self.ratio_threshold * n.distance:
                        good_matches.append(m)
            
            return good_matches
            
        except Exception as e:
            print(f"Error matching features: {str(e)}")
            return []
    
    def calculate_match_quality(self, matches: List, kp1: List, kp2: List) -> dict:
        """
        Calculate additional match quality metrics.
        
        Args:
            matches: List of good matches
            kp1: Keypoints from first image
            kp2: Keypoints from second image
            
        Returns:
            Dictionary with quality metrics
        """
        if len(matches) < 4:
            return {
                'homography_inliers': 0,
                'geometric_consistency': 0.0,
                'spatial_distribution': 0.0
            }
        
        try:
            # Extract matched points
            src_pts = np.float32([kp1[m.queryIdx].pt for m in matches]).reshape(-1, 1, 2)
            dst_pts = np.float32([kp2[m.trainIdx].pt for m in matches]).reshape(-1, 1, 2)
            
            # Find homography and count inliers
            _, mask = cv2.findHomography(src_pts, dst_pts, 
                                       cv2.RANSAC, 5.0)
            
            inliers = np.sum(mask) if mask is not None else 0
            geometric_consistency = inliers / len(matches) if matches else 0
            
            # Calculate spatial distribution (spread of matches across image)
            if len(src_pts) > 1:
                hull = cv2.convexHull(src_pts)
                area = cv2.contourArea(hull)
                spatial_distribution = min(area / 10000, 1.0)  # Normalize to 0-1
            else:
                spatial_distribution = 0.0
            
            return {
                'homography_inliers': int(inliers),
                'geometric_consistency': float(geometric_consistency),
                'spatial_distribution': float(spatial_distribution)
            }
            
        except Exception as e:
            print(f"Error calculating match quality: {str(e)}")
            return {
                'homography_inliers': 0,
                'geometric_consistency': 0.0,
                'spatial_distribution': 0.0
            }
    
    def compare_images(self, image1_path: str, image2_path: str) -> dict:
        """
        Compare two images and return detailed matching results.
        
        Args:
            image1_path: Path to first image (query image)
            image2_path: Path to second image (database image)
            
        Returns:
            Dictionary with matching results
        """
        # Load and preprocess images
        img1 = self.preprocess_image(image1_path)
        img2 = self.preprocess_image(image2_path)
        
        if img1 is None or img2 is None:
            return {
                'image_path': image2_path,
                'matches': 0,
                'quality_score': 0.0,
                'confidence': 0.0,
                'error': 'Could not load images'
            }
        
        # Extract features
        kp1, desc1 = self.extract_features(img1)
        kp2, desc2 = self.extract_features(img2)
        
        if desc1 is None or desc2 is None:
            return {
                'image_path': image2_path,
                'matches': 0,
                'quality_score': 0.0,
                'confidence': 0.0,
                'error': 'No features detected'
            }
        
        # Match features
        good_matches = self.match_features(desc1, desc2)
        match_count = len(good_matches)
        
        # Calculate quality metrics
        quality_metrics = self.calculate_match_quality(good_matches, kp1, kp2)
        
        # Calculate overall quality score
        base_score = min(match_count / 50, 1.0)  # Normalize based on match count
        quality_score = (
            base_score * 0.5 +
            quality_metrics['geometric_consistency'] * 0.3 +
            quality_metrics['spatial_distribution'] * 0.2
        )
        
        # Calculate confidence (0-100)
        confidence = min(quality_score * 100, 100)
        
        return {
            'image_path': image2_path,
            'matches': match_count,
            'quality_score': round(quality_score, 3),
            'confidence': round(confidence, 1),
            'homography_inliers': quality_metrics['homography_inliers'],
            'geometric_consistency': round(quality_metrics['geometric_consistency'], 3),
            'spatial_distribution': round(quality_metrics['spatial_distribution'], 3)
        }
    
    def compare_with_database(self, query_image_path: str, database_image_paths: List[str]) -> List[dict]:
        """
        Compare query image with multiple database images.
        
        Args:
            query_image_path: Path to the query image
            database_image_paths: List of paths to database images
            
        Returns:
            List of match results sorted by quality score
        """
        results = []
        
        print(f"Comparing query image: {query_image_path}")
        print(f"Against {len(database_image_paths)} database images")
        
        for db_image_path in database_image_paths:
            print(f"Processing: {db_image_path}")
            result = self.compare_images(query_image_path, db_image_path)
            results.append(result)
        
        # Sort by quality score (highest first)
        results.sort(key=lambda x: x['quality_score'], reverse=True)
        
        return results


def main():
    """Main function to handle command line interface."""
    if len(sys.argv) < 3:
        print("Usage: python image_matcher_api.py <query_image> <db_image1> [db_image2] ...")
        sys.exit(1)
    
    query_image = sys.argv[1]
    database_images = sys.argv[2:]
    
    # Validate input files
    if not os.path.exists(query_image):
        print(f"Error: Query image not found: {query_image}")
        sys.exit(1)
    
    valid_db_images = []
    for db_image in database_images:
        if os.path.exists(db_image):
            valid_db_images.append(db_image)
        else:
            print(f"Warning: Database image not found: {db_image}")
    
    if not valid_db_images:
        print("Error: No valid database images found")
        sys.exit(1)
    
    # Initialize matcher and perform comparison
    matcher = EnhancedImageMatcher()
    results = matcher.compare_with_database(query_image, valid_db_images)
    
    # Output results in format expected by Java backend
    print("\n=== MATCHING RESULTS ===")
    for result in results:
        if 'error' not in result and result['matches'] >= matcher.min_match_count:
            print(f"{result['image_path']}:{result['matches']} matches (confidence: {result['confidence']}%)")
    
    # Also output detailed JSON for debugging (commented out for production)
    # print(f"\n=== DETAILED RESULTS ===")
    # print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()