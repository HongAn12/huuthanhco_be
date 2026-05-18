import { createAdminUser } from "../src/modules/auth/auth.repository.js";
import { pool } from "../src/db/pool.js";

const email = process.env.ADMIN_EMAIL ?? "admin@huuthanh.vn";
const password = process.env.ADMIN_PASSWORD ?? "Admin@123456";
const name = process.env.ADMIN_NAME ?? "Super Admin";

const user = await createAdminUser(email, password, name, "super_admin");
console.log("Admin created:", user);
await pool.end();
