import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 모듈 상태 초기화를 위해 매번 fresh import
describe('kakao lazy-sdk', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // window.Kakao 없는 상태로 시작
    if ('Kakao' in window) {
      delete (window as unknown as Record<string, unknown>).Kakao;
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('isKakaoSDKReady가 초기에 false이다', async () => {
    const { isKakaoSDKReady } = await import('@/lib/kakao/lazy-sdk');
    expect(isKakaoSDKReady()).toBe(false);
  });

  it('shareAnalysisResult가 함수로 export된다', async () => {
    const mod = await import('@/lib/kakao/lazy-sdk');
    expect(mod.shareAnalysisResult).toBeInstanceOf(Function);
    expect(mod.shareApp).toBeInstanceOf(Function);
    expect(mod.shareToKakao).toBeInstanceOf(Function);
    expect(mod.initKakaoSDK).toBeInstanceOf(Function);
  });

  it('KakaoShareOptions 타입이 존재한다', async () => {
    // 타입 레벨 테스트 — import 성공하면 통과
    const mod = await import('@/lib/kakao/lazy-sdk');
    expect(mod).toBeDefined();
  });

  it('initKakaoSDK가 KAKAO_APP_KEY 없으면 warn한다', async () => {
    // script 로드를 mock
    const mockScript = {
      src: '',
      async: false,
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
    };

    vi.spyOn(document, 'createElement').mockReturnValue(mockScript as unknown as HTMLElement);
    vi.spyOn(document.head, 'appendChild').mockImplementation((el) => {
      // script onload 시뮬레이션
      if (mockScript.onload) {
        // Kakao 객체 설정 (isInitialized: false)
        (window as unknown as Record<string, unknown>).Kakao = {
          init: vi.fn(),
          isInitialized: () => false,
          Share: { sendDefault: vi.fn(), createDefaultButton: vi.fn() },
          Link: { sendDefault: vi.fn() },
        };
        mockScript.onload();
      }
      return el;
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // NEXT_PUBLIC_KAKAO_APP_KEY 없는 환경
    const originalEnv = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
    delete process.env.NEXT_PUBLIC_KAKAO_APP_KEY;

    // 모듈 캐시 초기화 후 재import
    vi.resetModules();
    const { initKakaoSDK } = await import('@/lib/kakao/lazy-sdk');

    await initKakaoSDK();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('NEXT_PUBLIC_KAKAO_APP_KEY'));

    // 정리
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_KAKAO_APP_KEY = originalEnv;
    }
  });
});
