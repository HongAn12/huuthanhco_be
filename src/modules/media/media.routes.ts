import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { mediaFileSchema } from "../../validators.js";
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
  res.status(201).json(await createMedia(mediaFileSchema.parse(req.body)));
}));

mediaRouter.put("/:id", requireAuth, asyncHandler(async (req, res) => {
  const data = mediaFileSchema.partial().parse(req.body);
  const updated = await updateMedia(req.params["id"] as string, data);
  if (!updated) res.status(404).json({ error: "Not found" });
  else res.json(updated);
}));

mediaRouter.delete("/:id", requireAuth, asyncHandler(async (req, res) => {
  const deleted = await deleteMedia(req.params["id"] as string);
  res.status(deleted ? 204 : 404).send();
}));
