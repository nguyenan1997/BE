# Schedule Setup Guide

## Tổng quan
Hệ thống đặt lịch cho phép tự động lấy dữ liệu và phân tích kênh YouTube theo thời gian định sẵn.

## Cài đặt

### 1. Cài đặt dependencies
```bash
npm install node-cron
```

### 2. Tạo bảng Schedule
Chạy migration script để tạo bảng:
```bash
node scripts/createScheduleTable.js
```

### 3. Cấu hình trong server.js
Đảm bảo đã import và sử dụng schedule routes:
```javascript
const scheduleRoutes = require('./routes/scheduleRoutes');
app.use('/api/schedules', scheduleRoutes);
```

## Sử dụng API

### Tạo lịch mới

**Endpoint:** `POST /api/schedules`

**Headers:**
```
Authorization: Bearer <your-token>
Content-Type: application/json
```

**Ví dụ tạo lịch hàng ngày:**
```json
{
  "channelId": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Phân tích hàng ngày",
  "description": "Phân tích kênh mỗi ngày lúc 9:00 AM",
  "scheduleType": "daily",
  "time": {
    "hour": 9,
    "minute": 0
  },
  "maxRuns": 30
}
```

**Ví dụ tạo lịch hàng tuần:**
```json
{
  "channelId": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Phân tích hàng tuần",
  "description": "Phân tích kênh mỗi thứ 2 lúc 9:00 AM",
  "scheduleType": "weekly",
  "time": {
    "hour": 9,
    "minute": 0,
    "dayOfWeek": 1
  },
  "maxRuns": 52
}
```

**Ví dụ tạo lịch hàng tháng:**
```json
{
  "channelId": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Phân tích hàng tháng",
  "description": "Phân tích kênh mỗi ngày 1 lúc 9:00 AM",
  "scheduleType": "monthly",
  "time": {
    "hour": 9,
    "minute": 0,
    "dayOfMonth": 1
  },
  "maxRuns": 12
}
```

**Ví dụ tạo lịch hàng năm:**
```json
{
  "channelId": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Phân tích hàng năm",
  "description": "Phân tích kênh mỗi ngày 1 tháng 1 lúc 9:00 AM",
  "scheduleType": "yearly",
  "time": {
    "hour": 9,
    "minute": 0,
    "dayOfMonth": 1,
    "month": 1
  },
  "maxRuns": 5
}
```

### Các loại lịch có sẵn

| Loại lịch | Mô tả | Thông tin thời gian cần thiết |
|-----------|-------|-------------------------------|
| `minutely` | Chạy mỗi phút | Không cần |
| `hourly` | Chạy mỗi giờ | Không cần |
| `daily` | Chạy hàng ngày | `hour`, `minute` |
| `weekly` | Chạy hàng tuần | `hour`, `minute`, `dayOfWeek` |
| `monthly` | Chạy hàng tháng | `hour`, `minute`, `dayOfMonth` |
| `yearly` | Chạy hàng năm | `hour`, `minute`, `dayOfMonth`, `month` |

### Thông tin thời gian

#### Cấu trúc object `time`:
```json
{
  "time": {
    "hour": 9,        // Giờ (0-23)
    "minute": 0,      // Phút (0-59)
    "dayOfWeek": 1,   // Ngày trong tuần (0-6, 0=Chủ nhật)
    "dayOfMonth": 1,  // Ngày trong tháng (1-31)
    "month": 1        // Tháng (1-12)
  }
}
```

#### Ngày trong tuần:
- `0`: Chủ nhật
- `1`: Thứ 2
- `2`: Thứ 3
- `3`: Thứ 4
- `4`: Thứ 5
- `5`: Thứ 6
- `6`: Thứ 7

### Quản lý lịch

#### Lấy danh sách lịch:
```bash
GET /api/schedules?page=1&limit=10&status=active
```

#### Cập nhật lịch:
```bash
PUT /api/schedules/:id
```

#### Bật/tắt lịch:
```bash
PATCH /api/schedules/:id/toggle
```

#### Chạy lịch ngay lập tức:
```bash
POST /api/schedules/:id/run
```

#### Xóa lịch:
```bash
DELETE /api/schedules/:id
```

## Cron Expression

Hệ thống tự động tạo cron expression từ thông tin thời gian:

| Loại lịch | Cron Expression |
|-----------|-----------------|
| minutely | `* * * * *` |
| hourly | `0 * * * *` |
| daily | `{minute} {hour} * * *` |
| weekly | `{minute} {hour} * * {dayOfWeek}` |
| monthly | `{minute} {hour} {dayOfMonth} * *` |
| yearly | `{minute} {hour} {dayOfMonth} {month} *` |

## Lưu ý quan trọng

1. **Authentication**: Tất cả API đều yêu cầu token hợp lệ
2. **Quyền sở hữu**: User chỉ có thể quản lý lịch của mình
3. **Kênh hợp lệ**: Chỉ có thể đặt lịch cho kênh đã phân tích
4. **Giới hạn chạy**: Có thể thiết lập `maxRuns` để tránh chạy vô hạn
5. **Timezone**: Tất cả thời gian đều theo timezone của server
6. **Tự động khởi động**: Lịch sẽ tự động khởi động khi server start

## Troubleshooting

### Lỗi thường gặp:

1. **"Channel not found"**: Đảm bảo channelId tồn tại và thuộc về user
2. **"Invalid time data"**: Kiểm tra thông tin thời gian theo loại lịch
3. **"Schedule not found"**: Kiểm tra scheduleId và quyền sở hữu
4. **"Cron job failed"**: Kiểm tra log server để debug

### Debug:

```bash
# Kiểm tra log server
tail -f logs/app.log

# Kiểm tra trạng thái cron jobs
console.log(global.activeCronJobs);
``` 