export type NewsItem = {
  id: string;
  title: string;
  titleEn: string;
  slug: string;
  date: string;
  category: string;
  categoryEn: string;
  thumbnail: string;
  excerpt: string;
  excerptEn: string;
  content: string;
  contentEn: string;
};

export type Project = {
  id: string;
  name: string;
  nameEn: string;
  location: string;
  year: number;
  category: string;
  categoryEn: string;
  image: string;
  description: string;
  descriptionEn: string;
};

export type Job = {
  id: string;
  title: string;
  titleEn: string;
  location: string;
  type: string;
  typeEn: string;
  salary: string;
  description: string;
  descriptionEn: string;
  requirements: string[];
  requirementsEn: string[];
};

export type CmsContent = {
  news: NewsItem[];
  projects: Project[];
  jobs: Job[];
};
