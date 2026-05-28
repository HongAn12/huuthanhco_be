import multer from "multer";
import path from "node:path";

export const MAX_CV_SIZE_BYTES = 5 * 1024 * 1024;

export const cvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CV_SIZE_BYTES, files: 1 },
});

export type VerifiedCv = {
  buffer: Buffer;
  fileName: string;
  mimeType: "application/pdf";
  fileSize: number;
};

export function verifyCvUpload(file: Express.Multer.File): VerifiedCv {
  if (file.buffer.length < 5 || file.buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw Object.assign(new Error("CV phai la tep PDF hop le."), { status: 400 });
  }

  const baseName =
    path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "cv";

  return {
    buffer: file.buffer,
    fileName: `${baseName}.pdf`,
    mimeType: "application/pdf",
    fileSize: file.buffer.length,
  };
}
