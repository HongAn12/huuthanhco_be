import { pool } from "./pool.js";
import type { CmsContent, Job, NewsItem, Project } from "../types.js";

type NewsRow = {
  id: string;
  title: string;
  title_en: string;
  slug: string;
  published_date: Date | string;
  category: string;
  category_en: string;
  thumbnail: string;
  excerpt: string;
  excerpt_en: string;
  content: string;
  content_en: string;
};

type ProjectRow = {
  id: string;
  name: string;
  name_en: string;
  location: string;
  year: number;
  category: string;
  category_en: string;
  image: string;
  description: string;
  description_en: string;
};

type JobRow = {
  id: string;
  title: string;
  title_en: string;
  location: string;
  type: string;
  type_en: string;
  salary: string;
  description: string;
  description_en: string;
  requirements: unknown;
  requirements_en: unknown;
};

function toDateString(value: Date | string) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function parseJsonArray(value: unknown) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function mapNews(row: NewsRow): NewsItem {
  return {
    id: row.id,
    title: row.title,
    titleEn: row.title_en,
    slug: row.slug,
    date: toDateString(row.published_date),
    category: row.category,
    categoryEn: row.category_en,
    thumbnail: row.thumbnail,
    excerpt: row.excerpt,
    excerptEn: row.excerpt_en,
    content: row.content,
    contentEn: row.content_en,
  };
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    nameEn: row.name_en,
    location: row.location,
    year: row.year,
    category: row.category,
    categoryEn: row.category_en,
    image: row.image,
    description: row.description,
    descriptionEn: row.description_en,
  };
}

function mapJob(row: JobRow): Job {
  return {
    id: row.id,
    title: row.title,
    titleEn: row.title_en,
    location: row.location,
    type: row.type,
    typeEn: row.type_en,
    salary: row.salary,
    description: row.description,
    descriptionEn: row.description_en,
    requirements: parseJsonArray(row.requirements),
    requirementsEn: parseJsonArray(row.requirements_en),
  };
}

export async function listNews() {
  const result = await pool.query<NewsRow>("SELECT * FROM news ORDER BY published_date DESC, updated_at DESC");
  return result.rows.map(mapNews);
}

export async function listProjects() {
  const result = await pool.query<ProjectRow>("SELECT * FROM projects ORDER BY year DESC, updated_at DESC");
  return result.rows.map(mapProject);
}

export async function listJobs() {
  const result = await pool.query<JobRow>("SELECT * FROM jobs ORDER BY updated_at DESC");
  return result.rows.map(mapJob);
}

export async function getCmsContent(): Promise<CmsContent> {
  const [news, projects, jobs] = await Promise.all([listNews(), listProjects(), listJobs()]);
  return { news, projects, jobs };
}

export async function upsertNews(item: NewsItem) {
  await pool.query(
    `INSERT INTO news
      (id, title, title_en, slug, published_date, category, category_en, thumbnail, excerpt, excerpt_en, content, content_en)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      title_en = EXCLUDED.title_en,
      slug = EXCLUDED.slug,
      published_date = EXCLUDED.published_date,
      category = EXCLUDED.category,
      category_en = EXCLUDED.category_en,
      thumbnail = EXCLUDED.thumbnail,
      excerpt = EXCLUDED.excerpt,
      excerpt_en = EXCLUDED.excerpt_en,
      content = EXCLUDED.content,
      content_en = EXCLUDED.content_en,
      updated_at = CURRENT_TIMESTAMP`,
    [
      item.id,
      item.title,
      item.titleEn,
      item.slug,
      item.date,
      item.category,
      item.categoryEn,
      item.thumbnail,
      item.excerpt,
      item.excerptEn,
      item.content,
      item.contentEn,
    ]
  );
  return item;
}

export async function upsertProject(item: Project) {
  await pool.query(
    `INSERT INTO projects
      (id, name, name_en, location, year, category, category_en, image, description, description_en)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      name_en = EXCLUDED.name_en,
      location = EXCLUDED.location,
      year = EXCLUDED.year,
      category = EXCLUDED.category,
      category_en = EXCLUDED.category_en,
      image = EXCLUDED.image,
      description = EXCLUDED.description,
      description_en = EXCLUDED.description_en,
      updated_at = CURRENT_TIMESTAMP`,
    [
      item.id,
      item.name,
      item.nameEn,
      item.location,
      item.year,
      item.category,
      item.categoryEn,
      item.image,
      item.description,
      item.descriptionEn,
    ]
  );
  return item;
}

export async function upsertJob(item: Job) {
  await pool.query(
    `INSERT INTO jobs
      (id, title, title_en, location, type, type_en, salary, description, description_en, requirements, requirements_en)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb)
     ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      title_en = EXCLUDED.title_en,
      location = EXCLUDED.location,
      type = EXCLUDED.type,
      type_en = EXCLUDED.type_en,
      salary = EXCLUDED.salary,
      description = EXCLUDED.description,
      description_en = EXCLUDED.description_en,
      requirements = EXCLUDED.requirements,
      requirements_en = EXCLUDED.requirements_en,
      updated_at = CURRENT_TIMESTAMP`,
    [
      item.id,
      item.title,
      item.titleEn,
      item.location,
      item.type,
      item.typeEn,
      item.salary,
      item.description,
      item.descriptionEn,
      JSON.stringify(item.requirements),
      JSON.stringify(item.requirementsEn),
    ]
  );
  return item;
}

export async function deleteItem(table: "news" | "projects" | "jobs", id: string) {
  const result = await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function replaceCmsContent(content: CmsContent) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM news");
    await client.query("DELETE FROM projects");
    await client.query("DELETE FROM jobs");
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  await Promise.all([
    ...content.news.map(upsertNews),
    ...content.projects.map(upsertProject),
    ...content.jobs.map(upsertJob),
  ]);

  return getCmsContent();
}

export async function clearCmsContent() {
  await replaceCmsContent({ news: [], projects: [], jobs: [] });
  return getCmsContent();
}
