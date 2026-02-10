import type { SupabaseClient } from "@supabase/supabase-js";
import type { Project, ProjectWithColors, ProjectColor } from "./types";

export async function getUserProjects(
  supabase: SupabaseClient
): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getProjectById(
  supabase: SupabaseClient,
  projectId: string
): Promise<ProjectWithColors | null> {
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      project_colors (
        *,
        color:color_id (
          *,
          brand:brand_id (*)
        )
      )
    `
    )
    .eq("id", projectId)
    .single();

  if (error) return null;
  return data as unknown as ProjectWithColors;
}

export async function createProject(
  supabase: SupabaseClient,
  name: string,
  description?: string
): Promise<Project> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: user.id, name, description: description ?? null })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProject(
  supabase: SupabaseClient,
  projectId: string,
  fields: { name?: string; description?: string | null }
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update(fields)
    .eq("id", projectId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProject(
  supabase: SupabaseClient,
  projectId: string
): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) throw error;
}

export async function addColorToProject(
  supabase: SupabaseClient,
  projectId: string,
  colorId: string,
  role: string = "walls"
): Promise<ProjectColor> {
  const { data, error } = await supabase
    .from("project_colors")
    .insert({ project_id: projectId, color_id: colorId, role })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeColorFromProject(
  supabase: SupabaseClient,
  projectColorId: string
): Promise<void> {
  const { error } = await supabase
    .from("project_colors")
    .delete()
    .eq("id", projectColorId);

  if (error) throw error;
}

export async function addColorsToProjectBatch(
  supabase: SupabaseClient,
  projectId: string,
  colors: { colorId: string; role: string }[]
): Promise<ProjectColor[]> {
  const rows = colors.map((c) => ({
    project_id: projectId,
    color_id: c.colorId,
    role: c.role,
  }));

  const { data, error } = await supabase
    .from("project_colors")
    .upsert(rows, { onConflict: "project_id,color_id", ignoreDuplicates: true })
    .select();

  if (error) throw error;
  return data ?? [];
}

export async function getProjectsForColor(
  supabase: SupabaseClient,
  colorId: string
): Promise<
  {
    projectId: string;
    projectName: string;
    projectColorId: string;
    role: string;
  }[]
> {
  const { data, error } = await supabase
    .from("project_colors")
    .select("id, role, project:project_id (id, name)")
    .eq("color_id", colorId);

  if (error) throw error;
  return (data ?? []).map((pc: Record<string, unknown>) => {
    const project = pc.project as { id: string; name: string };
    return {
      projectId: project.id,
      projectName: project.name,
      projectColorId: pc.id as string,
      role: pc.role as string,
    };
  });
}
