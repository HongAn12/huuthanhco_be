import { z } from "zod";

export const newsSchema = z.object({
  id: z.string().min(1),
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
  id: z.string().min(1),
  name: z.string().min(1),
  nameEn: z.string().min(1),
  location: z.string().min(1),
  year: z.number().int().min(1900).max(2200),
  category: z.string().min(1),
  categoryEn: z.string().min(1),
  image: z.string().min(1),
  description: z.string().default(""),
  descriptionEn: z.string().default(""),
});

export const jobSchema = z.object({
  id: z.string().min(1),
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
