CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(120) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    avatar_url VARCHAR(255),
    created_at DATETIME,
    updated_at DATETIME
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    category VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    location VARCHAR(255) NOT NULL,
    image_url VARCHAR(255),
    reported_by_id BIGINT NOT NULL,
    reported_at DATETIME NOT NULL,
    claimed_by_id BIGINT,
    claimed_at DATETIME,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (reported_by_id) REFERENCES users(id),
    FOREIGN KEY (claimed_by_id) REFERENCES users(id)
);

CREATE TABLE image_matchings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    search_request_id BIGINT,
    detected_object_id BIGINT,
    similarity_score DOUBLE,
    confidence_level DOUBLE,
    is_false_positive BOOLEAN DEFAULT FALSE,
    user_confirmed BOOLEAN,
    method VARCHAR(20),
    geometric_verification_passed BOOLEAN,
    keypoints_matched INT,
    total_keypoints_search INT,
    total_keypoints_matched INT,
    geographical_distance DOUBLE,
    temporal_distance INT,
    created_at DATETIME,
    updated_at DATETIME,
    item_id BIGINT,
    FOREIGN KEY (search_request_id) REFERENCES search_requests(id),
    FOREIGN KEY (detected_object_id) REFERENCES detected_objects(id),
    FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE TABLE claim_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    claim_message TEXT,
    contact_info VARCHAR(255),
    status VARCHAR(50),
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE detection_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE,
    camera_id VARCHAR(100),
    camera_location VARCHAR(255),
    start_time DATETIME,
    end_time DATETIME,
    is_active BOOLEAN,
    model_version VARCHAR(100),
    confidence_threshold DOUBLE,
    total_detections INT,
    abandoned_objects_count INT,
    created_at DATETIME,
    updated_at DATETIME
);

CREATE TABLE detected_objects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tracking_id VARCHAR(100) UNIQUE,
    category VARCHAR(50),
    confidence_score DOUBLE,
    first_detected DATETIME,
    last_seen DATETIME,
    stationary_duration BIGINT,
    is_abandoned BOOLEAN,
    abandon_threshold BIGINT,
    camera_location VARCHAR(255),
    bounding_box_x INT,
    bounding_box_y INT,
    bounding_box_width INT,
    bounding_box_height INT,
    snapshot_url VARCHAR(255),
    frame_timestamp DATETIME,
    status VARCHAR(50),
    detection_session_id BIGINT,
    linked_item_id BIGINT,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (detection_session_id) REFERENCES detection_sessions(id),
    FOREIGN KEY (linked_item_id) REFERENCES items(id)
);

CREATE TABLE search_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    search_image_url VARCHAR(255),
    description VARCHAR(1000),
    expected_category VARCHAR(50),
    matching_threshold DOUBLE,
    search_location VARCHAR(255),
    search_latitude DOUBLE,
    search_longitude DOUBLE,
    search_radius DOUBLE,
    date_lost_from DATETIME,
    date_lost_to DATETIME,
    status VARCHAR(50),
    total_matches_found INT,
    user_id BIGINT,
    processed_at DATETIME,
    created_at DATETIME,
    updated_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
); 