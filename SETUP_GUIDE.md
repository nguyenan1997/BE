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