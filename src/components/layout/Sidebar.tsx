'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Play,
  BookMarked,
  FileText,
  FolderOpen,
  Folder,
  FolderPlus,
  Settings,
  Zap,
  Crown,
  ChevronRight,
  ChevronDown,
  FlaskConical,
  TrendingUp,
  Target,
  Sparkles,
  Briefcase,
  BarChart3,
  Activity,
  SplitSquareHorizontal,
  Layers,
  Bot,
  LayoutDashboard,
  Image,
  FileBarChart,
  BookOpen,
  Mic2,
  Radio,
  BrainCircuit,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
  Check,
  GripVertical,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import {
  getNavState,
  createNavFolder,
  updateNavFolder,
  deleteNavFolder,
  moveNavItem,
  type NavFolder,
} from '@/actions/nav';

// ─── Nav item definitions ──────────────────────────────────────────────────────

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: 'NEW' | 'AI';
  tip?: string;
};

type NavSection = {
  key: string;
  label: string;
  tip: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    key: 'research',
    label: 'RESEARCH',
    tip: 'Track competitor channels, find viral videos, spy on ad creatives & explore trends in your niche.',
    items: [
      { id: 'channels', label: 'Channels', icon: Users, href: '/dashboard/channels', tip: 'Build watchlists of competitor & inspiration channels. Track subs, avg views & engagement.' },
      { id: 'videos', label: 'Videos', icon: Play, href: '/dashboard/videos', tip: 'Browse recent uploads from your tracked channels. Score outlier videos by performance.' },
      { id: 'research', label: 'Research', icon: TrendingUp, href: '/dashboard/research', badge: 'NEW', tip: 'AI-powered niche & topic research. Surface trending angles and underserved opportunities.' },
      { id: 'ads', label: 'Ad Intel', icon: Target, href: '/dashboard/ads', badge: 'NEW', tip: 'Discover competitor ad creatives, messaging strategies & estimated spend.' },
    ],
  },
  {
    key: 'create',
    label: 'CREATE',
    tip: 'AI-powered content creation tools — from first hook to final thumbnail.',
    items: [
      { id: 'studio', label: 'UGC Studio', icon: Sparkles, href: '/dashboard/studio', badge: 'NEW', tip: 'Generate UGC-style ad scripts and creator briefs optimized for conversions.' },
      { id: 'hook-lab', label: 'Hook Lab', icon: FlaskConical, href: '/dashboard/hook-lab', badge: 'AI', tip: 'Generate, score & compare video hooks. Analyze retention patterns to craft irresistible openers.' },
      { id: 'script', label: 'Script Engine', icon: FileText, href: '/dashboard/script', tip: 'Write full video scripts with AI. Structure retention hooks, payoff beats & CTAs.' },
      { id: 'storyboard', label: 'Storyboard', icon: Layers, href: '/dashboard/storyboard', badge: 'NEW', tip: 'Turn scripts into shot-by-shot visual storyboards for your editor or team.' },
      { id: 'thumbnail', label: 'Thumbnails', icon: Image, href: '/dashboard/thumbnail', badge: 'AI', tip: 'Generate thumbnail concepts with AI. Preview text overlays and compare click-appeal scores.' },
      { id: 'split-test', label: 'Split Testing', icon: SplitSquareHorizontal, href: '/dashboard/split-test', badge: 'NEW', tip: 'A/B test titles and thumbnails to find the highest click-through rate variant.' },
      { id: 'brand-voice', label: 'Brand Voice', icon: Mic2, href: '/dashboard/brand-voice', badge: 'AI', tip: 'Define your channel\'s tone, messaging pillars & hook formulas. AI writes in your voice.' },
    ],
  },
  {
    key: 'manage',
    label: 'MANAGE',
    tip: 'Organize your brands, save content inspiration & automate recurring workflows.',
    items: [
      { id: 'brands', label: 'Brands', icon: Briefcase, href: '/dashboard/brands', badge: 'NEW', tip: 'Manage multiple brand profiles — logos, palettes, tone guidelines & competitors.' },
      { id: 'vault', label: 'Vault', icon: BookMarked, href: '/dashboard/vault', tip: 'Save videos, articles & inspiration to your personal content vault for later reference.' },
      { id: 'projects', label: 'Projects', icon: FolderOpen, href: '/dashboard/projects', tip: 'Group scripts, thumbnails & assets into video projects. Track production status.' },
      { id: 'automations', label: 'Automations', icon: Bot, href: '/dashboard/automations', badge: 'NEW', tip: 'Build n8n-style workflows to automate research alerts, content briefs & team updates.' },
    ],
  },
  {
    key: 'intelligence',
    label: 'INTELLIGENCE',
    tip: 'Dashboards, analytics & AI predictions to understand what\'s working and what to make next.',
    items: [
      { id: 'ceo', label: 'CEO Dashboard', icon: LayoutDashboard, href: '/dashboard/ceo', badge: 'NEW', tip: 'High-level snapshot of channel health — growth, revenue, top content & key KPIs.' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/dashboard/analytics', badge: 'NEW', tip: 'Deep-dive into video performance, audience retention & engagement trends over time.' },
      { id: 'yt-analytics', label: 'YT Analytics', icon: Radio, href: '/dashboard/yt-analytics', badge: 'NEW', tip: 'Native YouTube Studio analytics pulled directly from your connected channel.' },
      { id: 'outlier-ml', label: 'Outlier Predict', icon: BrainCircuit, href: '/dashboard/outlier-ml', badge: 'AI', tip: 'ML model that predicts which video ideas have the highest chance of outperforming your average.' },
      { id: 'reports', label: 'Reports', icon: FileBarChart, href: '/dashboard/reports', badge: 'NEW', tip: 'Weekly AI-generated performance reports with pattern analysis and next-week recommendations.' },
      { id: 'ops', label: 'Operations', icon: Activity, href: '/dashboard/ops', tip: 'Team task tracking, content calendar and production workflow metrics.' },
    ],
  },
  {
    key: 'docs',
    label: 'DOCS',
    tip: 'Internal documentation, product specs & knowledge base for your team.',
    items: [
      { id: 'docs', label: 'PRD & Docs', icon: BookOpen, href: '/dashboard/docs', badge: 'NEW', tip: 'Write and store product requirement docs, SOPs & internal notes for your content operation.' },
    ],
  },
];

// Flat map of all nav items by id for quick lookup
const ALL_ITEMS: Record<string, NavItem> = {};
for (const section of NAV_SECTIONS) {
  for (const item of section.items) ALL_ITEMS[item.id] = item;
}

const LS_SECTIONS_KEY = 'vr_nav_sections';
const LS_ITEM_ORDER_KEY = 'vr_nav_item_order';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function loadSectionStates(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(LS_SECTIONS_KEY) ?? '{}'); }
  catch { return {}; }
}

function saveSectionStates(states: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_SECTIONS_KEY, JSON.stringify(states));
}

function loadItemOrders(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(LS_ITEM_ORDER_KEY) ?? '{}'); }
  catch { return {}; }
}

function saveItemOrders(orders: Record<string, string[]>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LS_ITEM_ORDER_KEY, JSON.stringify(orders));
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Badge({ type }: { type: 'NEW' | 'AI' }) {
  return (
    <span className={cn(
      'ml-auto text-[8px] font-black px-1.5 py-0.5 rounded-full tracking-wider border shrink-0',
      type === 'AI'
        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    )}>
      {type}
    </span>
  );
}

function NavItemRow({
  item,
  isActive,
  depth = 0,
  folders,
  placements,
  onMove,
  collapsed = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  item: NavItem;
  isActive: boolean;
  depth?: number;
  folders: NavFolder[];
  placements: Record<string, string | null>;
  onMove: (itemId: string, folderId: string | null) => void;
  collapsed?: boolean;
  isDragOver?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentFolder = placements[item.id] ?? null;

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // Collapsed: icon-only with tooltip
  if (collapsed) {
    return (
      <Link
        href={item.href}
        title={item.tip ? `${item.label} — ${item.tip}` : item.label}
        className={cn(
          'flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150 mx-auto',
          isActive
            ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
            : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'
        )}
      >
        <item.icon className="w-4 h-4 shrink-0" />
      </Link>
    );
  }

  return (
    <div
      className={cn(
        'relative group/item transition-colors',
        isDragOver && 'border-t border-violet-500/50',
      )}
      style={{ paddingLeft: depth > 0 ? `${depth * 10}px` : undefined }}
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Drag handle */}
      {onDragStart && (
        <span className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 z-10">
          <GripVertical className="w-3 h-3" />
        </span>
      )}

      <Link
        href={item.href}
        title={item.tip}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
          onDragStart && 'pl-5',
          isActive
            ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
        )}
      >
        <item.icon className={cn('w-3.5 h-3.5 shrink-0 transition-colors', isActive ? 'text-violet-400' : 'text-zinc-500 group-hover/item:text-zinc-300')} />
        <span className="flex-1 min-w-0 truncate">{item.label}</span>
        {item.badge ? (
          <Badge type={item.badge} />
        ) : isActive ? (
          <ChevronRight className="w-3 h-3 ml-auto text-violet-400/60 shrink-0" />
        ) : null}
      </Link>

      {/* Move menu trigger — appears on hover */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen((v) => !v); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 p-0.5 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700 transition-all"
        title="Move to folder"
      >
        <MoreHorizontal className="w-3 h-3" />
      </button>

      {/* Move dropdown */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute left-2 right-2 z-50 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 text-[12px]"
          style={{ top: '100%' }}
        >
          <div className="px-3 py-1 text-[10px] text-zinc-600 font-semibold uppercase tracking-wider">Move to</div>
          <button
            onClick={() => { onMove(item.id, null); setMenuOpen(false); }}
            className={cn(
              'w-full text-left px-3 py-1.5 hover:bg-zinc-800 flex items-center gap-2 transition-colors',
              currentFolder === null ? 'text-violet-400' : 'text-zinc-400'
            )}
          >
            <FolderOpen className="w-3 h-3 shrink-0" />
            Default section
            {currentFolder === null && <Check className="w-3 h-3 ml-auto text-violet-400" />}
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => { onMove(item.id, f.id); setMenuOpen(false); }}
              className={cn(
                'w-full text-left px-3 py-1.5 hover:bg-zinc-800 flex items-center gap-2 transition-colors',
                currentFolder === f.id ? 'text-violet-400' : 'text-zinc-400'
              )}
            >
              <Folder className="w-3 h-3 shrink-0" />
              <span className="truncate">{f.name}</span>
              {currentFolder === f.id && <Check className="w-3 h-3 ml-auto text-violet-400 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ────────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname = usePathname();
  const { legacyMode, toggleLegacyMode, sidebarCollapsed, toggleSidebarCollapsed } = useAppStore();

  // Section open/closed states (localStorage-backed)
  const [sectionStates, setSectionStates] = useState<Record<string, boolean>>({});

  // Per-section item order (localStorage-backed)
  const [itemOrders, setItemOrders] = useState<Record<string, string[]>>({});

  // Drag state (refs to avoid re-renders mid-drag)
  const dragItem = useRef<{ sectionKey: string; itemId: string } | null>(null);
  const dragOverItem = useRef<{ sectionKey: string; itemId: string } | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Custom folders from Supabase
  const [folders, setFolders] = useState<NavFolder[]>([]);

  // Which folder each item is in (null = default section)
  const [placements, setPlacements] = useState<Record<string, string | null>>({});

  // Folder editing state
  type EditState =
    | { type: 'create'; parentId: string | null; value: string }
    | { type: 'rename'; folderId: string; value: string }
    | null;
  const [editing, setEditing] = useState<EditState>(null);

  // Folder context menu
  const [folderMenu, setFolderMenu] = useState<string | null>(null);
  const folderMenuRef = useRef<HTMLDivElement>(null);

  // Load initial state
  useEffect(() => {
    setSectionStates(loadSectionStates());
    setItemOrders(loadItemOrders());
    getNavState().then((state) => {
      setFolders(state.folders);
      setPlacements(state.placements);
    });
  }, []);

  // Close folder context menu on outside click
  useEffect(() => {
    if (!folderMenu) return;
    const handler = (e: MouseEvent) => {
      if (folderMenuRef.current && !folderMenuRef.current.contains(e.target as Node)) setFolderMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [folderMenu]);

  const toggleSection = useCallback((key: string) => {
    setSectionStates((prev) => {
      const next = { ...prev, [key]: !(prev[key] ?? true) };
      saveSectionStates(next);
      return next;
    });
  }, []);

  const toggleFolder = useCallback((folderId: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, is_open: !f.is_open } : f))
    );
    const folder = folders.find((f) => f.id === folderId);
    if (folder) updateNavFolder(folderId, { isOpen: !folder.is_open });
  }, [folders]);

  const handleCreateFolder = useCallback(async (name: string, parentId: string | null) => {
    if (!name.trim()) return;
    const tempId = `temp_${Date.now()}`;
    const optimistic: NavFolder = {
      id: tempId,
      name: name.trim(),
      parent_id: parentId,
      sort_order: folders.filter((f) => f.parent_id === parentId).length,
      is_open: true,
      created_at: new Date().toISOString(),
    };
    setFolders((prev) => [...prev, optimistic]);
    setEditing(null);

    const result = await createNavFolder(name, parentId);
    if (result.id) {
      setFolders((prev) => prev.map((f) => f.id === tempId ? { ...f, id: result.id! } : f));
      setPlacements((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(next)) {
          if (v === tempId) next[k] = result.id!;
        }
        return next;
      });
    } else {
      setFolders((prev) => prev.filter((f) => f.id !== tempId));
    }
  }, [folders]);

  const handleRenameFolder = useCallback(async (folderId: string, name: string) => {
    if (!name.trim()) return;
    setFolders((prev) => prev.map((f) => (f.id === folderId ? { ...f, name: name.trim() } : f)));
    setEditing(null);
    await updateNavFolder(folderId, { name: name.trim() });
  }, []);

  const handleDeleteFolder = useCallback(async (folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId && f.parent_id !== folderId));
    setPlacements((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(next)) {
        if (v === folderId) delete next[k];
      }
      return next;
    });
    setFolderMenu(null);
    await deleteNavFolder(folderId);
  }, []);

  const handleMoveItem = useCallback((itemId: string, folderId: string | null) => {
    setPlacements((prev) => {
      const next = { ...prev };
      if (folderId === null) delete next[itemId];
      else next[itemId] = folderId;
      return next;
    });
    moveNavItem(itemId, folderId);
  }, []);

  // ─── Drag-to-reorder handlers ─────────────────────────────────────────────

  const handleDragStart = useCallback((sectionKey: string, itemId: string) => {
    dragItem.current = { sectionKey, itemId };
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, sectionKey: string, itemId: string) => {
    e.preventDefault();
    dragOverItem.current = { sectionKey, itemId };
    setDragOverId(itemId);
  }, []);

  const handleDrop = useCallback((sectionKey: string) => {
    setDragOverId(null);
    if (!dragItem.current || !dragOverItem.current) return;
    if (dragItem.current.sectionKey !== sectionKey || dragOverItem.current.sectionKey !== sectionKey) return;
    if (dragItem.current.itemId === dragOverItem.current.itemId) return;

    const section = NAV_SECTIONS.find((s) => s.key === sectionKey);
    if (!section) return;
    const movedItemSet = new Set(Object.keys(placements).filter((k) => placements[k] !== null));
    const visibleIds = section.items.filter((i) => !movedItemSet.has(i.id)).map((i) => i.id);
    const currentOrder = itemOrders[sectionKey] ?? visibleIds;
    // Ensure all visible items are in the order array
    const fullOrder = [
      ...currentOrder.filter((id) => visibleIds.includes(id)),
      ...visibleIds.filter((id) => !currentOrder.includes(id)),
    ];

    const fromIdx = fullOrder.indexOf(dragItem.current.itemId);
    const toIdx = fullOrder.indexOf(dragOverItem.current.itemId);
    if (fromIdx === -1 || toIdx === -1) return;

    const newOrder = [...fullOrder];
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, dragItem.current.itemId);

    setItemOrders((prev) => {
      const next = { ...prev, [sectionKey]: newOrder };
      saveItemOrders(next);
      return next;
    });

    dragItem.current = null;
    dragOverItem.current = null;
  }, [itemOrders, placements]);

  // Returns visible items for a section, sorted by stored order
  const getSectionItems = useCallback((section: NavSection): NavItem[] => {
    const movedItemSet = new Set(Object.keys(placements).filter((k) => placements[k] !== null));
    const visible = section.items.filter((item) => !movedItemSet.has(item.id));
    const order = itemOrders[section.key];
    if (!order) return visible;
    return [
      ...order.map((id) => visible.find((i) => i.id === id)).filter(Boolean) as NavItem[],
      ...visible.filter((i) => !order.includes(i.id)),
    ];
  }, [itemOrders, placements]);

  // Build folder tree structure: Map<parentId | null, children[]>
  const folderTree = new Map<string | null, NavFolder[]>();
  for (const f of folders) {
    const key = f.parent_id ?? null;
    if (!folderTree.has(key)) folderTree.set(key, []);
    folderTree.get(key)!.push(f);
  }

  // Items assigned to a custom folder (to exclude from default sections)
  const movedItems = new Set(Object.keys(placements).filter((k) => placements[k] !== null));

  const isSectionOpen = (key: string) => sectionStates[key] ?? true;

  // ─── Render folder subtree ──────────────────────────────────────────────────

  function renderFolder(folder: NavFolder, depth = 0): React.ReactNode {
    const isOpen = folder.is_open;
    const children = folderTree.get(folder.id) ?? [];
    const itemsInFolder = Object.entries(placements)
      .filter(([, fid]) => fid === folder.id)
      .map(([itemId]) => ALL_ITEMS[itemId])
      .filter(Boolean);
    const isRenamingThis = editing?.type === 'rename' && editing.folderId === folder.id;
    const isCreatingChildHere = editing?.type === 'create' && editing.parentId === folder.id;

    return (
      <div key={folder.id} style={{ paddingLeft: depth > 0 ? `${depth * 10}px` : undefined }}>
        {/* Folder header row */}
        <div className="flex items-center gap-1 group/folder">
          <button
            onClick={() => toggleFolder(folder.id)}
            className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all"
          >
            {isOpen ? (
              <FolderOpen className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            )}
            {isRenamingThis ? (
              <form
                className="flex-1"
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRenameFolder(folder.id, (editing as { value: string }).value);
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  autoFocus
                  value={(editing as { value: string }).value}
                  onChange={(e) => setEditing((prev) => prev ? { ...prev, value: e.target.value } : prev)}
                  onKeyDown={(e) => e.key === 'Escape' && setEditing(null)}
                  className="w-full bg-zinc-800 border border-violet-500/40 rounded px-1.5 py-0.5 text-[12px] text-zinc-100 outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </form>
            ) : (
              <span className="flex-1 truncate text-left">{folder.name}</span>
            )}
            {!isRenamingThis && (
              <ChevronDown
                className={cn('w-3 h-3 text-zinc-600 shrink-0 transition-transform', !isOpen && '-rotate-90')}
              />
            )}
          </button>

          {/* Folder actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover/folder:opacity-100 transition-opacity pr-1 relative">
            <button
              onClick={() => setEditing({ type: 'create', parentId: folder.id, value: '' })}
              className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700 transition-all"
              title="Add subfolder"
            >
              <FolderPlus className="w-3 h-3" />
            </button>
            <button
              onClick={() => setFolderMenu(folderMenu === folder.id ? null : folder.id)}
              className="p-1 rounded text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700 transition-all"
              title="Folder options"
            >
              <MoreHorizontal className="w-3 h-3" />
            </button>

            {/* Folder context menu */}
            {folderMenu === folder.id && (
              <div
                ref={folderMenuRef}
                className="absolute right-0 top-full z-50 mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 w-36 text-[12px]"
              >
                <button
                  onClick={() => {
                    setEditing({ type: 'rename', folderId: folder.id, value: folder.name });
                    setFolderMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 flex items-center gap-2 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <Pencil className="w-3 h-3" /> Rename
                </button>
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-800 flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Folder contents */}
        {isOpen && (
          <div className="space-y-0.5 pl-2">
            {itemsInFolder.map((item) => (
              <NavItemRow
                key={item.id}
                item={item}
                isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                depth={1}
                folders={folders}
                placements={placements}
                onMove={handleMoveItem}
              />
            ))}

            {/* Sub-folders */}
            {children.map((child) => renderFolder(child, 1))}

            {/* New subfolder input */}
            {isCreatingChildHere && (
              <NewFolderInput
                value={editing.value}
                onChange={(v) => setEditing((prev) => prev ? { ...prev, value: v } : prev)}
                onSubmit={() => handleCreateFolder(editing.value, folder.id)}
                onCancel={() => setEditing(null)}
                depth={1}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen bg-zinc-950 border-r border-zinc-800/60 flex flex-col z-40 transition-all duration-200',
      sidebarCollapsed ? 'w-14' : 'w-[220px]',
    )}>
      {/* Logo + collapse toggle */}
      <div className="px-3 py-4 border-b border-zinc-800/60 flex items-center justify-between gap-2 shrink-0">
        {sidebarCollapsed ? (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 mx-auto">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
        ) : (
          <div className="flex items-center gap-2.5 pl-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white font-semibold text-[15px] tracking-tight">VidRevamp</span>
          </div>
        )}
        <button
          onClick={toggleSidebarCollapsed}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60 transition-all shrink-0',
            sidebarCollapsed && 'mx-auto',
          )}
        >
          {sidebarCollapsed
            ? <PanelLeftOpen className="w-3.5 h-3.5" />
            : <PanelLeftClose className="w-3.5 h-3.5" />
          }
        </button>
      </div>

      {/* Navigation */}
      {sidebarCollapsed ? (
        // ── Collapsed: flat icon list ──────────────────────────────────────
        <nav className="flex-1 py-3 flex flex-col items-center gap-0.5 overflow-y-auto overflow-x-hidden">
          {NAV_SECTIONS.flatMap((section) =>
            section.items
              .filter((item) => !movedItems.has(item.id))
              .map((item) => (
                <NavItemRow
                  key={item.id}
                  item={item}
                  isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                  folders={folders}
                  placements={placements}
                  onMove={handleMoveItem}
                  collapsed
                />
              ))
          )}
        </nav>
      ) : (
        // ── Expanded: full nav with sections and folders ───────────────────
        <nav className="flex-1 py-3 px-3 overflow-y-auto space-y-1 overflow-x-visible">

          {/* Built-in sections (accordion) */}
          {NAV_SECTIONS.map((section) => {
            const open = isSectionOpen(section.key);
            const visibleItems = getSectionItems(section);

            return (
              <div key={section.key} className="mb-1">
                {/* Section header — click to toggle */}
                <button
                  onClick={() => toggleSection(section.key)}
                  className="w-full flex items-center justify-between px-3 py-1 mb-0.5 rounded-md hover:bg-zinc-800/40 transition-colors group/sec relative"
                >
                  <span className="text-[9px] font-black text-zinc-600 tracking-widest group-hover/sec:text-zinc-500 transition-colors">
                    {section.label}
                  </span>
                  <ChevronDown
                    className={cn('w-3 h-3 text-zinc-700 transition-transform', !open && '-rotate-90')}
                  />
                  {/* Section tooltip */}
                  <div className="absolute left-0 top-full mt-1 z-[60] w-56 bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-2 text-[11px] text-zinc-400 leading-relaxed shadow-xl opacity-0 group-hover/sec:opacity-100 pointer-events-none transition-opacity delay-150 whitespace-normal text-left">
                    {section.tip}
                  </div>
                </button>

                {/* Section items */}
                {open && (
                  <div
                    className="space-y-0.5"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(section.key)}
                  >
                    {visibleItems.map((item) => (
                      <NavItemRow
                        key={item.id}
                        item={item}
                        isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                        folders={folders}
                        placements={placements}
                        onMove={handleMoveItem}
                        isDragOver={dragOverId === item.id}
                        onDragStart={() => handleDragStart(section.key, item.id)}
                        onDragOver={(e) => handleDragOver(e, section.key, item.id)}
                        onDrop={() => handleDrop(section.key)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Custom Folders */}
          {(folders.length > 0 || editing?.type === 'create' && editing.parentId === null) && (
            <div className="mb-1 pt-1">
              <div className="flex items-center justify-between px-3 py-1 mb-0.5">
                <span className="text-[9px] font-black text-zinc-600 tracking-widest">FOLDERS</span>
              </div>
              <div className="space-y-0.5">
                {(folderTree.get(null) ?? []).map((folder) => renderFolder(folder))}
                {editing?.type === 'create' && editing.parentId === null && (
                  <NewFolderInput
                    value={editing.value}
                    onChange={(v) => setEditing((prev) => prev ? { ...prev, value: v } : prev)}
                    onSubmit={() => handleCreateFolder(editing.value, null)}
                    onCancel={() => setEditing(null)}
                  />
                )}
              </div>
            </div>
          )}

          {/* New root folder trigger */}
          {!(editing?.type === 'create' && editing.parentId === null) && (
            <button
              onClick={() => setEditing({ type: 'create', parentId: null, value: '' })}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/40 transition-all border border-dashed border-zinc-800 hover:border-zinc-700"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              New folder
            </button>
          )}
        </nav>
      )}

      {/* Bottom section */}
      <div className={cn('p-3 border-t border-zinc-800/60 space-y-1', sidebarCollapsed && 'flex flex-col items-center')}>
        {sidebarCollapsed ? (
          // Collapsed bottom: icon-only
          <>
            <button
              onClick={toggleLegacyMode}
              title={`Legacy Mode ${legacyMode ? 'ON' : 'OFF'}`}
              className={cn(
                'w-9 h-9 flex items-center justify-center rounded-lg transition-all',
                legacyMode ? 'text-violet-400 bg-violet-500/10' : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/60',
              )}
            >
              <Zap className="w-4 h-4" />
            </button>
            <Link
              href="/dashboard/settings"
              title="Settings"
              className={cn(
                'w-9 h-9 flex items-center justify-center rounded-lg transition-all',
                pathname === '/dashboard/settings'
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60',
              )}
            >
              <Settings className="w-4 h-4" />
            </Link>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0 mx-auto mt-1" title="creator@email.com">
              U
            </div>
          </>
        ) : (
          // Expanded bottom
          <>
            <button
              onClick={toggleLegacyMode}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 transition-all"
            >
              <span>Legacy Mode</span>
              <div className={cn('w-7 h-4 rounded-full transition-colors relative', legacyMode ? 'bg-violet-600' : 'bg-zinc-700')}>
                <div className={cn('w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform', legacyMode ? 'translate-x-3.5' : 'translate-x-0.5')} />
              </div>
            </button>

            <Link
              href="/dashboard/settings"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                pathname === '/dashboard/settings'
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              )}
            >
              <Settings className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 shrink-0" />
              Settings
              <span className="ml-auto flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-1.5 py-0.5">
                <Crown className="w-2.5 h-2.5 text-yellow-400" />
                <span className="text-[9px] font-black text-yellow-500 tracking-wider">PRO</span>
              </span>
            </Link>

            <div className="flex items-center gap-2.5 px-3 py-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                U
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-zinc-300 truncate">creator@email.com</p>
                <p className="text-[10px] text-zinc-600">Free Plan · 10 credits</p>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}

// ─── Inline new-folder input ────────────────────────────────────────────────────

function NewFolderInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  depth = 0,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  depth?: number;
}) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
      className="flex items-center gap-1.5 px-3 py-1.5"
      style={{ paddingLeft: depth > 0 ? `${depth * 10 + 12}px` : undefined }}
    >
      <Folder className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && onCancel()}
        placeholder="Folder name…"
        className="flex-1 min-w-0 bg-zinc-800 border border-violet-500/40 rounded px-2 py-0.5 text-[12px] text-zinc-100 placeholder-zinc-600 outline-none focus:border-violet-500/70"
      />
      <button type="submit" className="p-0.5 text-emerald-400 hover:text-emerald-300 transition-colors">
        <Check className="w-3.5 h-3.5" />
      </button>
      <button type="button" onClick={onCancel} className="p-0.5 text-zinc-600 hover:text-zinc-400 transition-colors">
        <X className="w-3.5 h-3.5" />
      </button>
    </form>
  );
}
