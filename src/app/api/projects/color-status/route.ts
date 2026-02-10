import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getProjectsForColor } from "@/lib/project-queries";

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ savedIn: [] });

  const colorId = request.nextUrl.searchParams.get("colorId");
  if (!colorId) return NextResponse.json({ savedIn: [] });

  const savedIn = await getProjectsForColor(supabase, colorId);
  return NextResponse.json({ savedIn });
}
