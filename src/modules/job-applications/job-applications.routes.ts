import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { logActivity } from "../../lib/activity-log.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import { jobApplicationSchema } from "../../validators.js";
import {
  createJobApplication,
  deleteJobApplication,
  getJobApplication,
  listJobApplications,
  updateJobApplication,
} from "./job-applications.repository.js";

export const jobApplicationsRouter = Router();

const publicFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Too many submissions, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public: ứng viên nộp đơn
jobApplicationsRouter.post("/", publicFormLimiter, asyncHandler(async (req, res) => {
  const data = jobApplicationSchema.parse(req.body);
  res.status(201).json(await createJobApplication(data));
}));

// Admin: danh sách đơn ứng tuyển (filter: ?status=new&jobId=xxx&limit=20&offset=0)
jobApplicationsRouter.get("/", requireAuth, requireRole("hr", "viewer"), asyncHandler(async (req, res) => {
  const query = z.object({
    status: z.string().optional(),
    jobId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  }).parse(req.query);
  res.json(await listJobApplications(query));
}));

// Admin: xem chi tiết 1 đơn
jobApplicationsRouter.get("/:id", requireAuth, requireRole("hr", "viewer"), asyncHandler(async (req, res) => {
  const item = await getJobApplication(req.params["id"] as string);
  if (!item) res.status(404).json({ error: "Not found" });
  else res.json(item);
}));

// Admin: cập nhật trạng thái + ghi chú
jobApplicationsRouter.patch("/:id", requireAuth, requireRole("hr"), asyncHandler(async (req, res) => {
  const data = z.object({
    status: z.enum(["new", "reviewing", "interviewed", "hired", "rejected"]).optional(),
    note: z.string().optional(),
  }).parse(req.body);
  const updated = await updateJobApplication(req.params["id"] as string, data);
  if (!updated) res.status(404).json({ error: "Not found" });
  else {
    void logActivity({ req, action: "update", module: "job-applications", targetId: updated.id });
    res.json(updated);
  }
}));

// Admin: xoá đơn (super_admin)
jobApplicationsRouter.delete("/:id", requireAuth, requireRole("super_admin"), asyncHandler(async (req, res) => {
  const id = req.params["id"] as string;
  const deleted = await deleteJobApplication(id);
  if (deleted) void logActivity({ req, action: "delete", module: "job-applications", targetId: id });
  res.status(deleted ? 204 : 404).send();
}));
