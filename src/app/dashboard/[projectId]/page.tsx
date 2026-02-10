import { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ColorSwatch } from "@/components/color-swatch";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getProjectById } from "@/lib/project-queries";
import { RemoveColorButton } from "@/components/remove-color-button";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { projectId } = await params;
  const supabase = await createSupabaseServerClient();
  const project = await getProjectById(supabase, projectId);
  return { title: project?.name ?? "Project" };
}

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: PageProps) {
  const { projectId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/dashboard");

  const project = await getProjectById(supabase, projectId);
  if (!project) notFound();

  // Group colors by role
  const colorsByRole: Record<string, typeof project.project_colors> = {};
  for (const pc of project.project_colors) {
    if (!colorsByRole[pc.role]) colorsByRole[pc.role] = [];
    colorsByRole[pc.role].push(pc);
  }

  const roleOrder = ["walls", "trim", "accent", "pop"];
  const sortedRoles = Object.keys(colorsByRole).sort((a, b) => {
    const ai = roleOrder.indexOf(a);
    const bi = roleOrder.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-gray-900">
            My Projects
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{project.name}</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
        {project.description && (
          <p className="mt-2 text-gray-600">{project.description}</p>
        )}

        {/* Palette preview strip */}
        {project.project_colors.length > 0 && (
          <div className="mt-6 flex h-20 overflow-hidden rounded-xl border border-gray-200">
            {project.project_colors.map((pc) => (
              <div
                key={pc.id}
                className="flex-1"
                style={{ backgroundColor: pc.color.hex }}
              />
            ))}
          </div>
        )}

        {project.project_colors.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-gray-500">
              No colors saved yet. Browse{" "}
              <Link href="/colors" className="text-blue-600 hover:underline">
                colors
              </Link>{" "}
              and save them to this project.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {sortedRoles.map((role) => (
              <div key={role}>
                <h2 className="text-lg font-semibold capitalize text-gray-900">
                  {role}
                </h2>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {colorsByRole[role].map((pc) => (
                    <div
                      key={pc.id}
                      className="flex items-center gap-4 rounded-lg border border-gray-200 p-4"
                    >
                      <Link
                        href={`/colors/${pc.color.brand.slug}/${pc.color.slug}`}
                        className="shrink-0"
                      >
                        <ColorSwatch hex={pc.color.hex} size="lg" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/colors/${pc.color.brand.slug}/${pc.color.slug}`}
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {pc.color.name}
                        </Link>
                        <p className="text-sm text-gray-500">
                          {pc.color.brand.name}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-gray-400">
                          {pc.color.hex.toUpperCase()}
                        </p>
                      </div>
                      <RemoveColorButton
                        projectId={project.id}
                        projectColorId={pc.id}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
