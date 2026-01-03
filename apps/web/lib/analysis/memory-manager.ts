/**
 * 메모리 관리 유틸리티
 * @description 대용량 이미지/Canvas 처리 시 메모리 최적화
 */

// ============================================
// 상수 정의
// ============================================

/** 메모리 경고 임계값 (70%) */
const MEMORY_WARNING_THRESHOLD = 0.7;

/** 메모리 위험 임계값 (90%) */
const MEMORY_CRITICAL_THRESHOLD = 0.9;

/** 가비지 컬렉션 요청 간격 (5초) */
const GC_REQUEST_INTERVAL = 5000;

// ============================================
// 메모리 상태 타입
// ============================================

export type MemoryStatus = 'normal' | 'warning' | 'critical';

export interface MemoryInfo {
  /** 현재 상태 */
  status: MemoryStatus;
  /** 사용 중인 힙 크기 (bytes) */
  usedHeap: number;
  /** 힙 제한 크기 (bytes) */
  heapLimit: number;
  /** 사용률 (0.0 ~ 1.0) */
  usageRatio: number;
}

// ============================================
// 리소스 추적
// ============================================

/** 해제 대기 리소스 목록 */
const pendingResources: Set<{ release: () => void }> = new Set();

/** 마지막 GC 요청 시간 */
let lastGCRequest = 0;

/**
 * 해제 가능한 리소스 등록
 * - 컴포넌트 언마운트 시 일괄 해제
 */
export function registerResource(resource: { release: () => void }): void {
  pendingResources.add(resource);
}

/**
 * 리소스 해제 및 등록 취소
 */
export function unregisterResource(resource: { release: () => void }): void {
  pendingResources.delete(resource);
}

/**
 * 모든 대기 리소스 해제
 */
export function releaseAllResources(): void {
  pendingResources.forEach((resource) => {
    try {
      resource.release();
    } catch {
      // 이미 해제된 경우 무시
    }
  });
  pendingResources.clear();
}

// ============================================
// 메모리 모니터링
// ============================================

/**
 * 현재 메모리 상태 조회
 * - Chrome 전용 API 사용
 */
export function getMemoryInfo(): MemoryInfo {
  // SSR 환경
  if (typeof window === 'undefined') {
    return {
      status: 'normal',
      usedHeap: 0,
      heapLimit: 0,
      usageRatio: 0,
    };
  }

  // performance.memory는 Chrome 전용
  const performance = window.performance as Performance & {
    memory?: {
      usedJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  };

  if (!performance.memory) {
    // 지원하지 않는 브라우저
    return {
      status: 'normal',
      usedHeap: 0,
      heapLimit: 0,
      usageRatio: 0,
    };
  }

  const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
  const usageRatio = usedJSHeapSize / jsHeapSizeLimit;

  let status: MemoryStatus = 'normal';
  if (usageRatio >= MEMORY_CRITICAL_THRESHOLD) {
    status = 'critical';
  } else if (usageRatio >= MEMORY_WARNING_THRESHOLD) {
    status = 'warning';
  }

  return {
    status,
    usedHeap: usedJSHeapSize,
    heapLimit: jsHeapSizeLimit,
    usageRatio,
  };
}

/**
 * 메모리 상태 체크 (boolean 반환)
 */
export function isMemoryOk(): boolean {
  const info = getMemoryInfo();
  return info.status === 'normal';
}

/**
 * 메모리 압박 상태 체크
 */
export function isMemoryPressured(): boolean {
  const info = getMemoryInfo();
  return info.status === 'warning' || info.status === 'critical';
}

// ============================================
// 가비지 컬렉션 힌트
// ============================================

/**
 * 가비지 컬렉션 요청 (힌트)
 * - 강제 GC는 불가하지만, 힌트 제공
 */
export function requestGC(): void {
  const now = Date.now();

  // 요청 간격 제한
  if (now - lastGCRequest < GC_REQUEST_INTERVAL) {
    return;
  }

  lastGCRequest = now;

  // 대기 리소스 해제
  releaseAllResources();

  // 브라우저에 메모리 해제 힌트
  if (typeof window !== 'undefined' && 'gc' in window) {
    try {
      // Chrome --expose-gc 플래그 필요 (개발용)
      (window as Window & { gc?: () => void }).gc?.();
    } catch {
      // 무시
    }
  }
}

// ============================================
// Canvas 메모리 해제
// ============================================

/**
 * Canvas 메모리 해제
 * - 대용량 Canvas 사용 후 호출
 */
export function releaseCanvas(canvas: HTMLCanvasElement): void {
  try {
    // 크기를 0으로 설정하여 메모리 해제
    canvas.width = 0;
    canvas.height = 0;

    // 컨텍스트 해제
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, 0, 0);
    }
  } catch {
    // 이미 해제된 경우 무시
  }
}

/**
 * ImageData 해제 (참조 해제)
 * - Float32Array 등 대용량 버퍼 해제
 */
export function releaseImageData(imageData: ImageData | null): void {
  if (!imageData) return;

  // TypedArray 참조 해제 (GC가 수거하도록)
  (imageData as unknown as Record<string, unknown>).data = null;
}

/**
 * Float32Array 해제
 */
export function releaseTypedArray(
  array: Float32Array | Uint8Array | Uint8ClampedArray | null
): void {
  if (!array) return;

  // 버퍼 참조 해제
  try {
    (array as unknown as { buffer: ArrayBuffer | null }).buffer = null;
  } catch {
    // 읽기 전용인 경우 무시
  }
}

// ============================================
// 메모리 안전 실행
// ============================================

/**
 * 메모리 안전하게 함수 실행
 * - 메모리 압박 시 대기 후 재시도
 */
export async function runWithMemorySafety<T>(
  fn: () => T | Promise<T>,
  options?: {
    maxRetries?: number;
    delayMs?: number;
  }
): Promise<T> {
  const { maxRetries = 3, delayMs = 500 } = options ?? {};

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const memoryInfo = getMemoryInfo();

    if (memoryInfo.status === 'critical') {
      console.warn(`[Memory] 메모리 위험 상태, 정리 시도 (${attempt + 1}/${maxRetries})`);
      requestGC();
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      continue;
    }

    if (memoryInfo.status === 'warning' && attempt === 0) {
      console.warn('[Memory] 메모리 경고 상태, 리소스 정리 중...');
      requestGC();
      await new Promise((resolve) => setTimeout(resolve, delayMs / 2));
    }

    return await fn();
  }

  // 최대 재시도 후에도 실행
  console.warn('[Memory] 메모리 압박 상태에서 강제 실행');
  return await fn();
}

// ============================================
// React Hook용 유틸리티
// ============================================

/**
 * 컴포넌트 언마운트 시 호출할 정리 함수 생성
 */
export function createCleanupFunction(
  resources: Array<
    HTMLCanvasElement | ImageData | Float32Array | Uint8Array | Uint8ClampedArray | null
  >
): () => void {
  return () => {
    resources.forEach((resource) => {
      if (!resource) return;

      if (resource instanceof HTMLCanvasElement) {
        releaseCanvas(resource);
      } else if (resource instanceof ImageData) {
        releaseImageData(resource);
      } else {
        // Float32Array, Uint8Array, Uint8ClampedArray
        releaseTypedArray(resource);
      }
    });

    // 대기 리소스 정리
    releaseAllResources();
  };
}

// ============================================
// 디버그 유틸리티
// ============================================

/**
 * 메모리 사용량 로깅 (개발용)
 */
export function logMemoryUsage(label?: string): void {
  const info = getMemoryInfo();

  if (info.heapLimit === 0) {
    console.log(`[Memory${label ? ` - ${label}` : ''}] 측정 불가 (Chrome 전용)`);
    return;
  }

  const usedMB = Math.round(info.usedHeap / 1024 / 1024);
  const limitMB = Math.round(info.heapLimit / 1024 / 1024);
  const percentage = Math.round(info.usageRatio * 100);

  console.log(
    `[Memory${label ? ` - ${label}` : ''}] ${usedMB}MB / ${limitMB}MB (${percentage}%) - ${info.status}`
  );
}
