import type { PoolClient } from "pg";
import { pool } from "../../db/pool.js";
import type { CmsContent } from "../../validators.js";
import { listNews, upsertNews } from "../news/news.repository.js";
import { listProjects, upsertProject } from "../projects/projects.repository.js";
import { listJobs, upsertJob } from "../jobs/jobs.repository.js";

export async function getCmsContent(): Promise<CmsContent> {
  const [newsRes, projectsRes, jobsRes] = await Promise.all([
    listNews({ limit: 9999 }),
    listProjects({ limit: 9999 }),
    listJobs({ limit: 9999 }),
  ]);
  return { news: newsRes.data, projects: projectsRes.data, jobs: jobsRes.data };
}

export async function replaceCmsContent(content: CmsContent): Promise<CmsContent> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM news");
    await client.query("DELETE FROM projects");
    await client.query("DELETE FROM jobs");

    await Promise.all(content.news.map(item => upsertNews(item, client)));
    await Promise.all(content.projects.map(item => upsertProject(item, client)));
    await Promise.all(content.jobs.map(item => upsertJob(item, client)));

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return getCmsContent();
}

export async function clearCmsContent(): Promise<CmsContent> {
  return replaceCmsContent({ news: [], projects: [], jobs: [] });
}
