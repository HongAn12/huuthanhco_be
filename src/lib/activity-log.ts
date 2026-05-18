import type { Request } from "express";
import { pool } from "../db/pool.js";

type LogParams = {
  req: Request;
  action: string;
  module: string;
  targetId?: string;
  description?: string;
};

export async function logActivity({ req, action, module, targetId, description }: LogParams) {
  const adminUserId = req.auth?.sub;
  if (!adminUserId) return;

  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
    req.socket.remoteAddress ??
    null;

  await pool.query(
    `INSERT INTO admin_activity_logs (admin_user_id,action,module,target_id,description,ip_address,user_agent)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [adminUserId, action, module, targetId ?? null, description ?? null, ip, req.headers["user-agent"] ?? null]
  ).catch(() => {
    // Log failure không được crash request chính
  });
}
