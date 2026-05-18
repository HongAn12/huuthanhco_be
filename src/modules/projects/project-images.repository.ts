import type { PoolClient } from "pg";
import { pool } from "../../db/pool.js";
import type { ProjectImage } from "../../validators.js";

type ProjectImageRow = {
  id: string;
  project_id: string;
  url: string;
  caption: string;
  caption_en: string;
  sort_order: number;
};

function mapImage(row: ProjectImageRow) {
  return {
    id: row.id,
    projectId: row.project_id,
    url: row.url,
    caption: row.caption,
    captionEn: row.caption_en,
    sortOrder: row.sort_order,
  };
}

const COLS = "id, project_id, url, caption, caption_en, sort_order";

export async function listProjectImages(projectId: string) {
  const result = await pool.query<ProjectImageRow>(
    `SELECT ${COLS} FROM project_images WHERE project_id = $1 ORDER BY sort_order ASC, created_at ASC`,
    [projectId]
  );
  return result.rows.map(mapImage);
}

export async function addProjectImage(projectId: string, data: ProjectImage) {
  const result = await pool.query<ProjectImageRow>(
    `INSERT INTO project_images (project_id, url, caption, caption_en, sort_order)
     VALUES ($1,$2,$3,$4,$5) RETURNING ${COLS}`,
    [projectId, data.url, data.caption, data.captionEn, data.sortOrder]
  );
  return mapImage(result.rows[0]);
}

export async function updateProjectImage(id: string, data: Partial<ProjectImage>) {
  const sets: string[] = [];
  const values: unknown[] = [id];
  let i = 2;
  if (data.url !== undefined) { sets.push(`url=$${i++}`); values.push(data.url); }
  if (data.caption !== undefined) { sets.push(`caption=$${i++}`); values.push(data.caption); }
  if (data.captionEn !== undefined) { sets.push(`caption_en=$${i++}`); values.push(data.captionEn); }
  if (data.sortOrder !== undefined) { sets.push(`sort_order=$${i++}`); values.push(data.sortOrder); }
  if (!sets.length) return null;
  const result = await pool.query<ProjectImageRow>(
    `UPDATE project_images SET ${sets.join(",")} WHERE id=$1 RETURNING ${COLS}`,
    values
  );
  return result.rows[0] ? mapImage(result.rows[0]) : null;
}

export async function deleteProjectImage(id: string) {
  const result = await pool.query("DELETE FROM project_images WHERE id=$1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function reorderProjectImages(projectId: string, orderedIds: string[]) {
  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");
    await Promise.all(
      orderedIds.map((id, i) =>
        client.query(
          "UPDATE project_images SET sort_order=$1 WHERE id=$2 AND project_id=$3",
          [i, id, projectId]
        )
      )
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return listProjectImages(projectId);
}
