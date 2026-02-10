import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { deleteProject } from "@/lib/project-queries";

interface RouteParams {
  params: Promise<{ projectId: string }>;
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
