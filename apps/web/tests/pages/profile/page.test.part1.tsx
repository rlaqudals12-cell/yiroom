/**
 * 프로필 페이지 테스트
 * K-5 리디자인 반영
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfilePage from '@/app/(main)/profile/page';

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(),
  SignOutButton: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sign-out-button">{children}</div>
  ),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: vi.fn(),
}));

// Mock gamification
vi.mock('@/lib/gamification', () => ({
  getUserLevelInfo: vi.fn(),
  getUserBadges: vi.fn(),
}));

// Mock gamification components
vi.mock('@/components/gamification', () => ({
  BadgeCard: vi.fn(() => <div data-testid="badge-card">BadgeCard</div>),
}));

// Mock common components
vi.mock('@/components/common', () => ({
  LevelBadgeFilled: vi.fn(() => <span data-testid="level-badge">Level Badge</span>),
  LevelProgress: vi.fn(() => <div data-testid="level-progress">LevelProgress</div>),
}));

// Mock profile components (K-5)
vi.mock('@/components/profile', () => ({
  WellnessScoreRing: vi.fn(() => <div data-testid="wellness-score-ring">WellnessScoreRing</div>),
  MyInfoSummaryCard: vi.fn(() => <div data-testid="my-info-summary-card">MyInfoSummaryCard</div>),
}));

// Mock QRCodeDisplay
vi.mock('@/components/common/QRCodeDisplay', () => ({
  QRCodeDisplay: vi.fn(() => <div data-testid="qr-code-display">QRCodeDisplay</div>),
}));

// Mock greeting utilities
vi.mock('@/lib/utils/greeting', () => ({
  getGreetingWithEmoji: vi.fn(() => ({
    greeting: 'Hello!',
    emoji: 'wave',
    timeOfDay: 'morning',
  })),
  TIME_GRADIENTS: {
    morning: 'from-yellow-50 to-orange-50',
    afternoon: 'from-blue-50 to-cyan-50',
    evening: 'from-purple-50 to-pink-50',
    night: 'from-indigo-900 to-purple-900',
  },
}));

// Mock challenges
vi.mock('@/lib/challenges', () => ({
  getUserChallengeStats: vi.fn(),
}));

// Mock levels
vi.mock('@/lib/levels', () => ({
  getUserLevel: vi.fn(),
  calculateUserLevelState: vi.fn(),
}));

// Mock animations
vi.mock('@/components/animations', () => ({
  FadeInUp: vi.fn(({ children }: { children: React.ReactNode }) => (
    <div data-testid="fade-in-up">{children}</div>
  )),
}));

// Mock BottomNav
vi.mock('@/components/BottomNav', () => ({
  BottomNav: vi.fn(() => <nav data-testid="bottom-nav">BottomNav</nav>),
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: vi.fn(({ src, alt, ...props }: { src: string; alt: string }) => (
    <img src={src} alt={alt} {...props} />
  )),
}));

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  const MockIcon = ({ className }: { className?: string }) => (
    <span className={className} data-testid="mock-icon" />
  );
  return {
    ...actual,
    LogOut: MockIcon,
    User: MockIcon,
    Users: MockIcon,
    Settings: MockIcon,
    Trophy: MockIcon,
    Target: MockIcon,
    Award: MockIcon,
    ChevronRight: MockIcon,
    Calendar: MockIcon,
    Bell: MockIcon,
    Shield: MockIcon,
    HelpCircle: MockIcon,
    MessageSquare: MockIcon,
    Star: MockIcon,
    TrendingUp: MockIcon,
    Flame: MockIcon,
    Zap: MockIcon,
    Heart: MockIcon,
    Megaphone: MockIcon,
    Palette: MockIcon,
    FlaskConical: MockIcon,
    QrCode: MockIcon,
  };
});
