import { pool } from "../../db/pool.js";

type SettingRow = {
  key: string;
  value: string | null;
  value_en: string | null;
  type: string;
  updated_at: Date;
};

export type Setting = {
  key: string;
  value: string | null;
  valueEn: string | null;
  type: string;
  updatedAt: string;
};

function mapSetting(row: SettingRow): Setting {
  return {
    key: row.key,
    value: row.value,
    valueEn: row.value_en,
    type: row.type,
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function getAllSettings(prefix?: string): Promise<Setting[]> {
  const values: unknown[] = [];
  const where = prefix ? (values.push(`${prefix}%`), "WHERE key LIKE $1") : "";
  const result = await pool.query<SettingRow>(
    `SELECT key, value, value_en, type, updated_at FROM site_settings ${where} ORDER BY key`,
    values
  );
  return result.rows.map(mapSetting);
}

export async function getSettingsByKeys(keys: string[]): Promise<Setting[]> {
  const result = await pool.query<SettingRow>(
    "SELECT key,value,value_en,type,updated_at FROM site_settings WHERE key = ANY($1) ORDER BY key",
    [keys]
  );
  return result.rows.map(mapSetting);
}

export async function getSetting(key: string): Promise<Setting | null> {
  const result = await pool.query<SettingRow>(
    "SELECT key,value,value_en,type,updated_at FROM site_settings WHERE key=$1",
    [key]
  );
  return result.rows[0] ? mapSetting(result.rows[0]) : null;
}

export async function upsertSetting(
  key: string,
  data: { value: string; valueEn?: string; type?: string }
): Promise<Setting> {
  const result = await pool.query<SettingRow>(
    `INSERT INTO site_settings (key, value, value_en, type)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (key) DO UPDATE SET
       value = EXCLUDED.value,
       value_en = EXCLUDED.value_en,
       type = EXCLUDED.type,
       updated_at = CURRENT_TIMESTAMP
     RETURNING key,value,value_en,type,updated_at`,
    [key, data.value, data.valueEn ?? null, data.type ?? "text"]
  );
  return mapSetting(result.rows[0]);
}

export async function upsertSettingsBulk(
  items: Array<{ key: string; value: string; valueEn?: string; type?: string }>
): Promise<Setting[]> {
  if (!items.length) return [];

  const values: unknown[] = [];
  const rows = items.map((item, i) => {
    const base = i * 4;
    values.push(item.key, item.value, item.valueEn ?? null, item.type ?? "text");
    return `($${base + 1},$${base + 2},$${base + 3},$${base + 4})`;
  });

  const result = await pool.query<SettingRow>(
    `INSERT INTO site_settings (key,value,value_en,type) VALUES ${rows.join(",")}
     ON CONFLICT (key) DO UPDATE SET
       value=EXCLUDED.value, value_en=EXCLUDED.value_en,
       type=EXCLUDED.type, updated_at=CURRENT_TIMESTAMP
     RETURNING key,value,value_en,type,updated_at`,
    values
  );
  return result.rows.map(mapSetting);
}

export async function deleteSetting(key: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM site_settings WHERE key=$1", [key]);
  return (result.rowCount ?? 0) > 0;
}

// Trả về object { key: value } — dễ dùng ở frontend
export async function getSettingsAsMap(prefix?: string): Promise<Record<string, string | null>> {
  const settings = await getAllSettings(prefix);
  return Object.fromEntries(settings.map(s => [s.key, s.value]));
}
