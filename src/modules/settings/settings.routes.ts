import { Router } from "express";
import { z } from "zod";
import { logActivity } from "../../lib/activity-log.js";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import { settingBulkSchema, settingUpsertSchema } from "../../validators.js";
import {
  deleteSetting,
  getAllSettings,
  getSetting,
  getSettingsAsMap,
  upsertSetting,
  upsertSettingsBulk,
} from "./settings.repository.js";

export const settingsRouter = Router();

// Public: lấy toàn bộ settings dạng map { key: value } — dùng cho frontend
settingsRouter.get("/", asyncHandler(async (req, res) => {
  const { prefix, full } = z.object({
    prefix: z.string().optional(),
    full: z.string().optional(),
  }).parse(req.query);

  if (full === "1" || full === "true") {
    res.json(await getAllSettings(prefix));
  } else {
    res.json(await getSettingsAsMap(prefix));
  }
}));

// Public: lấy 1 setting theo key
settingsRouter.get("/:key(*)", asyncHandler(async (req, res) => {
  const setting = await getSetting(req.params["key"] as string);
  if (!setting) res.status(404).json({ error: "Setting not found" });
  else res.json(setting);
}));

// Admin: upsert 1 setting
settingsRouter.put("/:key(*)", requireAuth, requireRole("editor"), asyncHandler(async (req, res) => {
  const key = req.params["key"] as string;
  const data = settingUpsertSchema.parse(req.body);
  const result = await upsertSetting(key, data);
  void logActivity({ req, action: "update", module: "settings", targetId: key });
  res.json(result);
}));

// Admin: bulk upsert nhiều settings cùng lúc
settingsRouter.post("/bulk", requireAuth, requireRole("editor"), asyncHandler(async (req, res) => {
  const items = settingBulkSchema.parse(req.body);
  const result = await upsertSettingsBulk(items);
  void logActivity({ req, action: "bulk-update", module: "settings", description: `${items.length} keys` });
  res.json(result);
}));

// Admin: xoá setting (chỉ super_admin)
settingsRouter.delete("/:key(*)", requireAuth, requireRole("super_admin"), asyncHandler(async (req, res) => {
  const key = req.params["key"] as string;
  const deleted = await deleteSetting(key);
  if (deleted) void logActivity({ req, action: "delete", module: "settings", targetId: key });
  res.status(deleted ? 204 : 404).send();
}));
