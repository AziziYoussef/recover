#!/bin/bash

# Development startup script for RECOVR Spring Boot backend
# This script starts the application with hot reload and development optimizations

echo "🚀 Starting RECOVR Backend in Development Mode..."
echo "📁 Working directory: $(pwd)"
echo "☕ Java version: $(java -version 2>&1 | head -n 1)"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Development Features Enabled:${NC}"
echo -e "  ${GREEN}✓${NC} Automatic restart on file changes"
echo -e "  ${GREEN}✓${NC} LiveReload for browser refresh"
echo -e "  ${GREEN}✓${NC} Enhanced logging"
echo -e "  ${GREEN}✓${NC} SQL query logging"
echo -e "  ${GREEN}✓${NC} CORS configured for localhost"
echo ""

echo -e "${YELLOW}📝 Usage Tips:${NC}"
echo -e "  • Edit any .java file to trigger automatic restart"
echo -e "  • Check logs for detailed SQL queries and debug info"
echo -e "  • LiveReload runs on port 35729"
echo -e "  • Backend API available at http://localhost:8080"
echo ""

echo -e "${BLUE}🎯 API Endpoints:${NC}"
echo -e "  • Auth: http://localhost:8080/api/auth/test"
echo -e "  • Register: POST http://localhost:8080/api/auth/signup"
echo -e "  • Login: POST http://localhost:8080/api/auth/signin"
echo -e "  • Swagger: http://localhost:8080/swagger-ui.html"
echo ""

# Set JVM options for development
export JAVA_OPTS="-Xmx1g -Xms512m -XX:+UseG1GC"

# Start the application with development profile
echo -e "${GREEN}Starting Spring Boot application...${NC}"
./mvnw spring-boot:run \
  -Dspring-boot.run.profiles=dev \
  -Dspring-boot.run.jvmArguments="$JAVA_OPTS" \
  -Dspring.output.ansi.enabled=always

echo -e "${RED}Application stopped.${NC}"