import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { jobSchema } from "../../validators.js";
import { deleteJob, getJob, listJobs, upsertJob } from "./jobs.repository.js";

export const jobsRouter = Router();

// Public
jobsRouter.get("/", asyncHandler(async (_req, res) => {
  res.json(await listJobs());
}));

jobsRouter.get("/:idOrSlug", asyncHandler(async (req, res) => {
  const item = await getJob(req.params["idOrSlug"] as string);
  if (!item) res.status(404).json({ error: "Not found" });
  else res.json(item);
}));

// Admin
jobsRouter.post("/", requireAuth, asyncHandler(async (req, res) => {
  res.status(201).json(await upsertJob(jobSchema.parse(req.body)));
}));

jobsRouter.put("/:id", requireAuth, asyncHandler(async (req, res) => {
  res.json(await upsertJob(jobSchema.parse({ ...req.body, id: req.params["id"] })));
}));

jobsRouter.delete("/:id", requireAuth, asyncHandler(async (req, res) => {
  const deleted = await deleteJob(req.params["id"] as string);
  res.status(deleted ? 204 : 404).send();
}));
