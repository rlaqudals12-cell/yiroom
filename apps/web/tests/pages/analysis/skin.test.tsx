/**
 * S-1 피부 분석 페이지 테스트
 * @description 다각도 촬영 시스템 연동 테스트
 * @version 1.0
 * @date 2026-01-09
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isSignedIn: true,
    isLoaded: true,
  }),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      }),
    }),
  }),
}));

// Mock 컴포넌트들
vi.mock('@/app/(main)/analysis/skin/_components/LightingGuide', () => ({
  default: ({ onContinue, onSkip }: { onContinue: () => void; onSkip?: () => void }) => (
    <div data-testid="lighting-guide">
      <button onClick={onContinue} data-testid="guide-continue">
        계속하기
      </button>
      {onSkip && (
        <button onClick={onSkip} data-testid="guide-skip">
          건너뛰기
        </button>
      )}
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
    onCancel,
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
      <button
        onClick={() =>
          onComplete({
            frontImageBase64: 'data:image/jpeg;base64,front-only',
          })
        }
        data-testid="capture-front-only"
      >
        정면만 촬영
      </button>
      {onCancel && (
        <button onClick={onCancel} data-testid="capture-cancel">
          취소
        </button>
      )}
    </div>
  ),
}));

vi.mock('@/app/(main)/analysis/skin/_components/KnownSkinTypeInput', () => ({
  default: ({
    onSelect,
    onBack,
  }: {
    onSelect: (skinType: string, concerns: string[]) => void;
    onBack: () => void;
  }) => (
    <div data-testid="known-skin-type-input">
      <button onClick={() => onSelect('oily', ['acne'])} data-testid="select-skin-type">
        피부 타입 선택
      </button>
      <button onClick={onBack} data-testid="known-input-back">
        돌아가기
      </button>
    </div>
  ),
}));

vi.mock('@/app/(main)/analysis/skin/_components/AnalysisLoading', () => ({
  default: ({ onComplete }: { onComplete: () => void }) => {
    // 즉시 완료 호출
    setTimeout(onComplete, 0);
    return <div data-testid="analysis-loading">분석 중...</div>;
  },
}));

vi.mock('@/app/(main)/analysis/skin/_components/AnalysisResult', () => ({
  default: ({
    onRetry,
  }: {
    result: unknown;
    onRetry: () => void;
    shareRef?: React.RefObject<HTMLDivElement>;
  }) => (
    <div data-testid="analysis-result">
      <button onClick={onRetry} data-testid="retry-analysis">
        다시 분석하기
      </button>
    </div>
  ),
}));

vi.mock('@/hooks/useShare', () => ({
  useShare: () => ({
    ref: { current: null },
    share: vi.fn(),
    loading: false,
  }),
}));

vi.mock('@/components/share', () => ({
  ShareButton: () => <button data-testid="share-button">공유</button>,
}));

vi.mock('@/components/animations', () => ({
  Confetti: () => null,
}));

// Global fetch mock
const mockFetch = vi.fn();
global.fetch = mockFetch;

import SkinAnalysisPage from '@/app/(main)/analysis/skin/page';

describe('SkinAnalysisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('렌더링', () => {
    it('초기 상태에서 조명 가이드를 표시한다', () => {
      render(<SkinAnalysisPage />);

      expect(screen.getByTestId('lighting-guide')).toBeInTheDocument();
      expect(screen.getByText('정확한 분석을 위한 촬영 가이드')).toBeInTheDocument();
    });

    it('헤더에 피부 분석 제목이 표시된다', () => {
      render(<SkinAnalysisPage />);

      expect(screen.getByRole('heading', { name: '피부 분석' })).toBeInTheDocument();
    });
  });

  describe('플로우 - 조명 가이드 → 모드 선택', () => {
    it('가이드 완료 시 모드 선택 화면으로 전환된다', async () => {
      const user = userEvent.setup();
      render(<SkinAnalysisPage />);

      await user.click(screen.getByTestId('guide-continue'));

      expect(screen.getByTestId('capture-mode-select')).toBeInTheDocument();
      expect(screen.getByText('촬영 방법을 선택해주세요')).toBeInTheDocument();
    });

    it('모드 선택 UI에 카메라와 갤러리 버튼이 표시된다', async () => {
      const user = userEvent.setup();
      render(<SkinAnalysisPage />);

      await user.click(screen.getByTestId('guide-continue'));

      expect(screen.getByTestId('camera-mode-button')).toBeInTheDocument();
      expect(screen.getByTestId('gallery-mode-button')).toBeInTheDocument();
      expect(screen.getByText('촬영')).toBeInTheDocument();
      expect(screen.getByText('갤러리')).toBeInTheDocument();
    });
  });

  describe('카메라 모드 (다각도 촬영)', () => {
    it('카메라 모드 선택 시 MultiAngleSkinCapture가 렌더링된다', async () => {
      const user = userEvent.setup();
      render(<SkinAnalysisPage />);

      await user.click(screen.getByTestId('guide-continue'));
      await user.click(screen.getByTestId('camera-mode-button'));

      expect(screen.getByTestId('multi-angle-skin-capture')).toBeInTheDocument();
      expect(screen.getByText('다각도 피부 촬영')).toBeInTheDocument();
    });

    it('3장 모두 촬영 후 분석이 시작된다', async () => {
      const user = userEvent.setup();

      // API 응답 mock
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

      await user.click(screen.getByTestId('guide-continue'));
      await user.click(screen.getByTestId('camera-mode-button'));
      await user.click(screen.getByTestId('capture-complete'));

      // 로딩 → API 호출 확인
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/analyze/skin', expect.any(Object));
      });

      // API 호출 시 다각도 이미지 전송 확인
      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.frontImageBase64).toBe('data:image/jpeg;base64,front');
      expect(requestBody.leftImageBase64).toBe('data:image/jpeg;base64,left');
      expect(requestBody.rightImageBase64).toBe('data:image/jpeg;base64,right');
    });

    it('정면만 촬영 후에도 분석이 가능하다', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            overallScore: 75,
            skinType: 'combination',
            analyzedAt: new Date().toISOString(),
          },
        }),
      });

      render(<SkinAnalysisPage />);

      await user.click(screen.getByTestId('guide-continue'));
      await user.click(screen.getByTestId('camera-mode-button'));
      await user.click(screen.getByTestId('capture-front-only'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const fetchCall = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      expect(requestBody.frontImageBase64).toBe('data:image/jpeg;base64,front-only');
      expect(requestBody.leftImageBase64).toBeUndefined();
      expect(requestBody.rightImageBase64).toBeUndefined();
    });

    it('촬영 취소 시 모드 선택으로 복귀한다', async () => {
      const user = userEvent.setup();
      render(<SkinAnalysisPage />);

      await user.click(screen.getByTestId('guide-continue'));
      await user.click(screen.getByTestId('camera-mode-button'));

      expect(screen.getByTestId('multi-angle-skin-capture')).toBeInTheDocument();

      await user.click(screen.getByTestId('capture-cancel'));

      expect(screen.getByTestId('capture-mode-select')).toBeInTheDocument();
    });
  });

  describe('갤러리 모드 (단일 이미지)', () => {
    it('갤러리 모드 선택 시 PhotoUpload가 렌더링된다', async () => {
      const user = userEvent.setup();
      render(<SkinAnalysisPage />);

      await user.click(screen.getByTestId('guide-continue'));
      await user.click(screen.getByTestId('gallery-mode-button'));

      expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
      expect(screen.getByText('피부 사진을 선택해주세요')).toBeInTheDocument();
    });

    it('사진 선택 후 분석이 시작된다', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            overallScore: 85,
            skinType: 'normal',
            analyzedAt: new Date().toISOString(),
          },
        }),
      });

      render(<SkinAnalysisPage />);

      await user.click(screen.getByTestId('guide-continue'));
      await user.click(screen.getByTestId('gallery-mode-button'));
      await user.click(screen.getByTestId('select-photo'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/analyze/skin', expect.any(Object));
      });
    });
  });

  describe('기존 피부 타입 입력 모드', () => {
    it('건너뛰기 클릭 시 피부 타입 입력 화면으로 전환된다', async () => {
      const user = userEvent.setup();
      render(<SkinAnalysisPage />);

      await user.click(screen.getByTestId('guide-skip'));

      expect(screen.getByTestId('known-skin-type-input')).toBeInTheDocument();
    });
  });

  describe('분석 결과', () => {
    it('분석 완료 후 결과 화면이 표시된다', async () => {
      const user = userEvent.setup();

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

      await user.click(screen.getByTestId('guide-continue'));
      await user.click(screen.getByTestId('camera-mode-button'));
      await user.click(screen.getByTestId('capture-complete'));

      await waitFor(() => {
        expect(screen.getByTestId('analysis-result')).toBeInTheDocument();
      });

      expect(screen.getByText('분석이 완료되었어요')).toBeInTheDocument();
    });

    it('다시 분석하기 클릭 시 가이드로 복귀한다', async () => {
      const user = userEvent.setup();

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

      await user.click(screen.getByTestId('guide-continue'));
      await user.click(screen.getByTestId('camera-mode-button'));
      await user.click(screen.getByTestId('capture-complete'));

      await waitFor(() => {
        expect(screen.getByTestId('analysis-result')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('retry-analysis'));

      expect(screen.getByTestId('lighting-guide')).toBeInTheDocument();
    });
  });

  describe('에러 처리', () => {
    it('API 에러 시 에러 메시지를 표시하고 카메라 모드로 복귀한다', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Analysis failed' }),
      });

      render(<SkinAnalysisPage />);

      await user.click(screen.getByTestId('guide-continue'));
      await user.click(screen.getByTestId('camera-mode-button'));
      await user.click(screen.getByTestId('capture-complete'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByText(/Analysis failed/)).toBeInTheDocument();
      expect(screen.getByTestId('multi-angle-skin-capture')).toBeInTheDocument();
    });
  });

  describe('모드 설명 텍스트', () => {
    it('모드 선택 화면에 설명 텍스트가 표시된다', async () => {
      const user = userEvent.setup();
      render(<SkinAnalysisPage />);

      await user.click(screen.getByTestId('guide-continue'));

      expect(
        screen.getByText(/정면 \+ 좌\/우측 다각도 촬영으로 더 정확한 분석/)
      ).toBeInTheDocument();
      expect(screen.getByText(/기존에 찍은 정면 사진으로 간편하게 분석/)).toBeInTheDocument();
    });
  });
});
