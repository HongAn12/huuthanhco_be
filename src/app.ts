import cors from "cors";
import express from "express";
import path from "node:path";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { cmsRouter } from "./modules/cms/cms.routes.js";
import { consultationRouter } from "./modules/consultations/consultations.routes.js";
import { jobApplicationsRouter } from "./modules/job-applications/job-applications.routes.js";
import { jobsRouter } from "./modules/jobs/jobs.routes.js";
import { mediaRouter } from "./modules/media/media.routes.js";
import { newsRouter } from "./modules/news/news.routes.js";
import { projectsRouter } from "./modules/projects/projects.routes.js";
import { settingsRouter } from "./modules/settings/settings.routes.js";
import { openApiDocument } from "./openapi.js";

export const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "huuthanhco-api" });
});

app.get("/openapi.json", (_req, res) => {
  res.json(openApiDocument);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

app.use("/api/auth", authRouter);
app.use("/api/news", newsRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/cms", cmsRouter);
app.use("/api/consultations", consultationRouter);
app.use("/api/job-applications", jobApplicationsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/media", mediaRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);
