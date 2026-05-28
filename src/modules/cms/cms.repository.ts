import type { CmsContent } from "../../validators.js";
import { listNews } from "../news/news.repository.js";
import { listProjects } from "../projects/projects.repository.js";
import { listJobs } from "../jobs/jobs.repository.js";

export async function getCmsContent(): Promise<CmsContent> {
  const [newsRes, projectsRes, jobsRes] = await Promise.all([
    listNews({ limit: 9999 }),
    listProjects({ limit: 9999 }),
    listJobs({ limit: 9999 }),
  ]);
  return { news: newsRes.data, projects: projectsRes.data, jobs: jobsRes.data };
}
