import { Router } from "express";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { logActivity } from "../../lib/activity-log.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { mediaFileSchema, mediaUploadSchema } from "../../validators.js";
import { createMedia, deleteMedia, getMedia, listMedia, updateMedia } from "./media.repository.js";

export const mediaRouter = Router();

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

mediaRouter.post("/", requireAuth, asyncHandler(async (req, res) => {
  const item = await createMedia(mediaFileSchema.parse(req.body));
  void logActivity({ req, action: "create", module: "media", targetId: item.id, description: item.fileName });
  res.status(201).json(item);
}));

mediaRouter.post("/upload", requireAuth, asyncHandler(async (req, res) => {
  const data = mediaUploadSchema.parse(req.body);
  const parsed = parseImageDataUrl(data.dataUrl);
  const safeFolder = sanitizePathSegment(data.folder || "general");
  const safeBaseName = sanitizeFileName(data.fileName);
  const fileName = `${Date.now()}-${safeBaseName.replace(/\.[^.]+$/, "")}.${parsed.extension}`;
  const relativeUrl = `/uploads/${safeFolder}/${fileName}`;
  const uploadDir = path.join(process.cwd(), "uploads", safeFolder);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), parsed.buffer);

  const item = await createMedia({
    fileName,
    fileUrl: relativeUrl,
    fileType: parsed.mimeType,
    fileSize: parsed.buffer.length,
    folder: safeFolder,
    altText: data.altText,
    altTextEn: data.altTextEn || data.altText,
  });
  void logActivity({ req, action: "upload", module: "media", targetId: item.id, description: item.fileName });
  res.status(201).json(item);
}));

mediaRouter.put("/:id", requireAuth, asyncHandler(async (req, res) => {
  const data = mediaFileSchema.partial().parse(req.body);
  const updated = await updateMedia(req.params["id"] as string, data);
  if (!updated) res.status(404).json({ error: "Not found" });
  else {
    void logActivity({ req, action: "update", module: "media", targetId: updated.id });
    res.json(updated);
  }
}));

mediaRouter.delete("/:id", requireAuth, asyncHandler(async (req, res) => {
  const id = req.params["id"] as string;
  const deleted = await deleteMedia(id);
  if (deleted) void logActivity({ req, action: "delete", module: "media", targetId: id });
  res.status(deleted ? 204 : 404).send();
}));

function parseImageDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw Object.assign(new Error("Chỉ hỗ trợ upload ảnh PNG, JPG, WEBP hoặc GIF."), { status: 400 });
  }

  const mimeType = match[1];
  const extension = mimeType === "image/jpeg" || mimeType === "image/jpg" ? "jpg" : mimeType.replace("image/", "");
  return { mimeType, extension, buffer: Buffer.from(match[2], "base64") };
}

function sanitizePathSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "general";
}

function sanitizeFileName(value: string) {
  return value.replace(/[/\\?%*:|"<>]/g, "-").replace(/\s+/g, "-") || "image";
}
