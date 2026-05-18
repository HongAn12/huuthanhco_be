import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import swaggerUi from "swagger-ui-express";
import { ZodError } from "zod";
import { env } from "./env.js";
import { openApiSpec } from "./openapi.js";
import { cmsRouter } from "./routes/cms.js";

const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.get("/openapi.json", (_req, res) => res.json(openApiSpec));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customSiteTitle: "Huu Thanh CMS API Docs",
}));
app.use("/api", cmsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", details: error.flatten() });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Internal server error" });
};

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Huu Thanh API running at http://localhost:${env.port}`);
  console.log(`Swagger UI running at http://localhost:${env.port}/api-docs`);
});
