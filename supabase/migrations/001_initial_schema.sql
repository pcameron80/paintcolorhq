-- Paint Color HQ - Initial Schema
-- Migration: 001_initial_schema.sql

-- =============================================================================
-- TABLES
-- =============================================================================

-- Brands
CREATE TABLE brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  website_url text,
  logo_url text,
  color_count int NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Colors
CREATE TABLE colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES brands(id),
  name text NOT NULL,
  slug text NOT NULL,
  color_number text,
  hex text NOT NULL,
  rgb_r int NOT NULL,
  rgb_g int NOT NULL,
  rgb_b int NOT NULL,
  lab_l numeric,
  lab_a numeric,
  lab_b_val numeric,
  lrv numeric,
  color_family text,
  collections jsonb NOT NULL DEFAULT '[]'::jsonb,
  undertone text,
  is_discontinued boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brand_id, slug)
);

-- Cross-brand matches
CREATE TABLE cross_brand_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_color_id uuid NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
  match_color_id uuid NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
  delta_e_score numeric NOT NULL,
  rank int NOT NULL,
  UNIQUE (source_color_id, match_color_id)
);

-- Color families
CREATE TABLE color_families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  display_order int,
  hex_range_start text,
  hex_range_end text
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- brands
CREATE INDEX idx_brands_slug ON brands (slug);

-- colors
CREATE INDEX idx_colors_brand_id ON colors (brand_id);
CREATE INDEX idx_colors_hex ON colors (hex);
CREATE INDEX idx_colors_color_family ON colors (color_family);
CREATE INDEX idx_colors_slug ON colors (slug);
CREATE INDEX idx_colors_brand_id_slug ON colors (brand_id, slug);
CREATE INDEX idx_colors_name_fts ON colors USING gin (to_tsvector('english', name));

-- cross_brand_matches
CREATE INDEX idx_cross_brand_matches_source ON cross_brand_matches (source_color_id);
CREATE INDEX idx_cross_brand_matches_match ON cross_brand_matches (match_color_id);
CREATE INDEX idx_cross_brand_matches_source_rank ON cross_brand_matches (source_color_id, rank);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_brand_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON brands
  FOR SELECT USING (true);

CREATE POLICY "Public read access" ON colors
  FOR SELECT USING (true);

CREATE POLICY "Public read access" ON cross_brand_matches
  FOR SELECT USING (true);

CREATE POLICY "Public read access" ON color_families
  FOR SELECT USING (true);

-- =============================================================================
-- SEED DATA: color_families
-- =============================================================================

INSERT INTO color_families (name, slug, display_order) VALUES
  ('Red',       'red',       1),
  ('Orange',    'orange',    2),
  ('Yellow',    'yellow',    3),
  ('Green',     'green',     4),
  ('Blue',      'blue',      5),
  ('Purple',    'purple',    6),
  ('Pink',      'pink',      7),
  ('White',     'white',     8),
  ('Off-White', 'off-white', 9),
  ('Black',     'black',     10),
  ('Gray',      'gray',      11),
  ('Brown',     'brown',     12),
  ('Beige',     'beige',     13),
  ('Tan',       'tan',       14),
  ('Neutral',   'neutral',   15);
