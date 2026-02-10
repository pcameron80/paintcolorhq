"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RenameProject({
  projectId,
  currentName,
}: {
  projectId: string;
  currentName: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [submitting, setSubmitting] = useState(false);

  async function handleSave() {
    if (!name.trim() || name.trim() === currentName) {
      setEditing(false);
      setName(currentName);
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      setEditing(false);
      router.refresh();
    }
    setSubmitting(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setEditing(false);
              setName(currentName);
            }
          }}
          autoFocus
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-2xl font-bold text-gray-900 focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={handleSave}
          disabled={submitting}
          className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={() => {
            setEditing(false);
            setName(currentName);
          }}
          className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2">
      <h1 className="text-3xl font-bold text-gray-900">{currentName}</h1>
      <button
        onClick={() => setEditing(true)}
        className="rounded p-1 text-gray-400 opacity-0 hover:text-gray-600 group-hover:opacity-100"
        aria-label="Rename project"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
        </svg>
      </button>
    </div>
  );
}
