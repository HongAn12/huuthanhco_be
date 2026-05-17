import { readFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import { env } from "../env.js";

const schemaPath = path.join(process.cwd(), "database", "schema.sql");
const schema = await readFile(schemaPath, "utf8");

const connection = await mysql.createConnection({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  multipleStatements: true,
});

await connection.query(schema);
await connection.end();

console.log("Database schema initialized.");
