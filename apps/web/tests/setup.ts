import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

// 글로벌 테스트 설정
// 필요에 따라 추가 설정을 여기에 작성

// Mock lucide-react icons (글로벌)
// 모든 아이콘을 간단한 span으로 대체
// testid 형식: lucide-{name} (컴포넌트 testid와 충돌 방지)
// 컴포넌트가 data-testid를 전달하면 해당 값이 우선됨
const createIconMock = (name: string) => {
  const IconMock = (props: Record<string, unknown>) =>
    React.createElement('span', {
      'data-testid': `lucide-${name.toLowerCase()}`,
      ...props,  // 컴포넌트에서 전달한 props (data-testid 포함) 우선 적용
    }, name)
  IconMock.displayName = name
  return IconMock
}

vi.mock('lucide-react', () => ({
  // Navigation & UI
  Home: createIconMock('Home'),
  ChevronLeft: createIconMock('ChevronLeft'),
  ChevronRight: createIconMock('ChevronRight'),
  ChevronDown: createIconMock('ChevronDown'),
  ChevronUp: createIconMock('ChevronUp'),
  ArrowLeft: createIconMock('ArrowLeft'),
  ArrowRight: createIconMock('ArrowRight'),
  ArrowUp: createIconMock('ArrowUp'),
  X: createIconMock('X'),
  Check: createIconMock('Check'),
  Plus: createIconMock('Plus'),
  Minus: createIconMock('Minus'),
  Search: createIconMock('Search'),
  Settings: createIconMock('Settings'),
  Info: createIconMock('Info'),
  List: createIconMock('List'),

  // Status & Alerts
  Loader2: createIconMock('Loader2'),
  AlertTriangle: createIconMock('AlertTriangle'),
  AlertCircle: createIconMock('AlertCircle'),
  CheckCircle: createIconMock('CheckCircle'),
  CheckCircle2: createIconMock('CheckCircle2'),
  XCircle: createIconMock('XCircle'),
  HelpCircle: createIconMock('HelpCircle'),
  Ban: createIconMock('Ban'),

  // Actions
  RefreshCw: createIconMock('RefreshCw'),
  RefreshCcw: createIconMock('RefreshCcw'),
  RotateCcw: createIconMock('RotateCcw'),
  Play: createIconMock('Play'),
  Pause: createIconMock('Pause'),
  SkipForward: createIconMock('SkipForward'),
  Share2: createIconMock('Share2'),
  Download: createIconMock('Download'),
  Save: createIconMock('Save'),
  Trash2: createIconMock('Trash2'),
  ExternalLink: createIconMock('ExternalLink'),
  Send: createIconMock('Send'),
  ThumbsUp: createIconMock('ThumbsUp'),
  MoreVertical: createIconMock('MoreVertical'),
  Edit2: createIconMock('Edit2'),

  // Workout & Activity
  Dumbbell: createIconMock('Dumbbell'),
  Activity: createIconMock('Activity'),
  Flame: createIconMock('Flame'),
  Target: createIconMock('Target'),
  Timer: createIconMock('Timer'),
  Clock: createIconMock('Clock'),
  Zap: createIconMock('Zap'),

  // Mood & Energy
  Smile: createIconMock('Smile'),
  Meh: createIconMock('Meh'),
  Frown: createIconMock('Frown'),
  Battery: createIconMock('Battery'),
  BatteryLow: createIconMock('BatteryLow'),
  Bot: createIconMock('Bot'),

  // Nutrition & Health
  Utensils: createIconMock('Utensils'),
  UtensilsCrossed: createIconMock('UtensilsCrossed'),
  Droplets: createIconMock('Droplets'),
  GlassWater: createIconMock('GlassWater'),
  Coffee: createIconMock('Coffee'),
  CupSoda: createIconMock('CupSoda'),
  Wine: createIconMock('Wine'),
  Leaf: createIconMock('Leaf'),
  Scale: createIconMock('Scale'),
  Moon: createIconMock('Moon'),
  Sun: createIconMock('Sun'),
  Pill: createIconMock('Pill'),

  // Body & Measurement
  Ruler: createIconMock('Ruler'),

  // Trends & Stats
  TrendingUp: createIconMock('TrendingUp'),
  TrendingDown: createIconMock('TrendingDown'),
  BarChart3: createIconMock('BarChart3'),
  FileBarChart: createIconMock('FileBarChart'),

  // Products & Shopping
  Package: createIconMock('Package'),
  PackageX: createIconMock('PackageX'),
  ShoppingBag: createIconMock('ShoppingBag'),
  ShoppingCart: createIconMock('ShoppingCart'),
  Star: createIconMock('Star'),
  Heart: createIconMock('Heart'),

  // Style & Beauty
  Sparkles: createIconMock('Sparkles'),
  Palette: createIconMock('Palette'),
  Shirt: createIconMock('Shirt'),
  FlaskConical: createIconMock('FlaskConical'),

  // Media & Input
  Camera: createIconMock('Camera'),
  ImageIcon: createIconMock('ImageIcon'),
  ScanBarcode: createIconMock('ScanBarcode'),
  MessageCircle: createIconMock('MessageCircle'),
  Volume2: createIconMock('Volume2'),
  VolumeX: createIconMock('VolumeX'),

  // People & Awards
  User: createIconMock('User'),
  Users: createIconMock('Users'),
  UserPlus: createIconMock('UserPlus'),
  Trophy: createIconMock('Trophy'),
  Award: createIconMock('Award'),
  Medal: createIconMock('Medal'),
  Crown: createIconMock('Crown'),
  Percent: createIconMock('Percent'),

  // Admin & System
  LayoutDashboard: createIconMock('LayoutDashboard'),
  Server: createIconMock('Server'),
  Database: createIconMock('Database'),
  Cpu: createIconMock('Cpu'),
  HardDrive: createIconMock('HardDrive'),
  ToggleLeft: createIconMock('ToggleLeft'),
  ToggleRight: createIconMock('ToggleRight'),

  // Misc
  Calendar: createIconMock('Calendar'),
  Lock: createIconMock('Lock'),
  Lightbulb: createIconMock('Lightbulb'),
  Circle: createIconMock('Circle'),
  SlidersHorizontal: createIconMock('SlidersHorizontal'),
  Apple: createIconMock('Apple'),

  // UI Components (Icon 접미사 버전)
  XIcon: createIconMock('XIcon'),
  CheckIcon: createIconMock('CheckIcon'),
  ChevronDownIcon: createIconMock('ChevronDownIcon'),
  ChevronUpIcon: createIconMock('ChevronUpIcon'),
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    isSignedIn: false,
    user: null,
    isLoaded: true,
  }),
  useAuth: () => ({
    isSignedIn: false,
    userId: null,
    isLoaded: true,
  }),
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
  SignOutButton: ({ children }: { children: React.ReactNode }) => children,
  UserButton: () => null,
}))
