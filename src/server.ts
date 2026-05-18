import { app } from "./app.js";
import { env } from "./config/env.js";
import { checkDbConnection } from "./db/pool.js";

checkDbConnection()
  .then(() => {
    console.log("PostgreSQL connected.");
    app.listen(env.port, () => {
      console.log(`Huu Thanh API running at http://localhost:${env.port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to PostgreSQL:", err);
    process.exit(1);
  });
