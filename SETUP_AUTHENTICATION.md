# Authentication Setup Guide

This guide will help you set up the complete authentication system for the RECOVR Lost & Found application.

## Prerequisites

1. **MySQL Database** (8.0 or higher)
2. **Java 17** or higher
3. **Node.js 18+** and npm/pnpm
4. **Maven** or use the included wrapper

## Backend Setup (Spring Boot)

### 1. Database Setup

First, make sure MySQL is running, then create the database:

```bash
cd spring-backend
chmod +x setup-db.sh
./setup-db.sh
```

Or manually create the database:

```sql
CREATE DATABASE recovr_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'recovr_user'@'localhost' IDENTIFIED BY 'Recovr@2024';
GRANT ALL PRIVILEGES ON recovr_db.* TO 'recovr_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Application Configuration

The application is configured with these properties in `application.properties`:

- **Database URL**: `jdbc:mysql://localhost:3306/recovr_db`
- **Database User**: `recovr_user`
- **Database Password**: `Recovr@2024`
- **Server Port**: `8080`
- **JWT Secret**: Base64 encoded for security
- **JWT Expiration**: 24 hours (86400000 ms)

### 3. Start the Backend

```bash
cd spring-backend

# Using Maven wrapper (recommended)
./mvnw spring-boot:run

# Or build and run JAR
./mvnw clean package
java -jar target/api-0.0.1-SNAPSHOT.jar
```

The backend will start on http://localhost:8080

### 4. Verify Backend

Test the API endpoints:

```bash
# Health check
curl http://localhost:8080/api/auth/signin

# Should return 400 (Bad Request) because no credentials provided
```

## Frontend Setup (Next.js)

### 1. Install Dependencies

```bash
# In the root directory
npm install
# or
pnpm install
```

### 2. Environment Configuration

The `.env.local` file is already configured with:

```env
NEXTAUTH_SECRET=ThisIsATemporarySecretForDevelopmentOnly
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

### 3. Start the Frontend

```bash
npm run dev
# or
pnpm dev
```

The frontend will start on http://localhost:3000

## Authentication Flow

### 1. Registration

1. Navigate to http://localhost:3000/auth/register
2. Fill in the registration form:
   - Username (unique, 3-20 characters)
   - First Name and Last Name
   - Email (unique, valid email address)
   - Password (minimum 6 characters)
   - Phone (optional)

3. Submit the form - it will call the Spring Boot `/api/auth/signup` endpoint
4. On success, you'll be redirected to the sign-in page

### 2. Login

1. Navigate to http://localhost:3000/auth/signin
2. Use either:
   - **Admin Account**: `admin@recovr.com` / `admin123`
   - **Your registered account**: Use email and password
3. Submit the form - it will call the Spring Boot `/api/auth/signin` endpoint
4. On success, you'll receive a JWT token and be redirected to the home page

### 3. Protected Routes

Once authenticated, you can access protected features:
- User profile
- Report lost/found items
- Claim requests
- Admin features (if you have admin role)

## Database Schema

The authentication system includes these tables:

### Users Table
- `id`: Primary key
- `username`: Unique username
- `email`: Unique email address
- `password`: BCrypt hashed password
- `first_name`, `last_name`: User's name
- `phone`: Optional contact number
- `avatar_url`: Optional profile picture
- `created_at`, `updated_at`: Timestamps

### Roles Table
- `id`: Primary key
- `name`: Role name (ROLE_USER, ROLE_ADMIN)

### User_Roles Table
- Links users to their roles (many-to-many relationship)

## Security Features

1. **Password Hashing**: BCrypt with strength 10
2. **JWT Authentication**: Stateless authentication with secure tokens
3. **CORS Configuration**: Configured for frontend-backend communication
4. **Role-Based Access**: User and Admin roles
5. **Input Validation**: Server-side validation for all inputs
6. **SQL Injection Protection**: JPA prevents SQL injection

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login user

### Protected Endpoints
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `POST /api/items` - Create new item (authenticated)
- `GET /api/claims` - Get user's claims (authenticated)

### Admin Endpoints
- `GET /api/admin/users` - Get all users (admin only)
- `DELETE /api/items/{id}` - Delete item (admin only)

## Troubleshooting

### Backend Issues

1. **Database Connection Failed**
   - Check if MySQL is running
   - Verify database credentials in `application.properties`
   - Ensure database and user exist

2. **Port 8080 Already in Use**
   - Change port in `application.properties`: `server.port=8081`
   - Update frontend env: `NEXT_PUBLIC_BACKEND_URL=http://localhost:8081`

3. **JWT Token Issues**
   - Check if JWT secret is base64 encoded
   - Verify token expiration settings

### Frontend Issues

1. **Backend Connection Failed**
   - Ensure backend is running on port 8080
   - Check CORS configuration in Spring Boot
   - Verify `NEXT_PUBLIC_BACKEND_URL` in `.env.local`

2. **CORS Errors**
   - The app is configured for `localhost:3000` and `localhost:3001`
   - If using different ports, update `WebSecurityConfig.java`
   - For development with any origin, use dev profile:
     ```bash
     ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
     ```

2. **Authentication Not Working**
   - Clear browser cookies and localStorage
   - Check browser developer tools for network errors
   - Verify NextAuth configuration

### Common Errors

1. **"User not found"** - User doesn't exist or wrong email
2. **"Invalid password"** - Wrong password provided
3. **"Username/Email already taken"** - Try different credentials
4. **Network errors** - Backend not running or CORS issues

## Production Considerations

For production deployment:

1. **Change JWT Secret**: Use a strong, randomly generated secret
2. **Update CORS Origins**: Restrict to your domain only
3. **Use HTTPS**: Enable SSL/TLS for secure communication
4. **Environment Variables**: Use environment variables for sensitive config
5. **Database Security**: Use stronger passwords and restrict access
6. **Rate Limiting**: Implement rate limiting for auth endpoints

## Test Accounts

The system comes with one pre-configured admin account:

- **Email**: admin@recovr.com
- **Password**: admin123
- **Role**: ADMIN

You can create additional users through the registration form.