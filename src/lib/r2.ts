import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
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

export interface PrivateUploadedFile {
  key: string;
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
  const key = storageKey(folder, originalName);

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

export async function uploadPrivateToR2(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder = "private/job-applications"
): Promise<PrivateUploadedFile> {
  const key = storageKey(folder, originalName);

  await r2.send(
    new PutObjectCommand({
      Bucket: env.r2Bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ContentDisposition: contentDisposition("attachment", originalName),
    })
  );

  return { key, fileName: originalName, fileType: mimeType, fileSize: buffer.length };
}

export async function privateFileSignedUrl(
  key: string,
  fileName: string,
  mode: "inline" | "attachment" = "inline"
) {
  return getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: env.r2Bucket,
      Key: key,
      ResponseContentDisposition: contentDisposition(mode, fileName),
      ResponseContentType: "application/pdf",
    }),
    { expiresIn: 300 }
  );
}

export async function deleteR2Object(key: string) {
  await r2.send(new DeleteObjectCommand({ Bucket: env.r2Bucket, Key: key }));
}

function storageKey(folder: string, originalName: string) {
  const safeFolder = folder
    .toLowerCase()
    .replace(/[^a-z0-9/_-]/g, "-")
    .replace(/^\/+|\/+$/g, "");
  const ext = path.extname(originalName).toLowerCase().replace(/[^a-z0-9.]/g, "");
  return `${safeFolder || "general"}/${crypto.randomUUID()}${ext}`;
}

function contentDisposition(mode: "inline" | "attachment", fileName: string) {
  const asciiName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-") || "document.pdf";
  return `${mode}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
