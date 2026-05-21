import { z } from "zod";

export const newsSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  titleEn: z.string().min(1),
  slug: z.string().min(1),
  date: z.string().min(1),
  category: z.string().min(1),
  categoryEn: z.string().min(1),
  thumbnail: z.string().min(1),
  excerpt: z.string().default(""),
  excerptEn: z.string().default(""),
  content: z.string().default(""),
  contentEn: z.string().default(""),
});

export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  nameEn: z.string().min(1),
  location: z.string().min(1),
  year: z.number().int().min(1900).max(2200),
  category: z.string().min(1),
  categoryEn: z.string().min(1),
  image: z.string().min(1),
  galleryImages: z.array(z.string().min(1)).default([]),
  description: z.string().default(""),
  descriptionEn: z.string().default(""),
});

export const jobSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  titleEn: z.string().min(1),
  location: z.string().min(1),
  type: z.string().min(1),
  typeEn: z.string().min(1),
  salary: z.string().min(1),
  description: z.string().default(""),
  descriptionEn: z.string().default(""),
  requirements: z.array(z.string()).default([]),
  requirementsEn: z.array(z.string()).default([]),
});

export const cmsContentSchema = z.object({
  news: z.array(newsSchema).default([]),
  projects: z.array(projectSchema).default([]),
  jobs: z.array(jobSchema).default([]),
});

export const consultationSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  service: z.string().optional(),
  message: z.string().default(""),
});

export const projectImageSchema = z.object({
  url: z.string().min(1),
  caption: z.string().default(""),
  captionEn: z.string().default(""),
  sortOrder: z.number().int().min(0).default(0),
});

export const adminUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  role: z.enum(["super_admin", "editor", "hr", "viewer"]).default("editor"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const settingUpsertSchema = z.object({
  value: z.string(),
  valueEn: z.string().optional(),
  type: z.enum(["text", "html", "json", "number", "boolean"]).default("text"),
});

export const settingBulkSchema = z.array(
  z.object({
    key: z.string().min(1),
    value: z.string(),
    valueEn: z.string().optional(),
    type: z.enum(["text", "html", "json", "number", "boolean"]).default("text"),
  })
);

export const jobApplicationSchema = z.object({
  jobId: z.string().uuid().nullish(),
  fullName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  positionApplied: z.string().optional(),
  cvFileUrl: z.string().url().optional(),
  message: z.string().default(""),
});

export const mediaFileSchema = z.object({
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  fileType: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  folder: z.string().default("general"),
  altText: z.string().default(""),
  altTextEn: z.string().default(""),
});

export type NewsItem = z.infer<typeof newsSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Job = z.infer<typeof jobSchema>;
export type CmsContent = z.infer<typeof cmsContentSchema>;
export type ConsultationRequest = z.infer<typeof consultationSchema>;
export type ProjectImage = z.infer<typeof projectImageSchema>;
export type JobApplication = z.infer<typeof jobApplicationSchema>;
export type MediaFile = z.infer<typeof mediaFileSchema>;
