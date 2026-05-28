# Huu Thanh CMS API

Backend API riêng cho website Hữu Thành. API dùng Node.js, Express và PostgreSQL/Neon để lưu nội dung CMS: tin tức, dự án và tuyển dụng.

## Chạy local

```bash
cp .env.example .env
npm install
docker compose up -d
npm run db:init
npm run dev
```

API chạy mặc định ở:

```txt
http://localhost:4000
```

Swagger UI:

```txt
http://localhost:4000/api-docs
```

OpenAPI JSON:

```txt
http://localhost:4000/openapi.json
```

## Endpoints chính

```txt
GET    /api/health
GET    /api/cms

GET    /api/news
POST   /api/news
PUT    /api/news/:id
DELETE /api/news/:id

GET    /api/projects
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id

GET    /api/jobs
POST   /api/jobs
PUT    /api/jobs/:id
DELETE /api/jobs/:id
```

`GET /api/cms` chỉ dùng để đọc dữ liệu tổng hợp. API không cung cấp thao tác
replace-all hoặc delete-all; nội dung được cập nhật qua endpoint riêng theo
từng bản ghi.

## Phân quyền quản trị

| Permission | Vai trò được phép | Phạm vi |
| --- | --- | --- |
| `content:write` | `editor`, `super_admin` | Tin tức, dự án, media và settings nội dung |
| `recruitment:write` | `hr`, `super_admin` | Tin tuyển dụng, trạng thái hồ sơ và liên hệ |
| `records:read` | `viewer`, `hr`, `super_admin` | Xem hồ sơ ứng tuyển và liên hệ |
| `system:admin` | `super_admin` | Tài khoản quản trị và thao tác xóa nhạy cảm |

`editor` không được tạo, sửa hoặc xóa tin tuyển dụng. `POST` và `DELETE`
trên `/api/cms` đã bị loại khỏi production để không có đường ghi/xóa toàn bộ
`news`, `projects` hoặc `jobs`.

## Kết nối frontend

Trong repo frontend, thêm biến môi trường:

```env
NEXT_PUBLIC_CMS_API_URL=http://localhost:4000
```

Sau đó frontend có thể gọi:

```txt
GET http://localhost:4000/api/cms
```

Khi deploy production:

```env
# Frontend Vercel
NEXT_PUBLIC_CMS_API_URL=https://huuthanhco.onrender.com

# Backend Render
CORS_ORIGIN=https://huuthanhco.vercel.app
```

## Kết nối Neon PostgreSQL

Lấy connection string từ Neon rồi đặt vào `.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
```

Sau đó chạy:

```bash
npm run db:init
npm run dev
```
