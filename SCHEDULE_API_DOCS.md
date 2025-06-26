# Schedule API Documentation

## Tổng quan
API đặt lịch cho phép user tạo lịch tự động lấy dữ liệu và phân tích kênh YouTube theo thời gian định sẵn.

## Endpoints

### 1. Tạo lịch mới

**POST** `/api/schedules`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "channelId": "uuid-của-kênh",
  "name": "Tên lịch",
  "description": "Mô tả lịch (tùy chọn)",
  "scheduleType": "daily",
  "time": {
    "hour": 9,
    "minute": 0
  },
  "maxRuns": 30,
  "settings": {
    "notifyOnComplete": true
  }
}
```

**Các loại lịch có sẵn:**

#### Minutely (Mỗi phút)
```json
{
  "scheduleType": "minutely",
  "time": {}
}
```

#### Hourly (Mỗi giờ)
```json
{
  "scheduleType": "hourly",
  "time": {}
}
```

#### Daily (Hàng ngày)
```json
{
  "scheduleType": "daily",
  "time": {
    "hour": 9,
    "minute": 0
  }
}
```

#### Weekly (Hàng tuần)
```json
{
  "scheduleType": "weekly",
  "time": {
    "hour": 9,
    "minute": 0,
    "dayOfWeek": 1
  }
}
```

#### Monthly (Hàng tháng)
```json
{
  "scheduleType": "monthly",
  "time": {
    "hour": 9,
    "minute": 0,
    "dayOfMonth": 1
  }
}
```

#### Yearly (Hàng năm)
```json
{
  "scheduleType": "yearly",
  "time": {
    "hour": 9,
    "minute": 0,
    "dayOfMonth": 1,
    "month": 1
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tạo lịch thành công",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "channelId": "uuid",
    "name": "Tên lịch",
    "description": "Mô tả lịch",
    "cronExpression": "0 9 * * *",
    "isActive": true,
    "lastRunAt": null,
    "nextRunAt": "2024-01-15T09:00:00.000Z",
    "runCount": 0,
    "maxRuns": 30,
    "settings": {
      "notifyOnComplete": true
    },
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z"
  }
}
```

### 2. Lấy danh sách lịch

**GET** `/api/schedules?page=1&limit=10&status=active`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`: Số trang (mặc định: 1)
- `limit`: Số item mỗi trang (mặc định: 10, tối đa: 100)
- `status`: Lọc theo trạng thái (`active`, `inactive`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Tên lịch",
      "description": "Mô tả",
      "cronExpression": "0 9 * * *",
      "isActive": true,
      "lastRunAt": "2024-01-15T09:00:00.000Z",
      "nextRunAt": "2024-01-16T09:00:00.000Z",
      "runCount": 5,
      "maxRuns": 30,
      "channel": {
        "id": "uuid",
        "channelName": "Tên kênh",
        "imageUrl": "url-ảnh"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 3. Cập nhật lịch

**PUT** `/api/schedules/:id`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Tên lịch mới",
  "description": "Mô tả mới",
  "cronExpression": "0 10 * * *",
  "isActive": false,
  "maxRuns": 20
}
```

### 4. Bật/tắt lịch

**PATCH** `/api/schedules/:id/toggle`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Đã bật lịch",
  "data": {
    "id": "uuid",
    "isActive": true
  }
}
```

### 5. Chạy lịch ngay lập tức

**POST** `/api/schedules/:id/run`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Đã chạy lịch thành công"
}
```

### 6. Xóa lịch

**DELETE** `/api/schedules/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Xóa lịch thành công"
}
```

## Thông tin thời gian

### Cấu trúc object `time`:

```json
{
  "time": {
    "hour": 9,        // Giờ (0-23)
    "minute": 0,      // Phút (0-59)
    "dayOfWeek": 1,   // Ngày trong tuần (0-6, 0=Chủ nhật) - chỉ cho weekly
    "dayOfMonth": 1,  // Ngày trong tháng (1-31) - chỉ cho monthly/yearly
    "month": 1        // Tháng (1-12) - chỉ cho yearly
  }
}
```

### Yêu cầu theo loại lịch:

| Loại lịch | Bắt buộc | Tùy chọn |
|-----------|----------|----------|
| minutely | - | - |
| hourly | - | - |
| daily | hour, minute | - |
| weekly | hour, minute, dayOfWeek | - |
| monthly | hour, minute, dayOfMonth | - |
| yearly | hour, minute, dayOfMonth, month | - |

## Cron Expression Examples

### Các ví dụ cron expression được tạo tự động:

```bash
# Minutely
* * * * *

# Hourly  
0 * * * *

# Daily lúc 9:00 AM
0 9 * * *

# Weekly vào thứ 2 lúc 9:00 AM
0 9 * * 1

# Monthly vào ngày 1 lúc 9:00 AM
0 9 1 * *

# Yearly vào ngày 1 tháng 1 lúc 9:00 AM
0 9 1 1 *
```

## Lưu ý quan trọng

1. **Bảo mật**: Tất cả endpoints đều yêu cầu authentication
2. **Quyền sở hữu**: User chỉ có thể quản lý lịch của mình
3. **Kênh hợp lệ**: Chỉ có thể đặt lịch cho kênh đã phân tích
4. **Giới hạn**: Số lần chạy tối đa có thể thiết lập để tránh chạy vô hạn
5. **Timezone**: Tất cả thời gian đều theo timezone của server

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    "Giờ phải từ 0-23",
    "Phút phải từ 0-59",
    "Ngày trong tuần phải từ 0-6"
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token không hợp lệ hoặc đã hết hạn"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Lịch không tồn tại"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Lỗi server",
  "error": "Chi tiết lỗi"
}
``` 