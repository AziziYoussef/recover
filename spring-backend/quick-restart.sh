#!/bin/bash

# Quick restart script for when you need a clean restart
# This stops any running Spring Boot process and starts fresh

echo "🔄 Quick Restart - RECOVR Backend"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Find and kill any running Spring Boot processes
echo -e "${YELLOW}🛑 Stopping existing Spring Boot processes...${NC}"
pkill -f "spring-boot:run" 2>/dev/null || echo "No running processes found"
pkill -f "RecovRApplication" 2>/dev/null || echo "No application processes found"

# Wait a moment for processes to stop
sleep 2

# Clean compiled classes
echo -e "${YELLOW}🧹 Cleaning compiled classes...${NC}"
./mvnw clean -q

# Start fresh
echo -e "${GREEN}🚀 Starting fresh with hot reload...${NC}"
./start-dev.sh