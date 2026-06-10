import dotenv from "dotenv";

dotenv.config();

const defaultCorsOrigins = ["http://localhost:3000", "https://huuthanhco.vercel.app"];
const configuredCorsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim()).filter(Boolean)
  : [];
const corsOrigin = Array.from(new Set([...defaultCorsOrigins, ...configuredCorsOrigins]));

function positiveNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsOrigin,
  databaseUrl: process.env.DATABASE_URL ?? "postgres://postgres:secret@127.0.0.1:5432/huuthanh_cms",
  jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production-use-strong-secret-key!!",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "refresh-change-me-must-be-different-secret!!",
  jwtAccessTtlSeconds: positiveNumber(process.env.JWT_ACCESS_TTL_HOURS, 8) * 60 * 60,
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  r2Endpoint: process.env.R2_ENDPOINT ?? "https://124830de785ccd3117effa8673736cac.r2.cloudflarestorage.com",
  r2Bucket: process.env.R2_BUCKET ?? "huuthanhco",
  r2PublicUrl: process.env.R2_PUBLIC_URL ?? "",
};
