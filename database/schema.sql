CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  published_date DATE NOT NULL,
  category VARCHAR(120) NOT NULL,
  category_en VARCHAR(120) NOT NULL,
  thumbnail TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  excerpt_en TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  content_en TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  slug_en VARCHAR(255),
  location VARCHAR(255) NOT NULL,
  year INT NOT NULL,
  category VARCHAR(120) NOT NULL,
  category_en VARCHAR(120) NOT NULL,
  image TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  caption_en TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_images' AND column_name = 'image_url'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_images' AND column_name = 'url'
  ) THEN
    ALTER TABLE project_images RENAME COLUMN image_url TO url;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_images' AND column_name = 'alt_text'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_images' AND column_name = 'caption'
  ) THEN
    ALTER TABLE project_images RENAME COLUMN alt_text TO caption;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_images' AND column_name = 'alt_text_en'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'project_images' AND column_name = 'caption_en'
  ) THEN
    ALTER TABLE project_images RENAME COLUMN alt_text_en TO caption_en;
  END IF;
END $$;

ALTER TABLE project_images ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE project_images ADD COLUMN IF NOT EXISTS caption TEXT NOT NULL DEFAULT '';
ALTER TABLE project_images ADD COLUMN IF NOT EXISTS caption_en TEXT NOT NULL DEFAULT '';
ALTER TABLE project_images ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;
ALTER TABLE project_images ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE project_images ALTER COLUMN url SET NOT NULL;

CREATE TABLE IF NOT EXISTS news_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES news(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  caption_en TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  slug_en VARCHAR(255),
  location VARCHAR(255) NOT NULL,
  type VARCHAR(120) NOT NULL,
  type_en VARCHAR(120) NOT NULL,
  salary VARCHAR(120) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  requirements_en JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consultation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  service VARCHAR(255),
  message TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'new',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'full_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'name'
  ) THEN
    ALTER TABLE consultation_requests RENAME COLUMN full_name TO name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'service_interest'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'service'
  ) THEN
    ALTER TABLE consultation_requests RENAME COLUMN service_interest TO service;
  END IF;
END $$;

ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS service VARCHAR(255);
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '';
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'new';
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE consultation_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE consultation_requests ALTER COLUMN name SET NOT NULL;
ALTER TABLE consultation_requests ALTER COLUMN phone SET NOT NULL;

CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(120) NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO admin_roles (name, display_name, description, permissions)
VALUES
  ('super_admin', 'Super Admin', 'Full system access', '["*"]'::jsonb),
  ('editor', 'Editor', 'Content editor', '["content:read","content:write"]'::jsonb),
  ('hr', 'HR', 'Hiring manager', '["jobs:read","jobs:write","applications:read","applications:write"]'::jsonb),
  ('viewer', 'Viewer', 'Read-only access', '["read"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES admin_roles(id),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  status VARCHAR(50) DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  last_login_ip VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE admin_users RENAME COLUMN name TO full_name;
  END IF;
END $$;

ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES admin_roles(id);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(100);
UPDATE admin_users SET full_name = email WHERE full_name IS NULL;
UPDATE admin_users
SET role_id = (SELECT id FROM admin_roles WHERE name = 'super_admin')
WHERE role_id IS NULL;
ALTER TABLE admin_users ALTER COLUMN full_name SET NOT NULL;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  position_applied VARCHAR(255),
  cv_file_url TEXT,
  message TEXT DEFAULT '',
  status VARCHAR(50) DEFAULT 'new',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT,
  value_en TEXT,
  type VARCHAR(50) NOT NULL DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INT,
  width INT,
  height INT,
  folder VARCHAR(255) DEFAULT 'general',
  alt_text VARCHAR(255) DEFAULT '',
  alt_text_en VARCHAR(255) DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_news_published_date ON news (published_date DESC);
CREATE INDEX IF NOT EXISTS idx_projects_year ON projects (year DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_updated_at ON jobs (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_images_project ON project_images (project_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_news_images_news ON news_images (news_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultation_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_files_folder ON media_files (folder, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens (token_hash);

CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  module VARCHAR(50) NOT NULL,
  target_id VARCHAR(255),
  description TEXT,
  ip_address VARCHAR(100),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON admin_activity_logs (admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_module ON admin_activity_logs (module, created_at DESC);
