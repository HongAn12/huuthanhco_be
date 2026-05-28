import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type AdminRole = "super_admin" | "editor" | "hr" | "viewer";
export type AdminPermission =
  | "content:write"
  | "recruitment:write"
  | "records:read"
  | "system:admin";

export const ROLE_PERMISSIONS: Readonly<Record<AdminRole, readonly AdminPermission[]>> = Object.freeze({
  super_admin: ["content:write", "recruitment:write", "records:read", "system:admin"],
  editor: ["content:write"],
  hr: ["recruitment:write", "records:read"],
  viewer: ["records:read"],
});

export type AuthPayload = {
  sub: string;
  role: AdminRole;
};

function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && Object.hasOwn(ROLE_PERMISSIONS, value);
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as Partial<AuthPayload>;
    if (typeof payload.sub !== "string" || !isAdminRole(payload.role)) {
      throw new Error("Invalid auth claims");
    }
    req.auth = { sub: payload.sub, role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requirePermission(permission: AdminPermission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.auth?.role;
    if (userRole && ROLE_PERMISSIONS[userRole]?.includes(permission)) {
      next();
      return;
    }
    res.status(403).json({ error: "Forbidden" });
  };
}
