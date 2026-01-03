/**
 * 기기 성능 감지 유틸리티
 * @description 기기 성능을 분석하여 적절한 분석 모드 결정
 */

import type { DeviceCapability, DeviceTier, DeviceInfo } from '@/types/visual-analysis';

// 성능 티어 결정 기준값
const MEMORY_THRESHOLD_HIGH = 8; // GB
const MEMORY_THRESHOLD_MEDIUM = 4; // GB
const CORES_THRESHOLD_HIGH = 8;
const CORES_THRESHOLD_MEDIUM = 4;

/**
 * 기기 성능 티어 계산
 * - high: 8GB+ RAM, 8+ cores
 * - medium: 4-8GB RAM, 4-8 cores
 * - low: 4GB 미만 RAM 또는 4 미만 cores
 */
function calculateDeviceTier(info: DeviceInfo): DeviceTier {
  const memory = info.memory ?? 0;
  const cores = info.cores ?? navigator.hardwareConcurrency ?? 2;

  // 모바일 기기 감지
  const isMobile = /Android|iPhone|iPad|iPod/i.test(info.userAgent);

  // 모바일은 한 단계 낮게 설정 (배터리, 발열 고려)
  if (isMobile) {
    if (memory >= MEMORY_THRESHOLD_HIGH && cores >= CORES_THRESHOLD_HIGH) {
      return 'medium';
    }
    return 'low';
  }

  // 데스크탑
  if (memory >= MEMORY_THRESHOLD_HIGH && cores >= CORES_THRESHOLD_HIGH) {
    return 'high';
  }
  if (memory >= MEMORY_THRESHOLD_MEDIUM && cores >= CORES_THRESHOLD_MEDIUM) {
    return 'medium';
  }
  return 'low';
}

/**
 * 기기 정보 수집
 */
export function getDeviceInfo(): DeviceInfo {
  // SSR 환경 체크
  if (typeof window === 'undefined') {
    return {
      userAgent: '',
      screen: { width: 0, height: 0 },
    };
  }

  return {
    userAgent: navigator.userAgent,
    screen: {
      width: window.screen.width,
      height: window.screen.height,
    },
    // Chrome에서만 사용 가능 (deviceMemory)
    memory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
    cores: navigator.hardwareConcurrency,
  };
}

/**
 * 기기 성능 분석
 * - 성능에 따라 드레이프 색상 수, 랜드마크 수, GPU 사용 여부 결정
 */
export function analyzeDeviceCapability(): DeviceCapability {
  const info = getDeviceInfo();
  const tier = calculateDeviceTier(info);

  // 성능 티어별 설정
  const capabilityMap: Record<DeviceTier, Omit<DeviceCapability, 'tier'>> = {
    high: {
      drapeColors: 128,
      landmarkCount: 468,
      useGPU: true,
    },
    medium: {
      drapeColors: 64,
      landmarkCount: 468,
      useGPU: true,
    },
    low: {
      drapeColors: 16,
      landmarkCount: 68,
      useGPU: false,
    },
  };

  return {
    tier,
    ...capabilityMap[tier],
  };
}

/**
 * GPU 가용성 확인
 * - WebGL 2.0 지원 여부 확인
 */
export function checkGPUAvailability(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return gl !== null;
  } catch {
    return false;
  }
}

/**
 * 메모리 상태 확인 (Chrome 전용)
 * - 메모리 압박 상태 감지
 */
export function checkMemoryPressure(): 'normal' | 'moderate' | 'critical' {
  if (typeof window === 'undefined') return 'normal';

  // performance.memory는 Chrome 전용
  const performance = window.performance as Performance & {
    memory?: {
      usedJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  };

  if (!performance.memory) return 'normal';

  const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
  const usageRatio = usedJSHeapSize / jsHeapSizeLimit;

  if (usageRatio > 0.9) return 'critical';
  if (usageRatio > 0.7) return 'moderate';
  return 'normal';
}

/**
 * 배터리 상태 확인 (지원 브라우저 한정)
 * - 저전력 모드 감지
 */
export async function checkBatteryStatus(): Promise<{
  isLowPower: boolean;
  level: number;
}> {
  if (typeof navigator === 'undefined') {
    return { isLowPower: false, level: 1 };
  }

  try {
    const battery = await (
      navigator as Navigator & {
        getBattery?: () => Promise<{
          level: number;
          charging: boolean;
        }>;
      }
    ).getBattery?.();

    if (!battery) {
      return { isLowPower: false, level: 1 };
    }

    // 충전 중이 아니고 30% 미만이면 저전력 모드
    const isLowPower = !battery.charging && battery.level < 0.3;
    return { isLowPower, level: battery.level };
  } catch {
    return { isLowPower: false, level: 1 };
  }
}
