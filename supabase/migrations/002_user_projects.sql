-- Migration: User projects and saved colors

-- Projects table
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Project colors (join table linking projects to colors with a role)
CREATE TABLE project_colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  color_id uuid NOT NULL REFERENCES colors(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'walls',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, color_id)
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects (user_id);
CREATE INDEX idx_project_colors_project_id ON project_colors (project_id);
CREATE INDEX idx_project_colors_color_id ON project_colors (color_id);

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_colors ENABLE ROW LEVEL SECURITY;

-- Projects: users can only CRUD their own
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE USING (auth.uid() = user_id);

-- Project colors: access through project ownership
CREATE POLICY "Users can view own project colors"
  ON project_colors FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_colors.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can add colors to own projects"
  ON project_colors FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_colors.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can update own project colors"
  ON project_colors FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_colors.project_id AND projects.user_id = auth.uid())
  );

CREATE POLICY "Users can remove colors from own projects"
  ON project_colors FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = project_colors.project_id AND projects.user_id = auth.uid())
  );

-- Updated_at trigger for projects
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
