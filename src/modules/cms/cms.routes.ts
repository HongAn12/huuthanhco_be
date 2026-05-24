import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import { cmsContentSchema } from "../../validators.js";
import { clearCmsContent, getCmsContent, replaceCmsContent } from "./cms.repository.js";

export const cmsRouter = Router();

cmsRouter.get("/", asyncHandler(async (_req, res) => {
  res.json(await getCmsContent());
}));

cmsRouter.post("/", requireAuth, requireRole("editor"), asyncHandler(async (req, res) => {
  res.json(await replaceCmsContent(cmsContentSchema.parse(req.body)));
}));

cmsRouter.delete("/", requireAuth, requireRole("editor"), asyncHandler(async (_req, res) => {
  res.json(await clearCmsContent());
}));
