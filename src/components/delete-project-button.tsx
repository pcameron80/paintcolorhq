"use client";

import { useRouter } from "next/navigation";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this project and all saved colors?")) return;

    await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="mt-3 text-xs text-gray-400 hover:text-red-600"
    >
      Delete project
    </button>
  );
}
