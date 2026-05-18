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
POST   /api/cms
DELETE /api/cms

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

`POST /api/cms` nhận nguyên object:

```json
{
  "news": [],
  "projects": [],
  "jobs": []
}
```

Shape này giữ tương thích với frontend hiện tại.

## Kết nối frontend

Trong repo frontend, thêm biến môi trường:

```env
NEXT_PUBLIC_CMS_API_URL=http://localhost:4000
```

Sau đó frontend có thể gọi:

```txt
GET http://localhost:4000/api/cms
POST http://localhost:4000/api/cms
DELETE http://localhost:4000/api/cms
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
