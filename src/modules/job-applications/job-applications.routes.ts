import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { logActivity } from "../../lib/activity-log.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { cvUpload, verifyCvUpload } from "../../lib/cv-upload.js";
import { deleteR2Object, privateFileSignedUrl, uploadPrivateToR2 } from "../../lib/r2.js";
import { requireAuth, requirePermission } from "../../middlewares/auth.middleware.js";
import { jobApplicationSchema } from "../../validators.js";
import {
  createJobApplication,
  deleteJobApplication,
  getJobApplicationCv,
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
jobApplicationsRouter.post(
  "/",
  publicFormLimiter,
  cvUpload.single("cvFile"),
  asyncHandler(async (req, res) => {
    const data = jobApplicationSchema.parse({
      ...req.body,
      jobId: req.body["jobId"] || null,
      email: req.body["email"] || undefined,
      positionApplied: req.body["positionApplied"] || undefined,
    });
    const cv = req.file ? verifyCvUpload(req.file) : undefined;
    const stored = cv
      ? await uploadPrivateToR2(cv.buffer, cv.fileName, cv.mimeType, "private/job-applications")
      : undefined;

    try {
      res.status(201).json(await createJobApplication(data, stored));
    } catch (error) {
      if (stored) await deleteR2Object(stored.key).catch(() => undefined);
      throw error;
    }
  })
);

// Admin: danh sách đơn ứng tuyển (filter: ?status=new&jobId=xxx&limit=20&offset=0)
jobApplicationsRouter.get("/", requireAuth, requirePermission("records:read"), asyncHandler(async (req, res) => {
  const query = z.object({
    status: z.string().optional(),
    jobId: z.string().uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  }).parse(req.query);
  res.json(await listJobApplications(query));
}));

// Admin: cấp đường dẫn CV ký số ngắn hạn, object trong storage luôn là private.
jobApplicationsRouter.get("/:id/cv", requireAuth, requirePermission("records:read"), asyncHandler(async (req, res) => {
  const query = z.object({ download: z.enum(["0", "1"]).default("0") }).parse(req.query);
  const cv = await getJobApplicationCv(req.params["id"] as string);
  if (!cv) {
    res.status(404).json({ error: "CV not found" });
    return;
  }
  const mode = query.download === "1" ? "attachment" : "inline";
  const url = await privateFileSignedUrl(cv.key, cv.fileName, mode);
  res.json({ url, fileName: cv.fileName, fileType: cv.fileType, fileSize: cv.fileSize, expiresIn: 300 });
}));

// Admin: xem chi tiết 1 đơn
jobApplicationsRouter.get("/:id", requireAuth, requirePermission("records:read"), asyncHandler(async (req, res) => {
  const item = await getJobApplication(req.params["id"] as string);
  if (!item) res.status(404).json({ error: "Not found" });
  else res.json(item);
}));

// Admin: cập nhật trạng thái + ghi chú
jobApplicationsRouter.patch("/:id", requireAuth, requirePermission("recruitment:write"), asyncHandler(async (req, res) => {
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
jobApplicationsRouter.delete("/:id", requireAuth, requirePermission("system:admin"), asyncHandler(async (req, res) => {
  const id = req.params["id"] as string;
  const deleted = await deleteJobApplication(id);
  if (deleted) void logActivity({ req, action: "delete", module: "job-applications", targetId: id });
  res.status(deleted ? 204 : 404).send();
}));
