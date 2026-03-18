-- FaceGallery Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. STUDIOS (extends Supabase auth.users)
-- ============================================
CREATE TABLE studios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Studio',
  logo_url TEXT,
  brand_color TEXT DEFAULT '#6C5CE7',
  brand_color_secondary TEXT DEFAULT '#A29BFE',
  custom_domain TEXT,
  api_key TEXT UNIQUE DEFAULT ('fg_' || replace(gen_random_uuid()::text, '-', '')),
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'agency', 'enterprise')),
  gallery_title TEXT DEFAULT 'Your Photos Are Ready',
  gallery_subtitle TEXT DEFAULT 'Browse and download your personalized gallery',
  show_powered_by BOOLEAN DEFAULT true,
  allow_downloads BOOLEAN DEFAULT true,
  allow_social_share BOOLEAN DEFAULT false,
  default_link_expiry_days INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 2. PROJECTS
-- ============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  studio_id UUID NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_date DATE,
  description TEXT,
  status TEXT DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'ready', 'archived')),
  photo_count INTEGER DEFAULT 0,
  cluster_count INTEGER DEFAULT 0,
  processing_progress INTEGER DEFAULT 0,
  cover_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 3. PHOTOS
-- ============================================
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  thumbnail_path TEXT,
  original_filename TEXT,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  face_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. FACE CLUSTERS
-- ============================================
CREATE TABLE face_clusters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  label TEXT,
  thumbnail_url TEXT,
  photo_count INTEGER DEFAULT 0,
  avg_confidence REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. PHOTO ↔ CLUSTER MAPPING (many-to-many)
-- ============================================
CREATE TABLE photo_cluster_map (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  cluster_id UUID NOT NULL REFERENCES face_clusters(id) ON DELETE CASCADE,
  confidence REAL DEFAULT 0,
  face_bbox JSONB, -- {x, y, width, height}
  UNIQUE(photo_id, cluster_id)
);

-- ============================================
-- 6. GALLERY LINKS
-- ============================================
CREATE TABLE gallery_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cluster_id UUID NOT NULL REFERENCES face_clusters(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  password_hash TEXT,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_projects_studio ON projects(studio_id);
CREATE INDEX idx_photos_project ON photos(project_id);
CREATE INDEX idx_clusters_project ON face_clusters(project_id);
CREATE INDEX idx_pcm_photo ON photo_cluster_map(photo_id);
CREATE INDEX idx_pcm_cluster ON photo_cluster_map(cluster_id);
CREATE INDEX idx_gallery_token ON gallery_links(token);
CREATE INDEX idx_gallery_cluster ON gallery_links(cluster_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE studios ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_cluster_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_links ENABLE ROW LEVEL SECURITY;

-- Studios: users can only see their own studio
CREATE POLICY "Studios: own data" ON studios
  FOR ALL USING (auth.uid() = id);

-- Projects: users can only see their own projects
CREATE POLICY "Projects: own data" ON projects
  FOR ALL USING (studio_id = auth.uid());

-- Photos: users can see photos in their projects
CREATE POLICY "Photos: own project data" ON photos
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE studio_id = auth.uid()));

-- Clusters: users can see clusters in their projects
CREATE POLICY "Clusters: own project data" ON face_clusters
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE studio_id = auth.uid()));

-- Photo-Cluster Map: users can see mappings for their clusters
CREATE POLICY "PCM: own data" ON photo_cluster_map
  FOR ALL USING (cluster_id IN (
    SELECT id FROM face_clusters WHERE project_id IN (
      SELECT id FROM projects WHERE studio_id = auth.uid()
    )
  ));

-- Gallery Links: owners can manage, public can read by token
CREATE POLICY "Links: own data" ON gallery_links
  FOR ALL USING (cluster_id IN (
    SELECT id FROM face_clusters WHERE project_id IN (
      SELECT id FROM projects WHERE studio_id = auth.uid()
    )
  ));

-- Public gallery access (anyone with token can view)
CREATE POLICY "Links: public read by token" ON gallery_links
  FOR SELECT USING (true);

-- Public photo access via gallery links
CREATE POLICY "Photos: public via gallery" ON photos
  FOR SELECT USING (
    id IN (
      SELECT pcm.photo_id FROM photo_cluster_map pcm
      JOIN gallery_links gl ON gl.cluster_id = pcm.cluster_id
      WHERE gl.is_active = true AND gl.expires_at > now()
    )
  );

-- Public cluster access via gallery links
CREATE POLICY "Clusters: public via gallery" ON face_clusters
  FOR SELECT USING (
    id IN (
      SELECT cluster_id FROM gallery_links
      WHERE is_active = true AND expires_at > now()
    )
  );

-- ============================================
-- FUNCTION: Auto-create studio on signup
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO studios (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'studio_name', 'My Studio'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- STORAGE BUCKETS (run separately or via dashboard)
-- ============================================
-- Create a 'photos' bucket: Dashboard → Storage → New Bucket → Name: "photos", Public: ON
