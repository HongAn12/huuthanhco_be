import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { logActivity } from "../../lib/activity-log.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import { jobSchema } from "../../validators.js";
import { deleteJob, getJob, listJobs, upsertJob } from "./jobs.repository.js";

export const jobsRouter = Router();

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.string().optional(),
  location: z.string().optional(),
});

// Public
jobsRouter.get("/", asyncHandler(async (req, res) => {
  const params = listQuerySchema.parse(req.query);
  res.json(await listJobs(params));
}));

jobsRouter.get("/:idOrSlug", asyncHandler(async (req, res) => {
  const item = await getJob(req.params["idOrSlug"] as string);
  if (!item) res.status(404).json({ error: "Not found" });
  else res.json(item);
}));

// Admin
jobsRouter.post("/", requireAuth, requireRole("hr"), asyncHandler(async (req, res) => {
  const item = await upsertJob(jobSchema.parse({ ...req.body, id: randomUUID() }));
  void logActivity({ req, action: "create", module: "jobs", targetId: item.id, description: item.title });
  res.status(201).json(item);
}));

jobsRouter.put("/:id", requireAuth, requireRole("hr"), asyncHandler(async (req, res) => {
  const item = await upsertJob(jobSchema.parse({ ...req.body, id: req.params["id"] }));
  void logActivity({ req, action: "update", module: "jobs", targetId: item.id, description: item.title });
  res.json(item);
}));

jobsRouter.delete("/:id", requireAuth, requireRole("hr"), asyncHandler(async (req, res) => {
  const id = req.params["id"] as string;
  const deleted = await deleteJob(id);
  if (deleted) void logActivity({ req, action: "delete", module: "jobs", targetId: id });
  res.status(deleted ? 204 : 404).send();
}));
