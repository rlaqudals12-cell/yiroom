/**
 * 얼굴 랜드마크 추출 — Mock 폴백 정직 노출(usedFallback) 테스트
 *
 * @module tests/lib/analysis/face-landmark-fallback
 * @description AI 불변식: 폴백 경로는 usedFallback=true, 실검출 성공은 false를 반환해야 한다.
 *   (CSP로 MediaPipe CDN이 차단된 프로덕션에서 무음 폴백이 실측처럼 노출되는 것을 방지)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// mediapipe-loader 모킹 — CDN/실검출 경로를 결정론적으로 제어
vi.mock('@/lib/analysis/mediapipe-loader', () => ({
  checkMediaPipeCDN: vi.fn(),
  initFaceMesh: vi.fn(),
  closeFaceMesh: vi.fn(),
}));

import { extractFaceLandmarks } from '@/lib/analysis/face-landmark';
import { checkMediaPipeCDN, initFaceMesh } from '@/lib/analysis/mediapipe-loader';

/** MediaPipe 결과 형태 */
interface FakeResults {
  multiFaceLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
}

/**
 * 가짜 FaceMesh 생성 — onResults 콜백을 send() 시점에 호출
 */
function createFakeFaceMesh(faceCount: number = 1): {
  setOptions: ReturnType<typeof vi.fn>;
  onResults: (cb: (results: FakeResults) => void) => void;
  send: (input: { image: unknown }) => Promise<void>;
  close: ReturnType<typeof vi.fn>;
} {
  let callback: ((results: FakeResults) => void) | null = null;
  return {
    setOptions: vi.fn(),
    onResults: (cb: (results: FakeResults) => void): void => {
      callback = cb;
    },
    send: async (): Promise<void> => {
      callback?.({
        multiFaceLandmarks:
          faceCount > 0
            ? Array.from({ length: faceCount }, () =>
                Array.from({ length: 468 }, () => ({ x: 0.5, y: 0.5, z: 0 }))
              )
            : [],
      });
    },
    close: vi.fn(),
  };
}

const fakeImage = {} as HTMLImageElement;

describe('extractFaceLandmarks — usedFallback 플래그', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 환경변수에 의한 Mock 강제를 차단해 경로를 결정론적으로
    vi.stubEnv('NEXT_PUBLIC_FORCE_MOCK_AI', 'false');
    // 폴백 경로의 console 출력이 테스트 로그를 오염시키지 않도록
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('should set usedFallback=true when useMock option is forced', async () => {
    const result = await extractFaceLandmarks(fakeImage, { useMock: true });

    expect(result).not.toBeNull();
    expect(result?.usedFallback).toBe(true);
    expect(result?.landmarks).toHaveLength(468);
    // Mock 강제 경로는 CDN/실검출을 시도하지 않는다
    expect(checkMediaPipeCDN).not.toHaveBeenCalled();
  });

  it('should set usedFallback=true when env NEXT_PUBLIC_FORCE_MOCK_AI=true', async () => {
    vi.stubEnv('NEXT_PUBLIC_FORCE_MOCK_AI', 'true');

    const result = await extractFaceLandmarks(fakeImage);

    expect(result?.usedFallback).toBe(true);
  });

  it('should set usedFallback=true when CDN is unavailable (CSP 차단 시나리오)', async () => {
    vi.mocked(checkMediaPipeCDN).mockResolvedValue(false);

    const result = await extractFaceLandmarks(fakeImage);

    expect(result).not.toBeNull();
    expect(result?.usedFallback).toBe(true);
    expect(initFaceMesh).not.toHaveBeenCalled();
  });

  it('should set usedFallback=true when MediaPipe init throws', async () => {
    vi.mocked(checkMediaPipeCDN).mockResolvedValue(true);
    vi.mocked(initFaceMesh).mockRejectedValue(new Error('로드 실패'));

    const result = await extractFaceLandmarks(fakeImage);

    expect(result).not.toBeNull();
    expect(result?.usedFallback).toBe(true);
  });

  it('should set usedFallback=false when real detection succeeds', async () => {
    vi.mocked(checkMediaPipeCDN).mockResolvedValue(true);
    vi.mocked(initFaceMesh).mockResolvedValue(createFakeFaceMesh(1) as never);

    const result = await extractFaceLandmarks(fakeImage);

    expect(result).not.toBeNull();
    expect(result?.usedFallback).toBe(false);
    expect(result?.landmarks).toHaveLength(468);
  });

  it('should return null (not fallback) when no face is detected', async () => {
    vi.mocked(checkMediaPipeCDN).mockResolvedValue(true);
    vi.mocked(initFaceMesh).mockResolvedValue(createFakeFaceMesh(0) as never);

    const result = await extractFaceLandmarks(fakeImage);

    // 얼굴 미감지는 폴백이 아니라 null — 소비자가 명시적 에러로 처리
    expect(result).toBeNull();
  });
});
