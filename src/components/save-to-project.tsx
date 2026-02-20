"use client";

import { useState, useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const ROLES = ["walls", "trim", "accent", "pop"];

interface Project {
  id: string;
  name: string;
}

interface SavedIn {
  projectId: string;
  projectName: string;
  projectColorId: string;
  role: string;
}

export function SaveToProject({
  colorId,
  currentPath,
}: {
  colorId: string;
  currentPath: string;
}) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [savedIn, setSavedIn] = useState<SavedIn[]>([]);
  const [loading, setLoading] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedRole, setSelectedRole] = useState("walls");
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
    const [projectsData, statusData] = await Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch(`/api/projects/color-status?colorId=${colorId}`).then((r) =>
        r.json()
      ),
    ]);
    setProjects(projectsData.projects ?? []);
    setSavedIn(statusData.savedIn ?? []);
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

  async function handleToggleProject(project: Project) {
    const existing = savedIn.find((s) => s.projectId === project.id);
    if (existing) {
      await fetch(`/api/projects/${project.id}/colors`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectColorId: existing.projectColorId }),
      });
      setSavedIn(savedIn.filter((s) => s.projectId !== project.id));
    } else {
      const res = await fetch(`/api/projects/${project.id}/colors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colorId, role: selectedRole }),
      });
      const data = await res.json();
      if (data.projectColor) {
        setSavedIn([
          ...savedIn,
          {
            projectId: project.id,
            projectName: project.name,
            projectColorId: data.projectColor.id,
            role: selectedRole,
          },
        ]);
      }
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

  const isSaved = savedIn.length > 0;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors ${
          isSaved
            ? "bg-brand-blue text-white hover:bg-brand-blue-dark"
            : "bg-brand-blue text-white hover:bg-brand-blue-dark"
        }`}
      >
        <svg
          className={`h-5 w-5 ${isSaved ? "fill-white" : "fill-none stroke-current"}`}
          viewBox="0 0 24 24"
          strokeWidth={isSaved ? 0 : 1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
          />
        </svg>
        {isSaved ? "Saved" : "Save to Project"}
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
          <p className="text-sm font-semibold text-gray-900">
            Save to project
          </p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {ROLES.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                  selectedRole === role
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="mt-3 text-sm text-gray-500">Loading...</p>
          ) : (
            <>
              <div className="mt-3 max-h-48 space-y-1 overflow-y-auto">
                {projects.map((project) => {
                  const saved = savedIn.find(
                    (s) => s.projectId === project.id
                  );
                  return (
                    <label
                      key={project.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={!!saved}
                        onChange={() => handleToggleProject(project)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">
                        {project.name}
                      </span>
                      {saved && (
                        <span className="ml-auto text-xs capitalize text-gray-400">
                          {saved.role}
                        </span>
                      )}
                    </label>
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
