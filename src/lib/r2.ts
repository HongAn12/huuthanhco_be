import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import crypto from "node:crypto";
import path from "node:path";
import { env } from "../config/env.js";

export const r2 = new S3Client({
  region: "auto",
  endpoint: env.r2Endpoint,
  credentials: {
    accessKeyId: env.r2AccessKeyId,
    secretAccessKey: env.r2SecretAccessKey,
  },
});

export interface UploadedFile {
  key: string;
  url: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export async function uploadToR2(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder = "general"
): Promise<UploadedFile> {
  const ext = path.extname(originalName).toLowerCase();
  const uuid = crypto.randomUUID();
  const key = `${folder}/${uuid}${ext}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: env.r2Bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    })
  );

  const baseUrl = env.r2PublicUrl.replace(/\/$/, "");
  const url = `${baseUrl}/${key}`;

  return { key, url, fileName: originalName, fileType: mimeType, fileSize: buffer.length };
}
