/**
 * 퍼스널 컬러 분석 페이지 테스트
 * /analysis/personal-color
 *
 * - 페이지 렌더링
 * - 단계별 플로우 (가이드 → 다각도촬영 → 손목촬영 → 분석 → 결과)
 * - 기존 퍼스널 컬러 입력 플로우
 * - 에러 처리
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock lucide-react icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  const MockIcon = ({
    className,
    'aria-hidden': ariaHidden,
  }: {
    className?: string;
    'aria-hidden'?: boolean | 'true' | 'false';
  }) => <svg className={className} aria-hidden={ariaHidden} data-testid="mock-icon" />;
  return {
    ...actual,
    Clock: MockIcon,
    ArrowRight: MockIcon,
    Palette: MockIcon,
    Camera: MockIcon,
    Sun: MockIcon,
    CheckCircle2: MockIcon,
    XCircle: MockIcon,
  };
});

// Mock Next.js router
const mockPush = vi.fn();
const mockSearchParamsGet = vi.fn().mockReturnValue(null);
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: mockSearchParamsGet,
  }),
}));

// Mock Clerk
const mockIsSignedIn = vi.fn(() => true);
const mockIsLoaded = vi.fn(() => true);
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isSignedIn: mockIsSignedIn(),
    isLoaded: mockIsLoaded(),
  }),
}));

// 퍼스널 대비 실측(ADR-116)은 jsdom에서 Image.onload가 발화하지 않아 목 처리 —
// 실측 로직 자체는 contrast-measure.test.ts에서 합성 픽셀로 검증됨
vi.mock('@/app/(main)/analysis/personal-color/_components/measure-contrast', () => ({
  measureContrastLevel: vi.fn().mockResolvedValue(null),
}));
vi.mock('@/hooks/useFaceLandmarker', () => ({
  useFaceLandmarker: () => ({ detect: vi.fn().mockResolvedValue(null), isReady: false }),
}));

// Mock 이미지 압축 유틸리티
vi.mock('@/lib/utils/image-compression', () => ({
  compressFileToBase64: vi.fn().mockResolvedValue('data:image/jpeg;base64,mockBase64'),
}));

// Mock Supabase client
const mockSupabaseSelect = vi.fn();
const mockSupabaseFrom = vi.fn(() => ({
  select: mockSupabaseSelect,
}));

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({
    from: mockSupabaseFrom,
  }),
}));

// Mock components
// onSkip은 자가입력 우회 경로 제거로 폐기됨 — prop이 넘어오면 skip-button이 렌더되도록 두어,
// 우회 경로가 재도입되면 아래 회귀 테스트가 실패하게 한다.
vi.mock('@/app/(main)/analysis/personal-color/_components/LightingGuide', () => ({
  default: ({
    onContinue,
    onSkip,
  }: {
    onContinue: (consentToSaveImage: boolean) => void;
    onSkip?: () => void;
  }) => (
    <div data-testid="lighting-guide">
      <button onClick={() => onContinue(false)} data-testid="continue-button">
        계속하기
      </button>
      {onSkip && (
        <button onClick={onSkip} data-testid="skip-button">
          기존 퍼스널 컬러 입력
        </button>
      )}
    </div>
  ),
}));

vi.mock('@/app/(main)/analysis/personal-color/_components/MultiAnglePersonalColorCapture', () => ({
  default: ({
    onComplete,
    onCancel,
  }: {
    onComplete: (images: unknown) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="multi-angle-capture">
      <button
        onClick={() =>
          onComplete({
            frontImageBase64: 'data:image/png;base64,front',
            leftImageBase64: 'data:image/png;base64,left',
            rightImageBase64: 'data:image/png;base64,right',
          })
        }
        data-testid="capture-complete"
      >
        촬영 완료
      </button>
      <button onClick={onCancel} data-testid="capture-cancel">
        취소
      </button>
    </div>
  ),
}));

vi.mock('@/app/(main)/analysis/personal-color/_components/WristPhotoUpload', () => ({
  default: ({
    onPhotoSelect,
    onSkip,
  }: {
    onPhotoSelect: (file: File) => void;
    onSkip: () => void;
  }) => (
    <div data-testid="wrist-photo-upload">
      <button
        onClick={() => {
          const file = new File(['wrist'], 'wrist.jpg', { type: 'image/jpeg' });
          onPhotoSelect(file);
        }}
        data-testid="wrist-select"
      >
        손목 사진 선택
      </button>
      <button onClick={onSkip} data-testid="wrist-skip">
        건너뛰기
      </button>
    </div>
  ),
}));

vi.mock('@/app/(main)/analysis/personal-color/_components/AnalysisLoading', () => ({
  default: ({ isApiComplete }: { isApiComplete?: boolean }) => (
    <div data-testid="analysis-loading">분석 중...{isApiComplete && <span>완료</span>}</div>
  ),
}));

vi.mock('@/app/(main)/analysis/personal-color/_components/AnalysisResult', () => ({
  default: ({ result, onRetry }: { result: unknown; onRetry: () => void }) => (
    <div data-testid="analysis-result">
      <div>분석 결과</div>
      <button onClick={onRetry} data-testid="retry-button">
        다시 분석
      </button>
    </div>
  ),
}));

import PersonalColorPage from '@/app/(main)/analysis/personal-color/page';

describe('PersonalColorPage', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSignedIn.mockReturnValue(true);
    mockIsLoaded.mockReturnValue(true);

    // 기본 fetch mock — init 시 /api/analyze/personal-color 호출 대응
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ data: null }),
    });

    // Supabase 기본 응답 설정 (기존 분석 없음 + 동의 없음)
    mockSupabaseSelect.mockReturnValue({
      // consent 쿼리: .select().eq().maybeSingle()
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
      // 기존 분석 쿼리: .select().order().limit().maybeSingle()
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('렌더링', () => {
    it('페이지가 렌더링된다', async () => {
      render(<PersonalColorPage />);

      // i18n 도입으로 테스트 환경에서는 번역 키가 렌더됨 (ko: "퍼스널 컬러 진단")
      await waitFor(() => {
        expect(screen.getByText('pc.title')).toBeInTheDocument();
      });
    });

    it('초기에는 조명 가이드가 표시된다', async () => {
      render(<PersonalColorPage />);

      await waitFor(() => {
        expect(screen.getByTestId('lighting-guide')).toBeInTheDocument();
      });
    });

    it('서브타이틀이 표시된다', async () => {
      render(<PersonalColorPage />);

      // i18n 키 렌더 (ko: "정확한 진단을 위한 촬영 가이드")
      await waitFor(() => {
        expect(screen.getByText('pc.subtitle.guide')).toBeInTheDocument();
      });
    });

    // 자가입력 우회 경로 제거 회귀 방지: 가이드에 "이미 알고 있어요" 건너뛰기 버튼이 없어야 함
    it('자가입력 우회(skip) 버튼이 더 이상 렌더되지 않는다', async () => {
      render(<PersonalColorPage />);

      await waitFor(() => {
        expect(screen.getByTestId('lighting-guide')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('skip-button')).not.toBeInTheDocument();
    });
  });

  describe('정상 플로우: 다각도 촬영', () => {
    it('가이드 → 다각도촬영 → 손목촬영 → 분석 단계로 진행된다', async () => {
      // init fetch는 빠르게 응답, 분석 fetch는 영원히 대기 → 로딩 상태 유지
      let fetchCallCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        fetchCallCount++;
        // 첫 2회 호출(init 시 checkExistingAnalysis 등)은 빠르게 응답
        if (fetchCallCount <= 2) {
          return Promise.resolve({ ok: false, status: 404, json: async () => ({ data: null }) });
        }
        // 이후 호출(분석 API)은 영원히 대기
        return new Promise(() => {});
      });

      const user = userEvent.setup();
      render(<PersonalColorPage />);

      // 1. 조명 가이드
      await waitFor(() => {
        expect(screen.getByTestId('lighting-guide')).toBeInTheDocument();
      });

      // 2. 계속하기 클릭 → 다각도 촬영
      await user.click(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(screen.getByTestId('multi-angle-capture')).toBeInTheDocument();
      });

      // 3. 촬영 완료 → 손목 촬영
      await user.click(screen.getByTestId('capture-complete'));

      await waitFor(() => {
        expect(screen.getByTestId('wrist-photo-upload')).toBeInTheDocument();
      });

      // 4. 손목 사진 선택 → 분석 로딩
      await user.click(screen.getByTestId('wrist-select'));

      await waitFor(() => {
        expect(screen.getByTestId('analysis-loading')).toBeInTheDocument();
      });
    });

    it('손목 사진 건너뛰기가 가능하다', async () => {
      // init fetch는 빠르게 응답, 분석 fetch는 영원히 대기
      let fetchCallCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        fetchCallCount++;
        if (fetchCallCount <= 2) {
          return Promise.resolve({ ok: false, status: 404, json: async () => ({ data: null }) });
        }
        return new Promise(() => {});
      });

      const user = userEvent.setup();
      render(<PersonalColorPage />);

      await waitFor(() => {
        expect(screen.getByTestId('lighting-guide')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('continue-button'));
      await user.click(screen.getByTestId('capture-complete'));

      await waitFor(() => {
        expect(screen.getByTestId('wrist-photo-upload')).toBeInTheDocument();
      });

      // 건너뛰기
      await user.click(screen.getByTestId('wrist-skip'));

      await waitFor(() => {
        expect(screen.getByTestId('analysis-loading')).toBeInTheDocument();
      });
    });
  });

  describe('취소/뒤로가기 동작', () => {
    it('다각도 촬영에서 취소하면 가이드로 돌아간다', async () => {
      const user = userEvent.setup();
      render(<PersonalColorPage />);

      await waitFor(() => {
        expect(screen.getByTestId('lighting-guide')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('continue-button'));
      await user.click(screen.getByTestId('capture-cancel'));

      await waitFor(() => {
        expect(screen.getByTestId('lighting-guide')).toBeInTheDocument();
      });
    });
  });

  describe('기존 분석 결과', () => {
    it('기존 분석이 있으면 배너가 표시된다', async () => {
      // 낮은 신뢰도 (< 70)면 자동 리디렉트 대신 배너 표시
      mockSupabaseSelect.mockReturnValue({
        // consent 쿼리: .select().eq().maybeSingle()
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        // 기존 분석 쿼리: .select().order().limit().maybeSingle()
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: 'test-id',
                season: 'spring',
                confidence: 50, // 낮은 신뢰도 → 배너 표시
                created_at: new Date().toISOString(),
              },
              error: null,
              count: 1,
            }),
          }),
        }),
      });

      render(<PersonalColorPage />);

      await waitFor(() => {
        // 낮은 신뢰도 기존 분석 배너 — i18n 키 렌더 (ko: "기존 분석 결과 보기")
        expect(screen.getByText('action.viewExistingResult')).toBeInTheDocument();
      });
    });
  });

  describe('로딩 상태', () => {
    it('인증 로딩 중에는 렌더링하지 않는다', () => {
      mockIsLoaded.mockReturnValue(false);
      render(<PersonalColorPage />);

      // 조명 가이드가 표시되지 않아야 함
      expect(screen.queryByTestId('lighting-guide')).not.toBeInTheDocument();
    });
  });

  describe('AI 분석', () => {
    it('분석 중 메시지가 표시된다', async () => {
      // init fetch는 빠르게 응답, 분석 fetch는 영원히 대기
      let fetchCallCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        fetchCallCount++;
        if (fetchCallCount <= 2) {
          return Promise.resolve({ ok: false, status: 404, json: async () => ({ data: null }) });
        }
        return new Promise(() => {});
      });

      const user = userEvent.setup();
      render(<PersonalColorPage />);

      await waitFor(() => {
        expect(screen.getByTestId('lighting-guide')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('continue-button'));
      await user.click(screen.getByTestId('capture-complete'));
      await user.click(screen.getByTestId('wrist-skip'));

      // 분석 진행 중 서브타이틀 — i18n 키 렌더 (ko: "AI가 분석 중이에요...")
      await waitFor(() => {
        expect(screen.getByText('subtitle.aiAnalyzing')).toBeInTheDocument();
      });
    });
  });
});

describe('PersonalColorPage - API 통합', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('API 호출이 성공하면 결과가 표시된다', async () => {
    // GET: 기존 분석 확인 (없음 반환 → 새 분석 진행)
    const mockGetResponse = {
      data: null,
    };

    // POST: 새 분석 결과 (router.push로 결과 페이지 이동)
    const mockPostResponse = {
      data: {
        id: 'test-analysis-id',
        season: 'spring',
        confidence: 95,
        created_at: new Date().toISOString(),
      },
      usedMock: false,
      analysisReliability: 'high',
      imagesCount: 2,
    };

    // GET과 POST 요청 구분하여 응답
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url, options) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => mockPostResponse,
        });
      }
      // GET 요청
      return Promise.resolve({
        ok: true,
        json: async () => mockGetResponse,
      });
    });

    const user = userEvent.setup();
    render(<PersonalColorPage />);

    await waitFor(() => {
      expect(screen.getByTestId('lighting-guide')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('continue-button'));
    await user.click(screen.getByTestId('capture-complete'));
    await user.click(screen.getByTestId('wrist-skip'));

    // POST 호출 후 router.push로 결과 페이지 이동
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith('/analysis/personal-color/result/test-analysis-id');
      },
      { timeout: 3000 }
    );
  });
});
