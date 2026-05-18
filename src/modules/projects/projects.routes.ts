import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { projectImageSchema, projectSchema } from "../../validators.js";
import {
  addProjectImage,
  deleteProjectImage,
  listProjectImages,
  reorderProjectImages,
  updateProjectImage,
} from "./project-images.repository.js";
import { deleteProject, getProject, listProjects, upsertProject } from "./projects.repository.js";

export const projectsRouter = Router();

// --- Dự án ---

// Public
projectsRouter.get("/", asyncHandler(async (_req, res) => {
  res.json(await listProjects());
}));

projectsRouter.get("/:idOrSlug", asyncHandler(async (req, res) => {
  const item = await getProject(req.params["idOrSlug"] as string);
  if (!item) res.status(404).json({ error: "Not found" });
  else res.json(item);
}));

// Admin
projectsRouter.post("/", requireAuth, asyncHandler(async (req, res) => {
  res.status(201).json(await upsertProject(projectSchema.parse(req.body)));
}));

projectsRouter.put("/:id", requireAuth, asyncHandler(async (req, res) => {
  res.json(await upsertProject(projectSchema.parse({ ...req.body, id: req.params["id"] })));
}));

projectsRouter.delete("/:id", requireAuth, asyncHandler(async (req, res) => {
  const deleted = await deleteProject(req.params["id"] as string);
  res.status(deleted ? 204 : 404).send();
}));

// --- Hình ảnh dự án (nested: /projects/:id/images) ---

projectsRouter.get("/:id/images", asyncHandler(async (req, res) => {
  res.json(await listProjectImages(req.params["id"] as string));
}));

projectsRouter.post("/:id/images", requireAuth, asyncHandler(async (req, res) => {
  const data = projectImageSchema.parse(req.body);
  res.status(201).json(await addProjectImage(req.params["id"] as string, data));
}));

// Reorder đặt trước /:imageId để không bị match nhầm
projectsRouter.patch("/:id/images/reorder", requireAuth, asyncHandler(async (req, res) => {
  const { ids } = z.object({ ids: z.array(z.string().uuid()) }).parse(req.body);
  res.json(await reorderProjectImages(req.params["id"] as string, ids));
}));

projectsRouter.put("/:id/images/:imageId", requireAuth, asyncHandler(async (req, res) => {
  const data = projectImageSchema.partial().parse(req.body);
  const updated = await updateProjectImage(req.params["imageId"] as string, data);
  if (!updated) res.status(404).json({ error: "Not found" });
  else res.json(updated);
}));

projectsRouter.delete("/:id/images/:imageId", requireAuth, asyncHandler(async (req, res) => {
  const deleted = await deleteProjectImage(req.params["imageId"] as string);
  res.status(deleted ? 204 : 404).send();
}));
