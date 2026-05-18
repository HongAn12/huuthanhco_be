import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { AdminRole, AuthPayload } from "../../middlewares/auth.middleware.js";
import { pool } from "../../db/pool.js";

export type AdminUser = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: AdminRole;
  status: string;
};

type AdminUserRow = AdminUser & {
  password_hash: string;
};

const SELECT_USER = `
  SELECT u.id, u.email, u.full_name AS "fullName", u.phone, u.status,
         u.password_hash, r.name AS role
  FROM admin_users u
  LEFT JOIN admin_roles r ON r.id = u.role_id
`;

function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function findUserByEmail(email: string): Promise<AdminUserRow | null> {
  const result = await pool.query<AdminUserRow>(
    `${SELECT_USER} WHERE u.email=$1 AND u.status='active'`,
    [email]
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: string): Promise<AdminUser | null> {
  const result = await pool.query<AdminUser>(
    `${SELECT_USER} WHERE u.id=$1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function signAccessToken(user: AdminUser) {
  const payload: AuthPayload = { sub: user.id, role: user.role };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "15m" });
}

export async function createRefreshToken(userId: string) {
  const raw = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.query(
    "INSERT INTO refresh_tokens (user_id,token_hash,expires_at) VALUES ($1,$2,$3)",
    [userId, hashToken(raw), expiresAt]
  );
  return raw;
}

export async function rotateRefreshToken(raw: string) {
  const result = await pool.query<{ user_id: string }>(
    "DELETE FROM refresh_tokens WHERE token_hash=$1 AND expires_at>NOW() RETURNING user_id",
    [hashToken(raw)]
  );
  const row = result.rows[0];
  if (!row) return null;
  const user = await findUserById(row.user_id);
  if (!user) return null;
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(user),
    createRefreshToken(user.id),
  ]);
  return { user, accessToken, refreshToken };
}

export async function revokeRefreshToken(raw: string) {
  await pool.query("DELETE FROM refresh_tokens WHERE token_hash=$1", [hashToken(raw)]);
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const result = await pool.query<AdminUser>(
    `${SELECT_USER} ORDER BY u.created_at ASC`
  );
  return result.rows;
}

async function getRoleId(roleName: AdminRole): Promise<string | null> {
  const r = await pool.query<{ id: string }>("SELECT id FROM admin_roles WHERE name=$1", [roleName]);
  return r.rows[0]?.id ?? null;
}

export async function createAdminUser(
  email: string,
  password: string,
  fullName: string,
  role: AdminRole = "editor"
): Promise<AdminUser> {
  const [password_hash, roleId] = await Promise.all([
    bcrypt.hash(password, 12),
    getRoleId(role),
  ]);
  const result = await pool.query<AdminUser>(
    `INSERT INTO admin_users (email, password_hash, full_name, phone, role_id)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, email, full_name AS "fullName", phone, status`,
    [email, password_hash, fullName, null, roleId]
  );
  const user = result.rows[0];
  return { ...user, role };
}

export async function updateAdminUser(
  id: string,
  data: { fullName?: string; email?: string; password?: string; role?: AdminRole }
): Promise<AdminUser | null> {
  const sets: string[] = [];
  const values: unknown[] = [id];
  let i = 2;

  if (data.fullName !== undefined) { sets.push(`full_name=$${i++}`); values.push(data.fullName); }
  if (data.email !== undefined) { sets.push(`email=$${i++}`); values.push(data.email); }
  if (data.password !== undefined) {
    sets.push(`password_hash=$${i++}`);
    values.push(await bcrypt.hash(data.password, 12));
  }
  if (data.role !== undefined) {
    const roleId = await getRoleId(data.role);
    sets.push(`role_id=$${i++}`);
    values.push(roleId);
  }

  if (!sets.length) return findUserById(id);
  sets.push("updated_at=CURRENT_TIMESTAMP");

  await pool.query(
    `UPDATE admin_users SET ${sets.join(",")} WHERE id=$1`,
    values
  );
  return findUserById(id);
}

export async function deleteAdminUser(id: string) {
  const result = await pool.query("DELETE FROM admin_users WHERE id=$1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function updateLastLogin(id: string, ip: string | null) {
  await pool.query(
    "UPDATE admin_users SET last_login_at=NOW(), last_login_ip=$2, updated_at=NOW() WHERE id=$1",
    [id, ip]
  );
}
