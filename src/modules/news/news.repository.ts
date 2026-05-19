import { pool } from "../../db/pool.js";
import type { NewsItem } from "../../validators.js";
import type { QueryExecutor } from "../../lib/types.js";

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ListNewsParams = { page?: number; limit?: number; category?: string };
export type ListNewsResult = { data: NewsItem[]; total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean };

export async function listNews(params: ListNewsParams = {}): Promise<ListNewsResult> {
  const limit = Math.min(params.limit ?? 20, 100);
  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * limit;

  const filterValues: unknown[] = [];
  let i = 1;
  let where = "";

  if (params.category) {
    where = `WHERE (category=$${i} OR category_en=$${i})`;
    filterValues.push(params.category);
    i++;
  }

  const limitParam = i++;
  const offsetParam = i;

  const [dataResult, countResult] = await Promise.all([
    pool.query<NewsRow>(
      `SELECT * FROM news ${where} ORDER BY published_date DESC, updated_at DESC LIMIT $${limitParam} OFFSET $${offsetParam}`,
      [...filterValues, limit, offset]
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM news ${where}`,
      filterValues
    ),
  ]);

  const total = Number(countResult.rows[0].count);
  const totalPages = Math.ceil(total / limit);
  return {
    data: dataResult.rows.map(mapNews),
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export async function getNews(idOrSlug: string): Promise<NewsItem | null> {
  const col = UUID_RE.test(idOrSlug) ? "id" : "slug";
  const result = await pool.query<NewsRow>(`SELECT * FROM news WHERE ${col} = $1`, [idOrSlug]);
  return result.rows[0] ? mapNews(result.rows[0]) : null;
}

export async function upsertNews(item: NewsItem, executor: QueryExecutor = pool) {
  await executor.query(
    `INSERT INTO news
      (id, title, title_en, slug, published_date, category, category_en, thumbnail, excerpt, excerpt_en, content, content_en)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (id) DO UPDATE SET
      title=EXCLUDED.title, title_en=EXCLUDED.title_en, slug=EXCLUDED.slug,
      published_date=EXCLUDED.published_date, category=EXCLUDED.category,
      category_en=EXCLUDED.category_en, thumbnail=EXCLUDED.thumbnail,
      excerpt=EXCLUDED.excerpt, excerpt_en=EXCLUDED.excerpt_en,
      content=EXCLUDED.content, content_en=EXCLUDED.content_en,
      updated_at=CURRENT_TIMESTAMP`,
    [item.id, item.title, item.titleEn, item.slug, item.date, item.category,
     item.categoryEn, item.thumbnail, item.excerpt, item.excerptEn, item.content, item.contentEn]
  );
  return item;
}

export async function deleteNews(id: string) {
  const result = await pool.query("DELETE FROM news WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
