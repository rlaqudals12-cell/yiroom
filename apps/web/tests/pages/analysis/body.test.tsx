/**
 * 체형 분석 페이지 테스트
 * /analysis/body
 *
 * - 페이지 렌더링
 * - 단계별 플로우 (가이드 → 입력 → 촬영 → 분석 → 결과)
 * - 기존 체형 타입 입력 플로우
 * - 에러 처리
 */

import React from 'react';
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
    User: MockIcon,
    Camera: MockIcon,
    Sun: MockIcon,
    CheckCircle2: MockIcon,
    XCircle: MockIcon,
  };
});

// 현행 페이지는 next-intl 키(analysisEntry.*)를 사용 — setup.ts의 "키 그대로 반환" mock 대신
// 실제 한국어 메시지(ko.json)로 해석해 사용자 대면 텍스트 기준 검증을 유지한다.
vi.mock('next-intl', async () => {
  const ko = (await import('@/messages/ko.json')).default as Record<string, unknown>;
  const resolve = (ns: string | undefined, key: string): string => {
    const path = ns ? `${ns}.${key}` : key;
    const value = path
      .split('.')
      .reduce<unknown>((acc, part) => (acc as Record<string, unknown> | undefined)?.[part], ko);
    return typeof value === 'string' ? value : key;
  };
  return {
    useTranslations: (ns?: string) => (key: string) => resolve(ns, key),
    useLocale: () => 'ko',
    useMessages: () => ko,
    useNow: () => new Date(),
    useTimeZone: () => 'Asia/Seoul',
    useFormatter: () => ({
      number: (n: number) => String(n),
      dateTime: (d: Date) => d.toISOString(),
      relativeTime: (d: Date) => d.toISOString(),
    }),
    NextIntlClientProvider: ({ children }: { children?: unknown }) => children,
  };
});

// Mock Next.js router
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockSearchParamsGet = vi.fn().mockReturnValue(null);
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: mockSearchParamsGet,
  }),
  usePathname: () => '/analysis/body',
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

// Mock useShare hook
vi.mock('@/hooks/useShare', () => ({
  useShare: () => ({
    ref: { current: null },
    share: vi.fn(),
    loading: false,
  }),
}));

// Mock components
// onSkip은 자가입력 우회 경로 제거로 폐기됨 — prop이 넘어오면 skip-button이 렌더되도록 두어,
// 우회 경로가 재도입되면 아래 회귀 테스트가 실패하게 한다.
vi.mock('@/app/(main)/analysis/body/_components/BodyPhotographyGuide', () => ({
  default: ({ onContinue, onSkip }: { onContinue: () => void; onSkip?: () => void }) => (
    <div data-testid="body-photography-guide">
      <button onClick={onContinue} data-testid="continue-button">
        계속하기
      </button>
      {onSkip && (
        <button onClick={onSkip} data-testid="skip-button">
          기존 체형 입력
        </button>
      )}
    </div>
  ),
}));

vi.mock('@/app/(main)/analysis/body/_components/InputForm', () => ({
  default: ({ onSubmit }: { onSubmit: (data: unknown) => void }) => (
    <div data-testid="input-form">
      <button
        onClick={() =>
          onSubmit({
            height: 170,
            weight: 65,
            gender: 'female',
            age: 25,
          })
        }
        data-testid="form-submit"
      >
        다음
      </button>
    </div>
  ),
}));

vi.mock('@/app/(main)/analysis/body/_components/PhotoUpload', () => ({
  default: ({ onPhotoSelect }: { onPhotoSelect: (file: File) => void }) => (
    <div data-testid="photo-upload">
      <button
        onClick={() => {
          const file = new File(['photo'], 'body.jpg', { type: 'image/jpeg' });
          onPhotoSelect(file);
        }}
        data-testid="photo-select"
      >
        사진 선택
      </button>
    </div>
  ),
}));

// Mock MultiAngleBodyCapture (새로운 다각도 촬영 컴포넌트)
vi.mock('@/components/analysis/camera', () => ({
  MultiAngleBodyCapture: ({
    onComplete,
    onCancel,
  }: {
    onComplete: (images: {
      frontImageBase64: string;
      sideImageBase64?: string;
      backImageBase64?: string;
    }) => void;
    onCancel: () => void;
  }) => (
    <div data-testid="multi-angle-capture">
      <button
        onClick={() =>
          onComplete({
            frontImageBase64: 'data:image/jpeg;base64,front',
            sideImageBase64: 'data:image/jpeg;base64,side',
            backImageBase64: 'data:image/jpeg;base64,back',
          })
        }
        data-testid="multi-angle-complete"
      >
        촬영 완료
      </button>
      <button onClick={onCancel} data-testid="multi-angle-cancel">
        취소
      </button>
    </div>
  ),
}));

vi.mock('@/app/(main)/analysis/body/_components/AnalysisLoading', () => ({
  default: ({ isApiComplete }: { isApiComplete?: boolean }) => (
    <div data-testid="analysis-loading">분석 중...{isApiComplete && <span>완료</span>}</div>
  ),
}));

vi.mock('@/app/(main)/analysis/body/_components/AnalysisResult', () => ({
  default: ({ result, onRetry }: { result: unknown; onRetry: () => void }) => (
    <div data-testid="analysis-result">
      <div>분석 결과</div>
      <button onClick={onRetry} data-testid="retry-button">
        다시 분석
      </button>
    </div>
  ),
}));

vi.mock('@/components/share', () => ({
  ShareButton: ({ onShare }: { onShare: () => void }) => (
    <button onClick={onShare} data-testid="share-button">
      공유하기
    </button>
  ),
  ShareThemePicker: () => null,
}));

vi.mock('@/components/animations', () => ({
  Confetti: ({ trigger }: { trigger: boolean }) =>
    trigger ? <div data-testid="confetti">🎉</div> : null,
}));

import BodyAnalysisPage from '@/app/(main)/analysis/body/page';

describe('BodyAnalysisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsSignedIn.mockReturnValue(true);
    mockIsLoaded.mockReturnValue(true);

    // Supabase 기본 응답 설정 (기존 분석 없음)
    mockSupabaseSelect.mockReturnValue({
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });
  });

  describe('렌더링', () => {
    it('페이지가 렌더링된다', async () => {
      render(<BodyAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByText('체형 분석')).toBeInTheDocument();
      });
    });

    it('초기에는 촬영 가이드가 표시된다', async () => {
      render(<BodyAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByTestId('body-photography-guide')).toBeInTheDocument();
      });
    });

    it('서브타이틀이 표시된다', async () => {
      render(<BodyAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByText('정확한 분석을 위한 촬영 가이드')).toBeInTheDocument();
      });
    });

    // 자가입력 우회 경로 제거 회귀 방지: 가이드에 "이미 알고 있어요" 건너뛰기 버튼이 없어야 함
    it('자가입력 우회(skip) 버튼이 더 이상 렌더되지 않는다', async () => {
      render(<BodyAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByTestId('body-photography-guide')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('skip-button')).not.toBeInTheDocument();
    });
  });

  describe('정상 플로우: 가이드 → 입력 → 다각도촬영 → 분석', () => {
    it('가이드 → 입력 폼 → 다각도 촬영 → 분석 단계로 진행된다', async () => {
      // fetch가 영원히 대기하도록 설정 → 로딩 상태 유지
      global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));

      const user = userEvent.setup();
      render(<BodyAnalysisPage />);

      // 1. 촬영 가이드
      await waitFor(() => {
        expect(screen.getByTestId('body-photography-guide')).toBeInTheDocument();
      });

      // 2. 계속하기 클릭 → 입력 폼
      await user.click(screen.getByTestId('continue-button'));

      await waitFor(() => {
        expect(screen.getByTestId('input-form')).toBeInTheDocument();
      });
      expect(screen.getByText('나에게 어울리는 스타일이 궁금하신가요?')).toBeInTheDocument();

      // 3. 폼 제출 → 다각도 촬영
      await user.click(screen.getByTestId('form-submit'));

      await waitFor(() => {
        expect(screen.getByTestId('multi-angle-capture')).toBeInTheDocument();
      });
      expect(
        screen.getByText('정면, 좌측면, 우측면, 후면 사진을 촬영해주세요')
      ).toBeInTheDocument();

      // 4. 촬영 완료 → 분석 로딩
      await user.click(screen.getByTestId('multi-angle-complete'));

      await waitFor(() => {
        expect(screen.getByTestId('analysis-loading')).toBeInTheDocument();
      });
    });
  });

  describe('취소/뒤로가기 동작', () => {
    it('결과 화면에서 다시 분석하기를 클릭하면 처음으로 돌아간다', async () => {
      // 사진 분석 경로로 결과 도달 후 재분석
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            bodyType: 'S',
            bodyTypeLabel: '스트레이트형',
            analyzedAt: new Date().toISOString(),
          },
          data: { id: 'body-retry-1' },
        }),
      });

      const user = userEvent.setup();
      render(<BodyAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByTestId('body-photography-guide')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('continue-button'));
      await user.click(screen.getByTestId('form-submit'));
      await user.click(screen.getByTestId('multi-angle-complete'));

      await waitFor(
        () => {
          expect(screen.getByTestId('analysis-result')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // 다시 분석
      await user.click(screen.getByTestId('retry-button'));

      await waitFor(() => {
        expect(screen.getByTestId('body-photography-guide')).toBeInTheDocument();
      });
    });
  });

  describe('기존 분석 결과', () => {
    it('기존 분석이 있으면 결과 페이지로 리다이렉트한다', async () => {
      mockSupabaseSelect.mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'test-id',
                body_type: 'S',
                created_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      });

      render(<BodyAnalysisPage />);

      // 기존 분석이 있으면 결과 페이지로 자동 리다이렉트
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/analysis/body/result/test-id');
      });
    });
  });

  describe('로딩 상태', () => {
    it('인증 로딩 중에는 렌더링하지 않는다', () => {
      mockIsLoaded.mockReturnValue(false);
      render(<BodyAnalysisPage />);

      // 촬영 가이드가 표시되지 않아야 함
      expect(screen.queryByTestId('body-photography-guide')).not.toBeInTheDocument();
    });

    it('분석 중 메시지가 표시된다', async () => {
      // fetch가 영원히 대기하도록 설정 → 로딩 상태 유지
      global.fetch = vi.fn().mockReturnValue(new Promise(() => {}));

      const user = userEvent.setup();
      render(<BodyAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByTestId('body-photography-guide')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('continue-button'));
      await user.click(screen.getByTestId('form-submit'));
      await user.click(screen.getByTestId('multi-angle-complete'));

      await waitFor(() => {
        expect(screen.getByTestId('analysis-loading')).toBeInTheDocument();
      });
    });
  });

  describe('에러 처리', () => {
    it('에러 발생 시 다각도 촬영 화면으로 복귀한다', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Analysis failed' }),
      });

      const user = userEvent.setup();
      render(<BodyAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByTestId('body-photography-guide')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('continue-button'));
      await user.click(screen.getByTestId('form-submit'));
      await user.click(screen.getByTestId('multi-angle-complete'));

      // 에러 발생 후 다각도 촬영 화면으로 복귀
      await waitFor(
        () => {
          expect(screen.getByTestId('multi-angle-capture')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // 에러 배너 확인 (현행 카피: analysisEntry.error.analysisFailed)
      await waitFor(() => {
        expect(
          screen.getByText('분석 중 오류가 발생했어요. 다시 시도해주세요.')
        ).toBeInTheDocument();
      });
    });
  });

  describe('축하 효과', () => {
    it('분석 완료 시 Confetti가 표시된다', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            bodyType: 'S',
            bodyTypeLabel: '스트레이트형',
            analyzedAt: new Date().toISOString(),
          },
          data: { id: 'body-confetti-1' },
        }),
      });

      const user = userEvent.setup();
      render(<BodyAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByTestId('body-photography-guide')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('continue-button'));
      await user.click(screen.getByTestId('form-submit'));
      await user.click(screen.getByTestId('multi-angle-complete'));

      await waitFor(
        () => {
          expect(screen.getByTestId('confetti')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('공유 기능', () => {
    it('결과 화면에서 공유 버튼이 표시된다', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            bodyType: 'S',
            bodyTypeLabel: '스트레이트형',
            analyzedAt: new Date().toISOString(),
          },
          data: { id: 'body-share-1' },
        }),
      });

      const user = userEvent.setup();
      render(<BodyAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByTestId('body-photography-guide')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('continue-button'));
      await user.click(screen.getByTestId('form-submit'));
      await user.click(screen.getByTestId('multi-angle-complete'));

      await waitFor(
        () => {
          expect(screen.getByTestId('share-button')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('사용자 입력 데이터', () => {
    it('입력 폼 데이터가 API 호출에 포함된다', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            bodyType: 'S',
            bodyTypeLabel: '스트레이트형',
            analyzedAt: new Date().toISOString(),
          },
        }),
      });
      global.fetch = mockFetch;

      const user = userEvent.setup();
      render(<BodyAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByTestId('body-photography-guide')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('continue-button'));
      await user.click(screen.getByTestId('form-submit'));
      await user.click(screen.getByTestId('multi-angle-complete'));

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.userInput).toEqual({
        height: 170,
        weight: 65,
        gender: 'female',
        age: 25,
      });
    });
  });
});

describe('BodyAnalysisPage - API 통합', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('API 호출이 성공하면 결과가 표시된다', async () => {
    const mockResponse = {
      result: {
        bodyType: 'S',
        bodyTypeLabel: '스트레이트형',
        bodyTypeDescription: '입체적이고 탄탄한 실루엣',
        measurements: {
          shoulderWidth: 40,
          waistWidth: 30,
          hipWidth: 42,
        },
        strengths: ['상체가 탄탄해요'],
        insight: '심플하고 베이직한 스타일이 가장 잘 어울려요!',
        styleRecommendations: [],
        analyzedAt: new Date().toISOString(),
      },
      personalColorSeason: 'spring',
      colorRecommendations: [],
      colorTips: [],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const user = userEvent.setup();
    render(<BodyAnalysisPage />);

    await waitFor(() => {
      expect(screen.getByTestId('body-photography-guide')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('continue-button'));
    await user.click(screen.getByTestId('form-submit'));
    await user.click(screen.getByTestId('multi-angle-complete'));

    // 로딩 후 결과 표시
    await waitFor(
      () => {
        expect(screen.getByTestId('analysis-result')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('분석 완료 후 전체 결과 보기 딥링크 버튼이 노출된다 (#7)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: {
          bodyType: 'S',
          bodyTypeLabel: '스트레이트형',
          analyzedAt: new Date().toISOString(),
        },
        data: { id: 'body-analysis-123' },
      }),
    });

    const user = userEvent.setup();
    render(<BodyAnalysisPage />);

    await waitFor(() => {
      expect(screen.getByTestId('body-photography-guide')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('continue-button'));
    await user.click(screen.getByTestId('form-submit'));
    await user.click(screen.getByTestId('multi-angle-complete'));

    await waitFor(
      () => {
        expect(screen.getByTestId('view-full-result')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // 결과 페이지 딥링크 href 확인
    expect(screen.getByTestId('view-full-result')).toHaveAttribute(
      'href',
      '/analysis/body/result/body-analysis-123'
    );
  });

  it('API 호출 실패 시 에러를 처리한다', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    const user = userEvent.setup();
    render(<BodyAnalysisPage />);

    await waitFor(() => {
      expect(screen.getByTestId('body-photography-guide')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('continue-button'));
    await user.click(screen.getByTestId('form-submit'));
    await user.click(screen.getByTestId('multi-angle-complete'));

    // 에러 발생 후 다각도 촬영 화면으로 복귀
    await waitFor(
      () => {
        expect(screen.getByTestId('multi-angle-capture')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
