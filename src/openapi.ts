export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Huu Thanh CMS API",
    version: "1.0.0",
    description: "API quản lý nội dung CMS cho website Công ty Cổ phần Xây dựng Hữu Thành.",
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "System", description: "Kiểm tra trạng thái API" },
    { name: "CMS", description: "Đồng bộ toàn bộ nội dung CMS" },
    { name: "News", description: "Quản lý tin tức" },
    { name: "Projects", description: "Quản lý dự án" },
    { name: "Jobs", description: "Quản lý tuyển dụng" },
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["System"],
        summary: "Kiểm tra API",
        responses: {
          "200": {
            description: "API đang hoạt động",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
    "/api/cms": {
      get: {
        tags: ["CMS"],
        summary: "Lấy toàn bộ nội dung CMS",
        responses: {
          "200": {
            description: "Danh sách tin tức, dự án và tuyển dụng",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CmsContent" },
              },
            },
          },
        },
      },
      post: {
        tags: ["CMS"],
        summary: "Thay thế toàn bộ nội dung CMS",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CmsContent" },
            },
          },
        },
        responses: {
          "200": {
            description: "Nội dung CMS sau khi lưu",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CmsContent" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
      delete: {
        tags: ["CMS"],
        summary: "Xóa toàn bộ nội dung CMS",
        responses: {
          "200": {
            description: "CMS rỗng sau khi xóa",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CmsContent" },
              },
            },
          },
        },
      },
    },
    "/api/news": {
      get: {
        tags: ["News"],
        summary: "Danh sách tin tức",
        responses: {
          "200": {
            description: "Danh sách tin tức",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/NewsItem" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["News"],
        summary: "Tạo hoặc cập nhật tin tức",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NewsItem" },
            },
          },
        },
        responses: {
          "201": {
            description: "Tin tức đã lưu",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NewsItem" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/api/news/{id}": {
      put: {
        tags: ["News"],
        summary: "Cập nhật tin tức theo ID",
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NewsItem" },
            },
          },
        },
        responses: {
          "200": {
            description: "Tin tức đã cập nhật",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/NewsItem" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
      delete: {
        tags: ["News"],
        summary: "Xóa tin tức theo ID",
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          "204": { description: "Đã xóa" },
          "404": { description: "Không tìm thấy" },
        },
      },
    },
    "/api/projects": {
      get: {
        tags: ["Projects"],
        summary: "Danh sách dự án",
        responses: {
          "200": {
            description: "Danh sách dự án",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Project" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Projects"],
        summary: "Tạo hoặc cập nhật dự án",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Project" },
            },
          },
        },
        responses: {
          "201": {
            description: "Dự án đã lưu",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Project" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/api/projects/{id}": {
      put: {
        tags: ["Projects"],
        summary: "Cập nhật dự án theo ID",
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Project" },
            },
          },
        },
        responses: {
          "200": {
            description: "Dự án đã cập nhật",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Project" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
      delete: {
        tags: ["Projects"],
        summary: "Xóa dự án theo ID",
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          "204": { description: "Đã xóa" },
          "404": { description: "Không tìm thấy" },
        },
      },
    },
    "/api/jobs": {
      get: {
        tags: ["Jobs"],
        summary: "Danh sách tuyển dụng",
        responses: {
          "200": {
            description: "Danh sách tuyển dụng",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Job" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Jobs"],
        summary: "Tạo hoặc cập nhật tuyển dụng",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Job" },
            },
          },
        },
        responses: {
          "201": {
            description: "Tin tuyển dụng đã lưu",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Job" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/api/jobs/{id}": {
      put: {
        tags: ["Jobs"],
        summary: "Cập nhật tuyển dụng theo ID",
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Job" },
            },
          },
        },
        responses: {
          "200": {
            description: "Tin tuyển dụng đã cập nhật",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Job" },
              },
            },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
      delete: {
        tags: ["Jobs"],
        summary: "Xóa tuyển dụng theo ID",
        parameters: [{ $ref: "#/components/parameters/IdParam" }],
        responses: {
          "204": { description: "Đã xóa" },
          "404": { description: "Không tìm thấy" },
        },
      },
    },
  },
  components: {
    parameters: {
      IdParam: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string" },
        example: "11111111-1111-4111-8111-111111111111",
      },
    },
    responses: {
      ValidationError: {
        description: "Dữ liệu gửi lên không hợp lệ",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
          },
        },
      },
    },
    schemas: {
      HealthResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: true },
          service: { type: "string", example: "huuthanhco-api" },
        },
        required: ["ok", "service"],
      },
      CmsContent: {
        type: "object",
        properties: {
          news: {
            type: "array",
            items: { $ref: "#/components/schemas/NewsItem" },
          },
          projects: {
            type: "array",
            items: { $ref: "#/components/schemas/Project" },
          },
          jobs: {
            type: "array",
            items: { $ref: "#/components/schemas/Job" },
          },
        },
        required: ["news", "projects", "jobs"],
      },
      NewsItem: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", example: "11111111-1111-4111-8111-111111111111" },
          title: { type: "string", example: "Hữu Thành cập nhật năng lực thi công" },
          titleEn: { type: "string", example: "Huu Thanh updates construction capabilities" },
          slug: { type: "string", example: "huu-thanh-cap-nhat-nang-luc-thi-cong" },
          date: { type: "string", format: "date", example: "2026-05-18" },
          category: { type: "string", example: "Tin công ty" },
          categoryEn: { type: "string", example: "Company News" },
          thumbnail: { type: "string", example: "/uploads/news/example.webp" },
          excerpt: { type: "string", example: "Mô tả ngắn tin tức." },
          excerptEn: { type: "string", example: "Short news excerpt." },
          content: { type: "string", example: "Nội dung chi tiết tin tức." },
          contentEn: { type: "string", example: "Detailed news content." },
        },
        required: ["id", "title", "titleEn", "slug", "date", "category", "categoryEn", "thumbnail", "excerpt", "excerptEn", "content", "contentEn"],
      },
      Project: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", example: "22222222-2222-4222-8222-222222222222" },
          name: { type: "string", example: "Bến số 3 Dung Quất" },
          nameEn: { type: "string", example: "Dung Quat Berth No. 3" },
          location: { type: "string", example: "Quảng Ngãi" },
          year: { type: "integer", example: 2024 },
          category: { type: "string", example: "Cảng & cầu cảng" },
          categoryEn: { type: "string", example: "Ports & Jetties" },
          image: { type: "string", example: "/uploads/projects/example.webp" },
          description: { type: "string", example: "Mô tả dự án." },
          descriptionEn: { type: "string", example: "Project description." },
        },
        required: ["id", "name", "nameEn", "location", "year", "category", "categoryEn", "image", "description", "descriptionEn"],
      },
      Job: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", example: "33333333-3333-4333-8333-333333333333" },
          title: { type: "string", example: "Kỹ sư xây dựng thủy lợi" },
          titleEn: { type: "string", example: "Hydraulic Construction Engineer" },
          location: { type: "string", example: "TP. Hồ Chí Minh / Công trình" },
          type: { type: "string", example: "Toàn thời gian" },
          typeEn: { type: "string", example: "Full-time" },
          salary: { type: "string", example: "Thỏa thuận" },
          description: { type: "string", example: "Mô tả công việc." },
          descriptionEn: { type: "string", example: "Job description." },
          requirements: {
            type: "array",
            items: { type: "string" },
            example: ["Tốt nghiệp chuyên ngành liên quan"],
          },
          requirementsEn: {
            type: "array",
            items: { type: "string" },
            example: ["Degree in related field"],
          },
        },
        required: ["id", "title", "titleEn", "location", "type", "typeEn", "salary", "description", "descriptionEn", "requirements", "requirementsEn"],
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: { type: "string", example: "Validation failed" },
          details: { type: "object" },
        },
        required: ["error"],
      },
    },
  },
} as const;
