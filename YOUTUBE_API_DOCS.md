# YouTube Channel Analysis API Documentation

## Overview
This API allows you to analyze YouTube channel screenshots using Google Gemini AI. It supports multiple analysis methods:
1. **Manual Image Upload**: Upload images directly for AI analysis
2. **Manual Channel Entry**: Add channel data manually without AI
3. **URL-based Analysis**: Provide channel URL, system fetches images from external API and analyzes with AI

## Base URL
```
http://localhost:3000/api/youtube
```

## Endpoints

### 1. Analyze YouTube Channel from URL (Recommended)

**POST** `/analyze-url`

**New Feature**: Analyze YouTube channel by providing just the channel URL. The system automatically:
1. Calls external API to fetch channel images and basic information
2. Downloads images from the external API
3. Uses Gemini AI to analyze the images
4. Combines external API data with AI analysis results

**Request Body:**
```json
{
  "channelUrl": "https://www.youtube.com/@PewDiePie"
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Channel analysis started",
  "data": {
    "id": "uuid-of-channel",
    "status": "processing",
    "message": "Fetching channel images and starting AI analysis. Check status later.",
    "channelUrl": "https://www.youtube.com/@PewDiePie"
  }
}
```

**Example with curl:**
```bash
curl -X POST http://localhost:3000/api/youtube/analyze-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "channelUrl": "https://www.youtube.com/@PewDiePie"
  }'
```

**Supported URL Formats:**
- `https://www.youtube.com/@channelname`
- `https://youtube.com/@channelname`
- `https://www.youtube.com/channel/CHANNEL_ID`
- `https://youtu.be/CHANNEL_ID`

**Note**: Frontend chỉ cần gửi `channelUrl`. Backend sẽ tự động gọi external API để lấy ảnh và thông tin channel.

### 2. Fetch and Analyze Multiple YouTube Channel Images

**POST** `/analyze`

Fetches multiple images from external URLs and analyzes them together with Gemini AI to extract complete channel information.

**Request Body:**
```json
{
  "imageUrls": [
    "https://example.com/youtube-channel-main.jpg",
    "https://example.com/youtube-channel-stats.jpg",
    "https://example.com/youtube-channel-videos.jpg",
    "https://example.com/youtube-channel-about.jpg"
  ]
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Images fetched and analysis started",
  "data": {
    "id": "uuid-of-channel",
    "status": "processing",
    "message": "AI analysis is in progress. Check status later.",
    "imageCount": 4,
    "imageUrls": [
      "https://example.com/youtube-channel-main.jpg",
      "https://example.com/youtube-channel-stats.jpg",
      "https://example.com/youtube-channel-videos.jpg",
      "https://example.com/youtube-channel-about.jpg"
    ]
  }
}
```

**Example with curl:**
```bash
curl -X POST http://localhost:3000/api/youtube/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "imageUrls": [
      "https://example.com/youtube-channel-main.jpg",
      "https://example.com/youtube-channel-stats.jpg",
      "https://example.com/youtube-channel-videos.jpg"
    ]
  }'
```

### 3. Manually Add YouTube Channel

**POST** `/channels`

Add a new YouTube channel manually without AI analysis. This is useful when you have the channel information and want to store it directly.

**Request Body:**
```json
{
  "channelName": "PewDiePie",
  "subscriberCount": "111M",
  "totalViews": "28.5B",
  "estimatedRevenue": "$50K - $100K",
  "watchTime": "2.5B hours",
  "views48h": "500K",
  "views60min": "10K",
  "description": "Gaming and entertainment channel",
  "category": "Gaming",
  "joinDate": "Apr 29, 2010",
  "location": "United States",
  "socialLinks": {
    "twitter": "https://twitter.com/pewdiepie",
    "instagram": "https://instagram.com/pewdiepie"
  },
  "imageUrl": "https://example.com/channel-image.jpg",
  "monetizationWarning": false,
  "monetizationWarningReason": "",
  "communityGuidelinesWarning": false,
  "communityGuidelinesWarningReason": ""
}
```

**Required Fields:**
- `channelName` (string): Name of the YouTube channel

**Optional Fields:**
- All other fields are optional and can be added as needed

**Response (201 Created):**
```json
{
  "success": true,
  "message": "YouTube channel added successfully",
  "data": {
    "id": "uuid-of-channel",
    "channelName": "PewDiePie",
    "subscriberCount": "111M",
    "totalViews": "28.5B",
    "estimatedRevenue": "$50K - $100K",
    "watchTime": "2.5B hours",
    "views48h": "500K",
    "views60min": "10K",
    "description": "Gaming and entertainment channel",
    "category": "Gaming",
    "joinDate": "Apr 29, 2010",
    "location": "United States",
    "socialLinks": {
      "twitter": "https://twitter.com/pewdiepie",
      "instagram": "https://instagram.com/pewdiepie"
    },
    "imageUrl": "https://example.com/channel-image.jpg",
    "analysisStatus": "completed",
    "monetizationWarning": false,
    "communityGuidelinesWarning": false,
    "analyzedBy": "user-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example with curl:**
```bash
curl -X POST http://localhost:3000/api/youtube/channels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "channelName": "PewDiePie",
    "subscriberCount": "111M",
    "totalViews": "28.5B",
    "category": "Gaming"
  }'
```

### 4. Check Analysis Status

**GET** `/status/:id`

Check the status of an ongoing analysis.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-of-channel",
    "status": "processing|completed|failed",
    "channelName": "Channel Name",
    "imageUrl": "url1|url2|url3",
    "error": "Error message if failed",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5. Get Analysis Results

**GET** `/result/:id`

Get the completed analysis results. Only works when status is "completed".

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-of-channel",
    "channelName": "Channel Name",
    "subscriberCount": "1.2M",
    "totalViews": "10M",
    "estimatedRevenue": "$5K",
    "watchTime": "1M hours",
    "views48h": "10K",
    "views60min": "100",
    "recentVideos": [
      {
        "title": "Video Title",
        "views": "10K",
        "likes": "1K",
        "comments": "100"
      }
    ],
    "description": "Channel description",
    "category": "Gaming",
    "joinDate": "2020-01-01",
    "location": "United States",
    "socialLinks": {
      "website": "https://example.com",
      "twitter": "https://twitter.com/channel",
      "instagram": "https://instagram.com/channel"
    },
    "aiAnalysis": {
      "channelType": "Gaming",
      "targetAudience": "Gamers aged 18-35",
      "contentQuality": "High quality content",
      "engagementLevel": "High engagement",
      "monetizationPotential": "High potential",
      "growthTrend": "Growing steadily"
    },
    "imageUrl": "url1|url2|url3",
    "originalImageName": "3-images.jpg",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 6. Get All Channels

**GET** `/channels?page=1&limit=10`

Get a paginated list of all analyzed channels.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "channels": [
      {
        "id": "uuid-of-channel",
        "channelName": "Channel Name",
        "analysisStatus": "completed",
        "imageUrl": "url1|url2|url3",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
}
```

### 7. Delete Channel

**DELETE** `/channels/:id`

Delete a channel and its analysis data.

**Response:**
```json
{
  "success": true,
  "message": "YouTube channel deleted successfully"
}
```

## Workflow Examples

### URL-based Analysis Workflow (Recommended):
1. **Start Analysis with Channel URL:**
   ```bash
   curl -X POST http://localhost:3000/api/youtube/analyze-url \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "channelUrl": "https://www.youtube.com/@PewDiePie"
     }'
   ```

2. **Check Status:**
   ```bash
   curl -X GET http://localhost:3000/api/youtube/status/CHANNEL_ID \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **Get Results (when completed):**
   ```bash
   curl -X GET http://localhost:3000/api/youtube/result/CHANNEL_ID \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### AI Analysis Workflow:
1. **Start Analysis with Multiple Images:**
   ```bash
   curl -X POST http://localhost:3000/api/youtube/analyze \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "imageUrls": [
         "https://example.com/channel-main.jpg",
         "https://example.com/channel-stats.jpg",
         "https://example.com/channel-videos.jpg"
       ]
     }'
   ```

### Manual Addition Workflow:
1. **Add Channel Manually:**
   ```bash
   curl -X POST http://localhost:3000/api/youtube/channels \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "channelName": "Example Channel",
       "subscriberCount": "1M",
       "totalViews": "10M",
       "category": "Education"
     }'
   ```

## External API Configuration (Backend Setup)

The URL-based analysis requires an external API that can:
1. Accept a YouTube channel URL
2. Return channel images and basic information
3. Provide structured data

**Note**: Đây là cấu hình backend. Frontend chỉ cần gửi `channelUrl`, backend sẽ tự động gọi external API.

### Environment Variables (Backend):
```env
# External Channel API Configuration
EXTERNAL_CHANNEL_API_URL=https://api.example.com/youtube/channel
EXTERNAL_API_KEY=your_external_api_key_here
```

### Expected External API Response:
```json
{
  "success": true,
  "data": {
    "images": [
      "https://example.com/channel-main.jpg",
      "https://example.com/channel-stats.jpg",
      "https://example.com/channel-videos.jpg"
    ],
    "channelInfo": {
      "channelName": "PewDiePie",
      "subscriberCount": "111M",
      "totalViews": "28.5B",
      "description": "Gaming and entertainment channel",
      "category": "Gaming",
      "joinDate": "Apr 29, 2010",
      "location": "United States",
      "socialLinks": {
        "twitter": "https://twitter.com/pewdiepie",
        "instagram": "https://instagram.com/pewdiepie"
      }
    }
  }
}
```

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Channel URL is required"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "YouTube channel not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Notes

- **URL-based analysis** is the recommended approach for ease of use
- The analysis is performed asynchronously in the background
- Multiple images are analyzed together to provide comprehensive information
- Image URLs must be publicly accessible
- Supported image formats: JPEG, PNG, GIF, WebP
- Maximum image size: 10MB per image
- Analysis typically takes 15-45 seconds depending on number of images and complexity
- The API includes proper error handling for network issues and AI analysis failures
- All endpoints require JWT authentication

## 📊 Data Analysis

### Basic Information:
- **channelName**: Channel name
- **subscriberCount**: Number of subscribers
- **videoCount**: Number of videos
- **totalViews**: Total views
- **description**: Channel description
- **category**: Category
- **joinDate**: Join date
- **location**: Location

### Social Links:
- Website
- Twitter/X
- Instagram
- Facebook

### AI Analysis:
- **channelType**: Content type
- **targetAudience**: Target audience
- **contentQuality**: Content quality
- **engagementLevel**: Engagement level
- **monetizationPotential**: Monetization potential
- **growthTrend**: Growth trend

## ⚠️ Notes

1. **File Size**: 10MB limit per image
2. **File Types**: Only jpeg, jpg, png, gif, webp accepted
3. **Processing Time**: AI analysis may take 10-30 seconds
4. **Rate Limiting**: 100 requests per 15 minutes per IP
5. **Authentication**: All endpoints require JWT token

## 🛠️ Setup

1. **Install dependencies:**
   ```bash
   npm install multer @google/generative-ai
   ```

2. **Configure Gemini API Key:**
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   ```

3. **Configure External API:**
   ```env
   EXTERNAL_CHANNEL_API_URL=your_external_api_url
   EXTERNAL_API_KEY=your_external_api_key
   ```

4. **Start server:**
   ```bash
   npm run dev
   ```

5. **Test API:**
   ```bash
   # URL-based analysis
   curl -X POST http://localhost:3000/api/youtube/analyze-url \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"channelUrl": "https://www.youtube.com/@PewDiePie"}'
   ``` 