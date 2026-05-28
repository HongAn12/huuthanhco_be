import { pool } from "../../db/pool.js";
import type { JobApplication } from "../../validators.js";

type JobApplicationRow = {
  id: string;
  job_id: string | null;
  full_name: string;
  phone: string;
  email: string | null;
  position_applied: string | null;
  cv_storage_key: string | null;
  cv_file_name: string | null;
  cv_content_type: string | null;
  cv_file_size: number | null;
  message: string | null;
  status: string;
  note: string | null;
  created_at: Date;
  updated_at: Date;
};

export type StoredCvFile = {
  key: string;
  fileName: string;
  fileType: string;
  fileSize: number;
};

type JobApplicationWithJobRow = JobApplicationRow & {
  job_title: string | null;
  job_title_en: string | null;
};

function mapApplication(row: JobApplicationRow) {
  return {
    id: row.id,
    jobId: row.job_id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email ?? undefined,
    positionApplied: row.position_applied ?? undefined,
    hasCv: Boolean(row.cv_storage_key),
    cvFileName: row.cv_file_name ?? undefined,
    cvContentType: row.cv_content_type ?? undefined,
    cvFileSize: row.cv_file_size ?? undefined,
    message: row.message ?? "",
    status: row.status as "new" | "reviewing" | "interviewed" | "hired" | "rejected",
    note: row.note ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function mapApplicationWithJob(row: JobApplicationWithJobRow) {
  return {
    ...mapApplication(row),
    jobTitle: row.job_title ?? undefined,
    jobTitleEn: row.job_title_en ?? undefined,
  };
}

export async function createJobApplication(data: JobApplication, cvFile?: StoredCvFile) {
  const result = await pool.query<JobApplicationRow>(
    `INSERT INTO job_applications
       (job_id,full_name,phone,email,position_applied,cv_storage_key,cv_file_name,cv_content_type,cv_file_size,message)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [
      data.jobId ?? null,
      data.fullName,
      data.phone,
      data.email ?? null,
      data.positionApplied ?? null,
      cvFile?.key ?? null,
      cvFile?.fileName ?? null,
      cvFile?.fileType ?? null,
      cvFile?.fileSize ?? null,
      data.message,
    ]
  );
  return mapApplication(result.rows[0]);
}

export async function getJobApplicationCv(id: string): Promise<StoredCvFile | null> {
  const result = await pool.query<Pick<JobApplicationRow, "cv_storage_key" | "cv_file_name" | "cv_content_type" | "cv_file_size">>(
    `SELECT cv_storage_key, cv_file_name, cv_content_type, cv_file_size
     FROM job_applications WHERE id=$1`,
    [id]
  );
  const row = result.rows[0];
  if (!row?.cv_storage_key || !row.cv_file_name || !row.cv_content_type || !row.cv_file_size) return null;
  return {
    key: row.cv_storage_key,
    fileName: row.cv_file_name,
    fileType: row.cv_content_type,
    fileSize: row.cv_file_size,
  };
}

export async function listJobApplications(filters: {
  status?: string;
  jobId?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (filters.status) { conditions.push(`ja.status=$${i++}`); values.push(filters.status); }
  if (filters.jobId) { conditions.push(`ja.job_id=$${i++}`); values.push(filters.jobId); }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;

  values.push(limit, offset);
  const result = await pool.query<JobApplicationWithJobRow>(
    `SELECT ja.*, j.title AS job_title, j.title_en AS job_title_en
     FROM job_applications ja
     LEFT JOIN jobs j ON j.id = ja.job_id
     ${where}
     ORDER BY ja.created_at DESC
     LIMIT $${i++} OFFSET $${i++}`,
    values
  );

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM job_applications ja ${where}`,
    values.slice(0, values.length - 2)
  );

  return {
    data: result.rows.map(mapApplicationWithJob),
    total: Number(countResult.rows[0].count),
    limit,
    offset,
  };
}

export async function getJobApplication(id: string) {
  const result = await pool.query<JobApplicationWithJobRow>(
    `SELECT ja.*, j.title AS job_title, j.title_en AS job_title_en
     FROM job_applications ja
     LEFT JOIN jobs j ON j.id = ja.job_id
     WHERE ja.id=$1`,
    [id]
  );
  return result.rows[0] ? mapApplicationWithJob(result.rows[0]) : null;
}

export async function updateJobApplication(
  id: string,
  data: { status?: string; note?: string }
) {
  const result = await pool.query<JobApplicationRow>(
    `UPDATE job_applications
     SET status=COALESCE($2,status), note=COALESCE($3,note), updated_at=CURRENT_TIMESTAMP
     WHERE id=$1 RETURNING *`,
    [id, data.status ?? null, data.note ?? null]
  );
  return result.rows[0] ? mapApplication(result.rows[0]) : null;
}

export async function deleteJobApplication(id: string) {
  const result = await pool.query("DELETE FROM job_applications WHERE id=$1", [id]);
  return (result.rowCount ?? 0) > 0;
}
