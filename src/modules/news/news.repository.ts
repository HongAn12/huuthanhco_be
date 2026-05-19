import { pool } from "../../db/pool.js";
import type { QueryExecutor } from "../../db/pool.js";
import { UUID_RE } from "../../lib/slugify.js";
import type { NewsItem } from "../../validators.js";

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

function toDateString(value: Date | string) {
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value).slice(0, 10);
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

export async function listNews(): Promise<NewsItem[]> {
  const result = await pool.query<NewsRow>(
    "SELECT * FROM news ORDER BY published_date DESC, updated_at DESC"
  );
  return result.rows.map(mapNews);
}

export async function getNews(idOrSlug: string): Promise<NewsItem | null> {
  const col = UUID_RE.test(idOrSlug) ? "id" : "slug";
  const result = await pool.query<NewsRow>(`SELECT * FROM news WHERE ${col} = $1`, [idOrSlug]);
  return result.rows[0] ? mapNews(result.rows[0]) : null;
}

export async function upsertNews(item: NewsItem, executor: QueryExecutor = pool): Promise<NewsItem> {
  const result = await executor.query<NewsRow>(
    `INSERT INTO news
      (id, title, title_en, slug, published_date, category, category_en, thumbnail, excerpt, excerpt_en, content, content_en)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (id) DO UPDATE SET
      title=EXCLUDED.title, title_en=EXCLUDED.title_en, slug=EXCLUDED.slug,
      published_date=EXCLUDED.published_date, category=EXCLUDED.category,
      category_en=EXCLUDED.category_en, thumbnail=EXCLUDED.thumbnail,
      excerpt=EXCLUDED.excerpt, excerpt_en=EXCLUDED.excerpt_en,
      content=EXCLUDED.content, content_en=EXCLUDED.content_en,
      updated_at=CURRENT_TIMESTAMP
     RETURNING *`,
    [item.id, item.title, item.titleEn, item.slug, item.date, item.category,
     item.categoryEn, item.thumbnail, item.excerpt, item.excerptEn, item.content, item.contentEn]
  );
  return mapNews(result.rows[0]);
}

export async function deleteNews(id: string) {
  const result = await pool.query("DELETE FROM news WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
