# Prompt triển khai FE News Editor

Sao chép nguyên prompt dưới đây cho agent làm frontend:

---

Hãy nâng cấp màn hình tạo/chỉnh sửa tin tức thành Rich Text Editor chuyên nghiệp bằng TipTap, tương thích với backend Hữu Thành hiện tại.

## Kết quả cần đạt

- Soạn nội dung tiếng Việt (`content`) và tiếng Anh (`contentEn`) bằng hai editor hoặc tab ngôn ngữ.
- Có toolbar giống trình soạn thảo văn bản: undo/redo, heading H1-H6, paragraph, bold, italic, underline, strike, text color, highlight, alignment, bullet list, ordered list, blockquote, link, image, table và Vimeo.
- Dữ liệu gửi backend phải là HTML bằng `editor.getHTML()`, không gửi TipTap JSON.
- Khi edit, khởi tạo editor từ HTML trả về bởi API.
- Có preview desktop/mobile và trạng thái loading/error rõ ràng.

## TipTap extensions

Dùng StarterKit cùng các extension phù hợp cho Underline, TextAlign, Link, Image, Table, TableRow, TableHeader, TableCell, Highlight, TextStyle và Color. Tạo custom node `Vimeo`.

## API

Base URL lấy từ biến môi trường hiện tại của dự án.

### Upload ảnh

Gửi `multipart/form-data` đến:

```http
POST /api/media/upload
Authorization: Bearer <accessToken>
```

FormData:

```ts
form.append("files", file);
form.append("folder", "news/inline");
form.append("altText", altText);
```

Sau khi thành công, chèn `response.items[0].fileUrl` vào Image node. Kiểm tra loại PNG/JPG/WEBP/GIF và tối đa 5 MB trước khi upload. Hiển thị progress hoặc loading và thông báo upload thất bại.

### Chèn Vimeo

Khi người dùng dán Vimeo URL, gọi:

```http
POST /api/media/vimeo/normalize
Authorization: Bearer <accessToken>
Content-Type: application/json

{ "url": "https://vimeo.com/123456789" }
```

Response gồm `videoId`, optional `hash`, và `playerUrl`. Chỉ tạo Vimeo node khi API trả về thành công.

Custom Vimeo node phải serialize thành:

```html
<figure class="news-video news-video--vimeo" data-provider="vimeo" data-video-id="123456789">
  <figcaption>Mô tả video</figcaption>
</figure>
```

Nếu response có `hash`, thêm `data-video-hash`. Node view trong editor được phép preview bằng iframe nhưng iframe không được serialize vào HTML gửi backend.

Iframe preview/render phải luôn dùng hostname cố định:

```ts
const playerUrl = new URL(`https://player.vimeo.com/video/${videoId}`);
if (hash) playerUrl.searchParams.set("h", hash);
```

Không sử dụng URL iframe tùy ý từ HTML.

## Tạo và cập nhật bài viết

Tạo mới:

```http
POST /api/news
```

Cập nhật:

```http
PUT /api/news/:id
```

Payload phải gửi đầy đủ:

```ts
{
  title,
  titleEn,
  slug,
  date,
  category,
  categoryEn,
  thumbnail,
  galleryImages,
  excerpt,
  excerptEn,
  content: viEditor.getHTML(),
  contentEn: enEditor.getHTML(),
}
```

Không gửi `id` khi POST. Khi PUT, ID nằm trong URL.

## Render trang chi tiết

Không chỉ dùng `dangerouslySetInnerHTML` cho toàn bộ content vì Vimeo cần React component.

- Parse HTML đã được backend sanitize.
- Thay mỗi `figure[data-provider="vimeo"]` bằng responsive Vimeo component tỷ lệ 16:9.
- Các node HTML còn lại render trong container `.prose` hoặc `.news-content`.
- Iframe dùng `loading="lazy"`, `allow="autoplay; fullscreen; picture-in-picture"`, `allowFullScreen` và title lấy từ caption.
- Style ảnh responsive, bảng có horizontal scroll trên mobile, heading có spacing rõ ràng và blockquote khác biệt.

## UX bắt buộc

- Confirm khi rời trang nếu có thay đổi chưa lưu.
- Disable nút submit trong lúc upload media hoặc lưu bài.
- Hiện validation cho trường bắt buộc.
- Có modal nhập URL/caption cho Link và Vimeo, modal alt text cho Image.
- Có nút xóa/chỉnh caption video và ảnh.
- Không cho paste raw iframe/script vào editor.

Đọc contract chi tiết trong `docs/NEWS_RICH_CONTENT_API.md` của backend. Giữ conventions, component library và data-fetching pattern đang có trong repository frontend. Sau khi hoàn thành, chạy lint, typecheck, tests và kiểm tra thủ công create → edit → preview → public detail.

---
