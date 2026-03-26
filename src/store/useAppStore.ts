'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppStoreState, NavTab, User, VideoInsight } from '@/types';

// ============================================================
// Zustand Global Store
// Manages: active nav tab, legacy mode, video modal, user
// ============================================================

export const useAppStore = create<AppStoreState>()(
  persist(
    (set) => ({
      // ── Navigation ──────────────────────────────────────────
      activeTab: 'videos' as NavTab,
      setActiveTab: (tab: NavTab) => set({ activeTab: tab }),

      // ── Legacy Mode Toggle ───────────────────────────────────
      // "Legacy mode" disables AI features and uses simpler views
      legacyMode: false,
      toggleLegacyMode: () => set((state) => ({ legacyMode: !state.legacyMode })),

      // ── Sidebar Collapse ─────────────────────────────────────
      sidebarCollapsed: false,
      toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      // ── Video Detail Modal ───────────────────────────────────
      videoModal: {
        isOpen: false,
        video: null,
      },
      openVideoModal: (video: VideoInsight) =>
        set({ videoModal: { isOpen: true, video } }),
      closeVideoModal: () =>
        set({ videoModal: { isOpen: false, video: null } }),

      // ── Authenticated User ───────────────────────────────────
      user: null,
      setUser: (user: User | null) => set({ user }),
    }),
    {
      name: 'vidrevamp-store',
      // Only persist non-sensitive, preference-like state
      partialize: (state) => ({
        activeTab: state.activeTab,
        legacyMode: state.legacyMode,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
