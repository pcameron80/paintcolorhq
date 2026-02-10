import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  addColorToProject,
  removeColorFromProject,
} from "@/lib/project-queries";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId } = await params;
  const { colorId, role } = await request.json();

  if (!colorId) {
    return NextResponse.json(
      { error: "colorId is required" },
      { status: 400 }
    );
  }

  try {
    const projectColor = await addColorToProject(
      supabase,
      projectId,
      colorId,
      role ?? "walls"
    );
    return NextResponse.json({ projectColor }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err?.code === "23505") {
      return NextResponse.json(
        { error: "Color already in this project" },
        { status: 409 }
      );
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectColorId } = await request.json();
  await removeColorFromProject(supabase, projectColorId);
  return NextResponse.json({ success: true });
}
