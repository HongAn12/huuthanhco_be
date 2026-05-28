import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler.js";
import { getCmsContent } from "./cms.repository.js";

export const cmsRouter = Router();

cmsRouter.get("/", asyncHandler(async (_req, res) => {
  res.json(await getCmsContent());
}));
