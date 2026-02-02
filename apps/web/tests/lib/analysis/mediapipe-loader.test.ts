/**
 * MediaPipe Face Mesh 로더 테스트
 *
 * @module tests/lib/analysis/mediapipe-loader
 * @description isFaceMeshLoaded, closeFaceMesh, checkMediaPipeCDN 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';

// 모듈을 동적으로 import하기 위해 변수 선언
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let isFaceMeshLoaded: () => boolean;
let closeFaceMesh: () => void;
let checkMediaPipeCDN: () => Promise<boolean>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let initFaceMesh: (...args: any[]) => Promise<any>;
let preloadFaceMesh: () => void;

describe('mediapipe-loader', () => {
  // 각 테스트 전에 모듈 상태 리셋
  beforeEach(async () => {
    vi.resetModules();

    // window 객체 모킹
    const mockWindow = {
      FaceMesh: undefined as unknown,
      requestIdleCallback: undefined as unknown,
    };

    vi.stubGlobal('window', mockWindow);
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        src: '',
        crossOrigin: '',
        onload: null as (() => void) | null,
        onerror: null as ((err: unknown) => void) | null,
      })),
      head: {
        appendChild: vi.fn((script: { onload?: () => void }) => {
          // 스크립트 로드 시뮬레이션
          if (script.onload) {
            setTimeout(() => script.onload?.(), 0);
          }
        }),
      },
    });

    // 모듈 다시 import
    const module = await import('@/lib/analysis/mediapipe-loader');
    isFaceMeshLoaded = module.isFaceMeshLoaded;
    closeFaceMesh = module.closeFaceMesh;
    checkMediaPipeCDN = module.checkMediaPipeCDN;
    initFaceMesh = module.initFaceMesh;
    preloadFaceMesh = module.preloadFaceMesh;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('isFaceMeshLoaded', () => {
    it('초기 상태에서 false를 반환한다', () => {
      expect(isFaceMeshLoaded()).toBe(false);
    });

    it('FaceMesh 인스턴스가 없으면 false를 반환한다', () => {
      expect(isFaceMeshLoaded()).toBe(false);
    });
  });

  describe('closeFaceMesh', () => {
    it('인스턴스가 없을 때 호출해도 에러가 발생하지 않는다', () => {
      expect(() => closeFaceMesh()).not.toThrow();
    });

    it('호출 후 isFaceMeshLoaded가 false를 반환한다', () => {
      closeFaceMesh();
      expect(isFaceMeshLoaded()).toBe(false);
    });
  });

  describe('checkMediaPipeCDN', () => {
    it('fetch 성공 시 true를 반환한다', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await checkMediaPipeCDN();

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('cdn.jsdelivr.net'),
        expect.objectContaining({ method: 'HEAD' })
      );
    });

    it('fetch 실패 시 false를 반환한다', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await checkMediaPipeCDN();

      expect(result).toBe(false);
    });

    it('fetch 예외 발생 시 false를 반환한다', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      vi.stubGlobal('fetch', mockFetch);

      const result = await checkMediaPipeCDN();

      expect(result).toBe(false);
    });

    it('MediaPipe CDN URL로 요청한다', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', mockFetch);

      await checkMediaPipeCDN();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('@mediapipe/face_mesh'),
        expect.any(Object)
      );
    });

    it('HEAD 메서드로 요청한다', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', mockFetch);

      await checkMediaPipeCDN();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'HEAD' })
      );
    });

    it('no-cache 옵션으로 요청한다', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      vi.stubGlobal('fetch', mockFetch);

      await checkMediaPipeCDN();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ cache: 'no-cache' })
      );
    });
  });
});

describe('SSR 환경 처리', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('window가 undefined일 때 initFaceMesh가 에러를 던진다', async () => {
    // window를 undefined로 설정
    vi.stubGlobal('window', undefined);

    const module = await import('@/lib/analysis/mediapipe-loader');

    await expect(module.initFaceMesh()).rejects.toThrow('브라우저 환경에서만 사용 가능');
  });

  it('window가 undefined일 때 preloadFaceMesh가 에러 없이 반환한다', async () => {
    vi.stubGlobal('window', undefined);

    const module = await import('@/lib/analysis/mediapipe-loader');

    expect(() => module.preloadFaceMesh()).not.toThrow();
  });
});

describe('initFaceMesh', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('FaceMesh 클래스가 없으면 에러를 던진다', async () => {
    const mockScript = {
      src: '',
      crossOrigin: '',
      onload: null as (() => void) | null,
      onerror: null as ((err: unknown) => void) | null,
    };

    vi.stubGlobal('window', { FaceMesh: undefined });
    vi.stubGlobal('document', {
      createElement: vi.fn(() => mockScript),
      head: {
        appendChild: vi.fn((script: typeof mockScript) => {
          // 스크립트 로드 성공 시뮬레이션
          setTimeout(() => script.onload?.(), 10);
        }),
      },
    });

    const module = await import('@/lib/analysis/mediapipe-loader');

    await expect(module.initFaceMesh()).rejects.toThrow('FaceMesh 클래스를 찾을 수 없음');
  });

  it('스크립트 로드 실패 시 에러를 던진다', async () => {
    const mockScript = {
      src: '',
      crossOrigin: '',
      onload: null as (() => void) | null,
      onerror: null as ((err: unknown) => void) | null,
    };

    vi.stubGlobal('window', { FaceMesh: undefined });
    vi.stubGlobal('document', {
      createElement: vi.fn(() => mockScript),
      head: {
        appendChild: vi.fn((script: typeof mockScript) => {
          // 스크립트 로드 실패 시뮬레이션
          setTimeout(() => script.onerror?.(new Error('Load failed')), 10);
        }),
      },
    });

    const module = await import('@/lib/analysis/mediapipe-loader');

    await expect(module.initFaceMesh()).rejects.toThrow('CDN 로드 실패');
  });

  it('이미 FaceMesh가 로드되어 있으면 스크립트를 로드하지 않는다', async () => {
    const mockFaceMesh = vi.fn().mockImplementation(() => ({
      setOptions: vi.fn(),
      onResults: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
    }));

    const createElementMock = vi.fn();

    vi.stubGlobal('window', { FaceMesh: mockFaceMesh });
    vi.stubGlobal('document', {
      createElement: createElementMock,
      head: { appendChild: vi.fn() },
    });

    const module = await import('@/lib/analysis/mediapipe-loader');
    await module.initFaceMesh();

    // createElement가 호출되지 않음 (이미 로드됨)
    expect(createElementMock).not.toHaveBeenCalled();
  });

  it('성공적으로 초기화되면 FaceMesh 인스턴스를 반환한다', async () => {
    const mockFaceMeshInstance = {
      setOptions: vi.fn(),
      onResults: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
    };

    const MockFaceMeshClass = vi.fn().mockImplementation(() => mockFaceMeshInstance);

    vi.stubGlobal('window', { FaceMesh: MockFaceMeshClass });
    vi.stubGlobal('document', {
      createElement: vi.fn(),
      head: { appendChild: vi.fn() },
    });

    const module = await import('@/lib/analysis/mediapipe-loader');
    const result = await module.initFaceMesh();

    expect(result).toBe(mockFaceMeshInstance);
    expect(module.isFaceMeshLoaded()).toBe(true);
  });

  it('옵션이 전달되면 setOptions에 적용된다', async () => {
    const mockSetOptions = vi.fn();
    const mockFaceMeshInstance = {
      setOptions: mockSetOptions,
      onResults: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
    };

    const MockFaceMeshClass = vi.fn().mockImplementation(() => mockFaceMeshInstance);

    vi.stubGlobal('window', { FaceMesh: MockFaceMeshClass });
    vi.stubGlobal('document', {
      createElement: vi.fn(),
      head: { appendChild: vi.fn() },
    });

    const module = await import('@/lib/analysis/mediapipe-loader');
    await module.initFaceMesh({ maxNumFaces: 2 });

    expect(mockSetOptions).toHaveBeenCalledWith(
      expect.objectContaining({ maxNumFaces: 2 })
    );
  });

  it('기본 옵션이 적용된다', async () => {
    const mockSetOptions = vi.fn();
    const mockFaceMeshInstance = {
      setOptions: mockSetOptions,
      onResults: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
    };

    const MockFaceMeshClass = vi.fn().mockImplementation(() => mockFaceMeshInstance);

    vi.stubGlobal('window', { FaceMesh: MockFaceMeshClass });
    vi.stubGlobal('document', {
      createElement: vi.fn(),
      head: { appendChild: vi.fn() },
    });

    const module = await import('@/lib/analysis/mediapipe-loader');
    await module.initFaceMesh();

    expect(mockSetOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })
    );
  });

  it('두 번째 호출 시 캐시된 인스턴스를 반환한다', async () => {
    const mockFaceMeshInstance = {
      setOptions: vi.fn(),
      onResults: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
    };

    const MockFaceMeshClass = vi.fn().mockImplementation(() => mockFaceMeshInstance);

    vi.stubGlobal('window', { FaceMesh: MockFaceMeshClass });
    vi.stubGlobal('document', {
      createElement: vi.fn(),
      head: { appendChild: vi.fn() },
    });

    const module = await import('@/lib/analysis/mediapipe-loader');

    const result1 = await module.initFaceMesh();
    const result2 = await module.initFaceMesh();

    expect(result1).toBe(result2);
    expect(MockFaceMeshClass).toHaveBeenCalledTimes(1);
  });
});

describe('closeFaceMesh 상세', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('인스턴스의 close 메서드를 호출한다', async () => {
    const mockClose = vi.fn();
    const mockFaceMeshInstance = {
      setOptions: vi.fn(),
      onResults: vi.fn(),
      send: vi.fn(),
      close: mockClose,
    };

    const MockFaceMeshClass = vi.fn().mockImplementation(() => mockFaceMeshInstance);

    vi.stubGlobal('window', { FaceMesh: MockFaceMeshClass });
    vi.stubGlobal('document', {
      createElement: vi.fn(),
      head: { appendChild: vi.fn() },
    });

    const module = await import('@/lib/analysis/mediapipe-loader');

    await module.initFaceMesh();
    module.closeFaceMesh();

    expect(mockClose).toHaveBeenCalled();
  });

  it('close 후 isFaceMeshLoaded가 false를 반환한다', async () => {
    const mockFaceMeshInstance = {
      setOptions: vi.fn(),
      onResults: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
    };

    const MockFaceMeshClass = vi.fn().mockImplementation(() => mockFaceMeshInstance);

    vi.stubGlobal('window', { FaceMesh: MockFaceMeshClass });
    vi.stubGlobal('document', {
      createElement: vi.fn(),
      head: { appendChild: vi.fn() },
    });

    const module = await import('@/lib/analysis/mediapipe-loader');

    await module.initFaceMesh();
    expect(module.isFaceMeshLoaded()).toBe(true);

    module.closeFaceMesh();
    expect(module.isFaceMeshLoaded()).toBe(false);
  });

  it('close 메서드에서 에러가 발생해도 상태가 리셋된다', async () => {
    const mockFaceMeshInstance = {
      setOptions: vi.fn(),
      onResults: vi.fn(),
      send: vi.fn(),
      close: vi.fn().mockImplementation(() => {
        throw new Error('Close failed');
      }),
    };

    const MockFaceMeshClass = vi.fn().mockImplementation(() => mockFaceMeshInstance);

    vi.stubGlobal('window', { FaceMesh: MockFaceMeshClass });
    vi.stubGlobal('document', {
      createElement: vi.fn(),
      head: { appendChild: vi.fn() },
    });

    const module = await import('@/lib/analysis/mediapipe-loader');

    await module.initFaceMesh();

    // 에러가 발생해도 예외를 던지지 않음
    expect(() => module.closeFaceMesh()).not.toThrow();
    expect(module.isFaceMeshLoaded()).toBe(false);
  });
});

describe('preloadFaceMesh', () => {
  beforeEach(async () => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('requestIdleCallback이 있으면 사용한다', async () => {
    const mockRequestIdleCallback = vi.fn((callback: () => void) => {
      callback();
    });

    const mockFaceMeshInstance = {
      setOptions: vi.fn(),
      onResults: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
    };
    const MockFaceMeshClass = vi.fn().mockImplementation(() => mockFaceMeshInstance);

    vi.stubGlobal('window', {
      FaceMesh: MockFaceMeshClass,
      requestIdleCallback: mockRequestIdleCallback,
    });
    vi.stubGlobal('document', {
      createElement: vi.fn(),
      head: { appendChild: vi.fn() },
    });

    const module = await import('@/lib/analysis/mediapipe-loader');
    module.preloadFaceMesh();

    expect(mockRequestIdleCallback).toHaveBeenCalled();
  });

  it('requestIdleCallback이 없으면 setTimeout을 사용한다', async () => {
    const mockSetTimeout = vi.fn();
    const originalSetTimeout = global.setTimeout;

    const mockFaceMeshInstance = {
      setOptions: vi.fn(),
      onResults: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
    };
    const MockFaceMeshClass = vi.fn().mockImplementation(() => mockFaceMeshInstance);

    // requestIdleCallback 프로퍼티를 아예 포함하지 않는 window 객체 생성
    // (undefined로 설정하면 'in' 연산자가 true를 반환함)
    const windowWithoutIdleCallback = {
      FaceMesh: MockFaceMeshClass,
    };

    vi.stubGlobal('window', windowWithoutIdleCallback);
    vi.stubGlobal('setTimeout', mockSetTimeout);
    vi.stubGlobal('document', {
      createElement: vi.fn(),
      head: { appendChild: vi.fn() },
    });

    const module = await import('@/lib/analysis/mediapipe-loader');
    module.preloadFaceMesh();

    // setTimeout이 1000ms 딜레이로 호출됨
    expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);

    // 원래 setTimeout 복원
    vi.stubGlobal('setTimeout', originalSetTimeout);
  });

  it('프리로드 실패해도 예외를 던지지 않는다', async () => {
    const mockRequestIdleCallback = vi.fn((callback: () => void) => {
      callback();
    });

    vi.stubGlobal('window', {
      FaceMesh: undefined, // FaceMesh가 없어서 에러 발생
      requestIdleCallback: mockRequestIdleCallback,
    });
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        src: '',
        crossOrigin: '',
        onload: null,
        onerror: null,
      })),
      head: {
        appendChild: vi.fn((script: { onload?: () => void }) => {
          setTimeout(() => script.onload?.(), 0);
        }),
      },
    });

    const module = await import('@/lib/analysis/mediapipe-loader');

    // 예외를 던지지 않음
    expect(() => module.preloadFaceMesh()).not.toThrow();
  });
});
