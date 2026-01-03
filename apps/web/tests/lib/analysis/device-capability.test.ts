/**
 * 기기 성능 감지 유틸리티 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getDeviceInfo,
  analyzeDeviceCapability,
  checkGPUAvailability,
  checkMemoryPressure,
  checkBatteryStatus,
} from '@/lib/analysis/device-capability';

describe('Device Capability', () => {
  // 원본 값 저장
  const originalNavigator = global.navigator;
  const originalWindow = global.window;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    // 원본 복원
    Object.defineProperty(global, 'navigator', { value: originalNavigator, writable: true });
    Object.defineProperty(global, 'window', { value: originalWindow, writable: true });
  });

  describe('getDeviceInfo', () => {
    it('SSR 환경에서는 빈 정보를 반환한다', () => {
      // window를 undefined로 설정
      Object.defineProperty(global, 'window', { value: undefined, writable: true });

      const info = getDeviceInfo();

      expect(info.userAgent).toBe('');
      expect(info.screen).toEqual({ width: 0, height: 0 });
    });

    it('브라우저 환경에서 기기 정보를 반환한다', () => {
      // Mock 브라우저 환경
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0',
          hardwareConcurrency: 8,
          deviceMemory: 8,
        },
        writable: true,
      });

      Object.defineProperty(global, 'window', {
        value: {
          screen: { width: 1920, height: 1080 },
        },
        writable: true,
      });

      const info = getDeviceInfo();

      expect(info.userAgent).toContain('Chrome');
      expect(info.cores).toBe(8);
      expect(info.memory).toBe(8);
      expect(info.screen.width).toBe(1920);
    });
  });

  describe('analyzeDeviceCapability', () => {
    it('고성능 데스크탑에서 high 티어를 반환한다', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          hardwareConcurrency: 16,
          deviceMemory: 16,
        },
        writable: true,
      });

      Object.defineProperty(global, 'window', {
        value: { screen: { width: 2560, height: 1440 } },
        writable: true,
      });

      const capability = analyzeDeviceCapability();

      expect(capability.tier).toBe('high');
      expect(capability.drapeColors).toBe(128);
      expect(capability.landmarkCount).toBe(468);
      expect(capability.useGPU).toBe(true);
    });

    it('중간 성능에서 medium 티어를 반환한다', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          hardwareConcurrency: 4,
          deviceMemory: 4,
        },
        writable: true,
      });

      Object.defineProperty(global, 'window', {
        value: { screen: { width: 1920, height: 1080 } },
        writable: true,
      });

      const capability = analyzeDeviceCapability();

      expect(capability.tier).toBe('medium');
      expect(capability.drapeColors).toBe(64);
      expect(capability.useGPU).toBe(true);
    });

    it('저사양 기기에서 low 티어를 반환한다', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
          hardwareConcurrency: 2,
          deviceMemory: 2,
        },
        writable: true,
      });

      Object.defineProperty(global, 'window', {
        value: { screen: { width: 1366, height: 768 } },
        writable: true,
      });

      const capability = analyzeDeviceCapability();

      expect(capability.tier).toBe('low');
      expect(capability.drapeColors).toBe(16);
      expect(capability.landmarkCount).toBe(68);
      expect(capability.useGPU).toBe(false);
    });

    it('모바일 기기는 한 단계 낮은 티어를 반환한다', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)',
          hardwareConcurrency: 8,
          deviceMemory: 8,
        },
        writable: true,
      });

      Object.defineProperty(global, 'window', {
        value: { screen: { width: 390, height: 844 } },
        writable: true,
      });

      const capability = analyzeDeviceCapability();

      // 고성능 모바일도 medium으로 제한
      expect(capability.tier).toBe('medium');
    });

    it('Android 기기도 모바일로 감지한다', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)',
          hardwareConcurrency: 4,
          deviceMemory: 4,
        },
        writable: true,
      });

      Object.defineProperty(global, 'window', {
        value: { screen: { width: 412, height: 892 } },
        writable: true,
      });

      const capability = analyzeDeviceCapability();

      expect(capability.tier).toBe('low');
    });
  });

  describe('checkGPUAvailability', () => {
    it('SSR 환경에서는 false를 반환한다', () => {
      Object.defineProperty(global, 'window', { value: undefined, writable: true });

      const result = checkGPUAvailability();

      expect(result).toBe(false);
    });

    it('WebGL2 지원 시 true를 반환한다', () => {
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue({}),
      };

      Object.defineProperty(global, 'window', { value: {}, writable: true });
      Object.defineProperty(global, 'document', {
        value: { createElement: vi.fn().mockReturnValue(mockCanvas) },
        writable: true,
      });

      const result = checkGPUAvailability();

      expect(result).toBe(true);
    });

    it('WebGL2 미지원 시 false를 반환한다', () => {
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(null),
      };

      Object.defineProperty(global, 'window', { value: {}, writable: true });
      Object.defineProperty(global, 'document', {
        value: { createElement: vi.fn().mockReturnValue(mockCanvas) },
        writable: true,
      });

      const result = checkGPUAvailability();

      expect(result).toBe(false);
    });
  });

  describe('checkMemoryPressure', () => {
    it('SSR 환경에서는 normal을 반환한다', () => {
      Object.defineProperty(global, 'window', { value: undefined, writable: true });

      const result = checkMemoryPressure();

      expect(result).toBe('normal');
    });

    it('performance.memory가 없으면 normal을 반환한다', () => {
      Object.defineProperty(global, 'window', {
        value: { performance: {} },
        writable: true,
      });

      const result = checkMemoryPressure();

      expect(result).toBe('normal');
    });

    it('메모리 사용량 90% 이상이면 critical을 반환한다', () => {
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

      const result = checkMemoryPressure();

      expect(result).toBe('critical');
    });

    it('메모리 사용량 70-90%이면 moderate를 반환한다', () => {
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

      const result = checkMemoryPressure();

      expect(result).toBe('moderate');
    });

    it('메모리 사용량 70% 미만이면 normal을 반환한다', () => {
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

      const result = checkMemoryPressure();

      expect(result).toBe('normal');
    });
  });

  describe('checkBatteryStatus', () => {
    it('navigator가 없으면 기본값을 반환한다', async () => {
      Object.defineProperty(global, 'navigator', { value: undefined, writable: true });

      const result = await checkBatteryStatus();

      expect(result.isLowPower).toBe(false);
      expect(result.level).toBe(1);
    });

    it('getBattery가 없으면 기본값을 반환한다', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
      });

      const result = await checkBatteryStatus();

      expect(result.isLowPower).toBe(false);
      expect(result.level).toBe(1);
    });

    it('배터리 30% 미만이고 충전 중이 아니면 저전력 모드', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          getBattery: vi.fn().mockResolvedValue({
            level: 0.2,
            charging: false,
          }),
        },
        writable: true,
      });

      const result = await checkBatteryStatus();

      expect(result.isLowPower).toBe(true);
      expect(result.level).toBe(0.2);
    });

    it('충전 중이면 저전력 모드가 아님', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          getBattery: vi.fn().mockResolvedValue({
            level: 0.1,
            charging: true,
          }),
        },
        writable: true,
      });

      const result = await checkBatteryStatus();

      expect(result.isLowPower).toBe(false);
    });

    it('배터리 30% 이상이면 저전력 모드가 아님', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          getBattery: vi.fn().mockResolvedValue({
            level: 0.5,
            charging: false,
          }),
        },
        writable: true,
      });

      const result = await checkBatteryStatus();

      expect(result.isLowPower).toBe(false);
    });
  });
});
