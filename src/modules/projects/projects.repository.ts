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
