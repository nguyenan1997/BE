# Hướng dẫn Setup và Sử dụng Chức năng Đặt lịch

## Tổng quan
Chức năng đặt lịch cho phép user tự động lấy dữ liệu và phân tích kênh YouTube theo thời gian định sẵn. Hệ thống sử dụng cron jobs để thực hiện các lịch đã đặt.

## Cài đặt

### 1. Cài đặt dependencies
```bash
npm install node-cron
```

### 2. Tạo bảng schedules trong database
```bash
npm run create-schedule-table
```

### 3. Khởi động server
```bash
npm run dev
```

## Cách sử dụng

### 1. Tạo lịch đơn giản (Khuyến nghị)

**Endpoint:** `POST /api/schedules/form`

**Ví dụ tạo lịch hàng ngày:**
```javascript
const response = await fetch('/api/schedules/form', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    channelId: 'uuid-của-kênh',
    name: 'Phân tích hàng ngày',
    description: 'Tự động phân tích kênh mỗi ngày lúc 9:00',
    frequency: 'daily',
    time: '09:00',
    maxRuns: 30
  })
});
```

**Ví dụ tạo lịch hàng tuần:**
```javascript
const response = await fetch('/api/schedules/form', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    channelId: 'uuid-của-kênh',
    name: 'Phân tích hàng tuần',
    description: 'Tự động phân tích kênh mỗi thứ 2 lúc 9:00',
    frequency: 'weekly',
    time: '09:00',
    dayOfWeek: 1, // 0=Chủ nhật, 1=Thứ 2, ..., 6=Thứ 7
    maxRuns: 52
  })
});
```

### 2. Tạo lịch với cron expression

**Endpoint:** `POST /api/schedules`

```javascript
const response = await fetch('/api/schedules', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    channelId: 'uuid-của-kênh',
    name: 'Phân tích mỗi 2 giờ',
    description: 'Tự động phân tích kênh mỗi 2 giờ',
    cronExpression: '0 */2 * * *',
    maxRuns: 100
  })
});
```

### 3. Quản lý lịch

**Lấy danh sách lịch:**
```javascript
const response = await fetch('/api/schedules?page=1&limit=10&status=active', {
  headers: {
    'Authorization': 'Bearer your-token'
  }
});
```

**Bật/tắt lịch:**
```javascript
const response = await fetch(`/api/schedules/${scheduleId}/toggle`, {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer your-token'
  }
});
```

**Chạy lịch ngay lập tức:**
```javascript
const response = await fetch(`/api/schedules/${scheduleId}/run`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-token'
  }
});
```

**Cập nhật lịch:**
```javascript
const response = await fetch(`/api/schedules/${scheduleId}`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer your-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Tên lịch mới',
    cronExpression: '0 10 * * *',
    isActive: false
  })
});
```

**Xóa lịch:**
```javascript
const response = await fetch(`/api/schedules/${scheduleId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer your-token'
  }
});
```

## Tần suất có sẵn

### 1. Minutely (Mỗi phút)
```javascript
{
  frequency: 'minutely'
  // Không cần time
}
```

### 2. Hourly (Mỗi giờ)
```javascript
{
  frequency: 'hourly'
  // Không cần time
}
```

### 3. Daily (Hàng ngày)
```javascript
{
  frequency: 'daily',
  time: '09:00' // Format: HH:MM
}
```

### 4. Weekly (Hàng tuần)
```javascript
{
  frequency: 'weekly',
  time: '09:00',
  dayOfWeek: 1 // 0=Chủ nhật, 1=Thứ 2, ..., 6=Thứ 7
}
```

### 5. Monthly (Hàng tháng)
```javascript
{
  frequency: 'monthly',
  time: '09:00',
  dayOfMonth: 1 // 1-31
}
```

## Cron Expression Examples

### Các ví dụ phổ biến:

```bash
# Mỗi phút
* * * * *

# Mỗi giờ
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

## Lưu ý quan trọng

### 1. Bảo mật
- Tất cả endpoints đều yêu cầu authentication
- User chỉ có thể quản lý lịch của mình
- Chỉ có thể đặt lịch cho kênh đã phân tích

### 2. Giới hạn
- Số lần chạy tối đa có thể thiết lập để tránh chạy vô hạn
- Mỗi user có thể tạo nhiều lịch cho nhiều kênh khác nhau

### 3. Timezone
- Tất cả thời gian đều theo timezone của server
- Đảm bảo server có timezone đúng

### 4. Performance
- Hệ thống tự động quản lý cron jobs
- Khi server restart, các lịch active sẽ được khôi phục tự động

### 5. Monitoring
- Theo dõi logs để kiểm tra việc thực thi lịch
- Có thể xem thông tin `lastRunAt`, `nextRunAt`, `runCount` để monitor

## Troubleshooting

### 1. Lịch không chạy
- Kiểm tra `isActive` có đúng không
- Kiểm tra `cronExpression` có hợp lệ không
- Kiểm tra logs của server

### 2. Lỗi validation
- Đảm bảo `channelId` là UUID hợp lệ
- Đảm bảo `cronExpression` đúng format
- Đảm bảo các field bắt buộc đã được điền

### 3. Lỗi database
- Kiểm tra kết nối database
- Chạy lại script tạo bảng nếu cần

## API Documentation
Xem chi tiết API tại file: `SCHEDULE_API_DOCS.md` 