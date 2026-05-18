import { pool } from "../../db/pool.js";
import type { ConsultationRequest } from "../../validators.js";

type ConsultationRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  service: string | null;
  message: string;
  status: "new" | "read" | "done";
  note: string | null;
  created_at: Date;
  updated_at: Date;
};

function mapConsultation(row: ConsultationRow) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    service: row.service ?? undefined,
    message: row.message,
    status: row.status,
    note: row.note ?? undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function createConsultation(data: ConsultationRequest) {
  const result = await pool.query<ConsultationRow>(
    `INSERT INTO consultation_requests (name,phone,email,service,message)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [data.name, data.phone, data.email ?? null, data.service ?? null, data.message]
  );
  return mapConsultation(result.rows[0]);
}

export async function listConsultations(status?: string) {
  const values: unknown[] = [];
  const where = status ? (values.push(status), "WHERE status=$1") : "";
  const result = await pool.query<ConsultationRow>(
    `SELECT * FROM consultation_requests ${where} ORDER BY created_at DESC`,
    values
  );
  return result.rows.map(mapConsultation);
}

export async function updateConsultation(
  id: string,
  data: { status?: "new" | "read" | "done"; note?: string }
) {
  const result = await pool.query<ConsultationRow>(
    `UPDATE consultation_requests
     SET status=COALESCE($2,status), note=COALESCE($3,note), updated_at=CURRENT_TIMESTAMP
     WHERE id=$1 RETURNING *`,
    [id, data.status ?? null, data.note ?? null]
  );
  return result.rows[0] ? mapConsultation(result.rows[0]) : null;
}

export async function deleteConsultation(id: string) {
  const result = await pool.query("DELETE FROM consultation_requests WHERE id=$1", [id]);
  return (result.rowCount ?? 0) > 0;
}
