import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getUserProjects } from "@/lib/project-queries";
import { DeleteProjectButton } from "@/components/delete-project-button";
import { CreateProjectForm } from "@/components/create-project-form";

export const metadata: Metadata = {
  title: "My Projects",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/dashboard");
  }

  const projects = await getUserProjects(supabase);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
            <p className="mt-2 text-gray-600">
              Your saved color palettes for rooms and projects.
            </p>
          </div>
          <CreateProjectForm />
        </div>

        {projects.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-gray-500">
              No projects yet. Browse{" "}
              <Link href="/colors" className="text-blue-600 hover:underline">
                colors
              </Link>{" "}
              and save them to a project.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="rounded-xl border border-gray-200 p-5 transition-shadow hover:shadow-md"
              >
                <Link href={`/dashboard/${project.id}`}>
                  <h2 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                    {project.name}
                  </h2>
                  {project.description && (
                    <p className="mt-1 text-sm text-gray-500">
                      {project.description}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-gray-400">
                    Updated{" "}
                    {new Date(project.updated_at).toLocaleDateString()}
                  </p>
                </Link>
                <DeleteProjectButton projectId={project.id} />
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
