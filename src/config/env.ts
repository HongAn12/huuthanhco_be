import dotenv from "dotenv";

dotenv.config();

const defaultCorsOrigins = ["http://localhost:3000", "https://huuthanhco.vercel.app"];
const configuredCorsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  : [];
const corsOrigin = Array.from(new Set([...defaultCorsOrigins, ...configuredCorsOrigins]));

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsOrigin,
  databaseUrl: process.env.DATABASE_URL ?? "postgres://postgres:secret@127.0.0.1:5432/huuthanh_cms",
  jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production-use-strong-secret-key!!",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "refresh-change-me-must-be-different-secret!!",
};
