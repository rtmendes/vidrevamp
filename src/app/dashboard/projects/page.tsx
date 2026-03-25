'use client';

/**
 * Projects — Kanban Board
 *
 * Inspired by Stoneforge's KanbanBoard.tsx + TaskDependencySection.tsx.
 * Projects are organized across workflow stages with HTML5 drag-and-drop.
 * Toggle between Kanban view and the original Grid view.
 */

import { useState } from 'react';
import {
  FolderOpen,
  Plus,
  Play,
  FileText,
  Trash2,
  X,
  LayoutGrid,
  Columns,
  GripVertical,
  TrendingUp,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterBar } from '@/components/shared/FilterBar';

// ── Types ──────────────────────────────────────────────────────────────────

type ProjectStatus = 'ideation' | 'production' | 'review' | 'live';
type ProjectPriority = 'high' | 'medium' | 'low';

interface KanbanProject {
  id: string;
  name: string;
  color: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  brand?: string;
  created_at: string;
  items_count: number;
  script_count: number;
  video_count: number;
  avatar_count?: number;
  performance: number; // 0-100
  tags: string[];
}

// ── Mock data ──────────────────────────────────────────────────────────────

const INITIAL_PROJECTS: KanbanProject[] = [
  {
    id: 'p1', name: 'EduLaunch Q2 Launch', color: '#6366f1', status: 'live',
    priority: 'high', brand: 'EduLaunch', created_at: '2026-03-01T00:00:00Z',
    items_count: 18, script_count: 12, video_count: 6, avatar_count: 3,
    performance: 87, tags: ['launch', 'edu', 'Q2'],
  },
  {
    id: 'p2', name: 'FitPulse Transformation Series', color: '#10b981', status: 'production',
    priority: 'high', brand: 'FitPulse', created_at: '2026-03-10T00:00:00Z',
    items_count: 11, script_count: 8, video_count: 3, avatar_count: 2,
    performance: 62, tags: ['fitness', 'series', 'UGC'],
  },
  {
    id: 'p3', name: 'WealthPath Objection Hooks', color: '#f59e0b', status: 'review',
    priority: 'medium', brand: 'WealthPath', created_at: '2026-03-15T00:00:00Z',
    items_count: 7, script_count: 7, video_count: 0, avatar_count: 1,
    performance: 0, tags: ['hooks', 'objection', 'finance'],
  },
  {
    id: 'p4', name: 'Behind the Scenes — Founder Series', color: '#8b5cf6', status: 'ideation',
    priority: 'medium', brand: 'EduLaunch', created_at: '2026-03-20T00:00:00Z',
    items_count: 2, script_count: 2, video_count: 0,
    performance: 0, tags: ['BTS', 'founder', 'storytelling'],
  },
  {
    id: 'p5', name: 'FitPulse 30-Day Challenge', color: '#ec4899', status: 'ideation',
    priority: 'low', brand: 'FitPulse', created_at: '2026-03-21T00:00:00Z',
    items_count: 1, script_count: 1, video_count: 0,
    performance: 0, tags: ['challenge', 'UGC'],
  },
  {
    id: 'p6', name: 'WealthPath Ad Intelligence Swipes', color: '#14b8a6', status: 'production',
    priority: 'high', brand: 'WealthPath', created_at: '2026-03-18T00:00:00Z',
    items_count: 5, script_count: 3, video_count: 2,
    performance: 41, tags: ['ads', 'swipe', 'finance'],
  },
  {
    id: 'p7', name: 'EduLaunch Relatable Content', color: '#3b82f6', status: 'review',
    priority: 'low', brand: 'EduLaunch', created_at: '2026-03-12T00:00:00Z',
    items_count: 6, script_count: 6, video_count: 0,
    performance: 0, tags: ['relatable', 'edu'],
  },
];

// ── Kanban column config ───────────────────────────────────────────────────

const COLUMNS: { id: ProjectStatus; label: string; color: string; description: string }[] = [
  { id: 'ideation',   label: 'Ideation',   color: 'zinc',   description: 'Research & planning' },
  { id: 'production', label: 'Production', color: 'blue',   description: 'Scripts & UGC active' },
  { id: 'review',     label: 'Review',     color: 'amber',  description: 'Pending approval' },
  { id: 'live',       label: 'Live',       color: 'emerald', description: 'Published & tracking' },
];

const PRIORITY_COLORS: Record<ProjectPriority, string> = {
  high:   'text-red-400 bg-red-500/10 border-red-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low:    'text-zinc-400 bg-zinc-800 border-zinc-700',
};

const PROJECT_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#84cc16',
];

// ── Main component ─────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [projects, setProjects] = useState<KanbanProject[]>(INITIAL_PROJECTS);
  const [view, setView] = useState<'kanban' | 'grid'>('kanban');
  const [showCreate, setShowCreate] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<ProjectStatus | null>(null);
  const [search, setSearch] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create form state
  const [newName, setNewName]         = useState('');
  const [newColor, setNewColor]       = useState(PROJECT_COLORS[0]);
  const [newStatus, setNewStatus]     = useState<ProjectStatus>('ideation');
  const [newPriority, setNewPriority] = useState<ProjectPriority>('medium');
  const [newBrand, setNewBrand]       = useState('');

  // Derived
  const brands = Array.from(new Set(projects.map((p) => p.brand).filter(Boolean)));

  const filtered = projects.filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))) return false;
    if (filterBrand && p.brand !== filterBrand) return false;
    if (filterPriority && p.priority !== filterPriority) return false;
    return true;
  });

  // ── Drag and drop (HTML5 DnD — no external library) ─────────────────────

  function handleDragStart(id: string) {
    setDragId(id);
  }

  function handleDragOver(e: React.DragEvent, colId: ProjectStatus) {
    e.preventDefault();
    setDragOver(colId);
  }

  function handleDrop(colId: ProjectStatus) {
    if (!dragId) return;
    setProjects((prev) =>
      prev.map((p) => p.id === dragId ? { ...p, status: colId } : p)
    );
    setDragId(null);
    setDragOver(null);
  }

  function handleDragEnd() {
    setDragId(null);
    setDragOver(null);
  }

  // ── Create ───────────────────────────────────────────────────────────────

  function handleCreate() {
    if (!newName.trim()) return;
    setProjects((prev) => [{
      id: `proj-${Date.now()}`,
      name: newName.trim(),
      color: newColor,
      status: newStatus,
      priority: newPriority,
      brand: newBrand || undefined,
      created_at: new Date().toISOString(),
      items_count: 0,
      script_count: 0,
      video_count: 0,
      performance: 0,
      tags: [],
    }, ...prev]);
    setNewName(''); setNewColor(PROJECT_COLORS[0]);
    setNewStatus('ideation'); setNewPriority('medium'); setNewBrand('');
    setShowCreate(false);
  }

  function handleDelete(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setSelectedIds((prev) => prev.filter((i) => i !== id));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function handleBulkAction(action: string, ids: string[]) {
    if (action === 'delete') {
      setProjects((prev) => prev.filter((p) => !ids.includes(p.id)));
      setSelectedIds([]);
    } else if (action === 'mark_live') {
      setProjects((prev) => prev.map((p) => ids.includes(p.id) ? { ...p, status: 'live' } : p));
      setSelectedIds([]);
    }
  }

  // ── Project card ─────────────────────────────────────────────────────────

  function ProjectCard({ project }: { project: KanbanProject }) {
    const isExpanded = expandedId === project.id;
    const isSelected = selectedIds.includes(project.id);
    const isDragging = dragId === project.id;

    return (
      <div
        draggable
        onDragStart={() => handleDragStart(project.id)}
        onDragEnd={handleDragEnd}
        className={cn(
          'bg-zinc-900 border rounded-xl overflow-hidden transition-all group',
          isDragging ? 'opacity-40 scale-95' : 'opacity-100',
          isSelected ? 'border-violet-500/50' : 'border-zinc-800/60 hover:border-zinc-700',
        )}
      >
        {/* Color band */}
        <div className="h-1 w-full" style={{ backgroundColor: project.color }} />

        <div className="p-3">
          {/* Header row */}
          <div className="flex items-start gap-2 mb-2">
            {/* Drag handle */}
            <GripVertical className="w-3.5 h-3.5 text-zinc-700 mt-0.5 shrink-0 cursor-grab active:cursor-grabbing" />

            {/* Select checkbox */}
            <button
              onClick={() => toggleSelect(project.id)}
              className={cn(
                'w-4 h-4 rounded border mt-0.5 shrink-0 transition-colors',
                isSelected
                  ? 'bg-violet-600 border-violet-500'
                  : 'border-zinc-700 hover:border-violet-500/60'
              )}
            />

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-zinc-200 leading-snug truncate">
                {project.name}
              </p>
              {project.brand && (
                <p className="text-[10px] text-zinc-600 mt-0.5">{project.brand}</p>
              )}
            </div>

            {/* Priority badge */}
            <span className={cn(
              'text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider shrink-0',
              PRIORITY_COLORS[project.priority]
            )}>
              {project.priority}
            </span>
          </div>

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2 ml-9">
              {project.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 ml-9">
            <div className="flex items-center gap-1">
              <FileText className="w-3 h-3 text-zinc-600" />
              <span className="text-[10px] text-zinc-600">{project.script_count}</span>
            </div>
            <div className="flex items-center gap-1">
              <Play className="w-3 h-3 text-zinc-600" />
              <span className="text-[10px] text-zinc-600">{project.video_count}</span>
            </div>
            {(project.avatar_count ?? 0) > 0 && (
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-zinc-600" />
                <span className="text-[10px] text-zinc-600">{project.avatar_count}</span>
              </div>
            )}
            {project.performance > 0 && (
              <div className="flex items-center gap-1 ml-auto">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span className="text-[10px] text-emerald-400 font-medium">{project.performance}%</span>
              </div>
            )}
          </div>

          {/* Expanded detail — Stoneforge TaskDetailPanel pattern */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-zinc-800/60 ml-9 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-600">Created</span>
                <span className="text-[10px] text-zinc-400">
                  {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
              {project.performance > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-zinc-600">Performance</span>
                    <span className="text-[10px] text-emerald-400">{project.performance}%</span>
                  </div>
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${project.performance}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button className="flex-1 text-[10px] py-1.5 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 rounded-lg transition-colors border border-violet-500/20">
                  Open Project
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Expand toggle */}
          <button
            onClick={() => setExpandedId(isExpanded ? null : project.id)}
            className="w-full flex items-center justify-center mt-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronDown className={cn('w-3 h-3 text-zinc-600 transition-transform', isExpanded && 'rotate-180')} />
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 h-screen flex flex-col max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Projects</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {projects.length} projects · drag cards between columns to update status
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setView('kanban')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                view === 'kanban' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <Columns className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setView('grid')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
                view === 'grid' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Grid
            </button>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      {/* FilterBar — shared component replaces inline filters */}
      <div className="mb-4 shrink-0">
        <FilterBar
          search={{ value: search, onChange: setSearch, placeholder: 'Search projects...' }}
          filters={[
            {
              key: 'brand', label: 'Brand', value: filterBrand, onChange: setFilterBrand,
              options: [
                { value: '', label: 'All Brands' },
                ...brands.map((b) => ({ value: b!, label: b! })),
              ],
            },
            {
              key: 'priority', label: 'Priority', value: filterPriority, onChange: setFilterPriority,
              options: [
                { value: '', label: 'All Priorities' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ],
            },
          ]}
          resultCount={filtered.length}
          selectedIds={selectedIds}
          bulkActions={[
            { label: 'Mark Live', action: 'mark_live' },
            { label: 'Delete', action: 'delete', destructive: true },
          ]}
          onBulkAction={handleBulkAction}
        />
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-4 p-5 bg-zinc-900 border border-violet-500/30 rounded-xl shrink-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-zinc-200">Create New Project</p>
            <button onClick={() => setShowCreate(false)}>
              <X className="w-4 h-4 text-zinc-500 hover:text-zinc-300" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <input
                type="text"
                placeholder="Project name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 mb-1.5 block font-medium">Brand</label>
              <input
                type="text"
                placeholder="e.g. EduLaunch"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60"
              />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 mb-1.5 block font-medium">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as ProjectPriority)}
                className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500/60"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 mb-1.5 block font-medium">Start in column</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ProjectStatus)}
                className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500/60"
              >
                {COLUMNS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 mb-2 block font-medium">Color</label>
              <div className="flex gap-2 flex-wrap">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className={cn(
                      'w-6 h-6 rounded-md transition-transform hover:scale-110',
                      newColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="col-span-2 flex gap-2">
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

      {/* ── KANBAN VIEW ─────────────────────────────────────────────────── */}
      {view === 'kanban' ? (
        <div className="flex gap-4 flex-1 overflow-x-auto pb-2">
          {COLUMNS.map((col) => {
            const colProjects = filtered.filter((p) => p.status === col.id);
            const isOver = dragOver === col.id;

            return (
              <div
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDrop={() => handleDrop(col.id)}
                className={cn(
                  'flex flex-col w-64 shrink-0 rounded-xl border transition-all',
                  isOver
                    ? 'border-violet-500/40 bg-violet-500/5'
                    : 'border-zinc-800/60 bg-zinc-900/40'
                )}
              >
                {/* Column header */}
                <div className="px-3 py-3 border-b border-zinc-800/60">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-zinc-300">{col.label}</span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full">
                      {colProjects.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-600">{col.description}</p>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {colProjects.length === 0 ? (
                    <div className={cn(
                      'flex flex-col items-center justify-center h-20 rounded-lg border border-dashed transition-all',
                      isOver ? 'border-violet-500/40 bg-violet-500/5' : 'border-zinc-800/60'
                    )}>
                      <p className="text-[10px] text-zinc-700">Drop project here</p>
                    </div>
                  ) : (
                    colProjects.map((p) => <ProjectCard key={p.id} project={p} />)
                  )}
                </div>

                {/* Add to column */}
                <button
                  onClick={() => { setNewStatus(col.id); setShowCreate(true); }}
                  className="mx-2 mb-2 py-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/60 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add project
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── GRID VIEW ──────────────────────────────────────────────────── */
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-zinc-600">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No projects found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((project) => (
                <div
                  key={project.id}
                  className={cn(
                    'bg-zinc-900 border rounded-xl overflow-hidden hover:border-zinc-700 transition-all group cursor-pointer',
                    selectedIds.includes(project.id) ? 'border-violet-500/50' : 'border-zinc-800/60'
                  )}
                  onClick={() => toggleSelect(project.id)}
                >
                  <div className="h-1.5 w-full" style={{ backgroundColor: project.color }} />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${project.color}20`, border: `1px solid ${project.color}30` }}
                        >
                          <FolderOpen className="w-4 h-4" style={{ color: project.color }} />
                        </div>
                        <div>
                          <p className="text-[13px] font-semibold text-zinc-200">{project.name}</p>
                          {project.brand && <p className="text-[10px] text-zinc-600">{project.brand}</p>}
                        </div>
                      </div>
                      <span className={cn(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider',
                        PRIORITY_COLORS[project.priority]
                      )}>
                        {project.priority}
                      </span>
                    </div>

                    {/* Status badge */}
                    <div className="mb-3">
                      <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-500 rounded-full capitalize">
                        {project.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-zinc-800/60">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-zinc-500" />
                        <span className="text-[11px] text-zinc-500">{project.script_count} scripts</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Play className="w-3 h-3 text-zinc-500" />
                        <span className="text-[11px] text-zinc-500">{project.video_count} videos</span>
                      </div>
                      {project.performance > 0 && (
                        <div className="ml-auto flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                          <span className="text-[10px] text-emerald-400">{project.performance}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
