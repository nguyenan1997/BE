# Cấu trúc Database - YouTube Channel Manager

## Tổng quan

Database đã được thiết kế lại để tối ưu hóa hiệu suất và dễ bảo trì. Cấu trúc mới chia nhỏ bảng `YouTubeChannel` thành nhiều bảng chuyên biệt theo từng loại dữ liệu.

## Cấu trúc bảng

### 1. Bảng `users`
**Mô tả:** Quản lý thông tin người dùng hệ thống

**Các trường chính:**
- `id` (UUID, PK): ID duy nhất của user
- `username` (STRING): Tên đăng nhập
- `email` (STRING): Email
- `password` (STRING): Mật khẩu đã mã hóa
- `fullName` (STRING): Họ tên đầy đủ
- `role` (ENUM): Vai trò (user/admin)
- `isActive` (BOOLEAN): Trạng thái hoạt động
- `lastLoginAt` (DATE): Lần đăng nhập cuối

### 2. Bảng `youtube_channels`
**Mô tả:** Thông tin cơ bản của YouTube channel

**Các trường chính:**
- `id` (UUID, PK): ID duy nhất của channel
- `userId` (UUID, FK): User sở hữu channel
- `channelName` (STRING): Tên channel
- `description` (TEXT): Mô tả channel
- `category` (STRING): Danh mục channel
- `joinDate` (STRING): Ngày tham gia
- `location` (STRING): Vị trí
- `imageUrl` (TEXT): URL ảnh đại diện
- `originalImageName` (STRING): Tên file ảnh gốc
- `analysisStatus` (ENUM): Trạng thái phân tích
- `analysisError` (TEXT): Lỗi phân tích
- `analyzedBy` (UUID, FK): User thực hiện phân tích

**Lợi ích:**
- Xác định rõ ràng channel thuộc về user nào
- Phân biệt user sở hữu và user phân tích
- Hỗ trợ multi-tenant architecture

### 3. Bảng `channel_statistics`
**Mô tả:** Thống kê của channel theo thời gian

**Các trường chính:**
- `id` (UUID, PK): ID duy nhất
- `channelId` (UUID, FK): ID channel
- `subscriberCount` (STRING): Số subscriber
- `totalViews` (STRING): Tổng lượt xem
- `estimatedRevenue` (STRING): Doanh thu ước tính
- `watchTime` (STRING): Thời gian xem
- `views48h` (STRING): Lượt xem 48h
- `views60min` (STRING): Lượt xem 60 phút
- `recordedAt` (DATE): Thời điểm ghi nhận

**Lợi ích:**
- Theo dõi thống kê theo thời gian
- Dễ dàng phân tích xu hướng
- Tối ưu hiệu suất query

### 4. Bảng `channel_warnings`
**Mô tả:** Các cảnh báo của channel

**Các trường chính:**
- `id` (UUID, PK): ID duy nhất
- `channelId` (UUID, FK): ID channel
- `warningType` (ENUM): Loại cảnh báo (monetization, community_guidelines, copyright, other)
- `isActive` (BOOLEAN): Trạng thái hoạt động
- `reason` (TEXT): Lý do cảnh báo
- `details` (JSON): Chi tiết bổ sung
- `warningDate` (DATE): Ngày cảnh báo
- `resolvedDate` (DATE): Ngày giải quyết
- `severity` (ENUM): Mức độ nghiêm trọng

**Lợi ích:**
- Quản lý nhiều loại cảnh báo
- Theo dõi lịch sử cảnh báo
- Dễ dàng filter và search

### 5. Bảng `channel_videos`
**Mô tả:** Thông tin video của channel

**Các trường chính:**
- `id` (UUID, PK): ID duy nhất
- `channelId` (UUID, FK): ID channel
- `videoId` (STRING): YouTube video ID
- `title` (STRING): Tiêu đề video
- `description` (TEXT): Mô tả video
- `thumbnailUrl` (TEXT): URL thumbnail
- `publishedAt` (DATE): Thời gian xuất bản
- `duration` (STRING): Thời lượng
- `viewCount` (INTEGER): Số lượt xem
- `likeCount` (INTEGER): Số lượt thích
- `commentCount` (INTEGER): Số bình luận
- `isRecent` (BOOLEAN): Video gần đây
- `recordedAt` (DATE): Thời điểm ghi nhận

**Lợi ích:**
- Quản lý video chi tiết
- Dễ dàng query video theo tiêu chí
- Tối ưu hiệu suất

### 6. Bảng `channel_social_links`
**Mô tả:** Liên kết mạng xã hội của channel

**Các trường chính:**
- `id` (UUID, PK): ID duy nhất
- `channelId` (UUID, FK): ID channel
- `platform` (ENUM): Nền tảng (facebook, twitter, instagram, tiktok, linkedin, website, other)
- `url` (TEXT): URL liên kết
- `displayName` (STRING): Tên hiển thị
- `isVerified` (BOOLEAN): Đã xác minh
- `isActive` (BOOLEAN): Trạng thái hoạt động

**Lợi ích:**
- Quản lý nhiều nền tảng
- Dễ dàng thêm/bớt social links
- Tối ưu hiệu suất query

### 7. Bảng `channel_analyses`
**Mô tả:** Kết quả phân tích AI của channel

**Các trường chính:**
- `id` (UUID, PK): ID duy nhất
- `channelId` (UUID, FK): ID channel
- `analysisType` (ENUM): Loại phân tích (content_analysis, audience_analysis, performance_analysis, trend_analysis, risk_assessment)
- `analysisData` (JSON): Dữ liệu phân tích chi tiết
- `summary` (TEXT): Tóm tắt phân tích
- `confidence` (DECIMAL): Độ tin cậy (0-1)
- `analyzedAt` (DATE): Thời điểm phân tích
- `isLatest` (BOOLEAN): Phân tích mới nhất

**Lợi ích:**
- Lưu trữ nhiều loại phân tích
- Theo dõi lịch sử phân tích
- Dễ dàng so sánh kết quả

### 8. Bảng `schedules`
**Mô tả:** Lịch trình phân tích channel

**Các trường chính:**
- `id` (UUID, PK): ID duy nhất
- `userId` (UUID, FK): ID user tạo lịch
- `channelId` (UUID, FK): ID channel
- `name` (STRING): Tên lịch
- `description` (TEXT): Mô tả
- `cronExpression` (STRING): Biểu thức cron
- `isActive` (BOOLEAN): Trạng thái hoạt động
- `lastRunAt` (DATE): Lần chạy cuối
- `nextRunAt` (DATE): Lần chạy tiếp theo
- `runCount` (INTEGER): Số lần đã chạy
- `maxRuns` (INTEGER): Số lần tối đa
- `settings` (JSON): Cài đặt bổ sung

## Relationships

```
users (1) ──── (N) youtube_channels
users (1) ──── (N) schedules
youtube_channels (1) ──── (N) schedules
youtube_channels (1) ──── (N) channel_statistics
youtube_channels (1) ──── (N) channel_warnings
youtube_channels (1) ──── (N) channel_videos
youtube_channels (1) ──── (N) channel_social_links
youtube_channels (1) ──── (N) channel_analyses
```

**Giải thích relationships:**
- `users` → `youtube_channels`: User sở hữu nhiều channels (qua `userId`)
- `users` → `schedules`: User tạo nhiều lịch trình
- `youtube_channels` → `schedules`: Channel có nhiều lịch trình
- `youtube_channels` → `channel_*`: Channel có nhiều dữ liệu liên quan

**Lưu ý:** Trường `analyzedBy` trong bảng `youtube_channels` chỉ là foreign key tham chiếu đến user thực hiện phân tích, không tạo relationship riêng biệt.

## Lợi ích của cấu trúc mới

### 1. **Chuẩn hóa dữ liệu**
- Loại bỏ dữ liệu JSON không chuẩn
- Dễ dàng query và index
- Đảm bảo data integrity

### 2. **Hiệu suất tốt hơn**
- Index tối ưu cho từng loại dữ liệu
- Query nhanh hơn với JOIN
- Giảm kích thước bảng chính

### 3. **Dễ bảo trì**
- Mỗi bảng có trách nhiệm rõ ràng
- Dễ dàng thêm/sửa/xóa tính năng
- Code sạch và có tổ chức

### 4. **Khả năng mở rộng**
- Dễ dàng thêm bảng mới
- Hỗ trợ nhiều loại dữ liệu
- Linh hoạt trong thiết kế

## Migration

Để chuyển đổi từ cấu trúc cũ sang mới, sử dụng script:

```bash
node scripts/migrate-database.js
```

Script này sẽ:
1. Tạo các bảng mới
2. Migrate dữ liệu từ bảng cũ
3. Đảm bảo tính toàn vẹn dữ liệu

## Best Practices

### 1. **Query Optimization**
- Sử dụng JOIN thay vì query riêng lẻ
- Tận dụng index đã tạo
- Sử dụng pagination cho dữ liệu lớn

### 2. **Data Management**
- Backup dữ liệu trước khi migration
- Test migration trên môi trường dev
- Monitor hiệu suất sau migration

### 3. **Code Organization**
- Tách logic theo từng model
- Sử dụng transactions khi cần
- Implement proper error handling 