import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { requireAuth, requireRole } from "../../middlewares/auth.middleware.js";
import { adminUserSchema, loginSchema } from "../../validators.js";
import {
  createAdminUser,
  createRefreshToken,
  deleteAdminUser,
  findUserByEmail,
  listAdminUsers,
  rotateRefreshToken,
  revokeRefreshToken,
  signAccessToken,
  updateAdminUser,
  verifyPassword,
} from "./auth.repository.js";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

authRouter.post("/login", loginLimiter, asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const { password_hash: _ph, ...safeUser } = user;
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(safeUser),
    createRefreshToken(user.id),
  ]);
  res.json({ accessToken, refreshToken, user: safeUser });
}));

authRouter.post("/refresh", asyncHandler(async (req, res) => {
  const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
  const result = await rotateRefreshToken(refreshToken);
  if (!result) {
    res.status(401).json({ error: "Invalid or expired refresh token" });
    return;
  }
  res.json({ accessToken: result.accessToken, refreshToken: result.refreshToken });
}));

authRouter.post("/logout", asyncHandler(async (req, res) => {
  const { refreshToken } = z.object({ refreshToken: z.string().optional() }).parse(req.body);
  if (refreshToken) await revokeRefreshToken(refreshToken);
  res.status(204).send();
}));

authRouter.get("/me", requireAuth, asyncHandler(async (req, res) => {
  res.json(req.auth);
}));

// Quản lý tài khoản admin (chỉ super_admin)
authRouter.get("/users", requireAuth, requireRole("super_admin"), asyncHandler(async (_req, res) => {
  res.json(await listAdminUsers());
}));

authRouter.post("/users", requireAuth, requireRole("super_admin"), asyncHandler(async (req, res) => {
  const data = adminUserSchema.parse(req.body);
  res.status(201).json(await createAdminUser(data.email, data.password, data.fullName, data.role));
}));

authRouter.put("/users/:id", requireAuth, requireRole("super_admin"), asyncHandler(async (req, res) => {
  const { fullName, email, password, role } = adminUserSchema.partial().parse(req.body);
  const user = await updateAdminUser(req.params["id"] as string, { fullName, email, password, role });
  if (!user) res.status(404).json({ error: "User not found" });
  else res.json(user);
}));

authRouter.delete("/users/:id", requireAuth, requireRole("super_admin"), asyncHandler(async (req, res) => {
  const deleted = await deleteAdminUser(req.params["id"] as string);
  res.status(deleted ? 204 : 404).send();
}));
