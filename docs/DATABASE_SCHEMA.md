# Database Schema Documentation

## 1. Mối quan hệ của các bảng

```
users (1) ────┐
              ├── (N) youtube_channels (1) ────┐
              │                                ├── (N) videos (1) ──── (N) video_statistics
              │                                ├── (N) channel_statistics
              │                                ├── (N) channel_violations
              │                                └── (N) access_tokens
              └── (N) user_schedules
```

### Chi tiết mối quan hệ:

- **users → youtube_channels** (1:N): Một user có thể sở hữu nhiều kênh YouTube
- **users → user_schedules** (1:N): Một user có thể có nhiều lịch trình
- **users → access_tokens** (1:N): Một user có thể có nhiều access token cho các kênh khác nhau

- **youtube_channels → videos** (1:N): Một kênh có thể có nhiều video
- **youtube_channels → channel_statistics** (1:N): Một kênh có nhiều thống kê theo thời gian
- **youtube_channels → channel_violations** (1:N): Một kênh có thể có nhiều vi phạm
- **youtube_channels → access_tokens** (1:N): Một kênh có thể có nhiều access token

- **videos → video_statistics** (1:N): Một video có nhiều thống kê theo thời gian

---

## 2. Chi tiết từng trường của bảng

### Bảng `users`
| Trường | Kiểu dữ liệu | Bắt buộc | Ý nghĩa |
|--------|-------------|----------|---------|
| `id` | UUID | ✅ | ID duy nhất của user (primary key) |
| `username` | VARCHAR(50) | ✅ | Tên đăng nhập (unique) |
| `email` | VARCHAR(100) | ✅ | Email đăng ký (unique) |
| `password` | VARCHAR | ✅ | Mật khẩu đã được hash |
| `full_name` | VARCHAR(100) | ✅ | Họ tên đầy đủ |
| `role` | ENUM('user', 'admin') | ❌ | Vai trò trong hệ thống (mặc định: 'user') |
| `is_active` | BOOLEAN | ❌ | Trạng thái hoạt động (mặc định: true) |
| `last_login_at` | TIMESTAMP | ❌ | Thời gian đăng nhập cuối |
| `created_at` | TIMESTAMP | ❌ | Thời gian tạo tài khoản |
| `updated_at` | TIMESTAMP | ❌ | Thời gian cập nhật cuối |

### Bảng `youtube_channels`
| Trường | Kiểu dữ liệu | Bắt buộc | Ý nghĩa |
|--------|-------------|----------|---------|
| `id` | UUID | ✅ | ID duy nhất của kênh (primary key) |
| `user_id` | UUID | ✅ | ID của user sở hữu kênh (foreign key) |
| `channel_id` | VARCHAR | ✅ | ID kênh YouTube (unique) |
| `channel_title` | VARCHAR | ✅ | Tên kênh YouTube |
| `channel_description` | TEXT | ❌ | Mô tả kênh |
| `channel_custom_url` | VARCHAR | ❌ | URL tùy chỉnh của kênh |
| `channel_country` | VARCHAR | ❌ | Quốc gia của kênh |
| `channel_thumbnail_url` | TEXT | ❌ | URL ảnh đại diện kênh |
| `channel_creation_date` | TIMESTAMP | ❌ | Ngày tạo kênh YouTube |
| `is_verified` | BOOLEAN | ❌ | Kênh đã được xác minh chưa |
| `is_monitized` | BOOLEAN | ❌ | Kênh có được monetize không |
| `created_at` | TIMESTAMP | ❌ | Thời gian thêm kênh vào hệ thống |
| `updated_at` | TIMESTAMP | ❌ | Thời gian cập nhật cuối |

### Bảng `videos`
| Trường | Kiểu dữ liệu | Bắt buộc | Ý nghĩa |
|--------|-------------|----------|---------|
| `id` | UUID | ✅ | ID duy nhất của video (primary key) |
| `channel_id` | UUID | ✅ | ID của kênh chứa video (foreign key) |
| `video_id` | VARCHAR | ✅ | ID video YouTube (unique) |
| `title` | VARCHAR | ✅ | Tiêu đề video |
| `description` | TEXT | ❌ | Mô tả video |
| `published_at` | TIMESTAMP | ❌ | Thời gian publish video |
| `thumbnail_url` | TEXT | ❌ | URL ảnh thumbnail video |
| `duration` | VARCHAR | ❌ | Thời lượng video (format: HH:MM:SS) |
| `privacy_status` | VARCHAR | ❌ | Trạng thái riêng tư (public/private/unlisted) |
| `created_at` | TIMESTAMP | ❌ | Thời gian thêm video vào hệ thống |
| `updated_at` | TIMESTAMP | ❌ | Thời gian cập nhật cuối |

### Bảng `channel_statistics`
| Trường | Kiểu dữ liệu | Bắt buộc | Ý nghĩa |
|--------|-------------|----------|---------|
| `id` | UUID | ✅ | ID duy nhất của thống kê (primary key) |
| `channel_id` | UUID | ✅ | ID của kênh (foreign key) |
| `date` | DATE | ✅ | Ngày thống kê |
| `subscriber_count` | INTEGER | ❌ | Số lượng subscriber |
| `view_count` | BIGINT | ❌ | Tổng số lượt xem |
| `like_count` | INTEGER | ❌ | Tổng số lượt like |
| `comment_count` | INTEGER | ❌ | Tổng số comment |
| `share_count` | INTEGER | ❌ | Tổng số lượt share |
| `watch_time_minutes` | INTEGER | ❌ | Tổng thời gian xem (phút) |
| `estimated_revenue` | DECIMAL(10,2) | ❌ | Doanh thu ước tính (USD) |
| `view_growth_percent` | DECIMAL(5,2) | ❌ | Phần trăm tăng trưởng lượt xem |
| `subscriber_growth_percent` | DECIMAL(5,2) | ❌ | Phần trăm tăng trưởng subscriber |
| `created_at` | TIMESTAMP | ❌ | Thời gian tạo thống kê |
| `updated_at` | TIMESTAMP | ❌ | Thời gian cập nhật cuối |

### Bảng `video_statistics`
| Trường | Kiểu dữ liệu | Bắt buộc | Ý nghĩa |
|--------|-------------|----------|---------|
| `id` | UUID | ✅ | ID duy nhất của thống kê (primary key) |
| `video_id` | UUID | ✅ | ID của video (foreign key) |
| `date` | DATE | ✅ | Ngày thống kê |
| `view_count` | INTEGER | ❌ | Số lượt xem video |
| `like_count` | INTEGER | ❌ | Số lượt like video |
| `comment_count` | INTEGER | ❌ | Số comment video |
| `share_count` | INTEGER | ❌ | Số lượt share video |
| `estimated_revenue` | DECIMAL(10,2) | ❌ | Doanh thu ước tính của video (USD) |
| `created_at` | TIMESTAMP | ❌ | Thời gian tạo thống kê |
| `updated_at` | TIMESTAMP | ❌ | Thời gian cập nhật cuối |

### Bảng `channel_violations`
| Trường | Kiểu dữ liệu | Bắt buộc | Ý nghĩa |
|--------|-------------|----------|---------|
| `id` | UUID | ✅ | ID duy nhất của vi phạm (primary key) |
| `channel_id` | UUID | ✅ | ID của kênh (foreign key) |
| `violation_type` | ENUM('monetization', 'community') | ✅ | Loại vi phạm |
| `title` | VARCHAR | ✅ | Tiêu đề vi phạm |
| `description` | TEXT | ❌ | Mô tả chi tiết vi phạm |
| `status` | ENUM('active', 'resolved') | ❌ | Trạng thái vi phạm (mặc định: 'active') |
| `violation_date` | TIMESTAMP | ✅ | Ngày xảy ra vi phạm |
| `resolved_date` | TIMESTAMP | ❌ | Ngày giải quyết vi phạm |
| `created_at` | TIMESTAMP | ❌ | Thời gian tạo vi phạm |
| `updated_at` | TIMESTAMP | ❌ | Thời gian cập nhật cuối |

### Bảng `access_tokens`
| Trường | Kiểu dữ liệu | Bắt buộc | Ý nghĩa |
|--------|-------------|----------|---------|
| `id` | UUID | ✅ | ID duy nhất của token (primary key) |
| `user_id` | UUID | ✅ | ID của user (foreign key) |
| `channel_id` | UUID | ✅ | ID của kênh (foreign key) |
| `access_token` | TEXT | ✅ | Access token cho YouTube API |
| `refresh_token` | TEXT | ✅ | Refresh token để làm mới access token |
| `scope` | TEXT | ✅ | Phạm vi quyền truy cập |
| `expires_at` | TIMESTAMP | ✅ | Thời gian hết hạn access token |
| `created_at` | TIMESTAMP | ❌ | Thời gian tạo token |
| `updated_at` | TIMESTAMP | ❌ | Thời gian cập nhật cuối |

### Bảng `user_schedules`
| Trường | Kiểu dữ liệu | Bắt buộc | Ý nghĩa |
|--------|-------------|----------|---------|
| `id` | UUID | ✅ | ID duy nhất của lịch trình (primary key) |
| `user_id` | UUID | ✅ | ID của user (foreign key) |
| `time_of_day` | TIME | ✅ | Thời gian trong ngày (format: HH:MM:SS) |
| `is_active` | BOOLEAN | ❌ | Trạng thái hoạt động (mặc định: true) |
| `created_at` | TIMESTAMP | ❌ | Thời gian tạo lịch trình |
| `updated_at` | TIMESTAMP | ❌ | Thời gian cập nhật cuối | 