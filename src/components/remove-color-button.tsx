"use client";

import { useRouter } from "next/navigation";

export function RemoveColorButton({
  projectId,
  projectColorId,
}: {
  projectId: string;
  projectColorId: string;
}) {
  const router = useRouter();

  async function handleRemove() {
    await fetch(`/api/projects/${projectId}/colors`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectColorId }),
    });
    router.refresh();
  }

  return (
    <button
      onClick={handleRemove}
      className="shrink-0 text-gray-400 hover:text-red-500"
      title="Remove from project"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>
  );
}
