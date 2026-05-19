import { pool } from "../../db/pool.js";
import type { Job } from "../../validators.js";
import type { QueryExecutor } from "../../lib/types.js";

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ListJobsParams = { page?: number; limit?: number; type?: string; location?: string };
export type ListJobsResult = { data: Job[]; total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean };

export async function listJobs(params: ListJobsParams = {}): Promise<ListJobsResult> {
  const limit = Math.min(params.limit ?? 20, 100);
  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const filterValues: unknown[] = [];
  let i = 1;

  if (params.type) {
    conditions.push(`(type=$${i} OR type_en=$${i})`);
    filterValues.push(params.type);
    i++;
  }
  if (params.location) {
    conditions.push(`location ILIKE $${i++}`);
    filterValues.push(`%${params.location}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limitParam = i++;
  const offsetParam = i;

  const [dataResult, countResult] = await Promise.all([
    pool.query<JobRow>(
      `SELECT * FROM jobs ${where} ORDER BY updated_at DESC LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...filterValues, limit, offset]
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM jobs ${where}`,
      filterValues
    ),
  ]);

  const total = Number(countResult.rows[0].count);
  const totalPages = Math.ceil(total / limit);
  return {
    data: dataResult.rows.map(mapJob),
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export async function getJob(idOrSlug: string): Promise<Job | null> {
  const col = UUID_RE.test(idOrSlug) ? "id" : "slug";
  const result = await pool.query<JobRow>(`SELECT * FROM jobs WHERE ${col} = $1`, [idOrSlug]);
  return result.rows[0] ? mapJob(result.rows[0]) : null;
}

export async function upsertJob(item: Job, executor: QueryExecutor = pool) {
  const slug = slugify(item.title);
  const slugEn = slugify(item.titleEn || item.title);
  await executor.query(
    `INSERT INTO jobs
      (id,title,title_en,slug,slug_en,location,type,type_en,salary,description,description_en,requirements,requirements_en)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13::jsonb)
     ON CONFLICT (id) DO UPDATE SET
      title=EXCLUDED.title, title_en=EXCLUDED.title_en, slug=EXCLUDED.slug,
      slug_en=EXCLUDED.slug_en, location=EXCLUDED.location,
      type=EXCLUDED.type, type_en=EXCLUDED.type_en, salary=EXCLUDED.salary,
      description=EXCLUDED.description, description_en=EXCLUDED.description_en,
      requirements=EXCLUDED.requirements, requirements_en=EXCLUDED.requirements_en,
      updated_at=CURRENT_TIMESTAMP`,
    [item.id, item.title, item.titleEn, slug, slugEn, item.location, item.type,
     item.typeEn, item.salary, item.description, item.descriptionEn,
     JSON.stringify(item.requirements), JSON.stringify(item.requirementsEn)]
  );
  return item;
}

export async function deleteJob(id: string) {
  const result = await pool.query("DELETE FROM jobs WHERE id=$1", [id]);
  return (result.rowCount ?? 0) > 0;
}
