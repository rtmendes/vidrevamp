'use client';

/**
 * FilterBar — shared filter/sort/search/bulk-action component
 *
 * Inspired by Stoneforge's FilterBar.tsx + SortByDropdown.tsx pattern.
 * Replaces the 4 separate inline filter implementations across Research,
 * Ads, Ops, and Analytics pages with one reusable declarative API.
 *
 * Usage:
 *   <FilterBar
 *     search={{ value: q, onChange: setQ, placeholder: 'Search events...' }}
 *     filters={[
 *       { key: 'status', label: 'Status', value: status, onChange: setStatus,
 *         options: [{ value: '', label: 'All Status' }, { value: 'success', label: 'Success' }] }
 *     ]}
 *     sort={{ value: sortBy, onChange: setSortBy,
 *       options: [{ value: 'ts', label: 'Time' }, { value: 'cost', label: 'Cost' }] }}
 *     resultCount={filtered.length}
 *     selectedIds={selected}
 *     bulkActions={[{ label: 'Export Selected', action: 'export' }, { label: 'Delete', action: 'delete', destructive: true }]}
 *     onBulkAction={(action, ids) => handleBulk(action, ids)}
 *     actions={<button>Export CSV</button>}
 *   />
 */

import { Search, ChevronDown, X, SlidersHorizontal, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (val: string) => void;
}

export interface BulkAction {
  label: string;
  action: string;
  destructive?: boolean;
}

export interface FilterBarProps {
  /** Search input config */
  search?: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  };
  /** Array of dropdown filters */
  filters?: FilterConfig[];
  /** Sort dropdown */
  sort?: {
    value: string;
    options: FilterOption[];
    onChange: (val: string) => void;
    prefix?: string; // e.g. "Sort by"
  };
  /** Number of results to show in summary */
  resultCount?: number;
  /** Currently selected item IDs (enables bulk action bar) */
  selectedIds?: string[];
  /** Bulk action definitions */
  bulkActions?: BulkAction[];
  /** Called when a bulk action is triggered */
  onBulkAction?: (action: string, ids: string[]) => void;
  /** Right-side slot — for Export buttons, toggles, etc. */
  actions?: React.ReactNode;
  /** Extra CSS class */
  className?: string;
}

export function FilterBar({
  search,
  filters,
  sort,
  resultCount,
  selectedIds = [],
  bulkActions,
  onBulkAction,
  actions,
  className,
}: FilterBarProps) {
  const hasActiveFilters = (filters ?? []).some((f) => f.value !== '') || (search?.value ?? '') !== '';
  const hasBulk = selectedIds.length > 0 && bulkActions && bulkActions.length > 0;

  function clearAll() {
    search?.onChange('');
    filters?.forEach((f) => f.onChange(''));
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Main bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        {search && (
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder ?? 'Search...'}
              className="w-full pl-8 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 transition-colors"
            />
            {search.value && (
              <button
                onClick={() => search.onChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Filter dropdowns */}
        {filters?.map((filter) => (
          <div key={filter.key} className="relative">
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className={cn(
                'appearance-none pl-3 pr-7 py-2 bg-zinc-900 border rounded-lg text-sm transition-colors focus:outline-none focus:border-violet-500/60 cursor-pointer',
                filter.value
                  ? 'border-violet-500/40 text-violet-300'
                  : 'border-zinc-800 text-zinc-400'
              )}
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
          </div>
        ))}

        {/* Sort */}
        {sort && (
          <div className="relative flex items-center gap-1">
            {sort.prefix && (
              <span className="text-[11px] text-zinc-600 font-medium whitespace-nowrap">
                {sort.prefix}
              </span>
            )}
            <div className="relative">
              <select
                value={sort.value}
                onChange={(e) => sort.onChange(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-400 focus:outline-none focus:border-violet-500/60 cursor-pointer transition-colors"
              >
                {sort.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1.5 px-2.5 py-2 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/60 rounded-lg transition-colors"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Result count */}
        {resultCount !== undefined && (
          <span className="text-xs text-zinc-600 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3 h-3" />
            {resultCount.toLocaleString()} result{resultCount !== 1 ? 's' : ''}
          </span>
        )}

        {/* Right-side action slot */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Bulk action bar — slides in when items are selected (Stoneforge BulkActionMenu pattern) */}
      {hasBulk && (
        <div className="flex items-center gap-3 px-3 py-2 bg-violet-500/10 border border-violet-500/20 rounded-lg">
          <CheckSquare className="w-4 h-4 text-violet-400 shrink-0" />
          <span className="text-xs font-medium text-violet-300">
            {selectedIds.length} selected
          </span>
          <div className="flex items-center gap-2 ml-2">
            {bulkActions!.map((ba) => (
              <button
                key={ba.action}
                onClick={() => onBulkAction?.(ba.action, selectedIds)}
                className={cn(
                  'text-xs font-medium px-3 py-1 rounded-lg transition-colors',
                  ba.destructive
                    ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                )}
              >
                {ba.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
