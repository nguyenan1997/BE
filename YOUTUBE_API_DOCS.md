# YouTube Channel Analysis API Documentation

## Overview
This API allows you to analyze YouTube channel screenshots by fetching multiple images from external URLs and using Google Gemini AI to extract comprehensive channel information from all images combined. It also supports manually adding channels without AI analysis.

## Base URL
```
http://localhost:3000/api/youtube
```

## Endpoints

### 1. Fetch and Analyze Multiple YouTube Channel Images

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
  -d '{
    "imageUrls": [
      "https://example.com/youtube-channel-main.jpg",
      "https://example.com/youtube-channel-stats.jpg",
      "https://example.com/youtube-channel-videos.jpg"
    ]
  }'
```

### 2. Manually Add YouTube Channel

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

### 3. Check Analysis Status

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

### 4. Get Analysis Results

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

### 5. Get All Channels

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

### 6. Delete Channel

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

### AI Analysis Workflow:
1. **Start Analysis with Multiple Images:**
   ```bash
   curl -X POST http://localhost:3000/api/youtube/analyze \
     -H "Content-Type: application/json" \
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

## Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "imageUrls array is required with at least one URL"
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

- The analysis is performed asynchronously in the background
- Multiple images are analyzed together to provide comprehensive information
- Each image can contain different aspects of the channel (main page, stats, videos, about, etc.)
- Image URLs must be publicly accessible
- Supported image formats: JPEG, PNG, GIF, WebP
- Maximum image size: 10MB per image
- Analysis typically takes 15-45 seconds depending on number of images and complexity
- The API includes proper error handling for network issues and AI analysis failures
- No authentication required for YouTube analysis endpoints

## 📊 Dữ liệu được Phân tích

### Thông tin Cơ bản:
- **channelName**: Tên kênh
- **subscriberCount**: Số lượng subscribers
- **videoCount**: Số lượng videos
- **totalViews**: Tổng lượt xem
- **description**: Mô tả kênh
- **category**: Danh mục
- **joinDate**: Ngày tham gia
- **location**: Vị trí

### Social Links:
- Website
- Twitter/X
- Instagram
- Facebook

### AI Analysis:
- **channelType**: Loại nội dung
- **targetAudience**: Đối tượng mục tiêu
- **contentQuality**: Chất lượng nội dung
- **engagementLevel**: Mức độ tương tác
- **monetizationPotential**: Tiềm năng kiếm tiền
- **growthTrend**: Xu hướng tăng trưởng

## ⚠️ Lưu ý

1. **File Size**: Giới hạn 10MB cho mỗi ảnh
2. **File Types**: Chỉ chấp nhận jpeg, jpg, png, gif, webp
3. **Processing Time**: Phân tích AI có thể mất 10-30 giây
4. **Rate Limiting**: 100 requests per 15 minutes per IP
5. **Authentication**: Tất cả endpoints đều yêu cầu JWT token

## 🛠️ Setup

1. **Cài đặt dependencies:**
   ```bash
   npm install multer @google/generative-ai
   ```

2. **Cấu hình Gemini API Key:**
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key
   ```

3. **Khởi động server:**
   ```bash
   npm run dev
   ```

4. **Test API:**
   ```bash
   # Upload ảnh
   curl -X POST http://localhost:3000/api/youtube/upload \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "image=@test_image.jpg"
   ``` 