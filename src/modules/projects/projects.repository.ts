import { pool } from "../../db/pool.js";
import type { QueryExecutor } from "../../db/pool.js";
import { slugify, UUID_RE } from "../../lib/slugify.js";
import type { Project } from "../../validators.js";

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

type ListProjectsParams = { page?: number; limit?: number; category?: string; year?: number };
export type ListProjectsResult = { data: Project[]; total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean };

export async function listProjects(params: ListProjectsParams = {}): Promise<ListProjectsResult> {
  const limit = Math.min(params.limit ?? 20, 100);
  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const filterValues: unknown[] = [];
  let i = 1;

  if (params.category) {
    conditions.push(`(category=$${i} OR category_en=$${i})`);
    filterValues.push(params.category);
    i++;
  }
  if (params.year) {
    conditions.push(`year=$${i++}`);
    filterValues.push(params.year);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limitParam = i++;
  const offsetParam = i;

  const [dataResult, countResult] = await Promise.all([
    pool.query<ProjectRow>(
      `SELECT id,name,name_en,location,year,category,category_en,image,description,description_en FROM projects ${where} ORDER BY year DESC, updated_at DESC LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...filterValues, limit, offset]
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM projects ${where}`,
      filterValues
    ),
  ]);

  const total = Number(countResult.rows[0].count);
  const totalPages = Math.ceil(total / limit);
  return {
    data: dataResult.rows.map(mapProject),
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export async function getProject(idOrSlug: string): Promise<Project | null> {
  const col = UUID_RE.test(idOrSlug) ? "id" : "slug";
  const result = await pool.query<ProjectRow>(
    `SELECT id,name,name_en,location,year,category,category_en,image,description,description_en FROM projects WHERE ${col} = $1`,
    [idOrSlug]
  );
  return result.rows[0] ? mapProject(result.rows[0]) : null;
}

export async function upsertProject(item: Project, executor: QueryExecutor = pool): Promise<Project> {
  const slug = slugify(item.name);
  const slugEn = slugify(item.nameEn || item.name);
  const result = await executor.query<ProjectRow>(
    `INSERT INTO projects
      (id,name,name_en,slug,slug_en,location,year,category,category_en,image,description,description_en)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (id) DO UPDATE SET
      name=EXCLUDED.name, name_en=EXCLUDED.name_en, slug=EXCLUDED.slug,
      slug_en=EXCLUDED.slug_en, location=EXCLUDED.location, year=EXCLUDED.year,
      category=EXCLUDED.category, category_en=EXCLUDED.category_en,
      image=EXCLUDED.image, description=EXCLUDED.description,
      description_en=EXCLUDED.description_en, updated_at=CURRENT_TIMESTAMP
     RETURNING id,name,name_en,location,year,category,category_en,image,description,description_en`,
    [item.id, item.name, item.nameEn, slug, slugEn, item.location, item.year,
     item.category, item.categoryEn, item.image, item.description, item.descriptionEn]
  );
  return mapProject(result.rows[0]);
}

export async function deleteProject(id: string) {
  const result = await pool.query("DELETE FROM projects WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
