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

// Mock components
vi.mock('@/app/(main)/analysis/personal-color/_components/LightingGuide', () => ({
  default: ({ onContinue, onSkip }: { onContinue: () => void; onSkip: () => void }) => (
    <div data-testid="lighting-guide">
      <button onClick={onContinue} data-testid="continue-button">
        계속하기
      </button>
      <button onClick={onSkip} data-testid="skip-button">
        기존 퍼스널 컬러 입력
      </button>
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

vi.mock('@/app/(main)/analysis/personal-color/_components/KnownPersonalColorInput', () => ({
  default: ({
    onSelect,
    onBack,
  }: {
    onSelect: (season: string, subtype?: string) => void;
    onBack: () => void;
  }) => (
    <div data-testid="known-color-input">
      <button onClick={() => onSelect('spring')} data-testid="select-spring">
        봄 웜톤
      </button>
      <button onClick={onBack} data-testid="known-back">
        뒤로
      </button>
    </div>
  ),
}));

vi.mock('@/app/(main)/analysis/personal-color/_components/AnalysisLoading', () => ({
  default: ({ onComplete }: { onComplete: () => void }) => {
    // 자동으로 onComplete 호출
    setTimeout(onComplete, 100);
    return <div data-testid="analysis-loading">분석 중...</div>;
  },
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
      render(<PersonalColorPage />);

      await waitFor(() => {
        expect(screen.getByText('퍼스널 컬러 진단')).toBeInTheDocument();
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

      await waitFor(() => {
        expect(screen.getByText('정확한 진단을 위한 촬영 가이드')).toBeInTheDocument();
      });
    });
  });

  describe('정상 플로우: 다각도 촬영', () => {
    it('가이드 → 다각도촬영 → 손목촬영 → 분석 단계로 진행된다', async () => {
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

  describe('정상 플로우: 기존 퍼스널 컬러 입력', () => {
    it('가이드에서 건너뛰기 → 퍼스널 컬러 입력 → 결과로 진행된다', async () => {
      const user = userEvent.setup();
      render(<PersonalColorPage />);

      await waitFor(() => {
        expect(screen.getByTestId('lighting-guide')).toBeInTheDocument();
      });

      // 건너뛰기 클릭
      await user.click(screen.getByTestId('skip-button'));

      await waitFor(() => {
        expect(screen.getByTestId('known-color-input')).toBeInTheDocument();
      });

      // 봄 웜톤 선택
      await user.click(screen.getByTestId('select-spring'));

      await waitFor(() => {
        expect(screen.getByTestId('analysis-result')).toBeInTheDocument();
      });
    });

    it('퍼스널 컬러 입력에서 뒤로가기가 가능하다', async () => {
      const user = userEvent.setup();
      render(<PersonalColorPage />);

      await waitFor(() => {
        expect(screen.getByTestId('lighting-guide')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('skip-button'));
      await user.click(screen.getByTestId('known-back'));

      await waitFor(() => {
        expect(screen.getByTestId('lighting-guide')).toBeInTheDocument();
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

    it('결과 화면에서 다시 분석하기를 클릭하면 처음으로 돌아간다', async () => {
      const user = userEvent.setup();
      render(<PersonalColorPage />);

      // 빠른 플로우: 기존 퍼스널 컬러 입력
      await waitFor(() => {
        expect(screen.getByTestId('lighting-guide')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('skip-button'));
      await user.click(screen.getByTestId('select-spring'));

      await waitFor(() => {
        expect(screen.getByTestId('analysis-result')).toBeInTheDocument();
      });

      // 다시 분석
      await user.click(screen.getByTestId('retry-button'));

      await waitFor(() => {
        expect(screen.getByTestId('lighting-guide')).toBeInTheDocument();
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
                season: 'spring',
                created_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      });

      render(<PersonalColorPage />);

      await waitFor(() => {
        expect(screen.getByText('기존 진단 결과 보기')).toBeInTheDocument();
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
      const user = userEvent.setup();
      render(<PersonalColorPage />);

      await waitFor(() => {
        expect(screen.getByTestId('lighting-guide')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('continue-button'));
      await user.click(screen.getByTestId('capture-complete'));
      await user.click(screen.getByTestId('wrist-skip'));

      await waitFor(() => {
        expect(screen.getByText(/AI가 분석 중이에요/)).toBeInTheDocument();
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
    const mockResponse = {
      result: {
        seasonType: 'spring',
        seasonLabel: '봄 웜톤',
        tone: 'warm',
        depth: 'light',
        confidence: 95,
        analyzedAt: new Date().toISOString(),
      },
      usedMock: false,
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const user = userEvent.setup();
    render(<PersonalColorPage />);

    await waitFor(() => {
      expect(screen.getByTestId('lighting-guide')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('continue-button'));
    await user.click(screen.getByTestId('capture-complete'));
    await user.click(screen.getByTestId('wrist-skip'));

    // 로딩 후 결과 표시
    await waitFor(
      () => {
        expect(screen.getByTestId('analysis-result')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
