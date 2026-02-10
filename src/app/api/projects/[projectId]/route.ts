import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { deleteProject, updateProject } from "@/lib/project-queries";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;
  const { name } = await request.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const project = await updateProject(supabase, projectId, {
    name: name.trim(),
  });
  return NextResponse.json({ project });
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;
  await deleteProject(supabase, projectId);
  return NextResponse.json({ success: true });
}
