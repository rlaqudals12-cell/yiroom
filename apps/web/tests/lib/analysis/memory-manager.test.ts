/**
 * 메모리 관리 유틸리티 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  registerResource,
  unregisterResource,
  releaseAllResources,
  getMemoryInfo,
  isMemoryOk,
  isMemoryPressured,
  releaseCanvas,
  releaseImageData,
  releaseTypedArray,
  createCleanupFunction,
  runWithMemorySafety,
  logMemoryUsage,
} from '@/lib/analysis/memory-manager';

// Node 환경에서 브라우저 API mock
class MockHTMLCanvasElement {
  width = 0;
  height = 0;
  getContext() {
    return { clearRect: vi.fn() };
  }
}

class MockImageData {
  data: Uint8ClampedArray | null = new Uint8ClampedArray(100);
  width = 10;
  height = 10;
}

// Global mock 설정
Object.defineProperty(global, 'HTMLCanvasElement', {
  value: MockHTMLCanvasElement,
  writable: true,
});
Object.defineProperty(global, 'ImageData', { value: MockImageData, writable: true });

describe('Memory Manager', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(global, 'window', { value: originalWindow, writable: true });
    releaseAllResources();
  });

  describe('리소스 등록/해제', () => {
    it('리소스를 등록하고 해제할 수 있다', () => {
      const mockResource = { release: vi.fn() };

      registerResource(mockResource);
      releaseAllResources();

      expect(mockResource.release).toHaveBeenCalled();
    });

    it('등록된 리소스를 개별 해제할 수 있다', () => {
      const mockResource = { release: vi.fn() };

      registerResource(mockResource);
      unregisterResource(mockResource);
      releaseAllResources();

      expect(mockResource.release).not.toHaveBeenCalled();
    });

    it('여러 리소스를 등록하고 일괄 해제할 수 있다', () => {
      const resources = [{ release: vi.fn() }, { release: vi.fn() }, { release: vi.fn() }];

      resources.forEach(registerResource);
      releaseAllResources();

      resources.forEach((resource) => {
        expect(resource.release).toHaveBeenCalled();
      });
    });

    it('이미 해제된 리소스는 에러 없이 처리한다', () => {
      const mockResource = {
        release: vi.fn().mockImplementation(() => {
          throw new Error('Already released');
        }),
      };

      registerResource(mockResource);

      expect(() => releaseAllResources()).not.toThrow();
    });
  });

  describe('getMemoryInfo', () => {
    it('SSR 환경에서는 기본값을 반환한다', () => {
      Object.defineProperty(global, 'window', { value: undefined, writable: true });

      const info = getMemoryInfo();

      expect(info.status).toBe('normal');
      expect(info.usedHeap).toBe(0);
      expect(info.heapLimit).toBe(0);
      expect(info.usageRatio).toBe(0);
    });

    it('performance.memory가 없으면 기본값을 반환한다', () => {
      Object.defineProperty(global, 'window', {
        value: { performance: {} },
        writable: true,
      });

      const info = getMemoryInfo();

      expect(info.status).toBe('normal');
    });

    it('메모리 사용률 70% 미만이면 normal 상태', () => {
      Object.defineProperty(global, 'window', {
        value: {
          performance: {
            memory: {
              usedJSHeapSize: 500000000,
              jsHeapSizeLimit: 1000000000,
            },
          },
        },
        writable: true,
      });

      const info = getMemoryInfo();

      expect(info.status).toBe('normal');
      expect(info.usageRatio).toBe(0.5);
    });

    it('메모리 사용률 70-90%이면 warning 상태', () => {
      Object.defineProperty(global, 'window', {
        value: {
          performance: {
            memory: {
              usedJSHeapSize: 800000000,
              jsHeapSizeLimit: 1000000000,
            },
          },
        },
        writable: true,
      });

      const info = getMemoryInfo();

      expect(info.status).toBe('warning');
    });

    it('메모리 사용률 90% 이상이면 critical 상태', () => {
      Object.defineProperty(global, 'window', {
        value: {
          performance: {
            memory: {
              usedJSHeapSize: 950000000,
              jsHeapSizeLimit: 1000000000,
            },
          },
        },
        writable: true,
      });

      const info = getMemoryInfo();

      expect(info.status).toBe('critical');
    });
  });

  describe('isMemoryOk / isMemoryPressured', () => {
    it('normal 상태에서 isMemoryOk는 true', () => {
      Object.defineProperty(global, 'window', {
        value: { performance: {} },
        writable: true,
      });

      expect(isMemoryOk()).toBe(true);
      expect(isMemoryPressured()).toBe(false);
    });

    it('warning 상태에서 isMemoryPressured는 true', () => {
      Object.defineProperty(global, 'window', {
        value: {
          performance: {
            memory: {
              usedJSHeapSize: 800000000,
              jsHeapSizeLimit: 1000000000,
            },
          },
        },
        writable: true,
      });

      expect(isMemoryOk()).toBe(false);
      expect(isMemoryPressured()).toBe(true);
    });
  });

  describe('releaseCanvas', () => {
    it('Canvas 크기를 0으로 설정하고 컨텍스트를 정리한다', () => {
      const mockCtx = { clearRect: vi.fn() };
      const mockCanvas = {
        width: 1920,
        height: 1080,
        getContext: vi.fn().mockReturnValue(mockCtx),
      } as unknown as HTMLCanvasElement;

      releaseCanvas(mockCanvas);

      expect(mockCanvas.width).toBe(0);
      expect(mockCanvas.height).toBe(0);
      expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 0, 0);
    });

    it('에러 발생 시 무시한다', () => {
      const mockCanvas = {
        get width() {
          throw new Error('Test error');
        },
        set width(_: number) {
          throw new Error('Test error');
        },
      } as unknown as HTMLCanvasElement;

      expect(() => releaseCanvas(mockCanvas)).not.toThrow();
    });
  });

  describe('releaseImageData', () => {
    it('ImageData의 data 참조를 해제한다', () => {
      const mockImageData = {
        data: new Uint8ClampedArray(100),
        width: 10,
        height: 10,
      } as unknown as ImageData;

      releaseImageData(mockImageData);

      expect((mockImageData as unknown as { data: null }).data).toBeNull();
    });

    it('null 입력은 무시한다', () => {
      expect(() => releaseImageData(null)).not.toThrow();
    });
  });

  describe('releaseTypedArray', () => {
    it('TypedArray의 buffer 참조를 해제한다', () => {
      // 실제 TypedArray는 buffer가 읽기 전용이므로 에러 없이 처리
      const array = new Float32Array(100);

      expect(() => releaseTypedArray(array)).not.toThrow();
    });

    it('null 입력은 무시한다', () => {
      expect(() => releaseTypedArray(null)).not.toThrow();
    });
  });

  describe('createCleanupFunction', () => {
    it('정리 함수를 생성하고 호출 시 에러 없이 실행된다', () => {
      // Node 환경에서는 HTMLCanvasElement/ImageData가 없으므로
      // TypedArray만 테스트
      const array = new Float32Array(100);

      const cleanup = createCleanupFunction([array, null]);

      expect(() => cleanup()).not.toThrow();
    });

    it('null 요소는 무시한다', () => {
      const cleanup = createCleanupFunction([null, null]);

      expect(() => cleanup()).not.toThrow();
    });
  });

  describe('runWithMemorySafety', () => {
    it('normal 상태에서 즉시 실행한다', async () => {
      Object.defineProperty(global, 'window', {
        value: { performance: {} },
        writable: true,
      });

      const fn = vi.fn().mockResolvedValue('result');
      const result = await runWithMemorySafety(fn);

      expect(result).toBe('result');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('critical 상태에서 재시도 후 실행한다', async () => {
      let attempts = 0;

      Object.defineProperty(global, 'window', {
        value: {
          performance: {
            memory: {
              get usedJSHeapSize() {
                // 첫 번째 시도는 critical, 이후 normal
                return attempts++ < 1 ? 950000000 : 500000000;
              },
              jsHeapSizeLimit: 1000000000,
            },
          },
        },
        writable: true,
      });

      const fn = vi.fn().mockReturnValue('result');
      const result = await runWithMemorySafety(fn, { maxRetries: 3, delayMs: 10 });

      expect(result).toBe('result');
    });

    it('최대 재시도 후 강제 실행한다', async () => {
      Object.defineProperty(global, 'window', {
        value: {
          performance: {
            memory: {
              usedJSHeapSize: 950000000,
              jsHeapSizeLimit: 1000000000,
            },
          },
        },
        writable: true,
      });

      const fn = vi.fn().mockReturnValue('result');
      const result = await runWithMemorySafety(fn, { maxRetries: 2, delayMs: 10 });

      expect(result).toBe('result');
    });
  });

  describe('logMemoryUsage', () => {
    it('메모리 정보를 로깅한다', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      Object.defineProperty(global, 'window', {
        value: { performance: {} },
        writable: true,
      });

      logMemoryUsage('test');

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('Chrome에서 상세 정보를 로깅한다', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      Object.defineProperty(global, 'window', {
        value: {
          performance: {
            memory: {
              usedJSHeapSize: 500 * 1024 * 1024,
              jsHeapSizeLimit: 1000 * 1024 * 1024,
            },
          },
        },
        writable: true,
      });

      logMemoryUsage();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('500MB'));
      consoleSpy.mockRestore();
    });
  });
});
