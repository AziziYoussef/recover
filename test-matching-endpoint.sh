#!/bin/bash

echo "Testing image matching endpoint..."

# Test if Spring Boot backend is running
echo "1. Testing if backend is running..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/items || echo "Backend not responding"

echo -e "\n2. Testing image matching endpoint with user_image.jpeg..."

# Test the matching endpoint with user_image.jpeg
curl -X POST \
  -F "image=@public/uploads/user_image.jpeg" \
  http://localhost:8080/api/matching/search-by-image \
  -v

echo -e "\n\nDone!"