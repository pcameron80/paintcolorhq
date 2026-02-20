"use client";

import { useState, useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface Project {
  id: string;
  name: string;
}

interface PaletteColor {
  colorId: string;
  role: string;
}

export function AddPaletteToProject({
  colors,
  currentPath,
}: {
  colors: PaletteColor[];
  currentPath: string;
}) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser({ id: user.id });
    });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadProjects() {
    setLoading(true);
    const r = await fetch("/api/projects");
    const data = await r.json();
    setProjects(data.projects ?? []);
    setLoading(false);
  }

  function handleClick() {
    if (!user) {
      window.location.href = `/auth/login?next=${encodeURIComponent(currentPath)}`;
      return;
    }
    if (!open) {
      loadProjects();
    }
    setOpen(!open);
  }

  async function handleAddToProject(project: Project) {
    const res = await fetch(`/api/projects/${project.id}/colors/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ colors }),
    });
    if (res.ok) {
      setAddedTo((prev) => new Set(prev).add(project.id));
      setTimeout(() => {
        setAddedTo((prev) => {
          const next = new Set(prev);
          next.delete(project.id);
          return next;
        });
      }, 2000);
    }
  }

  async function handleCreateProject() {
    if (!newProjectName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newProjectName.trim() }),
    });
    const data = await res.json();
    if (data.project) {
      setProjects([data.project, ...projects]);
      setNewProjectName("");
    }
    setCreating(false);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleClick}
        className="flex items-center gap-2 rounded-lg bg-brand-blue px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-blue-dark"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
        </svg>
        Add to Project
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
          <p className="text-sm font-semibold text-gray-900">
            Add all {colors.length} colors to project
          </p>

          {loading ? (
            <p className="mt-3 text-sm text-gray-500">Loading...</p>
          ) : (
            <>
              <div className="mt-3 max-h-48 space-y-1 overflow-y-auto">
                {projects.map((project) => {
                  const wasAdded = addedTo.has(project.id);
                  return (
                    <div
                      key={project.id}
                      className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-gray-50"
                    >
                      <span className="text-sm text-gray-700">
                        {project.name}
                      </span>
                      {wasAdded ? (
                        <span className="text-xs font-medium text-green-600">
                          Added!
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddToProject(project)}
                          className="rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-800"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  );
                })}
                {projects.length === 0 && (
                  <p className="py-2 text-sm text-gray-400">
                    No projects yet — create one below
                  </p>
                )}
              </div>

              <hr className="my-3 border-gray-100" />

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="New project name..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-brand-blue focus:outline-none"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                />
                <button
                  onClick={handleCreateProject}
                  disabled={creating || !newProjectName.trim()}
                  className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
