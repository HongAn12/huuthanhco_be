import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { logActivity } from "../../lib/activity-log.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import { consultationSchema } from "../../validators.js";
import {
  createConsultation,
  deleteConsultation,
  listConsultations,
  updateConsultation,
} from "./consultations.repository.js";

export const consultationRouter = Router();

const publicFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: "Too many submissions, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public: khách gửi form tư vấn
consultationRouter.post("/", publicFormLimiter, asyncHandler(async (req, res) => {
  res.status(201).json(await createConsultation(consultationSchema.parse(req.body)));
}));

// Admin: xem danh sách, filter theo ?status=new|read|done
consultationRouter.get("/", requireAuth, asyncHandler(async (req, res) => {
  const { status } = z.object({ status: z.string().optional() }).parse(req.query);
  res.json(await listConsultations(status));
}));

// Admin: cập nhật trạng thái + ghi chú
consultationRouter.patch("/:id", requireAuth, asyncHandler(async (req, res) => {
  const data = z.object({
    status: z.enum(["new", "read", "done"]).optional(),
    note: z.string().optional(),
  }).parse(req.body);
  const updated = await updateConsultation(req.params["id"] as string, data);
  if (!updated) res.status(404).json({ error: "Not found" });
  else {
    void logActivity({ req, action: "update", module: "consultations", targetId: updated.id });
    res.json(updated);
  }
}));

// Admin: xoá (chỉ super_admin)
consultationRouter.delete("/:id", requireAuth, requireRole("super_admin"), asyncHandler(async (req, res) => {
  const id = req.params["id"] as string;
  const deleted = await deleteConsultation(id);
  if (deleted) void logActivity({ req, action: "delete", module: "consultations", targetId: id });
  res.status(deleted ? 204 : 404).send();
}));
