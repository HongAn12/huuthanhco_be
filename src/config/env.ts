import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  databaseUrl: process.env.DATABASE_URL ?? "postgres://postgres:secret@127.0.0.1:5432/huuthanh_cms",
  jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production-use-strong-secret-key!!",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "refresh-change-me-must-be-different-secret!!",
};
