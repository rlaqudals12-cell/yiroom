import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// 글로벌 테스트 설정
// 필요에 따라 추가 설정을 여기에 작성

// IntersectionObserver 모킹 (useInfiniteScroll 훅에서 사용)
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(
    private callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit
  ) {}

  observe(_target: Element): void {
    // 즉시 관찰 대상이 visible하다고 콜백 호출
    this.callback(
      [
        {
          isIntersecting: true,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRatio: 1,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          target: _target,
          time: Date.now(),
        },
      ],
      this
    );
  }

  unobserve(_target: Element): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

global.IntersectionObserver = MockIntersectionObserver;

// ResizeObserver 모킹 (Radix UI Slider 등에서 사용)
class MockResizeObserver implements ResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}

  observe(_target: Element): void {
    // 즉시 콜백 호출
    this.callback(
      [
        {
          target: _target,
          contentRect: {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            top: 0,
            right: 100,
            bottom: 100,
            left: 0,
            toJSON: () => ({}),
          },
          borderBoxSize: [{ inlineSize: 100, blockSize: 100 }],
          contentBoxSize: [{ inlineSize: 100, blockSize: 100 }],
          devicePixelContentBoxSize: [{ inlineSize: 100, blockSize: 100 }],
        },
      ],
      this
    );
  }

  unobserve(_target: Element): void {}
  disconnect(): void {}
}

global.ResizeObserver = MockResizeObserver;

// Mock lucide-react icons (글로벌)
// 모든 아이콘을 간단한 span으로 대체
// testid 형식: lucide-{name} (컴포넌트 testid와 충돌 방지)
// 컴포넌트가 data-testid를 전달하면 해당 값이 우선됨
const createIconMock = (name: string) => {
  const IconMock = (props: Record<string, unknown>) =>
    React.createElement(
      'span',
      {
        'data-testid': `lucide-${name.toLowerCase()}`,
        ...props, // 컴포넌트에서 전달한 props (data-testid 포함) 우선 적용
      },
      name
    );
  IconMock.displayName = name;
  return IconMock;
};

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
  ArrowDown: createIconMock('ArrowDown'),
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
  MoreHorizontal: createIconMock('MoreHorizontal'),
  Edit2: createIconMock('Edit2'),
  Bookmark: createIconMock('Bookmark'),
  BookmarkPlus: createIconMock('BookmarkPlus'),
  Reply: createIconMock('Reply'),

  // Workout & Activity
  Dumbbell: createIconMock('Dumbbell'),
  Activity: createIconMock('Activity'),
  Flame: createIconMock('Flame'),
  Target: createIconMock('Target'),
  Timer: createIconMock('Timer'),
  Clock: createIconMock('Clock'),
  Zap: createIconMock('Zap'),
  ZapOff: createIconMock('ZapOff'),

  // Mood & Energy
  Smile: createIconMock('Smile'),
  Meh: createIconMock('Meh'),
  Frown: createIconMock('Frown'),
  Battery: createIconMock('Battery'),
  BatteryLow: createIconMock('BatteryLow'),
  Bot: createIconMock('Bot'),

  // Weather & Temperature
  Thermometer: createIconMock('Thermometer'),
  Cloud: createIconMock('Cloud'),
  CloudRain: createIconMock('CloudRain'),
  CloudSun: createIconMock('CloudSun'),
  Wind: createIconMock('Wind'),

  // Mental & Stress
  Brain: createIconMock('Brain'),

  // Nutrition & Health
  Utensils: createIconMock('Utensils'),
  UtensilsCrossed: createIconMock('UtensilsCrossed'),
  ChefHat: createIconMock('ChefHat'),
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
  BarChart: createIconMock('BarChart'),
  BarChart3: createIconMock('BarChart3'),
  FileBarChart: createIconMock('FileBarChart'),

  // Products & Shopping
  Package: createIconMock('Package'),
  PackageX: createIconMock('PackageX'),
  ShoppingBag: createIconMock('ShoppingBag'),
  ShoppingCart: createIconMock('ShoppingCart'),
  Star: createIconMock('Star'),
  Heart: createIconMock('Heart'),
  GitCompare: createIconMock('GitCompare'),
  Droplet: createIconMock('Droplet'),
  Bell: createIconMock('Bell'),

  // Style & Beauty
  Sparkles: createIconMock('Sparkles'),
  Palette: createIconMock('Palette'),
  Shirt: createIconMock('Shirt'),
  FlaskConical: createIconMock('FlaskConical'),
  Tag: createIconMock('Tag'),
  Brush: createIconMock('Brush'),
  Scissors: createIconMock('Scissors'),
  Wand2: createIconMock('Wand2'),
  ScanFace: createIconMock('ScanFace'),

  // Media & Input
  Camera: createIconMock('Camera'),
  CameraOff: createIconMock('CameraOff'),
  Image: createIconMock('Image'),
  ImageIcon: createIconMock('ImageIcon'),
  ImagePlus: createIconMock('ImagePlus'),
  ScanBarcode: createIconMock('ScanBarcode'),
  ScanLine: createIconMock('ScanLine'),
  Flashlight: createIconMock('Flashlight'),
  FlashlightOff: createIconMock('FlashlightOff'),
  MessageCircle: createIconMock('MessageCircle'),
  Volume2: createIconMock('Volume2'),
  VolumeX: createIconMock('VolumeX'),
  Keyboard: createIconMock('Keyboard'),
  Hash: createIconMock('Hash'),

  // People & Awards
  User: createIconMock('User'),
  Users: createIconMock('Users'),
  UserPlus: createIconMock('UserPlus'),
  Trophy: createIconMock('Trophy'),
  Award: createIconMock('Award'),
  Medal: createIconMock('Medal'),
  Crown: createIconMock('Crown'),
  Gem: createIconMock('Gem'),
  Shield: createIconMock('Shield'),
  Percent: createIconMock('Percent'),

  // Admin & System
  LayoutDashboard: createIconMock('LayoutDashboard'),
  Server: createIconMock('Server'),
  Database: createIconMock('Database'),
  Cpu: createIconMock('Cpu'),
  HardDrive: createIconMock('HardDrive'),
  ToggleLeft: createIconMock('ToggleLeft'),
  ToggleRight: createIconMock('ToggleRight'),
  Eye: createIconMock('Eye'),
  EyeOff: createIconMock('EyeOff'),

  // Charts & Analysis
  LineChart: createIconMock('LineChart'),

  // History
  History: createIconMock('History'),

  // Accessories (K-1)
  Watch: createIconMock('Watch'),
  Glasses: createIconMock('Glasses'),

  // Misc
  Calendar: createIconMock('Calendar'),
  Lock: createIconMock('Lock'),
  Lightbulb: createIconMock('Lightbulb'),
  Circle: createIconMock('Circle'),
  SlidersHorizontal: createIconMock('SlidersHorizontal'),
  Apple: createIconMock('Apple'),
  Hand: createIconMock('Hand'),
  FileText: createIconMock('FileText'),
  Move: createIconMock('Move'),
  ClipboardList: createIconMock('ClipboardList'),
  Upload: createIconMock('Upload'),
  Megaphone: createIconMock('Megaphone'),
  MessageSquare: createIconMock('MessageSquare'),
  Filter: createIconMock('Filter'),

  // Fashion K-2
  Grid3X3: createIconMock('Grid3X3'),
  Briefcase: createIconMock('Briefcase'),
  SortAsc: createIconMock('SortAsc'),
  ArrowUpDown: createIconMock('ArrowUpDown'),
  Store: createIconMock('Store'),

  // Product Shelf
  Archive: createIconMock('Archive'),
  Beaker: createIconMock('Beaker'),
  CircleSlash: createIconMock('CircleSlash'),
  EllipsisVertical: createIconMock('EllipsisVertical'),
  QrCode: createIconMock('QrCode'),
  Copy: createIconMock('Copy'),
  Link: createIconMock('Link'),

  // UI Components (Icon 접미사 버전)
  XIcon: createIconMock('XIcon'),
  CheckIcon: createIconMock('CheckIcon'),
  ChevronDownIcon: createIconMock('ChevronDownIcon'),
  ChevronUpIcon: createIconMock('ChevronUpIcon'),
}));

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
}));

// Mock @imgly/background-removal (optional peer dependency)
vi.mock('@imgly/background-removal', () => ({
  removeBackground: vi.fn().mockResolvedValue(new Blob()),
}));

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
}));

// Mock Supabase Clerk Client (Supabase 환경 변수가 없는 테스트 환경용)
// 체인 호출을 지원하는 모킹
const createChainableMock = () => {
  const chainable: Record<string, unknown> = {};
  const methods = [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'gt',
    'lt',
    'gte',
    'lte',
    'like',
    'ilike',
    'in',
    'contains',
    'containedBy',
    'range',
    'overlaps',
    'textSearch',
    'match',
    'not',
    'or',
    'filter',
    'order',
    'limit',
    'single',
    'maybeSingle',
    'range',
    'is',
    'csv',
  ];
  methods.forEach((method) => {
    chainable[method] = vi.fn(() => ({
      ...chainable,
      then: (resolve: (value: { data: unknown; error: null }) => unknown) =>
        resolve({ data: [], error: null }),
    }));
  });
  return chainable;
};

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({
    from: vi.fn(() => createChainableMock()),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
  }),
}));

// Mock server-only (Next.js Server Component 전용 모듈)
// Clerk의 auth()가 내부적으로 사용하므로 테스트 환경에서 모킹 필요
vi.mock('server-only', () => ({}));

// Mock @clerk/nextjs/server (API Route 테스트용)
// 개별 테스트에서 vi.mocked(auth).mockResolvedValue()로 오버라이드 가능
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: null }),
  currentUser: vi.fn().mockResolvedValue(null),
  clerkClient: vi.fn(() => ({
    users: {
      getUser: vi.fn().mockResolvedValue(null),
    },
  })),
}));

// ============================================================================
// Canvas API Mock (브라우저 환경 시뮬레이션)
// ============================================================================

// Mock ImageData 클래스 (ImageData 인터페이스와 호환)
class MockImageData {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  readonly colorSpace: PredefinedColorSpace = 'srgb';

  constructor(width: number, height: number);
  constructor(data: Uint8ClampedArray, width: number, height?: number);
  constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight: number, height?: number) {
    if (typeof dataOrWidth === 'number') {
      this.width = dataOrWidth;
      this.height = widthOrHeight;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
    } else {
      this.data = dataOrWidth;
      this.width = widthOrHeight;
      this.height = height ?? Math.floor(dataOrWidth.length / (widthOrHeight * 4));
    }
  }
}

global.ImageData = MockImageData as unknown as typeof ImageData;

// Mock CanvasRenderingContext2D
class MockCanvasRenderingContext2D {
  canvas: HTMLCanvasElement;
  private _imageData: MockImageData | null = null;
  fillStyle: string = '#000000';
  strokeStyle: string = '#000000';
  lineWidth: number = 1;
  shadowBlur: number = 0;
  shadowColor: string = 'transparent';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  getImageData(sx: number, sy: number, sw: number, sh: number): ImageData {
    const data = new Uint8ClampedArray(sw * sh * 4);
    // 기본값으로 회색 픽셀 채우기
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 128; // R
      data[i + 1] = 128; // G
      data[i + 2] = 128; // B
      data[i + 3] = 255; // A
    }
    return new MockImageData(data, sw, sh) as unknown as ImageData;
  }

  putImageData(_imageData: ImageData, _dx: number, _dy: number): void {
    // No-op in mock
  }

  drawImage(..._args: unknown[]): void {
    // No-op in mock
  }

  clearRect(_x: number, _y: number, _w: number, _h: number): void {
    // No-op in mock
  }

  fillRect(_x: number, _y: number, _w: number, _h: number): void {
    // No-op in mock
  }

  scale(_x: number, _y: number): void {
    // No-op in mock
  }

  save(): void {
    // No-op in mock
  }

  restore(): void {
    // No-op in mock
  }

  beginPath(): void {
    // No-op in mock
  }

  rect(_x: number, _y: number, _w: number, _h: number): void {
    // No-op in mock
  }

  clip(): void {
    // No-op in mock
  }

  moveTo(_x: number, _y: number): void {
    // No-op in mock
  }

  lineTo(_x: number, _y: number): void {
    // No-op in mock
  }

  stroke(): void {
    // No-op in mock
  }
}

// HTMLCanvasElement의 getContext 모킹
const originalCreateElement = document.createElement.bind(document);
document.createElement = function <K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options?: ElementCreationOptions
): HTMLElementTagNameMap[K] {
  const element = originalCreateElement(tagName, options);

  if (tagName === 'canvas') {
    const canvas = element as HTMLCanvasElement;
    const mockCtx = new MockCanvasRenderingContext2D(canvas);

    canvas.getContext = vi.fn((_contextId: string, _options?: unknown) => {
      return mockCtx as unknown as CanvasRenderingContext2D;
    }) as unknown as typeof canvas.getContext;

    canvas.toDataURL = vi.fn((_type?: string, _quality?: number) => 'data:image/png;base64,mock');

    canvas.toBlob = vi.fn((callback: BlobCallback, _type?: string, _quality?: number) => {
      callback(new Blob(['mock'], { type: 'image/png' }));
    });
  }

  return element;
};

// performance.now() mock (노드 환경)
if (typeof performance === 'undefined' || !performance.now) {
  global.performance = {
    ...global.performance,
    now: () => Date.now(),
  } as Performance;
}
