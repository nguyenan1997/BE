# Database Schema Documentation

## 1. Mối quan hệ của các bảng

```
users (1) ────┐
              ├── (N) youtube_channels (1) ────┐
              │                                ├── (N) videos (1) ──── (N) video_statistics
              │                                ├── (N) channel_statistics
              │                                ├── (N) channel_violations
              │                                ├── (N) access_tokens
              │                                └── (N) shared_channels (N) ────┐
              └── (N) user_schedules         users (N) <───────────────────────┘
```

### Chi tiết mối quan hệ:

- **users → youtube_channels** (1:N): Một user là chủ sở hữu nhiều kênh YouTube
- **users → user_schedules** (1:N): Một user có thể có nhiều lịch trình
- **youtube_channels → videos** (1:N): Một kênh có thể có nhiều video
- **youtube_channels → channel_statistics** (1:N): Một kênh có nhiều thống kê theo thời gian
- **youtube_channels → channel_violations** (1:N): Một kênh có thể có nhiều vi phạm
- **youtube_channels → access_tokens** (1:N): Một kênh có thể có nhiều access token
- **youtube_channels → shared_channels** (1:N): Một kênh có thể được chia sẻ cho nhiều user khác
- **users → shared_channels** (1:N): Một user có thể được chia sẻ nhiều kênh (không phải chủ sở hữu)
- **videos → video_statistics** (1:N): Một video có nhiều thống kê theo thời gian

---

## 2. Chi tiết từng trường của bảng

### Bảng `users` (Lưu thông tin người dùng hệ thống)
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

### Bảng `youtube_channels` (Lưu thông tin chi tiết về các kênh YouTube)
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

### Bảng `shared_channels` (Lưu thông tin các kênh được chia sẻ cho user khác)
| Trường | Kiểu dữ liệu | Bắt buộc | Ý nghĩa |
|--------|-------------|----------|---------|
| `id` | UUID | ✅ | ID duy nhất của bản ghi chia sẻ (primary key) |
| `channel_db_id` | UUID | ✅ | ID của kênh được chia sẻ (foreign key → youtube_channels.id) |
| `user_id` | UUID | ✅ | ID của user được chia sẻ (foreign key → users.id) |
| `permission` | ENUM('read', 'write', 'admin') | ✅ | Quyền hạn của user với kênh được chia sẻ |
| `created_at` | TIMESTAMP | ❌ | Thời gian chia sẻ |
| `updated_at` | TIMESTAMP | ❌ | Thời gian cập nhật cuối |

### Bảng `videos` (Lưu thông tin chi tiết về từng video thuộc các kênh YouTube đã lưu)
| Trường | Kiểu dữ liệu | Bắt buộc | Ý nghĩa |
|--------|-------------|----------|---------|
| `id` | UUID | ✅ | ID duy nhất của video (primary key) |
| `channel_db_id` | UUID | ✅ | ID của kênh chứa video (foreign key → youtube_channels.id) |
| `video_id` | VARCHAR | ✅ | ID video YouTube (unique) |
| `title` | VARCHAR | ✅ | Tiêu đề video |
| `description` | TEXT | ❌ | Mô tả video |
| `published_at` | TIMESTAMP | ❌ | Thời gian publish video |
| `thumbnail_url` | TEXT | ❌ | URL ảnh thumbnail video |
| `duration` | VARCHAR | ❌ | Thời lượng video (format: HH:MM:SS) |
| `privacy_status` | VARCHAR | ❌ | Trạng thái riêng tư (public/private/unlisted) |
| `created_at` | TIMESTAMP | ❌ | Thời gian thêm video vào hệ thống |
| `updated_at` | TIMESTAMP | ❌ | Thời gian cập nhật cuối |

### Bảng `channel_statistics` (Lưu trữ thống kê tổng quan của kênh YouTube theo từng ngày, chỉ giữ tối đa 7 ngày gần nhất)
| Trường             | Kiểu dữ liệu      | Bắt buộc | Ý nghĩa                                    |
|--------------------|------------------|----------|--------------------------------------------|
| `id`               | UUID             | ✅        | ID duy nhất của thống kê (primary key)     |
| `channel_db_id`    | UUID             | ✅        | ID của kênh (foreign key → youtube_channels.id) |
| `date`             | DATE             | ✅        | Ngày thống kê                              |
| `subscriber_count` | INTEGER          | ❌        | Số lượng subscriber                        |
| `view_count`       | BIGINT           | ❌        | Tổng số lượt xem                           |
| `like_count`       | INTEGER          | ❌        | Tổng số lượt like                          |
| `comment_count`    | INTEGER          | ❌        | Tổng số comment                            |
| `share_count`      | INTEGER          | ❌        | Tổng số lượt share                         |
| `watch_time_minutes`| INTEGER         | ❌        | Tổng thời gian xem (phút)                  |
| `estimated_revenue`| DECIMAL(10,2)    | ❌        | Doanh thu ước tính (USD)                   |
| `created_at`       | TIMESTAMP        | ❌        | Thời gian tạo thống kê                     |
| `updated_at`       | TIMESTAMP        | ❌        | Thời gian cập nhật cuối                    |

> **Ghi chú:** Mỗi ngày mỗi kênh chỉ có 1 bản ghi. Dữ liệu cũ hơn 7 ngày sẽ được xóa định kỳ để giữ bảng luôn gọn nhẹ.

### Bảng `video_statistics` (Lưu thống kê chi tiết của từng video theo từng ngày, chỉ giữ tối đa 7 ngày gần nhất)
| Trường             | Kiểu dữ liệu      | Bắt buộc | Ý nghĩa                                    |
|--------------------|------------------|----------|--------------------------------------------|
| `id`               | UUID             | ✅        | ID duy nhất của thống kê (primary key)     |
| `video_db_id`      | UUID             | ✅        | ID của video (foreign key → videos.id)     |
| `date`             | DATE             | ✅        | Ngày thống kê                              |
| `view_count`       | INTEGER          | ❌        | Số lượt xem video                          |
| `like_count`       | INTEGER          | ❌        | Số lượt like video                         |
| `comment_count`    | INTEGER          | ❌        | Số comment video                           |
| `share_count`      | INTEGER          | ❌        | Số lượt share video                        |
| `estimated_revenue`| DECIMAL(10,2)    | ❌        | Doanh thu ước tính của video (USD)         |
| `created_at`       | TIMESTAMP        | ❌        | Thời gian tạo thống kê                     |
| `updated_at`       | TIMESTAMP        | ❌        | Thời gian cập nhật cuối                    |

> **Ghi chú:** Mỗi ngày mỗi video chỉ có 1 bản ghi. Dữ liệu cũ hơn 7 ngày sẽ được xóa định kỳ để giữ bảng luôn gọn nhẹ.

### Bảng `channel_violations` (Lưu các cảnh báo, vi phạm của kênh)
| Trường | Kiểu dữ liệu | Bắt buộc | Ý nghĩa |
|--------|-------------|----------|---------|
| `id` | UUID | ✅ | ID duy nhất của vi phạm (primary key) |
| `channel_db_id` | UUID | ✅ | ID của kênh (foreign key → youtube_channels.id) |
| `violation_type` | ENUM('monetization', 'community') | ✅ | Loại vi phạm |
| `title` | VARCHAR | ✅ | Tiêu đề vi phạm |
| `description` | TEXT | ❌ | Mô tả chi tiết vi phạm |
| `status` | ENUM('active', 'resolved') | ❌ | Trạng thái vi phạm (mặc định: 'active') |
| `violation_date` | TIMESTAMP | ✅ | Ngày xảy ra vi phạm |
| `resolved_date` | TIMESTAMP | ❌ | Ngày giải quyết vi phạm |
| `created_at` | TIMESTAMP | ❌ | Thời gian tạo vi phạm |
| `updated_at` | TIMESTAMP | ❌ | Thời gian cập nhật cuối |

### Bảng `access_tokens` (Lưu trữ access token và refresh token dùng để truy cập API YouTube cho từng kênh)
| Trường | Kiểu dữ liệu | Bắt buộc | Ý nghĩa |
|--------|-------------|----------|---------|
| `id` | UUID | ✅ | ID duy nhất của token (primary key) |
| `channel_db_id` | UUID | ✅ | ID của kênh (foreign key → youtube_channels.id) |
| `access_token` | TEXT | ✅ | Access token cho YouTube API |
| `refresh_token` | TEXT | ✅ | Refresh token để làm mới access token |
| `scope` | TEXT | ✅ | Phạm vi quyền truy cập |
| `is_active` | BOOLEAN | ✅ | Kiểm tra xem đây có phải token còn hoạt động hay không |
| `expires_at` | TIMESTAMP | ✅ | Thời gian hết hạn access token |
| `created_at` | TIMESTAMP | ❌ | Thời gian tạo token |
| `updated_at` | TIMESTAMP | ❌ | Thời gian cập nhật cuối |

### Bảng `user_schedules` (Lưu lịch trình (schedule) của từng user)
| Trường | Kiểu dữ liệu | Bắt buộc | Ý nghĩa |
|--------|-------------|----------|---------|
| `id` | UUID | ✅ | ID duy nhất của lịch trình (primary key) |
| `user_id` | UUID | ✅ | ID của user (foreign key) |
| `time_of_day` | TIME | ✅ | Thời gian thực hiện schedule |
| `is_active` | BOOLEAN | ✅ | Lịch trình còn hiệu lực |
| `created_at` | TIMESTAMP | ❌ | Thời gian tạo |
| `updated_at` | TIMESTAMP | ❌ | Thời gian cập nhật cuối |