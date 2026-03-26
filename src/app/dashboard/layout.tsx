'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <Sidebar />
      <main
        className={cn(
          'flex-1 overflow-y-auto transition-all duration-200',
          sidebarCollapsed ? 'ml-14' : 'ml-[220px]',
        )}
      >
        {children}
      </main>
    </div>
  );
}
