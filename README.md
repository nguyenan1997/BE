# YouTube Channel Analysis Backend

A Node.js backend application for analyzing YouTube channel screenshots using Google Gemini AI with MVC architecture and PostgreSQL database.

## Features

- 🔐 **JWT Authentication** with role-based access control
- 🤖 **AI-Powered Analysis** using Google Gemini AI
- 📊 **YouTube Channel Analysis** from screenshots
- 👥 **User Management** with admin and user roles
- 🛡️ **Security** with rate limiting, CORS, and Helmet
- 📝 **API Documentation** with Swagger UI
- 🔍 **Data Validation** with Joi
- 📈 **Pagination** for all list endpoints

## Quick Start

### 1. Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- Google Gemini API key

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd BE

# Install dependencies
npm install

# Copy environment file
cp env.example .env
```

### 3. Environment Configuration

Edit `.env` file with your configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=youtube_analysis
DB_USER=your_username
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Database Setup

```bash
# Create PostgreSQL database
createdb youtube_analysis

# Run database sync (tables will be created automatically)
npm start
```

### 5. Create Initial Admin User

```bash
# Create the first admin user
node scripts/createAdmin.js
```

This will create an admin user with:
- **Email**: admin@example.com
- **Password**: admin123
- **Username**: admin
- **Role**: admin

⚠️ **Important**: Change the password after first login!

### 6. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will be running at `http://localhost:3000`

## API Documentation

Access the interactive API documentation at:
- **Swagger UI**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

## User Registration Process

### 🔒 Admin-Only Registration

**Important**: Only admin users can register new accounts. This is a security feature to control user access.

### Process:

1. **Initial Setup**: Use the script to create the first admin
   ```bash
   node scripts/createAdmin.js
   ```

2. **Admin Login**: Login with admin credentials
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "admin123"
     }'
   ```

3. **Register New Users**: Admin can register new users
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
     -d '{
       "username": "newuser",
       "email": "user@example.com",
       "password": "password123",
       "fullName": "New User"
     }'
   ```

### User Roles:

- **🔒 Admin**: Can manage all users, register new users, access all data
- **👤 User**: Can manage their own profile and YouTube channel analyses

## API Endpoints

### 🔓 Public Endpoints
- `GET /health` - Health check

### 👤 Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/refresh-token` - Refresh JWT token

### 🔒 Admin Only
- `POST /api/auth/register` - Register new user (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/search` - Search users
- `PATCH /api/users/{id}/toggle-status` - Toggle user status
- `DELETE /api/users/{id}` - Delete user

### 🔐 Mixed Permissions
- `GET /api/users/{id}` - Get user by ID (own profile or admin)
- `PUT /api/users/{id}` - Update user (own profile or admin)

### 👤 YouTube Analysis
- `POST /api/youtube/analyze` - Analyze channel with AI
- `POST /api/youtube/channels` - Add channel manually
- `GET /api/youtube/channels` - Get user's channels
- `GET /api/youtube/status/{id}` - Check analysis status
- `GET /api/youtube/result/{id}` - Get analysis results
- `DELETE /api/youtube/channels/{id}` - Delete channel
- `PUT /api/youtube/channels/{id}/warnings` - Update warnings

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Security Features

- **JWT Authentication** with configurable expiration
- **Role-based Access Control** (RBAC)
- **Password Hashing** with bcrypt
- **Rate Limiting** (100 requests per 15 minutes)
- **CORS Protection** with configurable origins
- **Helmet Security Headers**
- **Input Validation** with Joi schemas
- **SQL Injection Protection** with Sequelize ORM

## Development

### Project Structure

```
├── config/           # Configuration files
├── controllers/      # Route controllers
├── middleware/       # Custom middleware
├── models/          # Sequelize models
├── routes/          # API routes
├── scripts/         # Utility scripts
├── validators/      # Joi validation schemas
├── server.js        # Main server file
└── package.json
```

### Available Scripts

```bash
# Development with nodemon
npm run dev

# Production start
npm start

# Create admin user
node scripts/createAdmin.js

# Test database connection
node scripts/testDb.js
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `youtube_analysis` |
| `DB_USER` | Database user | - |
| `DB_PASSWORD` | Database password | - |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRES_IN` | JWT expiration | `24h` |
| `CORS_ORIGIN` | CORS origin | `http://localhost:3000` |
| `GEMINI_API_KEY` | Google Gemini API key | - |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 