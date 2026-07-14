export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Huu Thanh CMS API",
    version: "0.1.0",
    description: "Backend API for Huu Thanh CMS content, admin auth, forms, settings, and media.",
  },
  servers: [
    {
      url: "/",
      description: "Current API host",
    },
  ],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "CMS" },
    { name: "News" },
    { name: "Projects" },
    { name: "Jobs" },
    { name: "Consultations" },
    { name: "Job Applications" },
    { name: "Settings" },
    { name: "Media" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@example.com" },
          password: { type: "string", format: "password", writeOnly: true, example: "your-password" },
        },
      },
      AuthTokens: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
        },
      },
      AdminUser: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          fullName: { type: "string", nullable: true },
          phone: { type: "string", nullable: true },
          role: { type: "string", enum: ["super_admin", "editor", "hr", "viewer"] },
          status: { type: "string" },
        },
      },
      News: {
        type: "object",
        required: ["id", "title", "titleEn", "slug", "date", "category", "categoryEn", "thumbnail"],
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          titleEn: { type: "string" },
          slug: { type: "string" },
          date: { type: "string", example: "2026-05-18" },
          category: { type: "string" },
          categoryEn: { type: "string" },
          thumbnail: { type: "string" },
          galleryImages: { type: "array", items: { type: "string" } },
          excerpt: { type: "string" },
          excerptEn: { type: "string" },
          content: {
            type: "string",
            format: "html",
            maxLength: 1000000,
            description: "Nội dung Rich Text HTML đã được backend sanitize. Hỗ trợ tiêu đề, định dạng chữ, danh sách, trích dẫn, liên kết, ảnh và bảng.",
            example: "<h2>Tiêu đề nội dung</h2><p>Đoạn văn có <strong>chữ đậm</strong>.</p>",
          },
          contentEn: {
            type: "string",
            format: "html",
            maxLength: 1000000,
            description: "English Rich Text HTML; sanitized by the backend.",
            example: "<h2>Article heading</h2><p>A paragraph with <strong>bold text</strong>.</p>",
          },
        },
      },
      NewsImage: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          newsId: { type: "string", format: "uuid" },
          url: { type: "string" },
          caption: { type: "string" },
          captionEn: { type: "string" },
          sortOrder: { type: "integer" },
        },
      },
      Project: {
        type: "object",
        required: ["id", "name", "nameEn", "location", "year", "category", "categoryEn", "image"],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          nameEn: { type: "string" },
          location: { type: "string" },
          year: { type: "integer", example: 2026 },
          category: { type: "string" },
          categoryEn: { type: "string" },
          image: { type: "string" },
          galleryImages: { type: "array", items: { type: "string" } },
          description: { type: "string" },
          descriptionEn: { type: "string" },
        },
      },
      ProjectImage: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          projectId: { type: "string", format: "uuid" },
          url: { type: "string" },
          caption: { type: "string" },
          captionEn: { type: "string" },
          sortOrder: { type: "integer" },
        },
      },
      Job: {
        type: "object",
        required: ["id", "title", "titleEn", "location", "type", "typeEn", "salary"],
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          titleEn: { type: "string" },
          location: { type: "string" },
          type: { type: "string" },
          typeEn: { type: "string" },
          salary: { type: "string" },
          description: { type: "string" },
          descriptionEn: { type: "string" },
          requirements: { type: "array", items: { type: "string" } },
          requirementsEn: { type: "array", items: { type: "string" } },
        },
      },
      CmsContent: {
        type: "object",
        properties: {
          news: { type: "array", items: { $ref: "#/components/schemas/News" } },
          projects: { type: "array", items: { $ref: "#/components/schemas/Project" } },
          jobs: { type: "array", items: { $ref: "#/components/schemas/Job" } },
        },
      },
      PaginatedNews: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/News" } },
          total: { type: "integer", example: 45 },
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          totalPages: { type: "integer", example: 3 },
          hasNextPage: { type: "boolean", example: true },
          hasPrevPage: { type: "boolean", example: false },
        },
      },
      PaginatedProjects: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Project" } },
          total: { type: "integer", example: 30 },
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          totalPages: { type: "integer", example: 2 },
          hasNextPage: { type: "boolean", example: true },
          hasPrevPage: { type: "boolean", example: false },
        },
      },
      PaginatedJobs: {
        type: "object",
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Job" } },
          total: { type: "integer", example: 10 },
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          totalPages: { type: "integer", example: 1 },
          hasNextPage: { type: "boolean", example: false },
          hasPrevPage: { type: "boolean", example: false },
        },
      },
      Consultation: {
        type: "object",
        required: ["name", "phone"],
        properties: {
          id: { type: "string", format: "uuid", readOnly: true },
          name: { type: "string" },
          phone: { type: "string" },
          email: { type: "string", format: "email" },
          service: { type: "string" },
          message: { type: "string" },
          status: { type: "string", enum: ["new", "read", "done"], readOnly: true },
        },
      },
      JobApplication: {
        type: "object",
        required: ["fullName", "phone"],
        properties: {
          id: { type: "string", format: "uuid", readOnly: true },
          jobId: { type: "string", format: "uuid", nullable: true },
          fullName: { type: "string" },
          phone: { type: "string" },
          email: { type: "string", format: "email" },
          positionApplied: { type: "string" },
          hasCv: { type: "boolean", readOnly: true },
          cvFileName: { type: "string", readOnly: true },
          cvContentType: { type: "string", readOnly: true },
          cvFileSize: { type: "integer", readOnly: true },
          message: { type: "string" },
          status: { type: "string", enum: ["new", "reviewing", "interviewed", "hired", "rejected"], readOnly: true },
        },
      },
      Setting: {
        type: "object",
        properties: {
          key: { type: "string" },
          value: { type: "string", nullable: true },
          valueEn: { type: "string", nullable: true },
          type: { type: "string", enum: ["text", "html", "json", "number", "boolean"] },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      MediaFile: {
        type: "object",
        required: ["fileName", "fileUrl"],
        properties: {
          id: { type: "string", format: "uuid", readOnly: true },
          fileName: { type: "string" },
          fileUrl: { type: "string", format: "uri" },
          fileType: { type: "string" },
          fileSize: { type: "integer" },
          width: { type: "integer" },
          height: { type: "integer" },
          folder: { type: "string" },
          altText: { type: "string" },
          altTextEn: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          200: {
            description: "API is healthy",
          },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login (access token valid for 8 hours by default)",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
        },
        responses: {
          200: { description: "Logged in" },
          401: { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: { refreshToken: { type: "string" } },
              },
            },
          },
        },
        responses: { 200: { description: "New tokens", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthTokens" } } } } },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout",
        requestBody: {
          content: {
            "application/json": {
              schema: { type: "object", properties: { refreshToken: { type: "string" } } },
            },
          },
        },
        responses: { 204: { description: "Logged out" } },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user payload",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Current auth payload" } },
      },
    },
    "/api/auth/users": {
      get: {
        tags: ["Auth"],
        summary: "List admin users",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Admin users", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/AdminUser" } } } } } },
      },
      post: {
        tags: ["Auth"],
        summary: "Create admin user",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/AdminUser" },
                  { type: "object", required: ["email", "password", "fullName"], properties: { password: { type: "string", minLength: 8 } } },
                ],
              },
            },
          },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/api/cms": {
      get: {
        tags: ["CMS"],
        summary: "Get all CMS content (read only)",
        responses: { 200: { description: "CMS content", content: { "application/json": { schema: { $ref: "#/components/schemas/CmsContent" } } } } },
      },
    },
    "/api/news": {
      get: {
        tags: ["News"],
        summary: "List news",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 }, description: "Số trang" },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, minimum: 1, maximum: 100 }, description: "Số bản ghi mỗi trang" },
          { name: "category", in: "query", schema: { type: "string" }, description: "Lọc theo danh mục (tiếng Việt hoặc tiếng Anh)" },
        ],
        responses: { 200: { description: "Danh sách tin tức (phân trang)", content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedNews" } } } } },
      },
      post: {
        tags: ["News"],
        summary: "Tạo tin tức mới",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/News",
              },
            },
          },
        },
        responses: { 201: { description: "Đã tạo", content: { "application/json": { schema: { $ref: "#/components/schemas/News" } } } } },
      },
    },
    "/api/news/{idOrSlug}": {
      get: {
        tags: ["News"],
        summary: "Get news by id or slug",
        parameters: [{ name: "idOrSlug", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "News item" }, 404: { description: "Not found" } },
      },
    },
    "/api/news/{id}": {
      put: {
        tags: ["News"],
        summary: "Cập nhật tin tức",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/News" },
            },
          },
        },
        responses: { 200: { description: "Đã cập nhật", content: { "application/json": { schema: { $ref: "#/components/schemas/News" } } } } },
      },
      delete: {
        tags: ["News"],
        summary: "Delete news",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 204: { description: "Deleted" }, 404: { description: "Not found" } },
      },
    },
    "/api/news/{id}/images": {
      get: {
        tags: ["News"],
        summary: "Lấy danh sách ảnh gallery của bài viết",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Danh sách ảnh", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/NewsImage" } } } } } },
      },
      post: {
        tags: ["News"],
        summary: "Thêm ảnh vào gallery (truyền URL)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["url"],
                properties: {
                  url: { type: "string" },
                  caption: { type: "string" },
                  captionEn: { type: "string" },
                  sortOrder: { type: "integer", default: 0 },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Đã thêm" } },
      },
    },
    "/api/news/{id}/images/upload": {
      post: {
        tags: ["News"],
        summary: "Upload nhiều ảnh gallery cho bài viết lên R2",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["files"],
                properties: {
                  files: { type: "array", items: { type: "string", format: "binary" }, description: "Anh gallery PNG, JPG, WEBP hoac GIF (toi da 10 file, 5MB/file; kiem tra chu ky file)" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Upload thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    uploaded: { type: "integer" },
                    failed: { type: "integer" },
                    items: { type: "array", items: { $ref: "#/components/schemas/NewsImage" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/news/{id}/images/reorder": {
      patch: {
        tags: ["News"],
        summary: "Sắp xếp lại thứ tự ảnh gallery",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["ids"], properties: { ids: { type: "array", items: { type: "string", format: "uuid" } } } } } },
        },
        responses: { 200: { description: "Đã sắp xếp lại" } },
      },
    },
    "/api/news/{id}/images/{imageId}": {
      put: {
        tags: ["News"],
        summary: "Cập nhật caption hoặc thứ tự ảnh",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "imageId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/NewsImage" } } } },
        responses: { 200: { description: "Đã cập nhật" }, 404: { description: "Not found" } },
      },
      delete: {
        tags: ["News"],
        summary: "Xóa ảnh gallery",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "imageId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: { 204: { description: "Đã xóa" } },
      },
    },
    "/api/projects": {
      get: {
        tags: ["Projects"],
        summary: "List projects",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 }, description: "Số trang" },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, minimum: 1, maximum: 100 }, description: "Số bản ghi mỗi trang" },
          { name: "category", in: "query", schema: { type: "string" }, description: "Lọc theo danh mục" },
          { name: "year", in: "query", schema: { type: "integer" }, description: "Lọc theo năm (VD: 2024)" },
        ],
        responses: { 200: { description: "Danh sách dự án (phân trang)", content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedProjects" } } } } },
      },
      post: {
        tags: ["Projects"],
        summary: "Tạo dự án mới",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Project" },
            },
          },
        },
        responses: { 201: { description: "Đã tạo", content: { "application/json": { schema: { $ref: "#/components/schemas/Project" } } } } },
      },
    },
    "/api/projects/{idOrSlug}": {
      get: {
        tags: ["Projects"],
        summary: "Get project by id or slug",
        parameters: [{ name: "idOrSlug", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Project" }, 404: { description: "Not found" } },
      },
    },
    "/api/projects/{id}": {
      put: {
        tags: ["Projects"],
        summary: "Cập nhật dự án",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Project" },
            },
          },
        },
        responses: { 200: { description: "Đã cập nhật", content: { "application/json": { schema: { $ref: "#/components/schemas/Project" } } } } },
      },
      delete: {
        tags: ["Projects"],
        summary: "Delete project",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 204: { description: "Deleted" } },
      },
    },
    "/api/projects/{id}/images/upload": {
      post: {
        tags: ["Projects"],
        summary: "Upload nhiều ảnh gallery cho dự án lên R2",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["files"],
                properties: {
                  files: { type: "array", items: { type: "string", format: "binary" }, description: "Anh gallery PNG, JPG, WEBP hoac GIF (toi da 10 file, 5MB/file; kiem tra chu ky file)" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Upload thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    uploaded: { type: "integer" },
                    failed: { type: "integer" },
                    items: { type: "array", items: { $ref: "#/components/schemas/ProjectImage" } },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/projects/{id}/images": {
      get: {
        tags: ["Projects"],
        summary: "List project images",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Images", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/ProjectImage" } } } } } },
      },
      post: {
        tags: ["Projects"],
        summary: "Add project image",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProjectImage" } } } },
        responses: { 201: { description: "Created" } },
      },
    },
    "/api/projects/{id}/images/reorder": {
      patch: {
        tags: ["Projects"],
        summary: "Reorder project images",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["ids"], properties: { ids: { type: "array", items: { type: "string", format: "uuid" } } } } } },
        },
        responses: { 200: { description: "Reordered" } },
      },
    },
    "/api/projects/{id}/images/{imageId}": {
      put: {
        tags: ["Projects"],
        summary: "Update project image",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "imageId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProjectImage" } } } },
        responses: { 200: { description: "Updated" } },
      },
      delete: {
        tags: ["Projects"],
        summary: "Delete project image",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "imageId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: { 204: { description: "Deleted" } },
      },
    },
    "/api/jobs": {
      get: {
        tags: ["Jobs"],
        summary: "List jobs",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1, minimum: 1 }, description: "Số trang" },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, minimum: 1, maximum: 100 }, description: "Số bản ghi mỗi trang" },
          { name: "type", in: "query", schema: { type: "string" }, description: "Lọc theo loại công việc (VD: Full-time)" },
          { name: "location", in: "query", schema: { type: "string" }, description: "Lọc theo địa điểm (tìm kiếm gần đúng)" },
        ],
        responses: { 200: { description: "Danh sách việc làm (phân trang)", content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedJobs" } } } } },
      },
      post: {
        tags: ["Jobs"],
        summary: "Tạo việc làm mới (server tự sinh UUID)",
        description: "Requires recruitment:write permission (hr or super_admin).",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Job" } } } },
        responses: { 201: { description: "Đã tạo" } },
      },
    },
    "/api/jobs/{idOrSlug}": {
      get: {
        tags: ["Jobs"],
        summary: "Get job by id or slug",
        parameters: [{ name: "idOrSlug", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Job" }, 404: { description: "Not found" } },
      },
    },
    "/api/jobs/{id}": {
      put: {
        tags: ["Jobs"],
        summary: "Update job",
        description: "Requires recruitment:write permission (hr or super_admin).",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Job" } } } },
        responses: { 200: { description: "Updated" } },
      },
      delete: {
        tags: ["Jobs"],
        summary: "Delete job",
        description: "Requires recruitment:write permission (hr or super_admin).",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 204: { description: "Deleted" } },
      },
    },
    "/api/consultations": {
      get: {
        tags: ["Consultations"],
        summary: "List consultations",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "status", in: "query", schema: { type: "string", enum: ["new", "read", "done"] } }],
        responses: { 200: { description: "Consultations" } },
      },
      post: {
        tags: ["Consultations"],
        summary: "Submit consultation request",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Consultation" } } } },
        responses: { 201: { description: "Submitted" } },
      },
    },
    "/api/consultations/{id}": {
      patch: {
        tags: ["Consultations"],
        summary: "Update consultation status",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", enum: ["new", "read", "done"] }, note: { type: "string" } } } } } },
        responses: { 200: { description: "Updated" } },
      },
      delete: {
        tags: ["Consultations"],
        summary: "Delete consultation",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 204: { description: "Deleted" } },
      },
    },
    "/api/job-applications": {
      get: {
        tags: ["Job Applications"],
        summary: "List job applications",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "jobId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
        ],
        responses: { 200: { description: "Applications" } },
      },
      post: {
        tags: ["Job Applications"],
        summary: "Submit job application",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["fullName", "phone"],
                properties: {
                  jobId: { type: "string", format: "uuid" },
                  fullName: { type: "string" },
                  phone: { type: "string" },
                  email: { type: "string", format: "email" },
                  positionApplied: { type: "string" },
                  message: { type: "string" },
                  cvFile: { type: "string", format: "binary", description: "PDF only, maximum 5MB" },
                },
              },
            },
          },
        },
        responses: { 201: { description: "Submitted" } },
      },
    },
    "/api/job-applications/{id}": {
      get: {
        tags: ["Job Applications"],
        summary: "Get job application",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Application" } },
      },
      patch: {
        tags: ["Job Applications"],
        summary: "Update job application status",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", enum: ["new", "reviewing", "interviewed", "hired", "rejected"] }, note: { type: "string" } } } } } },
        responses: { 200: { description: "Updated" } },
      },
      delete: {
        tags: ["Job Applications"],
        summary: "Delete job application",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 204: { description: "Deleted" } },
      },
    },
    "/api/job-applications/{id}/cv": {
      get: {
        tags: ["Job Applications"],
        summary: "Create a short-lived signed CV URL",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          { name: "download", in: "query", schema: { type: "string", enum: ["0", "1"], default: "0" } },
        ],
        responses: {
          200: { description: "Signed URL valid for 300 seconds" },
          404: { description: "CV not found" },
        },
      },
    },
    "/api/settings": {
      get: {
        tags: ["Settings"],
        summary: "Get settings",
        parameters: [
          { name: "prefix", in: "query", schema: { type: "string" } },
          { name: "full", in: "query", schema: { type: "string", enum: ["true", "false", "1", "0"] } },
        ],
        responses: { 200: { description: "Settings" } },
      },
    },
    "/api/settings/bulk": {
      post: {
        tags: ["Settings"],
        summary: "Bulk save settings",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Setting" } } } } },
        responses: { 200: { description: "Saved" } },
      },
    },
    "/api/settings/{key}": {
      get: {
        tags: ["Settings"],
        summary: "Get setting",
        parameters: [{ name: "key", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Setting" }, 404: { description: "Not found" } },
      },
      put: {
        tags: ["Settings"],
        summary: "Upsert setting",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "key", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Setting" } } } },
        responses: { 200: { description: "Saved" } },
      },
      delete: {
        tags: ["Settings"],
        summary: "Delete setting",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "key", in: "path", required: true, schema: { type: "string" } }],
        responses: { 204: { description: "Deleted" } },
      },
    },
    "/api/media/upload": {
      post: {
        tags: ["Media"],
        summary: "Upload nhiều ảnh lên Cloudflare R2",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["files"],
                properties: {
                  files: {
                    type: "array",
                    items: { type: "string", format: "binary" },
                    description: "Danh sách file ảnh PNG, JPG, WEBP hoặc GIF (tối đa 10 file, mỗi file tối đa 5MB; kiểm tra chữ ký file)",
                  },
                  folder: {
                    type: "string",
                    default: "general",
                    description: "Thư mục lưu trữ trên R2 (VD: news, projects, general)",
                  },
                  altText: { type: "string", description: "Alt text tiếng Việt" },
                  altTextEn: { type: "string", description: "Alt text tiếng Anh" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Upload thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    uploaded: { type: "integer", example: 3, description: "Số file upload thành công" },
                    failed: { type: "integer", example: 0, description: "Số file thất bại" },
                    items: { type: "array", items: { $ref: "#/components/schemas/MediaFile" } },
                  },
                },
              },
            },
          },
          400: { description: "Không có file nào được gửi lên" },
          401: { description: "Chưa đăng nhập" },
        },
      },
    },
    "/api/media": {
      get: {
        tags: ["Media"],
        summary: "List media files",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "folder", in: "query", schema: { type: "string" } },
          { name: "fileType", in: "query", schema: { type: "string" } },
        ],
        responses: { 200: { description: "Media files" } },
      },
      post: {
        tags: ["Media"],
        summary: "Create media record",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/MediaFile" } } } },
        responses: { 201: { description: "Created" } },
      },
    },
    "/api/media/{id}": {
      get: {
        tags: ["Media"],
        summary: "Get media file",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Media file" } },
      },
      put: {
        tags: ["Media"],
        summary: "Update media metadata",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/MediaFile" } } } },
        responses: { 200: { description: "Updated" } },
      },
      delete: {
        tags: ["Media"],
        summary: "Delete media record",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 204: { description: "Deleted" } },
      },
    },
  },
} as const;
