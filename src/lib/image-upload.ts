import multer from "multer";
import path from "node:path";

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_FILES = 10;

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: MAX_IMAGE_FILES },
});

type VerifiedImage = {
  buffer: Buffer;
  fileName: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
};

export function verifyImageUpload(file: Express.Multer.File): VerifiedImage {
  const detected = detectImageType(file.buffer);
  if (!detected) {
    throw Object.assign(new Error("Chi ho tro anh PNG, JPG, WEBP hoac GIF hop le."), { status: 400 });
  }

  const baseName =
    path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "image";

  return {
    buffer: file.buffer,
    fileName: `${baseName}.${detected.extension}`,
    mimeType: detected.mimeType,
  };
}

export function sanitizeStorageFolder(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9/_-]/g, "-")
    .replace(/\/+/g, "/")
    .replace(/-+/g, "-")
    .replace(/^\/+|\/+$/g, "") || "general";
}

function detectImageType(buffer: Buffer) {
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer.subarray(1, 4).toString("ascii") === "PNG" &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mimeType: "image/png" as const, extension: "png" };
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: "image/jpeg" as const, extension: "jpg" };
  }

  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return { mimeType: "image/webp" as const, extension: "webp" };
  }

  const gifSignature = buffer.subarray(0, 6).toString("ascii");
  if (gifSignature === "GIF87a" || gifSignature === "GIF89a") {
    return { mimeType: "image/gif" as const, extension: "gif" };
  }

  return null;
}
