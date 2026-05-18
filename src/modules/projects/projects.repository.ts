import { pool } from "../../db/pool.js";
import type { Project } from "../../validators.js";
import type { QueryExecutor } from "../../lib/types.js";

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

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function listProjects(): Promise<Project[]> {
  const result = await pool.query<ProjectRow>(
    "SELECT id,name,name_en,location,year,category,category_en,image,description,description_en FROM projects ORDER BY year DESC, updated_at DESC"
  );
  return result.rows.map(mapProject);
}

export async function getProject(idOrSlug: string): Promise<Project | null> {
  const col = UUID_RE.test(idOrSlug) ? "id" : "slug";
  const result = await pool.query<ProjectRow>(
    `SELECT id,name,name_en,location,year,category,category_en,image,description,description_en FROM projects WHERE ${col} = $1`,
    [idOrSlug]
  );
  return result.rows[0] ? mapProject(result.rows[0]) : null;
}

export async function upsertProject(item: Project, executor: QueryExecutor = pool) {
  const slug = slugify(item.name);
  const slugEn = slugify(item.nameEn || item.name);
  await executor.query(
    `INSERT INTO projects
      (id,name,name_en,slug,slug_en,location,year,category,category_en,image,description,description_en)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (id) DO UPDATE SET
      name=EXCLUDED.name, name_en=EXCLUDED.name_en, slug=EXCLUDED.slug,
      slug_en=EXCLUDED.slug_en, location=EXCLUDED.location, year=EXCLUDED.year,
      category=EXCLUDED.category, category_en=EXCLUDED.category_en,
      image=EXCLUDED.image, description=EXCLUDED.description,
      description_en=EXCLUDED.description_en, updated_at=CURRENT_TIMESTAMP`,
    [item.id, item.name, item.nameEn, slug, slugEn, item.location, item.year,
     item.category, item.categoryEn, item.image, item.description, item.descriptionEn]
  );
  return item;
}

export async function deleteProject(id: string) {
  const result = await pool.query("DELETE FROM projects WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
