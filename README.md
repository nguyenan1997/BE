# YouTube Channel Analysis API

API for analyzing YouTube channel screenshots using Google Gemini AI with Node.js, Express, PostgreSQL, and Sequelize.

## 🚀 Features

- **User Authentication**: JWT-based authentication with role-based authorization
- **YouTube Analysis**: Analyze multiple channel images using Google Gemini AI
- **Database**: PostgreSQL with Sequelize ORM
- **API Documentation**: OpenAPI 3.0 specification with Swagger UI
- **Security**: Helmet, CORS, Rate limiting

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- Google Gemini API key

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd BE
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   Create `.env` file:
   ```env
   NODE_ENV=development
   PORT=3000
   
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=test
   DB_USER=postgres
   DB_PASSWORD=your_password
   
   # JWT
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=24h
   
   # Google Gemini AI
   GEMINI_API_KEY=your_gemini_api_key
   
   # CORS
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Database setup**
   - Create PostgreSQL database
   - Update database credentials in `.env`
   - Tables will be created automatically on first run

## 🚀 Running the Application

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📚 API Documentation

Access the interactive API documentation at:
```
http://localhost:3000/api-docs
```

### API Specification

The API specification is defined in `swagger.yaml` (OpenAPI 3.0 format) and includes:

- **Authentication**: Register, Login, Profile, Token Refresh
- **Users**: CRUD operations with role-based access
- **YouTube Analysis**: Channel analysis from multiple images
- **System**: Health check

### Authentication

1. **Register a new user**
   ```bash
   POST /api/auth/register
   {
     "username": "testuser",
     "email": "test@example.com",
     "password": "password123",
     "fullName": "Test User"
   }
   ```

2. **Login**
   ```bash
   POST /api/auth/login
   {
     "email": "test@example.com",
     "password": "password123"
   }
   ```

3. **Use JWT token**
   ```bash
   Authorization: Bearer <your_jwt_token>
   ```

### YouTube Analysis

1. **Start analysis**
   ```bash
   POST /api/youtube/analyze
   {
     "imageUrls": [
       "https://example.com/channel-main.jpg",
       "https://example.com/channel-stats.jpg"
     ]
   }
   ```

2. **Check status**
   ```bash
   GET /api/youtube/status/{id}
   ```

3. **Get results**
   ```bash
   GET /api/youtube/result/{id}
   ```

## 🏗️ Project Structure

```
├── config/
│   ├── database.js          # Database configuration
│   └── gemini.js           # Gemini AI configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── userController.js    # User management
│   └── youtubeController.js # YouTube analysis
├── middleware/
│   ├── authMiddleware.js    # JWT authentication
│   └── errorHandler.js      # Error handling
├── models/
│   ├── User.js             # User model
│   └── YouTubeChannel.js   # YouTube channel model
├── routes/
│   ├── authRoutes.js       # Authentication routes
│   ├── userRoutes.js       # User routes
│   └── youtubeRoutes.js    # YouTube routes
├── validators/
│   ├── authValidator.js    # Authentication validation
│   └── userValidator.js    # User validation
├── swagger.yaml            # OpenAPI 3.0 specification
├── server.js              # Main application file
└── package.json
```

## 🔧 Configuration

### Database
- **Host**: `DB_HOST` (default: localhost)
- **Port**: `DB_PORT` (default: 5432)
- **Database**: `DB_NAME`
- **Username**: `DB_USER`
- **Password**: `DB_PASSWORD`

### JWT
- **Secret**: `JWT_SECRET`
- **Expiration**: `JWT_EXPIRES_IN` (default: 24h)

### Gemini AI
- **API Key**: `GEMINI_API_KEY`

## 🧪 Testing

### Health Check
```bash
GET http://localhost:3000/health
```

### Using Swagger UI
1. Open `http://localhost:3000/api-docs`
2. Click "Authorize" and enter your JWT token
3. Test endpoints interactively

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/refresh-token` - Refresh JWT token

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/search` - Search users
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}` - Update user
- `PATCH /api/users/{id}/toggle-status` - Toggle user status
- `DELETE /api/users/{id}` - Delete user

### YouTube Analysis
- `POST /api/youtube/analyze` - Analyze channel images
- `GET /api/youtube/status/{id}` - Get analysis status
- `GET /api/youtube/result/{id}` - Get analysis results
- `GET /api/youtube/channels` - Get all channels
- `DELETE /api/youtube/channels/{id}` - Delete channel

### System
- `GET /health` - Health check

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Admin and user roles
- **Input Validation**: Request validation using Joi
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configurable CORS settings
- **Helmet**: Security headers

## 🚨 Error Handling

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
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## 📄 License

This project is licensed under the MIT License. 