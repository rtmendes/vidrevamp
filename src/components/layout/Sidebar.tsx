'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Play,
  BookMarked,
  FileText,
  FolderOpen,
  Settings,
  Zap,
  Crown,
  ChevronRight,
  FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

const NAV_ITEMS = [
  { id: 'channels', label: 'Channels', icon: Users, href: '/dashboard/channels' },
  { id: 'videos', label: 'Videos', icon: Play, href: '/dashboard/videos' },
  { id: 'vault', label: 'Vault', icon: BookMarked, href: '/dashboard/vault' },
  { id: 'hook-lab', label: 'Hook Lab', icon: FlaskConical, href: '/dashboard/hook-lab', badge: 'AI' },
  { id: 'script', label: 'Script', icon: FileText, href: '/dashboard/script' },
  { id: 'projects', label: 'Projects', icon: FolderOpen, href: '/dashboard/projects' },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { legacyMode, toggleLegacyMode } = useAppStore();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-zinc-950 border-r border-zinc-800/60 flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-semibold text-[15px] tracking-tight">VidRevamp</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              )}
            >
              <item.icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  isActive ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300'
                )}
              />
              {item.label}
              {'badge' in item && item.badge && (
                <span className="ml-1 text-[9px] font-black bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full tracking-wider">
                  {item.badge}
                </span>
              )}
              {isActive && (
                <ChevronRight className="w-3 h-3 ml-auto text-violet-400/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-zinc-800/60 space-y-2">
        {/* Upgrade card */}
        <div className="bg-gradient-to-br from-violet-950/60 to-indigo-950/60 border border-violet-800/30 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Crown className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-[11px] font-semibold text-yellow-400 uppercase tracking-wider">Pro Plan</span>
          </div>
          <p className="text-[11px] text-zinc-400 mb-2 leading-relaxed">
            Unlock unlimited AI credits, Vision analysis, and team collaboration.
          </p>
          <button className="w-full bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-semibold py-1.5 rounded-lg transition-colors">
            Upgrade Now
          </button>
        </div>

        {/* Legacy mode toggle */}
        <button
          onClick={toggleLegacyMode}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 transition-all"
        >
          <span>Legacy Mode</span>
          <div className={cn(
            'w-7 h-4 rounded-full transition-colors relative',
            legacyMode ? 'bg-violet-600' : 'bg-zinc-700'
          )}>
            <div className={cn(
              'w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform',
              legacyMode ? 'translate-x-3.5' : 'translate-x-0.5'
            )} />
          </div>
        </button>

        {/* Settings */}
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
            pathname === '/dashboard/settings'
              ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          )}
        >
          <Settings className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
          Settings
        </Link>

        {/* User avatar placeholder */}
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-zinc-300 truncate">creator@email.com</p>
            <p className="text-[10px] text-zinc-600">Free Plan · 10 credits</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
