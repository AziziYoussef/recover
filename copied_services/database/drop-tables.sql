-- Drop tables in correct order (children first)
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS image_matching;
DROP TABLE IF EXISTS search_requests;
DROP TABLE IF EXISTS detected_objects;
DROP TABLE IF EXISTS detection_sessions;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1; 