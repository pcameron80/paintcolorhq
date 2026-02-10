export interface Brand {
  id: string;
  name: string;
  slug: string;
  website_url: string | null;
  logo_url: string | null;
  color_count: number;
  description: string | null;
  created_at: string;
}

export interface Color {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  color_number: string | null;
  hex: string;
  rgb_r: number;
  rgb_g: number;
  rgb_b: number;
  lab_l: number | null;
  lab_a: number | null;
  lab_b_val: number | null;
  lrv: number | null;
  color_family: string | null;
  collections: string[];
  undertone: string | null;
  is_discontinued: boolean;
  created_at: string;
}

export interface ColorWithBrand extends Color {
  brand: Brand;
}

export interface CrossBrandMatch {
  id: string;
  source_color_id: string;
  match_color_id: string;
  delta_e_score: number;
  rank: number;
}

export interface CrossBrandMatchWithColor extends CrossBrandMatch {
  match_color: ColorWithBrand;
}

export interface ColorFamily {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number | null;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectColor {
  id: string;
  project_id: string;
  color_id: string;
  role: string;
  notes: string | null;
  created_at: string;
}

export interface ProjectColorWithDetails extends ProjectColor {
  color: ColorWithBrand;
}

export interface ProjectWithColors extends Project {
  project_colors: ProjectColorWithDetails[];
}
