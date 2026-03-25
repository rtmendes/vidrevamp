// ============================================================
// Global TypeScript types for VidRevamp
// ============================================================

export type UserTier = 'FREE' | 'PRO' | 'AGENCY';
export type PlatformType = 'YOUTUBE' | 'TIKTOK' | 'INSTAGRAM';
export type VaultItemType = 'HOOK' | 'STYLE';
export type SavedItemType = 'VIDEO' | 'SCRIPT';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  tier: UserTier;
  credits_remaining: number;
  stripe_customer_id?: string;
  legacy_mode: boolean;
  default_keywords: string[];
  created_at: string;
}

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  channels?: TrackedChannel[];
}

export interface TrackedChannel {
  id: string;
  platform: PlatformType;
  handle: string;
  display_name?: string;
  avatar_url?: string;
  average_views: number;
  subscriber_count?: number;
  created_at: string;
}

export interface TranscriptEntry {
  t: string; // timestamp e.g. "00:23"
  text: string;
}

export interface VisualAnalysis {
  visual_hook: string;
  pacing_cuts_per_sec: number;
  broll_usage: string;
  text_overlay_style: string;
  camera_framing: string;
  color_grade: string;
  screenshots: string[];
  key_moments: { timestamp: string; description: string }[];
}

export interface VideoInsight {
  id: string;
  channel_id: string;
  url: string;
  title?: string;
  thumbnail_url?: string;
  views: number;
  likes?: number;
  comments?: number;
  duration_seconds?: number;
  outlier_score: number;
  transcript: TranscriptEntry[];
  visual_analysis: VisualAnalysis;
  published_at?: string;
  analyzed_at?: string;
  created_at: string;
  channel?: TrackedChannel;
}

export interface VaultItem {
  id: string;
  user_id: string;
  type: VaultItemType;
  content: string;
  tags: string[];
  source_video_id?: string;
  created_at: string;
  source_video?: VideoInsight;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  items_count?: number;
}

export interface GeneratedScript {
  id: string;
  user_id: string;
  subject: string;
  angle: string;
  blueprint: string;
  language: string;
  vault_items_used: string[];
  created_at: string;
}

// ============================================================
// AI Response types
// ============================================================

export interface ScriptBlueprint {
  script: string;
  editInstructions: EditInstruction[];
  estimatedDuration: string;
  hook: string;
}

export interface EditInstruction {
  timestamp: string;
  scriptLine: string;
  visualInstruction: string;
  cutType: string;
  broll?: string;
  textOverlay?: string;
}

// ============================================================
// UI / Store types
// ============================================================

export type NavTab = 'channels' | 'videos' | 'vault' | 'script' | 'projects' | 'settings';

export interface VideoModalState {
  isOpen: boolean;
  video: VideoInsight | null;
}

export interface AppStoreState {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  legacyMode: boolean;
  toggleLegacyMode: () => void;
  videoModal: VideoModalState;
  openVideoModal: (video: VideoInsight) => void;
  closeVideoModal: () => void;
  user: User | null;
  setUser: (user: User | null) => void;
}

// ============================================================
// Supported translation languages
// ============================================================

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'pt', label: 'Portuguese', flag: '🇧🇷' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'it', label: 'Italian', flag: '🇮🇹' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', label: 'Korean', flag: '🇰🇷' },
  { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
] as const;
