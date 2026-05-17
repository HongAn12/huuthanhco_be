import { Router } from "express";
import {
  clearCmsContent,
  deleteItem,
  getCmsContent,
  listJobs,
  listNews,
  listProjects,
  replaceCmsContent,
  upsertJob,
  upsertNews,
  upsertProject,
} from "../db/repository.js";
import { cmsContentSchema, jobSchema, newsSchema, projectSchema } from "../validators.js";

export const cmsRouter = Router();

cmsRouter.get("/health", (_req, res) => {
  res.json({ ok: true, service: "huuthanhco-api" });
});

cmsRouter.get("/cms", async (_req, res, next) => {
  try {
    res.json(await getCmsContent());
  } catch (error) {
    next(error);
  }
});

cmsRouter.post("/cms", async (req, res, next) => {
  try {
    const content = cmsContentSchema.parse(req.body);
    res.json(await replaceCmsContent(content));
  } catch (error) {
    next(error);
  }
});

cmsRouter.delete("/cms", async (_req, res, next) => {
  try {
    res.json(await clearCmsContent());
  } catch (error) {
    next(error);
  }
});

cmsRouter.get("/news", async (_req, res, next) => {
  try {
    res.json(await listNews());
  } catch (error) {
    next(error);
  }
});

cmsRouter.post("/news", async (req, res, next) => {
  try {
    res.status(201).json(await upsertNews(newsSchema.parse(req.body)));
  } catch (error) {
    next(error);
  }
});

cmsRouter.put("/news/:id", async (req, res, next) => {
  try {
    res.json(await upsertNews(newsSchema.parse({ ...req.body, id: req.params.id })));
  } catch (error) {
    next(error);
  }
});

cmsRouter.delete("/news/:id", async (req, res, next) => {
  try {
    const deleted = await deleteItem("news", req.params.id);
    res.status(deleted ? 204 : 404).send();
  } catch (error) {
    next(error);
  }
});

cmsRouter.get("/projects", async (_req, res, next) => {
  try {
    res.json(await listProjects());
  } catch (error) {
    next(error);
  }
});

cmsRouter.post("/projects", async (req, res, next) => {
  try {
    res.status(201).json(await upsertProject(projectSchema.parse(req.body)));
  } catch (error) {
    next(error);
  }
});

cmsRouter.put("/projects/:id", async (req, res, next) => {
  try {
    res.json(await upsertProject(projectSchema.parse({ ...req.body, id: req.params.id })));
  } catch (error) {
    next(error);
  }
});

cmsRouter.delete("/projects/:id", async (req, res, next) => {
  try {
    const deleted = await deleteItem("projects", req.params.id);
    res.status(deleted ? 204 : 404).send();
  } catch (error) {
    next(error);
  }
});

cmsRouter.get("/jobs", async (_req, res, next) => {
  try {
    res.json(await listJobs());
  } catch (error) {
    next(error);
  }
});

cmsRouter.post("/jobs", async (req, res, next) => {
  try {
    res.status(201).json(await upsertJob(jobSchema.parse(req.body)));
  } catch (error) {
    next(error);
  }
});

cmsRouter.put("/jobs/:id", async (req, res, next) => {
  try {
    res.json(await upsertJob(jobSchema.parse({ ...req.body, id: req.params.id })));
  } catch (error) {
    next(error);
  }
});

cmsRouter.delete("/jobs/:id", async (req, res, next) => {
  try {
    const deleted = await deleteItem("jobs", req.params.id);
    res.status(deleted ? 204 : 404).send();
  } catch (error) {
    next(error);
  }
});
