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
  // True if a live Samplize peel-and-stick product page exists for this color
  // (gates the affiliate sample CTA). null = unchecked. Only set for SW/BM/F&B.
  samplize_available?: boolean | null;
  // Exact samplize.com handle when it differs from `<slug>-12x12` (size-variant or
  // accent/spelling colors recovered from the CJ feed). null = use `<slug>-12x12`.
  samplize_handle?: string | null;
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
