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
//
// 2026-04-26: 240줄 인라인 사전 → Proxy 패턴으로 교체 (FolderHeart 같은 신규
// 아이콘 누락 재발 방지). PascalCase로 시작하는 모든 이름을 자동으로 아이콘
// mock 반환.
const iconCache = new Map<string, ReturnType<typeof createIconMock>>();
const createIconMock = (name: string) => {
  const IconMock = (props: Record<string, unknown>) =>
    React.createElement(
      'span',
      {
        'data-testid': `lucide-${name.toLowerCase()}`,
        ...props,
      },
      name
    );
  IconMock.displayName = name;
  return IconMock;
};
const getIcon = (name: string) => {
  let cached = iconCache.get(name);
  if (!cached) {
    cached = createIconMock(name);
    iconCache.set(name, cached);
  }
  return cached;
};

vi.mock('lucide-react', async () => {
  // importActual로 실제 export 목록을 enumerate해 vitest의 named export 검증을
  // 통과시키면서, PascalCase 이름은 모두 mock 컴포넌트로 wrap.
  // 신규 아이콘 추가 시 setup.ts 수정 불필요 (FolderHeart 같은 누락 재발 방지).
  const actual = await vi.importActual<Record<string, unknown>>('lucide-react');
  const wrapped: Record<string, unknown> = {};
  for (const key of Object.keys(actual)) {
    wrapped[key] = /^[A-Z]/.test(key) ? getIcon(key) : actual[key];
  }
  return wrapped;
});

// Mock @/components/animations (전체 export 매칭)
vi.mock('@/components/animations', () => ({
  FadeInUp: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'fade-in-up' }, children),
  ScaleIn: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'scale-in' }, children),
  CelebrationEffect: ({ trigger }: { trigger: boolean }) =>
    trigger ? React.createElement('div', { 'data-testid': 'celebration' }, '축하!') : null,
  Confetti: ({ trigger }: { trigger: boolean }) =>
    trigger ? React.createElement('div', { 'data-testid': 'confetti' }, '🎉') : null,
  CountUp: ({ end }: { end: number }) =>
    React.createElement('span', { 'data-testid': 'count-up' }, String(end)),
  Sparkle: ({ children }: { children: React.ReactNode }) =>
    React.createElement('span', { 'data-testid': 'sparkle' }, children),
  PulseEmoji: ({ emoji }: { emoji: string }) =>
    React.createElement('span', { 'data-testid': 'pulse-emoji' }, emoji),
  BadgeDrop: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'badge-drop' }, children),
}));

// Mock next-intl/server (서버 컴포넌트용 i18n)
vi.mock('next-intl/server', () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
  getLocale: () => Promise.resolve('ko'),
  getMessages: () => Promise.resolve({}),
  getTimeZone: () => Promise.resolve('Asia/Seoul'),
  getNow: () => Promise.resolve(new Date()),
  getFormatter: () =>
    Promise.resolve({
      number: (n: number) => String(n),
      dateTime: (d: Date) => d.toISOString(),
      relativeTime: (d: Date) => d.toISOString(),
    }),
}));

// Mock @/components/share (ShareThemePicker 포함)
vi.mock('@/components/share', () => ({
  ShareButton: ({ onShare }: { onShare?: () => void }) =>
    React.createElement('button', { 'data-testid': 'share-button', onClick: onShare }, '공유'),
  PrintButton: () => React.createElement('button', { 'data-testid': 'print-button' }, 'PDF 저장'),
  ShareThemePicker: ({ value, onChange }: { value?: string; onChange?: (v: string) => void }) =>
    React.createElement(
      'select',
      {
        'data-testid': 'share-theme-picker',
        value,
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange?.(e.target.value),
      },
      React.createElement('option', { value: 'default' }, 'default')
    ),
}));

// Mock next-intl (i18n)
// Phase 5에서 추가된 다국어 지원 - 테스트에서는 키를 그대로 반환
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'ko',
  useMessages: () => ({}),
  useNow: () => new Date(),
  useTimeZone: () => 'Asia/Seoul',
  useFormatter: () => ({
    number: (n: number) => String(n),
    dateTime: (d: Date) => d.toISOString(),
    relativeTime: (d: Date) => d.toISOString(),
  }),
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock use-intl (next-intl 내부 의존성)
vi.mock('use-intl', () => ({
  useLocale: () => 'ko',
  useTranslations: () => (key: string) => key,
  useMessages: () => ({}),
  useNow: () => new Date(),
  useTimeZone: () => 'Asia/Seoul',
  useFormatter: () => ({
    number: (n: number) => String(n),
    dateTime: (d: Date) => d.toISOString(),
    relativeTime: (d: Date) => d.toISOString(),
  }),
  IntlProvider: ({ children }: { children: React.ReactNode }) => children,
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

  fill(): void {
    // No-op in mock
  }

  arc(
    _x: number,
    _y: number,
    _radius: number,
    _startAngle: number,
    _endAngle: number,
    _counterclockwise?: boolean
  ): void {
    // No-op in mock
  }

  quadraticCurveTo(_cpx: number, _cpy: number, _x: number, _y: number): void {
    // No-op in mock
  }

  setLineDash(_segments: number[]): void {
    // No-op in mock
  }

  fillText(_text: string, _x: number, _y: number, _maxWidth?: number): void {
    // No-op in mock
  }

  font: string = '10px sans-serif';

  measureText(_text: string): TextMetrics {
    return { width: 0 } as TextMetrics;
  }

  globalAlpha: number = 1;
  globalCompositeOperation: string = 'source-over';
  textAlign: string = 'start';
  textBaseline: string = 'alphabetic';
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
