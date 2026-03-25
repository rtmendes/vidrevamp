'use client';

import { useState } from 'react';
import {
  FolderOpen,
  Plus,
  Play,
  FileText,
  MoreHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { MOCK_PROJECTS } from '@/lib/mock-data';
import type { Project } from '@/types';

const PROJECT_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PROJECT_COLORS[0]);

  function handleCreate() {
    if (!newName.trim()) return;
    setProjects((prev) => [
      {
        id: `proj-${Date.now()}`,
        user_id: 'user-1',
        name: newName.trim(),
        color: newColor,
        created_at: new Date().toISOString(),
        items_count: 0,
      },
      ...prev,
    ]);
    setNewName('');
    setNewColor(PROJECT_COLORS[0]);
    setShowCreate(false);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Projects</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Organize saved videos and generated blueprints into folders.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Create project form */}
      {showCreate && (
        <div className="mb-6 p-5 bg-zinc-900 border border-violet-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-zinc-200">Create New Project</p>
            <button onClick={() => setShowCreate(false)}>
              <X className="w-4 h-4 text-zinc-500 hover:text-zinc-300" />
            </button>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Project name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60"
            />
            <div>
              <p className="text-[11px] text-zinc-500 mb-2 font-medium">Project Color</p>
              <div className="flex gap-2 flex-wrap">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className={`w-7 h-7 rounded-lg transition-transform hover:scale-110 ${
                      newColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
              >
                Create Project
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm px-5 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Projects grid */}
      {projects.length === 0 ? (
        <div className="text-center py-20 text-zinc-600">
          <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No projects yet</p>
          <p className="text-[12px] mt-1">Create a project to organize your research</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden hover:border-zinc-700 transition-all group cursor-pointer"
            >
              {/* Color band */}
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: project.color }}
              />

              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${project.color}20`, border: `1px solid ${project.color}30` }}
                    >
                      <FolderOpen
                        className="w-4.5 h-4.5"
                        style={{ color: project.color }}
                      />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-zinc-200">{project.name}</p>
                      <p className="text-[11px] text-zinc-600">
                        {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-zinc-800">
                    <MoreHorizontal className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 pt-3 border-t border-zinc-800/60">
                  <div className="flex items-center gap-1.5">
                    <Play className="w-3 h-3 text-zinc-500" />
                    <span className="text-[11px] text-zinc-500">
                      {Math.floor((project.items_count ?? 0) * 0.6)} videos
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-zinc-500" />
                    <span className="text-[11px] text-zinc-500">
                      {Math.ceil((project.items_count ?? 0) * 0.4)} scripts
                    </span>
                  </div>
                  <button className="ml-auto p-1 rounded hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all">
                    <Trash2 className="w-3 h-3 text-zinc-600 hover:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
