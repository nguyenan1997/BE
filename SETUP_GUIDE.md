# 🚀 Hướng dẫn cài đặt và cấu hình dự án

## 📥 Cài đặt PostgreSQL

### Cách 1: Tải từ trang chủ PostgreSQL
1. Truy cập: https://www.postgresql.org/download/windows/
2. Tải PostgreSQL installer cho Windows
3. Chạy installer và làm theo hướng dẫn
4. Ghi nhớ password cho user `postgres`

### Cách 2: Sử dụng Chocolatey (nếu có)
```bash
choco install postgresql
```

### Cách 3: Sử dụng Docker (khuyến nghị cho development)
```bash
# Pull PostgreSQL image
docker pull postgres:15

# Chạy PostgreSQL container
docker run --name postgres-dev -e POSTGRES_PASSWORD=password -e POSTGRES_DB=backend_mvc -p 5432:5432 -d postgres:15
```

## ⚙️ Cấu hình dự án

### Bước 1: Tạo file .env
Copy file `env.example` thành `.env` và cập nhật thông tin:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (cho PostgreSQL local)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=backend_mvc
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### Bước 2: Tạo database
Sau khi cài đặt PostgreSQL, tạo database:

```sql
-- Kết nối PostgreSQL và chạy:
CREATE DATABASE backend_mvc;
```

### Bước 3: Cài đặt dependencies
```bash
npm install
```

### Bước 4: Chạy dự án
```bash
# Development mode
npm run dev

# Tạo admin user (sau khi server chạy thành công)
npm run create-admin
```

## 🔧 Troubleshooting

### Lỗi kết nối database
- Kiểm tra PostgreSQL service đã chạy chưa
- Kiểm tra port 5432 có bị block không
- Kiểm tra thông tin kết nối trong file .env

### Lỗi permission
- Đảm bảo user có quyền tạo database
- Kiểm tra password PostgreSQL

## 📚 Test API

Sau khi chạy thành công, test các API:

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Đăng ký user
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

### 3. Đăng nhập
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 🐳 Docker Alternative (Khuyến nghị)

Nếu gặp khó khăn với cài đặt PostgreSQL, sử dụng Docker:

### 1. Cài đặt Docker Desktop
- Tải từ: https://www.docker.com/products/docker-desktop/

### 2. Chạy PostgreSQL với Docker
```bash
# Tạo network
docker network create backend-network

# Chạy PostgreSQL
docker run --name postgres-backend \
  --network backend-network \
  -e POSTGRES_DB=backend_mvc \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15
```

### 3. Cập nhật .env cho Docker
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=backend_mvc
DB_USER=postgres
DB_PASSWORD=password
```

## 🎯 Next Steps

1. Cài đặt PostgreSQL
2. Tạo file .env
3. Chạy `npm install`
4. Chạy `npm run dev`
5. Test API endpoints
6. Tạo admin user với `npm run create-admin` 

# Setup Guide - YouTube Channel Analysis Backend

## Prerequisites

Before setting up the application, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd BE

# Install dependencies
npm install
```

## Step 2: Environment Configuration

1. **Copy the environment file:**
   ```bash
   cp env.example .env
   ```

2. **Edit `.env` file with your configuration:**
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=youtube_analysis
   DB_USER=your_postgres_username
   DB_PASSWORD=your_postgres_password

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=24h

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000

   # Google Gemini AI (Required for YouTube analysis)
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

## Step 3: Database Setup

1. **Create PostgreSQL database:**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres

   # Create database
   CREATE DATABASE youtube_analysis;

   # Exit PostgreSQL
   \q
   ```

2. **Verify database connection:**
   ```bash
   node scripts/testDb.js
   ```

## Step 4: Create Initial Admin User

**Important**: The application now requires admin-only registration for security. You must create the first admin user using the provided script.

```bash
# Create the first admin user
node scripts/createAdmin.js
```

This will create an admin user with:
- **Email**: admin@example.com
- **Password**: admin123
- **Username**: admin
- **Role**: admin

⚠️ **Security Note**: Change the password immediately after first login!

## Step 5: Start the Application

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:3000`

## Step 6: Verify Installation

1. **Health Check:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Access API Documentation:**
   - Open: http://localhost:3000/api-docs
   - This provides interactive API documentation

3. **Test Admin Login:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "admin123"
     }'
   ```

## User Management Process

### 🔒 Admin-Only Registration System

The application implements a secure admin-only registration system:

1. **Initial Admin Creation:**
   - Use `node scripts/createAdmin.js` to create the first admin
   - This is the only way to create the initial admin user

2. **Subsequent User Registration:**
   - Only existing admins can register new users
   - Regular users cannot register themselves
   - This provides better control over user access

3. **Admin Registration Process:**
   ```bash
   # 1. Login as admin
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "admin123"
     }'

   # 2. Use the returned JWT token to register new users
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
     -d '{
       "username": "newuser",
       "email": "user@example.com",
       "password": "password123",
       "fullName": "New User"
     }'
   ```

## API Testing

### Using Swagger UI

1. Open http://localhost:3000/api-docs
2. Click "Authorize" button
3. Enter your JWT token: `Bearer YOUR_TOKEN`
4. Test endpoints interactively

### Using cURL

```bash
# Login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }' | jq -r '.data.token')

# Use token for authenticated requests
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

## Troubleshooting

### Common Issues

1. **Database Connection Error:**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **JWT Token Issues:**
   - Verify `JWT_SECRET` is set in `.env`
   - Check token expiration

3. **Gemini AI Errors:**
   - Verify `GEMINI_API_KEY` is set correctly
   - Check API key permissions

4. **Port Already in Use:**
   - Change `PORT` in `.env`
   - Or kill the process using the port

### Logs

Check application logs for detailed error information:
```bash
# Development mode shows detailed logs
npm run dev
```

## Security Considerations

1. **Change Default Admin Password:**
   - Immediately change admin password after first login
   - Use strong, unique passwords

2. **Environment Variables:**
   - Never commit `.env` file to version control
   - Use strong, unique values for secrets

3. **Database Security:**
   - Use dedicated database user with minimal privileges
   - Regularly backup database

4. **API Security:**
   - All sensitive endpoints require authentication
   - Rate limiting is enabled (100 requests per 15 minutes)
   - CORS is configured for security

## Next Steps

After successful setup:

1. **Change Admin Password:**
   - Login as admin
   - Update password via profile endpoint

2. **Configure Gemini AI:**
   - Get API key from Google AI Studio
   - Add to `.env` file

3. **Test YouTube Analysis:**
   - Upload channel screenshots
   - Test AI analysis functionality

4. **Monitor Application:**
   - Check logs for errors
   - Monitor database performance
   - Verify all endpoints work correctly 