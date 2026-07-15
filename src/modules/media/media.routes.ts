import { Router } from "express";
import { z } from "zod";
import { logActivity } from "../../lib/activity-log.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { imageUpload, MAX_IMAGE_FILES, sanitizeStorageFolder, verifyImageUpload } from "../../lib/image-upload.js";
import { uploadToR2 } from "../../lib/r2.js";
import { normalizeVimeoUrl } from "../../lib/vimeo.js";
import { requireAuth, requirePermission } from "../../middlewares/auth.middleware.js";
import { mediaFileSchema } from "../../validators.js";
import { createMedia, deleteMedia, getMedia, listMedia, updateMedia } from "./media.repository.js";

export const mediaRouter = Router();

mediaRouter.post(
  "/vimeo/normalize",
  requireAuth,
  requirePermission("content:write"),
  asyncHandler(async (req, res) => {
    const { url } = z.object({ url: z.string().url().max(2048) }).parse(req.body);
    res.json(normalizeVimeoUrl(url));
  })
);

// POST /api/media/upload — upload nhiều ảnh lên R2 song song
mediaRouter.post(
  "/upload",
  requireAuth,
  requirePermission("content:write"),
  imageUpload.array("files", MAX_IMAGE_FILES),
  asyncHandler(async (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: "Không có file nào được gửi lên" });
      return;
    }

    const folder = sanitizeStorageFolder(typeof req.body["folder"] === "string" ? req.body["folder"] : "general");
    const altText = typeof req.body["altText"] === "string" ? req.body["altText"] : "";
    const altTextEn = typeof req.body["altTextEn"] === "string" ? req.body["altTextEn"] : "";

    const verifiedFiles = files.map(verifyImageUpload);
    const uploadResults = await Promise.allSettled(
      verifiedFiles.map((file) => uploadToR2(file.buffer, file.fileName, file.mimeType, folder))
    );

    // Lưu metadata vào DB cho những file upload thành công, cũng song song
    const saveResults = await Promise.allSettled(
      uploadResults.map((result, i) => {
        if (result.status === "rejected") return Promise.reject(result.reason);
        const { url, fileName, fileType, fileSize } = result.value;
        return createMedia(
          mediaFileSchema.parse({ fileName, fileUrl: url, fileType, fileSize, folder, altText, altTextEn })
        );
      })
    );

    const succeeded = saveResults
      .map((r, i) => (r.status === "fulfilled" ? r.value : null))
      .filter(Boolean);

    const failed = saveResults.filter((r) => r.status === "rejected").length;

    if (succeeded.length > 0) {
      void logActivity({
        req,
        action: "create",
        module: "media",
        targetId: succeeded[0]!.id,
        description: `Upload ${succeeded.length} file(s) lên R2`,
      });
    }

    res.status(201).json({
      uploaded: succeeded.length,
      failed,
      items: succeeded,
    });
  })
);

// Tất cả media routes đều yêu cầu đăng nhập
mediaRouter.get("/", requireAuth, asyncHandler(async (req, res) => {
  const { folder, fileType } = z.object({
    folder: z.string().optional(),
    fileType: z.string().optional(),
  }).parse(req.query);
  res.json(await listMedia({ folder, fileType }));
}));

mediaRouter.get("/:id", requireAuth, asyncHandler(async (req, res) => {
  const item = await getMedia(req.params["id"] as string);
  if (!item) res.status(404).json({ error: "Not found" });
  else res.json(item);
}));

mediaRouter.post("/", requireAuth, requirePermission("content:write"), asyncHandler(async (req, res) => {
  const item = await createMedia(mediaFileSchema.parse(req.body));
  void logActivity({ req, action: "create", module: "media", targetId: item.id, description: item.fileName });
  res.status(201).json(item);
}));

mediaRouter.put("/:id", requireAuth, requirePermission("content:write"), asyncHandler(async (req, res) => {
  const data = mediaFileSchema.partial().parse(req.body);
  const updated = await updateMedia(req.params["id"] as string, data);
  if (!updated) res.status(404).json({ error: "Not found" });
  else {
    void logActivity({ req, action: "update", module: "media", targetId: updated.id });
    res.json(updated);
  }
}));

mediaRouter.delete("/:id", requireAuth, requirePermission("content:write"), asyncHandler(async (req, res) => {
  const id = req.params["id"] as string;
  const deleted = await deleteMedia(id);
  if (deleted) void logActivity({ req, action: "delete", module: "media", targetId: id });
  res.status(deleted ? 204 : 404).send();
}));
