# News Rich Content API

## Mục tiêu

Bài viết hỗ trợ nội dung HTML từ Rich Text Editor, ảnh lưu trên Cloudflare R2 và video phát bằng Vimeo. Backend không lưu iframe tùy ý và không nhận file video MP4.

## Định dạng nội dung

Hai trường `content` và `contentEn` là HTML string, tối đa 1.000.000 ký tự. Backend sanitize trước khi lưu.

Các nhóm nội dung chính được hỗ trợ:

- heading, paragraph, bold, italic, underline, strike, highlight;
- bullet list, ordered list, blockquote, code, table;
- link và ảnh dùng URL HTTP/HTTPS;
- Vimeo node dùng `figure[data-provider="vimeo"]`.

Không gửi iframe trong payload. Iframe, script, event handler và URL `javascript:` sẽ bị loại bỏ.

## Xác thực Vimeo URL

```http
POST /api/media/vimeo/normalize
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Request:

```json
{
  "url": "https://vimeo.com/123456789"
}
```

Response video public:

```json
{
  "provider": "vimeo",
  "videoId": "123456789",
  "playerUrl": "https://player.vimeo.com/video/123456789"
}
```

Response video unlisted:

```json
{
  "provider": "vimeo",
  "videoId": "123456789",
  "hash": "abcDEF12",
  "playerUrl": "https://player.vimeo.com/video/123456789?h=abcDEF12"
}
```

Các URL được chấp nhận:

```text
https://vimeo.com/123456789
https://vimeo.com/123456789/abcDEF12
https://player.vimeo.com/video/123456789?h=abcDEF12
```

Ràng buộc validation:

- chỉ nhận HTTPS trên `vimeo.com`, `www.vimeo.com` hoặc `player.vimeo.com`;
- `videoId` gồm 6–12 chữ số;
- hash gồm 6–64 ký tự chữ, số, `_` hoặc `-`;
- backend tự tạo `playerUrl`, không nhận iframe/player hostname tùy ý từ client.

## Vimeo node trong content

Frontend lưu node sau vào HTML:

```html
<figure
  class="news-video news-video--vimeo"
  data-provider="vimeo"
  data-video-id="123456789"
>
  <figcaption>Mô tả video</figcaption>
</figure>
```

Với video unlisted, bổ sung hash:

```html
<figure
  class="news-video news-video--vimeo"
  data-provider="vimeo"
  data-video-id="123456789"
  data-video-hash="abcDEF12"
>
  <figcaption>Mô tả video</figcaption>
</figure>
```

Backend sẽ chuẩn hóa class và chỉ giữ ID/hash hợp lệ.

## Upload ảnh lên R2

```http
POST /api/media/upload
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

Form fields:

- `files`: tối đa 10 ảnh PNG/JPG/WEBP/GIF, mỗi ảnh tối đa 5 MB;
- `folder`: nên dùng `news/inline`;
- `altText`, `altTextEn`: mô tả ảnh.

Response:

```json
{
  "uploaded": 1,
  "failed": 0,
  "items": [
    {
      "id": "uuid",
      "fileName": "image.jpg",
      "fileUrl": "https://media.example.com/news/inline/uuid.jpg",
      "fileType": "image/jpeg",
      "fileSize": 123456,
      "folder": "news/inline"
    }
  ]
}
```

Frontend chèn `items[0].fileUrl` vào TipTap Image node.

## Tạo bài viết

```http
POST /api/news
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "title": "Tin tức mới",
  "titleEn": "Latest news",
  "slug": "tin-tuc-moi",
  "date": "2026-07-15",
  "category": "Công ty",
  "categoryEn": "Company",
  "thumbnail": "https://media.example.com/news/thumbnail.jpg",
  "galleryImages": [],
  "excerpt": "Mô tả ngắn",
  "excerptEn": "Short description",
  "content": "<h2>Tiêu đề</h2><p>Nội dung...</p><figure data-provider=\"vimeo\" data-video-id=\"123456789\"><figcaption>Video</figcaption></figure>",
  "contentEn": "<h2>Heading</h2><p>Content...</p>"
}
```

`id` do backend tự sinh khi tạo mới.

## Cập nhật và đọc bài viết

```http
PUT /api/news/:id
GET /api/news/:idOrSlug
```

`PUT` hiện là cập nhật toàn bộ: frontend phải gửi đầy đủ các trường bắt buộc của bài viết.

## Render Vimeo an toàn

Frontend parse `figure[data-provider="vimeo"]`, lấy `data-video-id` và `data-video-hash`, rồi tự render iframe:

```text
https://player.vimeo.com/video/{videoId}
https://player.vimeo.com/video/{videoId}?h={hash}
```

Chỉ tạo iframe từ node đã qua backend và luôn cố định hostname `player.vimeo.com`; không render iframe lấy trực tiếp từ HTML người dùng.

## Vimeo settings

Trong Vimeo, bật quyền embed và allow domain production/staging của website. Video private không cho embed sẽ không phát dù URL có ID hợp lệ.
