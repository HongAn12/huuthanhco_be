import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { ZodError } from "zod";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", details: error.flatten() });
    return;
  }
  if (error instanceof multer.MulterError) {
    res.status(400).json({ error: error.code === "LIMIT_FILE_SIZE" ? "File vuot qua gioi han kich thuoc." : error.message });
    return;
  }
  if (error && typeof error === "object" && "status" in error && typeof error.status === "number") {
    res.status(error.status).json({ error: error instanceof Error ? error.message : "Request rejected" });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
};
