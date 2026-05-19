import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { logActivity } from "../../lib/activity-log.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { newsSchema } from "../../validators.js";
import { deleteNews, getNews, listNews, upsertNews } from "./news.repository.js";

export const newsRouter = Router();

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
