-- Drop tables in correct order (children first)
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS search_requests;
DROP TABLE IF EXISTS claim_requests;
DROP TABLE IF EXISTS image_matchings;
DROP TABLE IF EXISTS detected_objects;
DROP TABLE IF EXISTS detection_sessions;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- Create roles table
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name ENUM('ROLE_USER','ROLE_ADMIN') NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create users table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(255),
    role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user_roles table
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create items table
CREATE TABLE items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category ENUM('ELECTRONICS', 'CLOTHING', 'ACCESSORIES', 'DOCUMENTS', 'KEYS', 'BAGS', 'JEWELRY', 'TOYS', 'BOOKS', 'MISCELLANEOUS') NOT NULL,
    status ENUM('LOST', 'FOUND', 'CLAIMED', 'RETURNED', 'EXPIRED', 'ABANDONED') NOT NULL,
    location VARCHAR(255) NOT NULL,
    latitude DOUBLE,
    longitude DOUBLE,
    image_url VARCHAR(255),
    reported_by_id BIGINT NOT NULL,
    claimed_by_id BIGINT,
    reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    claimed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_items_reported_by FOREIGN KEY (reported_by_id) REFERENCES users(id),
    CONSTRAINT fk_items_claimed_by FOREIGN KEY (claimed_by_id) REFERENCES users(id),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_location (location(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create detection_sessions table
CREATE TABLE detection_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(50) NOT NULL UNIQUE,
    camera_id VARCHAR(50),
    camera_location VARCHAR(255),
    model_version VARCHAR(50),
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    confidence_threshold DOUBLE NOT NULL DEFAULT 0.5,
    total_detections INT NOT NULL DEFAULT 0,
    abandoned_objects_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_session_id (session_id),
    INDEX idx_camera_id (camera_id),
    INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create detected_objects table
CREATE TABLE detected_objects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tracking_id VARCHAR(50) UNIQUE,
    category ENUM('ELECTRONICS', 'CLOTHING', 'ACCESSORIES', 'DOCUMENTS', 'KEYS', 'BAGS', 'JEWELRY', 'TOYS', 'BOOKS', 'MISCELLANEOUS'),
    confidence_score DOUBLE,
    first_detected TIMESTAMP,
    last_seen TIMESTAMP,
    stationary_duration BIGINT,
    is_abandoned BOOLEAN,
    abandon_threshold BIGINT,
    camera_location VARCHAR(255),
    bounding_box_x INT,
    bounding_box_y INT,
    bounding_box_width INT,
    bounding_box_height INT,
    snapshot_url VARCHAR(255),
    frame_timestamp TIMESTAMP,
    status ENUM('DETECTED', 'TRACKING', 'ABANDONED', 'CLAIMED', 'RETURNED'),
    detection_session_id BIGINT,
    linked_item_id BIGINT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT fk_detected_objects_session FOREIGN KEY (detection_session_id) REFERENCES detection_sessions(id),
    CONSTRAINT fk_detected_objects_linked_item FOREIGN KEY (linked_item_id) REFERENCES items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create claim_requests table
CREATE TABLE claim_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    claim_message TEXT,
    contact_info VARCHAR(255),
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_claim_requests_item FOREIGN KEY (item_id) REFERENCES items(id),
    CONSTRAINT fk_claim_requests_user FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create search_requests table
CREATE TABLE search_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    expected_category ENUM('ELECTRONICS', 'CLOTHING', 'ACCESSORIES', 'DOCUMENTS', 'KEYS', 'BAGS', 'JEWELRY', 'TOYS', 'BOOKS', 'MISCELLANEOUS'),
    category ENUM('ELECTRONICS', 'CLOTHING', 'ACCESSORIES', 'DOCUMENTS', 'KEYS', 'BAGS', 'JEWELRY', 'TOYS', 'BOOKS', 'MISCELLANEOUS') NOT NULL,
    search_image_url VARCHAR(255),
    description TEXT,
    search_location VARCHAR(255) NOT NULL,
    search_latitude DOUBLE,
    search_longitude DOUBLE,
    search_radius DOUBLE DEFAULT 5.0,
    matching_threshold DOUBLE DEFAULT 0.7,
    date_lost_from TIMESTAMP NULL,
    date_lost_to TIMESTAMP NULL,
    processed_at TIMESTAMP NULL,
    total_matches_found INT DEFAULT 0,
    status ENUM('ACTIVE', 'FULFILLED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_search_requests_user FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_location (search_location(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create image_matchings table
CREATE TABLE image_matchings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    search_request_id BIGINT,
    detected_object_id BIGINT,
    similarity_score DOUBLE,
    confidence_level DOUBLE,
    is_false_positive BOOLEAN,
    user_confirmed BOOLEAN,
    method ENUM('CNN_EMBEDDING', 'ORB_FLANN', 'SIFT_FLANN', 'HISTOGRAM', 'HYBRID'),
    geometric_verification_passed BOOLEAN,
    keypoints_matched INT,
    total_keypoints_search INT,
    total_keypoints_matched INT,
    geographical_distance DOUBLE,
    temporal_distance INT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    item_id BIGINT,
    CONSTRAINT fk_image_matchings_search_request FOREIGN KEY (search_request_id) REFERENCES search_requests(id),
    CONSTRAINT fk_image_matchings_detected_object FOREIGN KEY (detected_object_id) REFERENCES detected_objects(id),
    CONSTRAINT fk_image_matchings_item FOREIGN KEY (item_id) REFERENCES items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create matches table
CREATE TABLE matches (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    search_request_id BIGINT NOT NULL,
    item_id BIGINT NOT NULL,
    match_score DOUBLE NOT NULL,
    status ENUM('PENDING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_matches_search_request FOREIGN KEY (search_request_id) REFERENCES search_requests(id),
    CONSTRAINT fk_matches_item FOREIGN KEY (item_id) REFERENCES items(id),
    INDEX idx_status (status),
    INDEX idx_match_score (match_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default roles
INSERT INTO roles (name) VALUES 
('ROLE_USER'),
('ROLE_ADMIN');

-- Insert admin user (password: admin123)
INSERT INTO users (username, email, password, full_name) VALUES 
('admin', 'admin@recovr.com', '$2a$10$dXJ3SW6G7P9C6_Y2GLdRxeDzPpD9hT7k0OJhB4QHq4fOi7nQ3FmW6', 'Admin User');

-- Link admin user with admin role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.username = 'admin' AND r.name = 'ROLE_ADMIN'; 