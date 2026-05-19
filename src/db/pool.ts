import pg from "pg";
import type { QueryResult, QueryResultRow } from "pg";
import { env } from "../config/env.js";

const { Pool } = pg;

const cleanUrl = env.databaseUrl
  .replace(/[?&]sslmode=[^&]*/g, "")
  .replace(/[?&]channel_binding=[^&]*/g, "")
  .replace(/\?&/, "?")
  .replace(/\?$/, "");

export const pool = new Pool({
  connectionString: cleanUrl,
  max: 10,
  ssl: env.databaseUrl.includes("neon.tech") ? { rejectUnauthorized: false } : undefined,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});

export async function checkDbConnection() {
  const client = await pool.connect();
  await client.query("SELECT 1");
  client.release();
}

export type QueryExecutor = {
  query<R extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[]
  ): Promise<QueryResult<R>>;
};
