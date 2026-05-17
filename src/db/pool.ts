import pg from "pg";
import { env } from "../env.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.databaseUrl,
  max: 10,
  ssl: env.databaseUrl.includes("neon.tech") ? { rejectUnauthorized: false } : undefined,
});
