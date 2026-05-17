import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "./pool.js";
import type { CmsContent, Job, NewsItem, Project } from "../types.js";

type NewsRow = RowDataPacket & {
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

type ProjectRow = RowDataPacket & {
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

type JobRow = RowDataPacket & {
  id: string;
  title: string;
  title_en: string;
  location: string;
  type: string;
  type_en: string;
  salary: string;
  description: string;
  description_en: string;
  requirements: string | string[];
  requirements_en: string | string[];
};

function toDateString(value: Date | string) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function parseJsonArray(value: string | string[]) {
  if (Array.isArray(value)) return value;
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
  const [rows] = await pool.query<NewsRow[]>("SELECT * FROM news ORDER BY published_date DESC, updated_at DESC");
  return rows.map(mapNews);
}

export async function listProjects() {
  const [rows] = await pool.query<ProjectRow[]>("SELECT * FROM projects ORDER BY year DESC, updated_at DESC");
  return rows.map(mapProject);
}

export async function listJobs() {
  const [rows] = await pool.query<JobRow[]>("SELECT * FROM jobs ORDER BY updated_at DESC");
  return rows.map(mapJob);
}

export async function getCmsContent(): Promise<CmsContent> {
  const [news, projects, jobs] = await Promise.all([listNews(), listProjects(), listJobs()]);
  return { news, projects, jobs };
}

export async function upsertNews(item: NewsItem) {
  await pool.execute<ResultSetHeader>(
    `INSERT INTO news
      (id, title, title_en, slug, published_date, category, category_en, thumbnail, excerpt, excerpt_en, content, content_en)
     VALUES
      (:id, :title, :titleEn, :slug, :date, :category, :categoryEn, :thumbnail, :excerpt, :excerptEn, :content, :contentEn)
     ON DUPLICATE KEY UPDATE
      title = VALUES(title), title_en = VALUES(title_en), slug = VALUES(slug),
      published_date = VALUES(published_date), category = VALUES(category), category_en = VALUES(category_en),
      thumbnail = VALUES(thumbnail), excerpt = VALUES(excerpt), excerpt_en = VALUES(excerpt_en),
      content = VALUES(content), content_en = VALUES(content_en)`,
    item
  );
  return item;
}

export async function upsertProject(item: Project) {
  await pool.execute<ResultSetHeader>(
    `INSERT INTO projects
      (id, name, name_en, location, year, category, category_en, image, description, description_en)
     VALUES
      (:id, :name, :nameEn, :location, :year, :category, :categoryEn, :image, :description, :descriptionEn)
     ON DUPLICATE KEY UPDATE
      name = VALUES(name), name_en = VALUES(name_en), location = VALUES(location), year = VALUES(year),
      category = VALUES(category), category_en = VALUES(category_en), image = VALUES(image),
      description = VALUES(description), description_en = VALUES(description_en)`,
    item
  );
  return item;
}

export async function upsertJob(item: Job) {
  await pool.execute<ResultSetHeader>(
    `INSERT INTO jobs
      (id, title, title_en, location, type, type_en, salary, description, description_en, requirements, requirements_en)
     VALUES
      (:id, :title, :titleEn, :location, :type, :typeEn, :salary, :description, :descriptionEn, :requirementsJson, :requirementsEnJson)
     ON DUPLICATE KEY UPDATE
      title = VALUES(title), title_en = VALUES(title_en), location = VALUES(location),
      type = VALUES(type), type_en = VALUES(type_en), salary = VALUES(salary),
      description = VALUES(description), description_en = VALUES(description_en),
      requirements = VALUES(requirements), requirements_en = VALUES(requirements_en)`,
    {
      ...item,
      requirementsJson: JSON.stringify(item.requirements),
      requirementsEnJson: JSON.stringify(item.requirementsEn),
    }
  );
  return item;
}

export async function deleteItem(table: "news" | "projects" | "jobs", id: string) {
  const [result] = await pool.execute<ResultSetHeader>(`DELETE FROM ${table} WHERE id = :id`, { id });
  return result.affectedRows > 0;
}

export async function replaceCmsContent(content: CmsContent) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query("DELETE FROM news");
    await connection.query("DELETE FROM projects");
    await connection.query("DELETE FROM jobs");
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
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
