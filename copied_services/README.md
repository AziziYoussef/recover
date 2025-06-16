# RECOVR - Lost & Found System - Core Services

This directory contains all the essential files for the core services of the RECOVR lost and found system.

## Directory Structure

### 📁 backend/
Contains all Spring Boot backend Java files:
- **controller/**: REST API controllers for authentication, items, matching, search, etc.
- **security/**: JWT authentication, security configuration, user details services
- **dto/**: Data Transfer Objects for API communication
- **entity/**: JPA entities (User, Item, ImageMatching, etc.)
- **repository/**: Data access layer interfaces
- **service/**: Business logic services
- **exception/**: Custom exception handlers
- **config/**: Spring configuration classes

### 📁 frontend/
Contains all Next.js/React frontend files:
- **auth/**: Authentication pages (signin, register)
- **api/**: Next.js API routes for backend communication
- **components/**: Reusable UI components including session management
- **lib/**: Utility libraries (auth, API client, database adapters)
- **pages/**: Main application pages (search, report, dashboard, etc.)

### 📁 python-services/
Contains Python AI services:
- **matching-service/**: Image matching service using OpenCV and ORB features
- **detection-service/**: Object detection service using YOLO
- Configuration files for AI models

### 📁 config/
Configuration files for all services:
- **spring/**: Spring Boot configuration (application.properties, pom.xml)
- **frontend/**: Next.js configuration (next.config.mjs, package.json, etc.)

### 📁 database/
Database migration files:
- SQL migration scripts for database schema
- Table creation and updates

## Core Services Included

### 🔐 Authentication & Authorization
- JWT-based authentication
- User registration and login
- Role-based access control
- Session management

### 👥 User Profile Management
- User registration and profile management
- Admin user management
- Role assignment

### 📦 Item Reporting & Management
- Lost/found item reporting
- Image upload and storage
- Item categorization and status tracking
- Claim request management

### 🔍 Image Search & Matching
- AI-powered image similarity matching
- OpenCV-based feature extraction
- Real-time image comparison
- Search result ranking

### 🤖 Object Detection
- YOLO-based object detection
- Automated item categorization
- Detection session management

## Technology Stack

- **Backend**: Spring Boot, Spring Security, JPA/Hibernate
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Flyway migrations
- **AI Services**: Python, OpenCV, YOLO
- **Authentication**: JWT tokens, NextAuth.js

## Key Features

1. **Secure Authentication**: Complete JWT implementation with refresh tokens
2. **Image Matching**: Advanced computer vision for finding similar items
3. **File Management**: Secure image upload and storage
4. **Real-time Search**: Fast image-based search with confidence scoring
5. **Admin Panel**: Complete administration interface
6. **Responsive Design**: Mobile-friendly UI components

## Recent Improvements

✅ **Fixed Image Search Issue**: Resolved path matching problems between Python and Java services
✅ **Enhanced Security**: Improved JWT implementation and CORS configuration
✅ **Optimized Matching**: Better image feature detection and matching algorithms
✅ **Improved UI**: Better error handling and user feedback

All services are production-ready and have been tested for the core lost & found functionality.
