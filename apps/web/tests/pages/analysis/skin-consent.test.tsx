/**
 * S-1 피부 분석 페이지 - 이미지 저장 동의 통합 테스트
 * @description ImageConsentModal 통합 테스트
 * SDD-VISUAL-SKIN-REPORT.md §4
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
    Camera: MockIcon,
    ImageIcon: MockIcon,
    Loader2: MockIcon,
  };
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isSignedIn: true,
    isLoaded: true,
  }),
}));

// Mock photo-reuse (Phase 2 기능)
vi.mock('@/lib/analysis/photo-reuse', () => ({
  checkPhotoReuseEligibility: vi.fn().mockResolvedValue({ eligible: false, reason: 'no_image' }),
}));

// Mock Supabase client
const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();
const mockSupabaseChain = {
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: mockSingle,
  maybeSingle: mockMaybeSingle,
};
vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({
    from: vi.fn().mockReturnValue(mockSupabaseChain),
  }),
}));

// Mock ImageConsentModal
vi.mock('@/components/analysis/consent', () => ({
  ImageConsentModal: (props: {
    isOpen: boolean;
    onConsent: () => void;
    onSkip: () => void;
    analysisType: string;
    isLoading?: boolean;
  }) => {
    if (!props.isOpen) return null;
    return (
      <div data-testid="image-consent-modal">
        <button onClick={props.onConsent} data-testid="consent-agree">
          저장하기
        </button>
        <button onClick={props.onSkip} data-testid="consent-skip">
          건너뛰기
        </button>
      </div>
    );
  },
}));

// Mock 컴포넌트들
vi.mock('@/app/(main)/analysis/skin/_components/LightingGuide', () => ({
  default: ({ onContinue }: { onContinue: () => void; onSkip?: () => void }) => (
    <div data-testid="lighting-guide">
      <button onClick={onContinue} data-testid="guide-continue">
        계속하기
      </button>
    </div>
  ),
}));

vi.mock('@/app/(main)/analysis/skin/_components/PhotoUpload', () => ({
  default: ({ onPhotoSelect }: { onPhotoSelect: (file: File) => void }) => (
    <div data-testid="photo-upload">
      <button
        onClick={() => onPhotoSelect(new File(['test'], 'test.jpg', { type: 'image/jpeg' }))}
        data-testid="select-photo"
      >
        사진 선택
      </button>
    </div>
  ),
}));

vi.mock('@/app/(main)/analysis/skin/_components/MultiAngleSkinCapture', () => ({
  default: ({
    onComplete,
  }: {
    onComplete: (images: {
      frontImageBase64: string;
      leftImageBase64?: string;
      rightImageBase64?: string;
    }) => void;
    onCancel?: () => void;
  }) => (
    <div data-testid="multi-angle-skin-capture">
      <button
        onClick={() =>
          onComplete({
            frontImageBase64: 'data:image/jpeg;base64,front',
            leftImageBase64: 'data:image/jpeg;base64,left',
            rightImageBase64: 'data:image/jpeg;base64,right',
          })
        }
        data-testid="capture-complete"
      >
        촬영 완료
      </button>
    </div>
  ),
}));

vi.mock('@/app/(main)/analysis/skin/_components/KnownSkinTypeInput', () => ({
  default: () => <div data-testid="known-skin-type-input" />,
}));

vi.mock('@/app/(main)/analysis/skin/_components/AnalysisLoading', () => ({
  default: ({ onComplete }: { onComplete: () => void }) => {
    setTimeout(onComplete, 0);
    return <div data-testid="analysis-loading">분석 중...</div>;
  },
}));

vi.mock('@/app/(main)/analysis/skin/_components/AnalysisResult', () => ({
  default: () => <div data-testid="analysis-result" />,
}));

vi.mock('@/hooks/useShare', () => ({
  useShare: () => ({
    ref: { current: null },
    share: vi.fn(),
    loading: false,
  }),
}));

vi.mock('@/components/share', () => ({
  ShareButton: () => null,
}));

vi.mock('@/components/animations', () => ({
  Confetti: () => null,
}));

// Global fetch mock
const mockFetch = vi.fn();
global.fetch = mockFetch;

import SkinAnalysisPage from '@/app/(main)/analysis/skin/page';

// 로딩 완료 대기 헬퍼
const waitForLoading = async () => {
  await waitFor(() => {
    expect(screen.queryByText('확인 중...')).not.toBeInTheDocument();
  });
};

describe('SkinAnalysisPage - 이미지 저장 동의', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    mockMaybeSingle.mockReset();
    mockSingle.mockReset();

    // 기본값 설정
    // 기존 분석 없음
    mockSingle.mockRejectedValue(new Error('No existing analysis'));
    // 기존 동의 없음
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  });

  it('동의 없이 카메라 촬영 시 동의 모달이 표시된다', async () => {
    const user = userEvent.setup();

    render(<SkinAnalysisPage />);
    await waitForLoading();

    await user.click(screen.getByTestId('guide-continue'));
    await user.click(screen.getByTestId('camera-mode-button'));
    await user.click(screen.getByTestId('capture-complete'));

    // 동의 모달이 표시되어야 함
    await waitFor(() => {
      expect(screen.getByTestId('image-consent-modal')).toBeInTheDocument();
    });
  });

  it('기존 동의가 있으면 모달 없이 바로 분석 진행', async () => {
    const user = userEvent.setup();

    // 기존 동의 있음
    mockMaybeSingle.mockResolvedValue({
      data: { consent_given: true },
      error: null,
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: {
          overallScore: 80,
          skinType: 'oily',
          analyzedAt: new Date().toISOString(),
        },
      }),
    });

    render(<SkinAnalysisPage />);
    await waitForLoading();

    await user.click(screen.getByTestId('guide-continue'));
    await user.click(screen.getByTestId('camera-mode-button'));
    await user.click(screen.getByTestId('capture-complete'));

    // 모달 없이 바로 분석 API 호출
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/analyze/skin', expect.any(Object));
    });

    // 동의 모달이 표시되지 않아야 함
    expect(screen.queryByTestId('image-consent-modal')).not.toBeInTheDocument();
  });

  it('동의 모달에서 저장하기 클릭 시 동의 API 호출 후 분석 진행', async () => {
    const user = userEvent.setup();

    // 동의 저장 API mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        consent: { consent_given: true },
      }),
    });

    // 분석 API mock
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: {
          overallScore: 80,
          skinType: 'oily',
          analyzedAt: new Date().toISOString(),
        },
      }),
    });

    render(<SkinAnalysisPage />);
    await waitForLoading();

    await user.click(screen.getByTestId('guide-continue'));
    await user.click(screen.getByTestId('camera-mode-button'));
    await user.click(screen.getByTestId('capture-complete'));

    // 동의 모달 표시 대기
    await waitFor(() => {
      expect(screen.getByTestId('image-consent-modal')).toBeInTheDocument();
    });

    // 저장하기 클릭
    await user.click(screen.getByTestId('consent-agree'));

    // 동의 API 호출 확인
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/consent', expect.any(Object));
    });
  });

  it('동의 모달에서 건너뛰기 클릭 시 동의 저장 없이 분석만 진행', async () => {
    const user = userEvent.setup();

    // 분석 API mock만 (동의 API는 호출 안됨)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        result: {
          overallScore: 80,
          skinType: 'oily',
          analyzedAt: new Date().toISOString(),
        },
      }),
    });

    render(<SkinAnalysisPage />);
    await waitForLoading();

    await user.click(screen.getByTestId('guide-continue'));
    await user.click(screen.getByTestId('camera-mode-button'));
    await user.click(screen.getByTestId('capture-complete'));

    // 동의 모달 표시 대기
    await waitFor(() => {
      expect(screen.getByTestId('image-consent-modal')).toBeInTheDocument();
    });

    // 건너뛰기 클릭
    await user.click(screen.getByTestId('consent-skip'));

    // 분석 API 호출 (동의 API 아님)
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/analyze/skin', expect.any(Object));
    });

    // 동의 API는 호출되지 않음
    const consentCalls = mockFetch.mock.calls.filter((call) => call[0] === '/api/consent');
    expect(consentCalls).toHaveLength(0);
  });

  it('갤러리 모드에서도 동의 없으면 모달이 표시된다', async () => {
    const user = userEvent.setup();

    render(<SkinAnalysisPage />);
    await waitForLoading();

    await user.click(screen.getByTestId('guide-continue'));
    await user.click(screen.getByTestId('gallery-mode-button'));
    await user.click(screen.getByTestId('select-photo'));

    // 동의 모달이 표시되어야 함
    await waitFor(() => {
      expect(screen.getByTestId('image-consent-modal')).toBeInTheDocument();
    });
  });
});
