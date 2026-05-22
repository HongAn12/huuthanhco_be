import { randomUUID } from "node:crypto";
import multer from "multer";
import { Router } from "express";
import { z } from "zod";
import { logActivity } from "../../lib/activity-log.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { uploadToR2 } from "../../lib/r2.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { newsImageSchema, newsSchema } from "../../validators.js";
import {
  addNewsImage,
  bulkAddNewsImages,
  deleteNewsImage,
  listNewsImages,
  reorderNewsImages,
  updateNewsImage,
} from "./news-images.repository.js";
import { deleteNews, getNews, listNews, upsertNews } from "./news.repository.js";

export const newsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
});

// Public
newsRouter.get("/", asyncHandler(async (req, res) => {
  const params = listQuerySchema.parse(req.query);
  res.json(await listNews(params));
}));

newsRouter.get("/:idOrSlug", asyncHandler(async (req, res) => {
  const item = await getNews(req.params["idOrSlug"] as string);
  if (!item) res.status(404).json({ error: "Not found" });
  else res.json(item);
}));

// Admin
newsRouter.post("/", requireAuth, asyncHandler(async (req, res) => {
  const item = await upsertNews(newsSchema.parse({ ...req.body, id: randomUUID() }));
  void logActivity({ req, action: "create", module: "news", targetId: item.id, description: item.title });
  res.status(201).json(item);
}));

newsRouter.put("/:id", requireAuth, asyncHandler(async (req, res) => {
  const item = await upsertNews(newsSchema.parse({ ...req.body, id: req.params["id"] }));
  void logActivity({ req, action: "update", module: "news", targetId: item.id, description: item.title });
  res.json(item);
}));

newsRouter.delete("/:id", requireAuth, asyncHandler(async (req, res) => {
  const id = req.params["id"] as string;
  const deleted = await deleteNews(id);
  if (deleted) void logActivity({ req, action: "delete", module: "news", targetId: id });
  res.status(deleted ? 204 : 404).send();
}));

// --- Hình ảnh bài viết (nested: /news/:id/images) ---

newsRouter.get("/:id/images", asyncHandler(async (req, res) => {
  res.json(await listNewsImages(req.params["id"] as string));
}));

newsRouter.post("/:id/images", requireAuth, asyncHandler(async (req, res) => {
  const newsId = req.params["id"] as string;
  const data = newsImageSchema.parse(req.body);
  const image = await addNewsImage(newsId, data);
  void logActivity({ req, action: "create", module: "news-images", targetId: newsId });
  res.status(201).json(image);
}));

// Reorder đặt trước /:imageId để không bị match nhầm
newsRouter.patch("/:id/images/reorder", requireAuth, asyncHandler(async (req, res) => {
  const newsId = req.params["id"] as string;
  const { ids } = z.object({ ids: z.array(z.string().uuid()) }).parse(req.body);
  const result = await reorderNewsImages(newsId, ids);
  void logActivity({ req, action: "reorder", module: "news-images", targetId: newsId });
  res.json(result);
}));

// Upload nhiều ảnh trực tiếp vào news_images (đặt trước /:imageId để không bị match nhầm)
newsRouter.post(
  "/:id/images/upload",
  requireAuth,
  upload.array("files", 20),
  asyncHandler(async (req, res) => {
    const newsId = req.params["id"] as string;
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: "Không có file nào được gửi lên" });
      return;
    }

    const uploadResults = await Promise.allSettled(
      files.map((file) => uploadToR2(file.buffer, file.originalname, file.mimetype, "news"))
    );

    const succeeded = uploadResults
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof uploadToR2>>> => r.status === "fulfilled")
      .map((r) => r.value.url);

    const failed = uploadResults.filter((r) => r.status === "rejected").length;

    const images = await bulkAddNewsImages(newsId, succeeded);
    if (images.length > 0) {
      void logActivity({ req, action: "create", module: "news-images", targetId: newsId, description: `Upload ${images.length} ảnh` });
    }

    res.status(201).json({ uploaded: images.length, failed, items: images });
  })
);

newsRouter.put("/:id/images/:imageId", requireAuth, asyncHandler(async (req, res) => {
  const imageId = req.params["imageId"] as string;
  const data = newsImageSchema.partial().parse(req.body);
  const updated = await updateNewsImage(imageId, data);
  if (!updated) res.status(404).json({ error: "Not found" });
  else {
    void logActivity({ req, action: "update", module: "news-images", targetId: imageId });
    res.json(updated);
  }
}));

newsRouter.delete("/:id/images/:imageId", requireAuth, asyncHandler(async (req, res) => {
  const imageId = req.params["imageId"] as string;
  const deleted = await deleteNewsImage(imageId);
  if (deleted) void logActivity({ req, action: "delete", module: "news-images", targetId: imageId });
  res.status(deleted ? 204 : 404).send();
}));
