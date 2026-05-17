import { readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "./pool.js";

const schemaPath = path.join(process.cwd(), "database", "schema.sql");
const schema = await readFile(schemaPath, "utf8");

await pool.query(schema);
await pool.end();

console.log("PostgreSQL schema initialized.");
