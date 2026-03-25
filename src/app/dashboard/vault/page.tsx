'use client';

import { useState, useMemo, useEffect, useTransition } from 'react';
import {
  BookMarked,
  Plus,
  Search,
  Tag,
  Trash2,
  Copy,
  Film,
  Zap,
  X,
  Loader2,
} from 'lucide-react';
import { getVaultItems, addVaultItem, deleteVaultItem } from '@/actions/vault';
import { MOCK_VAULT_ITEMS } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import type { VaultItem, VaultItemType } from '@/types';

const TYPE_FILTERS = ['All', 'HOOK', 'STYLE'] as const;
type TypeFilter = typeof TYPE_FILTERS[number];

export default function VaultPage() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<VaultItemType>('HOOK');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load vault items from Supabase on mount; fall back to mock if not authed
  useEffect(() => {
    startTransition(async () => {
      const data = await getVaultItems();
      setItems(data.length > 0 ? data : MOCK_VAULT_ITEMS);
      setLoaded(true);
    });
  }, []);

  const filtered = useMemo(() => {
    let result = [...items];
    if (typeFilter !== 'All') result = result.filter((i) => i.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.content.toLowerCase().includes(q) ||
          i.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [items, typeFilter, search]);

  const hooks = items.filter((i) => i.type === 'HOOK');
  const styles = items.filter((i) => i.type === 'STYLE');

  function handleCopy(item: VaultItem) {
    navigator.clipboard.writeText(item.content);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function handleDelete(id: string) {
    // Optimistic update
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(async () => {
      await deleteVaultItem(id);
    });
  }

  function handleAdd() {
    if (!newContent.trim()) return;
    const tags = newTags.split(',').map((t) => t.trim()).filter(Boolean);

    // Optimistic insert
    const optimistic: VaultItem = {
      id: `optimistic-${Date.now()}`,
      user_id: 'local',
      type: newType,
      content: newContent.trim(),
      tags,
      created_at: new Date().toISOString(),
    };
    setItems((prev) => [optimistic, ...prev]);
    setNewContent('');
    setNewTags('');
    setShowAdd(false);

    startTransition(async () => {
      const result = await addVaultItem(newType, optimistic.content, tags);
      if (result.success && result.item) {
        // Replace optimistic with real DB record
        setItems((prev) =>
          prev.map((i) => (i.id === optimistic.id ? result.item! : i))
        );
      }
    });
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-zinc-100 tracking-tight">Vault</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Your personal database of proven hooks and visual styles.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <BookMarked className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[11px] text-zinc-500">Total Items</span>
          </div>
          <p className="text-2xl font-bold text-zinc-100">
            {isPending && !loaded ? <Loader2 className="w-5 h-5 animate-spin text-zinc-600" /> : items.length}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-[11px] text-zinc-500">Hooks</span>
          </div>
          <p className="text-2xl font-bold text-zinc-100">{hooks.length}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Film className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] text-zinc-500">Styles</span>
          </div>
          <p className="text-2xl font-bold text-zinc-100">{styles.length}</p>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="mb-5 p-5 bg-zinc-900 border border-violet-500/30 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-200">Add to Vault</p>
            <button onClick={() => setShowAdd(false)}>
              <X className="w-4 h-4 text-zinc-500 hover:text-zinc-300" />
            </button>
          </div>

          <div className="flex gap-2">
            {(['HOOK', 'STYLE'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setNewType(t)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all',
                  newType === t
                    ? t === 'HOOK'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700/50 hover:text-zinc-200'
                )}
              >
                {t === 'HOOK' ? <Zap className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                {t}
              </button>
            ))}
          </div>

          <textarea
            placeholder={
              newType === 'HOOK'
                ? 'Enter your hook template. Use [brackets] for variables...'
                : 'Describe the visual style or editing technique...'
            }
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={4}
            className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 resize-none"
          />

          <input
            type="text"
            placeholder="Tags (comma-separated): business, hook, tiktok..."
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
            className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60"
          />

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              Save to Vault
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm px-5 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search vault..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-800/60 border border-zinc-700/50 rounded-lg py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/60"
          />
        </div>

        <div className="flex gap-1.5">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all',
                typeFilter === f
                  ? 'bg-violet-600 text-white'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50'
              )}
            >
              {f === 'All' ? 'All Items' : f === 'HOOK' ? '⚡ Hooks' : '🎬 Styles'}
            </button>
          ))}
        </div>

        <span className="ml-auto text-[11px] text-zinc-500">{filtered.length} items</span>
      </div>

      {/* Loading state */}
      {isPending && !loaded && (
        <div className="flex items-center justify-center py-16 text-zinc-600">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span className="text-sm">Loading vault from database…</span>
        </div>
      )}

      {/* Items list */}
      {loaded && (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-zinc-600">
              <BookMarked className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No items found</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-900 border border-zinc-800/60 rounded-xl p-4 hover:border-zinc-700 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                        'flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                        item.type === 'HOOK'
                          ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      )}>
                        {item.type === 'HOOK' ? <Zap className="w-2.5 h-2.5" /> : <Film className="w-2.5 h-2.5" />}
                        {item.type}
                      </span>
                      <span className="text-[10px] text-zinc-600">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-200 leading-relaxed">{item.content}</p>

                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700/40"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(item)}
                      className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedId === item.id ? (
                        <span className="text-[10px] text-emerald-400 font-medium">Copied!</span>
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-zinc-600 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
