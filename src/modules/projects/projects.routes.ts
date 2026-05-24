import { randomUUID } from "node:crypto";
import multer from "multer";
import { Router } from "express";
import { z } from "zod";
import { logActivity } from "../../lib/activity-log.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { uploadToR2 } from "../../lib/r2.js";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import { projectImageSchema, projectSchema } from "../../validators.js";
import {
  addProjectImage,
  bulkAddProjectImages,
  deleteProjectImage,
  listProjectImages,
  reorderProjectImages,
  updateProjectImage,
} from "./project-images.repository.js";
import { deleteProject, getProject, listProjects, upsertProject } from "./projects.repository.js";

export const projectsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().optional(),
  year: z.coerce.number().int().optional(),
});

// --- Dự án ---

// Public
projectsRouter.get("/", asyncHandler(async (req, res) => {
  const params = listQuerySchema.parse(req.query);
  res.json(await listProjects(params));
}));

projectsRouter.get("/:idOrSlug", asyncHandler(async (req, res) => {
  const item = await getProject(req.params["idOrSlug"] as string);
  if (!item) res.status(404).json({ error: "Not found" });
  else res.json(item);
}));

// Admin
projectsRouter.post("/", requireAuth, requireRole("editor"), asyncHandler(async (req, res) => {
  const item = await upsertProject(projectSchema.parse({ ...req.body, id: randomUUID() }));
  void logActivity({ req, action: "create", module: "projects", targetId: item.id, description: item.name });
  res.status(201).json(item);
}));

projectsRouter.put("/:id", requireAuth, requireRole("editor"), asyncHandler(async (req, res) => {
  const item = await upsertProject(projectSchema.parse({ ...req.body, id: req.params["id"] }));
  void logActivity({ req, action: "update", module: "projects", targetId: item.id, description: item.name });
  res.json(item);
}));

projectsRouter.delete("/:id", requireAuth, requireRole("editor"), asyncHandler(async (req, res) => {
  const id = req.params["id"] as string;
  const deleted = await deleteProject(id);
  if (deleted) void logActivity({ req, action: "delete", module: "projects", targetId: id });
  res.status(deleted ? 204 : 404).send();
}));

// --- Hình ảnh dự án (nested: /projects/:id/images) ---

projectsRouter.get("/:id/images", asyncHandler(async (req, res) => {
  res.json(await listProjectImages(req.params["id"] as string));
}));

projectsRouter.post("/:id/images", requireAuth, requireRole("editor"), asyncHandler(async (req, res) => {
  const projectId = req.params["id"] as string;
  const data = projectImageSchema.parse(req.body);
  const image = await addProjectImage(projectId, data);
  void logActivity({ req, action: "create", module: "project-images", targetId: projectId });
  res.status(201).json(image);
}));

// Reorder đặt trước /:imageId để không bị match nhầm
projectsRouter.patch("/:id/images/reorder", requireAuth, requireRole("editor"), asyncHandler(async (req, res) => {
  const projectId = req.params["id"] as string;
  const { ids } = z.object({ ids: z.array(z.string().uuid()) }).parse(req.body);
  const result = await reorderProjectImages(projectId, ids);
  void logActivity({ req, action: "reorder", module: "project-images", targetId: projectId });
  res.json(result);
}));

// Upload nhiều ảnh trực tiếp vào project_images (đặt trước /:imageId để không bị match nhầm)
projectsRouter.post(
  "/:id/images/upload",
  requireAuth,
  requireRole("editor"),
  upload.array("files", 20),
  asyncHandler(async (req, res) => {
    const projectId = req.params["id"] as string;
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: "Không có file nào được gửi lên" });
      return;
    }

    const uploadResults = await Promise.allSettled(
      files.map((file) => uploadToR2(file.buffer, file.originalname, file.mimetype, "projects"))
    );

    const succeeded = uploadResults
      .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof uploadToR2>>> => r.status === "fulfilled")
      .map((r) => r.value.url);

    const failed = uploadResults.filter((r) => r.status === "rejected").length;

    const images = await bulkAddProjectImages(projectId, succeeded);
    if (images.length > 0) {
      void logActivity({ req, action: "create", module: "project-images", targetId: projectId, description: `Upload ${images.length} ảnh` });
    }

    res.status(201).json({ uploaded: images.length, failed, items: images });
  })
);

projectsRouter.put("/:id/images/:imageId", requireAuth, requireRole("editor"), asyncHandler(async (req, res) => {
  const imageId = req.params["imageId"] as string;
  const data = projectImageSchema.partial().parse(req.body);
  const updated = await updateProjectImage(imageId, data);
  if (!updated) res.status(404).json({ error: "Not found" });
  else {
    void logActivity({ req, action: "update", module: "project-images", targetId: imageId });
    res.json(updated);
  }
}));

projectsRouter.delete("/:id/images/:imageId", requireAuth, requireRole("editor"), asyncHandler(async (req, res) => {
  const imageId = req.params["imageId"] as string;
  const deleted = await deleteProjectImage(imageId);
  if (deleted) void logActivity({ req, action: "delete", module: "project-images", targetId: imageId });
  res.status(deleted ? 204 : 404).send();
}));
