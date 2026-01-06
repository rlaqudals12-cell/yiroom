/**
 * 체형 분석 페이지 테스트
 * /analysis/body
 *
 * - 페이지 렌더링
 * - 단계별 플로우 (가이드 → 입력 → 촬영 → 분석 → 결과)
 * - 기존 체형 타입 입력 플로우
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
    User: MockIcon,
    Camera: MockIcon,
    Sun: MockIcon,
    CheckCircle2: MockIcon,
    XCircle: MockIcon,
  };
});

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
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
vi.mock('@/app/(main)/analysis/body/_components/BodyPhotographyGuide', () => ({
  default: ({ onContinue, onSkip }: { onContinue: () => void; onSkip: () => void }) => (
    <div data-testid="body-photography-guide">
      <button onClick={onContinue} data-testid="continue-button">
        계속하기
      </button>
      <button onClick={onSkip} data-testid="skip-button">
        기존 체형 입력
      </button>
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

vi.mock('@/app/(main)/analysis/body/_components/KnownBodyTypeInput', () => ({
  default: ({ onSelect, onBack }: { onSelect: (bodyType: string) => void; onBack: () => void }) => (
    <div data-testid="known-type-input">
      <button onClick={() => onSelect('X')} data-testid="select-x-type">
        X형
      </button>
      <button onClick={onBack} data-testid="known-back">
        뒤로
      </button>
    </div>
  ),
}));

vi.mock('@/app/(main)/analysis/body/_components/AnalysisLoading', () => ({
  default: ({ onComplete }: { onComplete: () => void }) => {
    // 자동으로 onComplete 호출
    setTimeout(onComplete, 100);
    return <div data-testid="analysis-loading">분석 중...</div>;
  },
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
  });

  describe('정상 플로우: 가이드 → 입력 → 촬영 → 분석', () => {
    it('가이드 → 입력 폼 → 사진 업로드 → 분석 단계로 진행된다', async () => {
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

      // 3. 폼 제출 → 사진 업로드
      await user.click(screen.getByTestId('form-submit'));

      await waitFor(() => {
        expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
      });
      expect(screen.getByText('전신 사진을 업로드해주세요')).toBeInTheDocument();

      // 4. 사진 선택 → 분석 로딩
      await user.click(screen.getByTestId('photo-select'));

      await waitFor(() => {
        expect(screen.getByTestId('analysis-loading')).toBeInTheDocument();
      });
    });
  });

  describe('정상 플로우: 기존 체형 타입 입력', () => {
    it('가이드에서 건너뛰기 → 체형 타입 입력 → 결과로 진행된다', async () => {
      const user = userEvent.setup();
      render(<BodyAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByTestId('body-photography-guide')).toBeInTheDocument();
      });

      // 건너뛰기 클릭
      await user.click(screen.getByTestId('skip-button'));

      await waitFor(() => {
        expect(screen.getByTestId('known-type-input')).toBeInTheDocument();
      });
      expect(screen.getByText('기존 체형 타입을 선택해주세요')).toBeInTheDocument();

      // X형 선택
      await user.click(screen.getByTestId('select-x-type'));

      await waitFor(() => {
        expect(screen.getByTestId('analysis-result')).toBeInTheDocument();
      });
    });

    it('체형 타입 입력에서 뒤로가기가 가능하다', async () => {
      const user = userEvent.setup();
      render(<BodyAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByTestId('body-photography-guide')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('skip-button'));
      await user.click(screen.getByTestId('known-back'));

      await waitFor(() => {
        expect(screen.getByTestId('body-photography-guide')).toBeInTheDocument();
      });
    });
  });

  describe('취소/뒤로가기 동작', () => {
    it('결과 화면에서 다시 분석하기를 클릭하면 처음으로 돌아간다', async () => {
      const user = userEvent.setup();
      render(<BodyAnalysisPage />);

      // 빠른 플로우: 기존 체형 타입 입력
      await waitFor(() => {
        expect(screen.getByTestId('body-photography-guide')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('skip-button'));
      await user.click(screen.getByTestId('select-x-type'));

      await waitFor(() => {
        expect(screen.getByTestId('analysis-result')).toBeInTheDocument();
      });

      // 다시 분석
      await user.click(screen.getByTestId('retry-button'));

      await waitFor(() => {
        expect(screen.getByTestId('body-photography-guide')).toBeInTheDocument();
      });
    });
  });

  describe('기존 분석 결과', () => {
    it('기존 분석이 있으면 배너가 표시된다', async () => {
      mockSupabaseSelect.mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'test-id',
                body_type: 'X',
                created_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      });

      render(<BodyAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByText('기존 분석 결과 보기')).toBeInTheDocument();
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
      const user = userEvent.setup();
      render(<BodyAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByTestId('body-photography-guide')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('continue-button'));
      await user.click(screen.getByTestId('form-submit'));
      await user.click(screen.getByTestId('photo-select'));

      await waitFor(() => {
        expect(screen.getByText(/AI가 분석 중이에요/)).toBeInTheDocument();
      });
    });
  });

  describe('에러 처리', () => {
    it('에러 발생 시 에러 메시지가 표시된다', async () => {
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
      await user.click(screen.getByTestId('photo-select'));

      // 에러 발생 후 업로드 화면으로 복귀
      await waitFor(
        () => {
          expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // 에러 메시지 확인
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('축하 효과', () => {
    it('분석 완료 시 Confetti가 표시된다', async () => {
      const user = userEvent.setup();
      render(<BodyAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByTestId('body-photography-guide')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('skip-button'));
      await user.click(screen.getByTestId('select-x-type'));

      await waitFor(() => {
        expect(screen.getByTestId('confetti')).toBeInTheDocument();
      });
    });
  });

  describe('공유 기능', () => {
    it('결과 화면에서 공유 버튼이 표시된다', async () => {
      const user = userEvent.setup();
      render(<BodyAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByTestId('body-photography-guide')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('skip-button'));
      await user.click(screen.getByTestId('select-x-type'));

      await waitFor(() => {
        expect(screen.getByTestId('share-button')).toBeInTheDocument();
      });
    });
  });

  describe('사용자 입력 데이터', () => {
    it('입력 폼 데이터가 API 호출에 포함된다', async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            bodyType: 'X',
            bodyTypeLabel: 'X형 (모래시계)',
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
      await user.click(screen.getByTestId('photo-select'));

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
        bodyType: 'X',
        bodyTypeLabel: 'X형 (모래시계)',
        bodyTypeDescription: '균형잡힌 체형',
        measurements: {
          shoulderWidth: 40,
          waistWidth: 30,
          hipWidth: 42,
        },
        strengths: ['균형잡힌 비율'],
        insight: '모든 스타일이 잘 어울려요',
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
    await user.click(screen.getByTestId('photo-select'));

    // 로딩 후 결과 표시
    await waitFor(
      () => {
        expect(screen.getByTestId('analysis-result')).toBeInTheDocument();
      },
      { timeout: 3000 }
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
    await user.click(screen.getByTestId('photo-select'));

    // 에러 발생 후 업로드 화면으로 복귀
    await waitFor(
      () => {
        expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
