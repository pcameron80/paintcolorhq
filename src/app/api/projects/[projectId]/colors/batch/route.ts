import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { addColorsToProjectBatch } from "@/lib/project-queries";

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
  const { colors } = await request.json();

  if (!Array.isArray(colors) || colors.length === 0) {
    return NextResponse.json(
      { error: "colors array is required" },
      { status: 400 }
    );
  }

  try {
    const added = await addColorsToProjectBatch(supabase, projectId, colors);
    return NextResponse.json({ added, count: added.length }, { status: 201 });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      { error: err?.message ?? "Failed to add colors" },
      { status: 500 }
    );
  }
}
