# Database Schema (Cập nhật từ models)

## Mối quan hệ giữa các bảng

```
users (1) ────┐
              ├── (N) user_channel (N) ────┐
              │                            │
              │                            └── (N) youtube_channels (1) ────┐
              │                                                            │
              └── (N) user_schedules                                       │
                                                                           │
      youtube_channels (1) ──── (N) videos (1) ──── (N) video_statistics    │
                        │                                                  │
                        ├── (N) channel_statistics                         │
                        ├── (N) channel_violations                         │
                        └── (N) google_access_tokens                       │
```

- **users ↔ user_channel ↔ youtube_channels**: Một user có thể sở hữu hoặc được chia sẻ nhiều kênh (qua bảng phụ user_channel). Một kênh có thể thuộc nhiều user (chia sẻ quyền).
- **users → user_schedules**: Một user có thể có nhiều lịch trình.
- **youtube_channels → videos**: Một kênh có nhiều video.
- **videos → video_statistics**: Một video có nhiều thống kê theo ngày.
- **youtube_channels → channel_statistics**: Một kênh có nhiều thống kê tổng hợp theo ngày.
- **youtube_channels → channel_violations**: Một kênh có nhiều vi phạm/cảnh báo.
- **youtube_channels → google_access_tokens**: Một kênh có nhiều access token (lịch sử, refresh, v.v).

---

## 1. users
| Trường         | Kiểu dữ liệu         | Bắt buộc | Ý nghĩa                        |
|----------------|---------------------|----------|-------------------------------|
| id             | UUID                | ✅       | Khóa chính                    |
| username       | STRING(50)          | ✅       | Tên đăng nhập (unique)        |
| email          | STRING(100)         | ✅       | Email (unique)                |
| password       | STRING              | ✅       | Mật khẩu đã hash              |
| fullName       | STRING(100)         | ✅       | Họ tên đầy đủ                 |
| role           | ENUM(user, admin)   | ❌       | Quyền (mặc định: user)        |
| isActive       | BOOLEAN             | ❌       | Trạng thái hoạt động          |
| lastLoginAt    | DATE                | ❌       | Lần đăng nhập cuối            |

---

## 2. youtube_channels
| Trường                | Kiểu dữ liệu     | Bắt buộc | Ý nghĩa                        |
|-----------------------|------------------|----------|-------------------------------|
| id                    | UUID             | ✅       | Khóa chính                    |
| channel_id            | STRING           | ✅       | ID kênh YouTube (unique)      |
| channel_title         | STRING           | ✅       | Tên kênh                      |
| channel_description   | TEXT             | ❌       | Mô tả kênh                    |
| channel_custom_url    | STRING           | ❌       | URL tùy chỉnh                 |
| channel_country       | STRING           | ❌       | Quốc gia                      |
| channel_thumbnail_url | TEXT             | ❌       | Ảnh đại diện                  |
| channel_creation_date | DATE             | ❌       | Ngày tạo kênh                 |
| is_verified           | BOOLEAN          | ❌       | Đã xác minh                   |
| is_monitized          | BOOLEAN          | ❌       | Được kiếm tiền                |
| total_view_count      | BIGINT           | ❌       | Tổng view (tại thời điểm sync)|
| total_subscriber_count| INTEGER          | ❌       | Tổng subscriber               |
| created_at            | DATE             |          | Thời gian tạo                 |
| updated_at            | DATE             |          | Thời gian cập nhật            |

---

## 3. videos
| Trường         | Kiểu dữ liệu         | Bắt buộc | Ý nghĩa                        |
|----------------|---------------------|----------|-------------------------------|
| id             | UUID                | ✅       | Khóa chính                    |
| channel_db_id  | UUID                | ✅       | FK → youtube_channels.id      |
| video_id       | STRING              | ✅       | ID video YouTube              |
| title          | STRING              | ❌       | Tiêu đề                       |
| description    | TEXT                | ❌       | Mô tả                         |
| published_at   | DATE                | ❌       | Ngày đăng                     |
| thumbnail_url  | TEXT                | ❌       | Ảnh thumbnail                  |
| duration       | STRING              | ❌       | Thời lượng (HH:MM:SS)         |
| privacy_status | ENUM(public,private,unlisted) | ❌ | Trạng thái riêng tư           |
| created_at     | DATE                |          | Thời gian tạo                 |

---

## 4. video_statistics
| Trường             | Kiểu dữ liệu      | Bắt buộc | Ý nghĩa                        |
|--------------------|------------------|----------|-------------------------------|
| id                 | UUID             | ✅       | Khóa chính                    |
| video_db_id        | UUID             | ✅       | FK → videos.id                |
| date               | DATEONLY         | ✅       | Ngày thống kê                 |
| view_count         | INTEGER          | ❌       | Số lượt xem                   |
| like_count         | INTEGER          | ❌       | Số lượt like                  |
| comment_count      | INTEGER          | ❌       | Số comment                    |
| share_count        | INTEGER          | ❌       | Số lượt share                 |
| watch_time_minutes | INTEGER          | ❌       | Tổng thời gian xem (phút)     |
| estimated_revenue  | FLOAT            | ❌       | Doanh thu ước tính            |
| created_at         | DATE             |          | Thời gian tạo                 |

---

## 5. channel_statistics
| Trường             | Kiểu dữ liệu      | Bắt buộc | Ý nghĩa                        |
|--------------------|------------------|----------|-------------------------------|
| id                 | UUID             | ✅       | Khóa chính                    |
| channel_db_id      | UUID             | ✅       | FK → youtube_channels.id      |
| date               | DATEONLY         | ✅       | Ngày thống kê                 |
| subscriber_count   | INTEGER          | ❌       | Số subscriber                 |
| view_count         | INTEGER          | ❌       | Tổng view                     |
| like_count         | INTEGER          | ❌       | Tổng like                     |
| comment_count      | INTEGER          | ❌       | Tổng comment                  |
| share_count        | INTEGER          | ❌       | Tổng share                    |
| watch_time_minutes | INTEGER          | ❌       | Tổng thời gian xem (phút)     |
| estimated_revenue  | FLOAT            | ❌       | Doanh thu ước tính            |
| created_at         | DATE             |          | Thời gian tạo                 |
| updated_at         | DATE             |          | Thời gian cập nhật            |

---

## 6. channel_violations
| Trường         | Kiểu dữ liệu         | Bắt buộc | Ý nghĩa                        |
|----------------|---------------------|----------|-------------------------------|
| id             | UUID                | ✅       | Khóa chính                    |
| channel_db_id  | UUID                | ✅       | FK → youtube_channels.id      |
| violation_type | ENUM(community, monetization) | ✅ | Loại vi phạm                  |
| title          | TEXT                | ❌       | Tiêu đề                       |
| description    | TEXT                | ❌       | Mô tả                         |
| status         | ENUM(active, resolved) | ❌    | Trạng thái (mặc định: active) |
| violation_date | DATE                | ❌       | Ngày vi phạm                   |
| resolved_date  | DATE                | ❌       | Ngày giải quyết                |
| created_at     | DATE                |          | Thời gian tạo                 |

---

## 7. google_access_tokens
| Trường         | Kiểu dữ liệu         | Bắt buộc | Ý nghĩa                        |
|----------------|---------------------|----------|-------------------------------|
| id             | UUID                | ✅       | Khóa chính                    |
| channel_db_id  | UUID                | ✅       | FK → youtube_channels.id      |
| access_token   | TEXT                | ✅       | Access token                  |
| refresh_token  | TEXT                | ❌       | Refresh token                 |
| scope          | TEXT                | ❌       | Phạm vi quyền                 |
| expires_at     | DATE                | ❌       | Hết hạn                       |
| is_active      | BOOLEAN             | ❌       | Còn hiệu lực                  |
| created_at     | DATE                |          | Thời gian tạo                 |

---

## 8. user_channel
| Trường         | Kiểu dữ liệu         | Bắt buộc | Ý nghĩa                        |
|----------------|---------------------|----------|-------------------------------|
| id             | UUID                | ✅       | Khóa chính                    |
| user_id        | UUID                | ✅       | FK → users.id                 |
| channel_db_id  | UUID                | ✅       | FK → youtube_channels.id      |
| is_owner       | BOOLEAN             | ❌       | Có phải chủ sở hữu            |
| is_active      | BOOLEAN             | ❌       | Đang hoạt động                |
| created_at     | DATE                |          | Thời gian tạo                 |

---

## 9. user_schedules
| Trường         | Kiểu dữ liệu         | Bắt buộc | Ý nghĩa                        |
|----------------|---------------------|----------|-------------------------------|
| id             | UUID                | ✅       | Khóa chính                    |
| user_id        | UUID                | ✅       | FK → users.id (unique)        |
| time_of_day    | TIME                | ✅       | Thời gian thực hiện           |
| is_active      | BOOLEAN             | ❌       | Đang hoạt động                |
| created_at     | DATE                |          | Thời gian tạo                 |