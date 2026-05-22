import type { PoolClient } from "pg";
import { pool } from "../../db/pool.js";
import type { QueryExecutor } from "../../db/pool.js";
import type { NewsImage } from "../../validators.js";

type NewsImageRow = {
  id: string;
  news_id: string;
  url: string;
  caption: string;
  caption_en: string;
  sort_order: number;
};

function mapImage(row: NewsImageRow) {
  return {
    id: row.id,
    newsId: row.news_id,
    url: row.url,
    caption: row.caption,
    captionEn: row.caption_en,
    sortOrder: row.sort_order,
  };
}

const COLS = "id, news_id, url, caption, caption_en, sort_order";

export async function listNewsImages(newsId: string) {
  const result = await pool.query<NewsImageRow>(
    `SELECT ${COLS} FROM news_images WHERE news_id = $1 ORDER BY sort_order ASC, created_at ASC`,
    [newsId]
  );
  return result.rows.map(mapImage);
}

export async function addNewsImage(newsId: string, data: NewsImage) {
  const result = await pool.query<NewsImageRow>(
    `INSERT INTO news_images (news_id, url, caption, caption_en, sort_order)
     VALUES ($1,$2,$3,$4,$5) RETURNING ${COLS}`,
    [newsId, data.url, data.caption, data.captionEn, data.sortOrder]
  );
  return mapImage(result.rows[0]);
}

export async function bulkAddNewsImages(newsId: string, urls: string[]) {
  if (!urls.length) return [];
  const countResult = await pool.query<{ max: number | null }>(
    "SELECT MAX(sort_order) AS max FROM news_images WHERE news_id = $1",
    [newsId]
  );
  const base = (countResult.rows[0]?.max ?? -1) + 1;
  const results = await Promise.all(
    urls.map((url, i) =>
      pool.query<NewsImageRow>(
        `INSERT INTO news_images (news_id, url, caption, caption_en, sort_order)
         VALUES ($1,$2,'','',$3) RETURNING ${COLS}`,
        [newsId, url, base + i]
      )
    )
  );
  return results.map((r) => mapImage(r.rows[0]));
}

export async function updateNewsImage(id: string, data: Partial<NewsImage>) {
  const sets: string[] = [];
  const values: unknown[] = [id];
  let i = 2;
  if (data.url !== undefined) { sets.push(`url=$${i++}`); values.push(data.url); }
  if (data.caption !== undefined) { sets.push(`caption=$${i++}`); values.push(data.caption); }
  if (data.captionEn !== undefined) { sets.push(`caption_en=$${i++}`); values.push(data.captionEn); }
  if (data.sortOrder !== undefined) { sets.push(`sort_order=$${i++}`); values.push(data.sortOrder); }
  if (!sets.length) return null;
  const result = await pool.query<NewsImageRow>(
    `UPDATE news_images SET ${sets.join(",")} WHERE id=$1 RETURNING ${COLS}`,
    values
  );
  return result.rows[0] ? mapImage(result.rows[0]) : null;
}

export async function deleteNewsImage(id: string) {
  const result = await pool.query("DELETE FROM news_images WHERE id=$1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function reorderNewsImages(newsId: string, orderedIds: string[]) {
  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");
    await Promise.all(
      orderedIds.map((id, i) =>
        client.query(
          "UPDATE news_images SET sort_order=$1 WHERE id=$2 AND news_id=$3",
          [i, id, newsId]
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
  return listNewsImages(newsId);
}

export async function replaceNewsImages(newsId: string, imageUrls: string[], executor: QueryExecutor = pool) {
  const urls = Array.from(new Set(imageUrls.map((u) => u.trim()).filter(Boolean)));
  await executor.query("DELETE FROM news_images WHERE news_id = $1", [newsId]);
  await Promise.all(
    urls.map((url, sortOrder) =>
      executor.query(
        `INSERT INTO news_images (news_id, url, caption, caption_en, sort_order) VALUES ($1,$2,'','',$3)`,
        [newsId, url, sortOrder]
      )
    )
  );
}
