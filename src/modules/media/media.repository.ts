import { pool } from "../../db/pool.js";
import type { MediaFile } from "../../validators.js";

type MediaRow = {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  folder: string | null;
  alt_text: string | null;
  alt_text_en: string | null;
  created_at: Date;
  updated_at: Date;
};

function mapMedia(row: MediaRow) {
  return {
    id: row.id,
    fileName: row.file_name,
    fileUrl: row.file_url,
    fileType: row.file_type ?? undefined,
    fileSize: row.file_size ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    folder: row.folder ?? "general",
    altText: row.alt_text ?? "",
    altTextEn: row.alt_text_en ?? "",
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listMedia(filters: { folder?: string; fileType?: string } = {}) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (filters.folder) { conditions.push(`folder=$${i++}`); values.push(filters.folder); }
  if (filters.fileType) { conditions.push(`file_type=$${i++}`); values.push(filters.fileType); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await pool.query<MediaRow>(
    `SELECT * FROM media_files ${where} ORDER BY created_at DESC`,
    values
  );
  return result.rows.map(mapMedia);
}

export async function getMedia(id: string) {
  const result = await pool.query<MediaRow>("SELECT * FROM media_files WHERE id=$1", [id]);
  return result.rows[0] ? mapMedia(result.rows[0]) : null;
}

export async function createMedia(data: MediaFile) {
  const result = await pool.query<MediaRow>(
    `INSERT INTO media_files (file_name,file_url,file_type,file_size,width,height,folder,alt_text,alt_text_en)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      data.fileName, data.fileUrl, data.fileType ?? null,
      data.fileSize ?? null, data.width ?? null, data.height ?? null,
      data.folder, data.altText, data.altTextEn,
    ]
  );
  return mapMedia(result.rows[0]);
}

export async function updateMedia(id: string, data: Partial<MediaFile>) {
  const sets: string[] = [];
  const values: unknown[] = [id];
  let i = 2;
  if (data.fileName !== undefined) { sets.push(`file_name=$${i++}`); values.push(data.fileName); }
  if (data.fileUrl !== undefined) { sets.push(`file_url=$${i++}`); values.push(data.fileUrl); }
  if (data.folder !== undefined) { sets.push(`folder=$${i++}`); values.push(data.folder); }
  if (data.altText !== undefined) { sets.push(`alt_text=$${i++}`); values.push(data.altText); }
  if (data.altTextEn !== undefined) { sets.push(`alt_text_en=$${i++}`); values.push(data.altTextEn); }
  if (!sets.length) return getMedia(id);
  sets.push("updated_at=CURRENT_TIMESTAMP");
  const result = await pool.query<MediaRow>(
    `UPDATE media_files SET ${sets.join(",")} WHERE id=$1 RETURNING *`,
    values
  );
  return result.rows[0] ? mapMedia(result.rows[0]) : null;
}

export async function deleteMedia(id: string) {
  const result = await pool.query("DELETE FROM media_files WHERE id=$1", [id]);
  return (result.rowCount ?? 0) > 0;
}
