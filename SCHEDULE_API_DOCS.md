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
  "cronExpression": "0 9 * * *",
  "maxRuns": 10,
  "settings": {
    "notifyOnComplete": true
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
    "maxRuns": 10,
    "settings": {
      "notifyOnComplete": true
    },
    "createdAt": "2024-01-15T08:00:00.000Z",
    "updatedAt": "2024-01-15T08:00:00.000Z"
  }
}
```

### 2. Tạo lịch từ form đơn giản

**POST** `/api/schedules/form`

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
  "frequency": "daily",
  "time": "09:00",
  "maxRuns": 10
}
```

**Tần suất có sẵn:**
- `minutely`: Mỗi phút
- `hourly`: Mỗi giờ
- `daily`: Hàng ngày (cần thời gian)
- `weekly`: Hàng tuần (cần thời gian + ngày trong tuần)
- `monthly`: Hàng tháng (cần thời gian + ngày trong tháng)

**Ví dụ weekly:**
```json
{
  "channelId": "uuid",
  "name": "Phân tích hàng tuần",
  "frequency": "weekly",
  "time": "09:00",
  "dayOfWeek": 1,
  "maxRuns": 52
}
```

### 3. Lấy danh sách lịch

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
      "maxRuns": 10,
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

### 4. Cập nhật lịch

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

### 5. Bật/tắt lịch

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

### 6. Chạy lịch ngay lập tức

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

### 7. Xóa lịch

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

## Cron Expression Examples

### Các ví dụ cron expression phổ biến:

```bash
# Mỗi phút
* * * * *

# Mỗi giờ (phút thứ 0)
0 * * * *

# Hàng ngày lúc 9:00 AM
0 9 * * *

# Hàng ngày lúc 9:00 AM và 6:00 PM
0 9,18 * * *

# Hàng tuần vào thứ 2 lúc 9:00 AM
0 9 * * 1

# Hàng tháng vào ngày 1 lúc 9:00 AM
0 9 1 * *

# Mỗi 30 phút
*/30 * * * *

# Mỗi 2 giờ
0 */2 * * *

# Chỉ vào các ngày trong tuần (thứ 2-6)
0 9 * * 1-5
```

### Giải thích cron expression:
```
* * * * *
│ │ │ │ │
│ │ │ │ └── Ngày trong tuần (0-7, 0 và 7 = Chủ nhật)
│ │ │ └──── Tháng (1-12)
│ │ └────── Ngày trong tháng (1-31)
│ └──────── Giờ (0-23)
└────────── Phút (0-59)
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
    "Biểu thức cron không hợp lệ",
    "Tên lịch phải có ít nhất 1 ký tự"
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