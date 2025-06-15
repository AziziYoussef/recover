#!/bin/bash

# Database setup script for RECOVR
echo "Setting up RECOVR database..."

# MySQL connection details
DB_HOST="localhost"
DB_PORT="3306"
DB_NAME="recovr_db"
DB_USER="recovr_user"
DB_PASSWORD="Recovr@2024"
ROOT_PASSWORD=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Creating database and user...${NC}"

# Create database and user
mysql -u root -p$ROOT_PASSWORD -e "
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Database and user created successfully!${NC}"
else
    echo -e "${RED}Failed to create database. Please check MySQL is running and root password is correct.${NC}"
    echo "You may need to run: mysql -u root -p"
    exit 1
fi

echo -e "${YELLOW}Database setup complete!${NC}"
echo "Connection details:"
echo "  Host: $DB_HOST:$DB_PORT"
echo "  Database: $DB_NAME"
echo "  Username: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo ""
echo "You can now start the Spring Boot application with:"
echo "  ./mvnw spring-boot:run"
echo ""
echo "Or build and run with:"
echo "  ./mvnw clean package"
echo "  java -jar target/api-0.0.1-SNAPSHOT.jar"