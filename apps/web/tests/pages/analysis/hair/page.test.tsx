/**
 * H-1 헤어 분석 메인 페이지 테스트
 * apps/web/app/(main)/analysis/hair/page.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Next.js
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock Clerk - 로그인 상태
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ isSignedIn: true, isLoaded: true, userId: 'test-user-123' }),
}));

// Mock Supabase client
const mockSingle = vi.fn();
const mockLimit = vi.fn(() => ({ single: mockSingle }));
const mockOrder = vi.fn(() => ({ limit: mockLimit }));
const mockSelect = vi.fn(() => ({ order: mockOrder }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({
    from: mockFrom,
  }),
}));

// Mock hair-analysis 모듈
vi.mock('@/lib/mock/hair-analysis', async () => {
  const actual = await vi.importActual('@/lib/mock/hair-analysis');
  return {
    ...actual,
    generateMockHairAnalysisResult: vi.fn(() => ({
      overallScore: 78,
      hairType: 'wavy',
      hairTypeLabel: '웨이브',
      hairThicknessLabel: '보통',
      scalpTypeLabel: '중성 두피',
      concerns: ['frizz', 'damage'],
      insight: '모발이 약간 건조한 편이에요',
      metrics: [
        { id: 'hydration', label: '수분도', value: 70, status: 'normal' },
        { id: 'damage', label: '손상도', value: 45, status: 'normal' },
      ],
      recommendedIngredients: ['아르간 오일', '케라틴'],
      careTips: ['주 2회 헤어팩 사용', '열 스타일링 최소화'],
      analyzedAt: new Date(),
    })),
  };
});

// Mock 이미지 압축 유틸리티
vi.mock('@/lib/utils/image-compression', () => ({
  compressFileToBase64: vi.fn().mockResolvedValue('data:image/jpeg;base64,mockBase64'),
}));

// Mock fetch (분석 API 호출)
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/fake-preview');
global.URL.revokeObjectURL = vi.fn();

import HairAnalysisPage from '@/app/(main)/analysis/hair/page';

describe('HairAnalysisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    // 기본 Supabase 응답: 기존 분석 없음
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // 기본 렌더링
  // ===========================================================================
  describe('기본 렌더링', () => {
    it('페이지가 정상 렌더링된다', async () => {
      render(<HairAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByTestId('hair-analysis-page')).toBeInTheDocument();
      });
    });

    it('data-testid가 올바르게 설정된다', async () => {
      render(<HairAnalysisPage />);

      await waitFor(() => {
        const page = screen.getByTestId('hair-analysis-page');
        expect(page).toBeInTheDocument();
      });
    });

    // i18n 전환: 테스트 환경 next-intl mock이 번역 키를 그대로 반환하므로 키 기준으로 검증
    it('페이지 제목이 표시된다', async () => {
      render(<HairAnalysisPage />);

      expect(screen.getByText('hair.title')).toBeInTheDocument();
    });

    it('촬영 가이드 서브타이틀이 표시된다', async () => {
      render(<HairAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByText('hair.subtitle.guide')).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // 촬영 가이드 단계
  // ===========================================================================
  describe('촬영 가이드 단계', () => {
    it('촬영 가이드가 표시된다', async () => {
      render(<HairAnalysisPage />);

      await waitFor(() => {
        // 촬영 가이드 섹션 제목 확인 (i18n 키)
        expect(screen.getByText('hair.guideTitle')).toBeInTheDocument();
      });
    });

    it('촬영 가이드 항목이 표시된다', async () => {
      render(<HairAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByText('hair.guideTip1')).toBeInTheDocument();
        expect(screen.getByText('hair.guideTip2')).toBeInTheDocument();
        expect(screen.getByText('hair.guideTip3')).toBeInTheDocument();
        expect(screen.getByText('hair.guideAvoid')).toBeInTheDocument();
      });
    });

    it('사진 선택하기 버튼이 표시된다', async () => {
      render(<HairAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByText('action.selectPhoto')).toBeInTheDocument();
      });
    });

    it('이미 알고 있어요 버튼이 표시된다', async () => {
      render(<HairAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByText('action.alreadyKnow')).toBeInTheDocument();
      });
    });

    it('사진 선택하기 버튼 클릭 시 업로드 단계로 전환된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByText('action.selectPhoto')).toBeInTheDocument();
      });

      await user.click(screen.getByText('action.selectPhoto'));

      await waitFor(() => {
        expect(screen.getByText('hair.subtitle.upload')).toBeInTheDocument();
      });
    });

    it('이미 알고 있어요 버튼 클릭 시 알고있는 타입 입력 단계로 전환된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByText('action.alreadyKnow')).toBeInTheDocument();
      });

      await user.click(screen.getByText('action.alreadyKnow'));

      await waitFor(() => {
        expect(screen.getByText('hair.subtitle.knownInput')).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // 기존 분석 결과 배너
  // ===========================================================================
  describe('기존 분석 결과 배너', () => {
    it('기존 분석 결과가 있으면 배너가 표시된다', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: 'analysis-existing',
          overall_score: 82,
          hair_type: 'straight',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      render(<HairAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByText('action.viewExistingResult')).toBeInTheDocument();
      });
    });

    it('기존 분석 결과 배너에 점수가 표시된다', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: 'analysis-existing',
          overall_score: 82,
          hair_type: 'straight',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      render(<HairAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByText('82')).toBeInTheDocument();
      });
    });

    it('기존 분석 결과가 없으면 배너가 표시되지 않는다', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      render(<HairAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByTestId('hair-analysis-page')).toBeInTheDocument();
      });

      expect(screen.queryByText('action.viewExistingResult')).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 사진 업로드 단계
  // ===========================================================================
  describe('사진 업로드 단계', () => {
    it('업로드 영역에 안내 문구가 표시된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.selectPhoto'));

      await waitFor(() => {
        expect(screen.getByText('upload.selectPhoto')).toBeInTheDocument();
        expect(screen.getByText('upload.tapToSelect')).toBeInTheDocument();
      });
    });

    it('가이드로 돌아가기 버튼이 표시된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.selectPhoto'));

      await waitFor(() => {
        expect(screen.getByText('action.backToGuide')).toBeInTheDocument();
      });
    });

    it('가이드로 돌아가기 클릭 시 가이드 단계로 돌아간다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.selectPhoto'));

      await waitFor(() => {
        expect(screen.getByText('action.backToGuide')).toBeInTheDocument();
      });

      await user.click(screen.getByText('action.backToGuide'));

      await waitFor(() => {
        // 가이드 단계 복귀 확인: 사진 선택하기 버튼 존재
        expect(screen.getByText('action.selectPhoto')).toBeInTheDocument();
      });
    });

    it('파일 입력이 숨겨져 있다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.selectPhoto'));

      const fileInput = screen.getByLabelText('hair.photoSelectAria');
      expect(fileInput).toHaveClass('hidden');
    });
  });

  // ===========================================================================
  // 알고있는 타입 입력 단계
  // ===========================================================================
  describe('알고있는 타입 입력 단계', () => {
    it('모발 타입 선택 UI가 표시된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.alreadyKnow'));

      await waitFor(() => {
        expect(screen.getByText('hair.selectHairType')).toBeInTheDocument();
      });
    });

    it('4가지 모발 타입이 모두 표시된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.alreadyKnow'));

      await waitFor(() => {
        expect(screen.getByText('직모')).toBeInTheDocument();
        expect(screen.getByText('웨이브')).toBeInTheDocument();
        expect(screen.getByText('곱슬')).toBeInTheDocument();
        expect(screen.getByText('강한 곱슬')).toBeInTheDocument();
      });
    });

    it('고민 선택 UI가 표시된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.alreadyKnow'));

      await waitFor(() => {
        expect(screen.getByText('hair.selectConcerns')).toBeInTheDocument();
      });
    });

    it('결과 보기 버튼이 타입 미선택 시 비활성화된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.alreadyKnow'));

      await waitFor(() => {
        const resultButton = screen.getByText('action.viewResult');
        expect(resultButton.closest('button')).toBeDisabled();
      });
    });

    it('모발 타입 선택 후 결과 보기 버튼이 활성화된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.alreadyKnow'));
      await user.click(screen.getByText('직모'));

      await waitFor(() => {
        const resultButton = screen.getByText('action.viewResult');
        expect(resultButton.closest('button')).not.toBeDisabled();
      });
    });

    it('뒤로 버튼 클릭 시 가이드 단계로 돌아간다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.alreadyKnow'));

      await waitFor(() => {
        expect(screen.getByText('action.back')).toBeInTheDocument();
      });

      await user.click(screen.getByText('action.back'));

      await waitFor(() => {
        // 가이드 단계 복귀 확인: 사진 선택하기 버튼 존재
        expect(screen.getByText('action.selectPhoto')).toBeInTheDocument();
      });
    });

    it('타입 선택 + 결과 보기 클릭 시 결과 단계로 전환된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.alreadyKnow'));
      await user.click(screen.getByText('웨이브'));
      await user.click(screen.getByText('action.viewResult'));

      await waitFor(() => {
        expect(screen.getByTestId('hair-analysis-result')).toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // 에러 상태
  // ===========================================================================
  describe('에러 상태', () => {
    it('에러 메시지가 표시된다', async () => {
      const user = userEvent.setup();

      // fetch 실패 설정
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: '분석에 실패했어요' }),
      });

      render(<HairAnalysisPage />);

      // 업로드 단계로 이동
      await user.click(screen.getByText('action.selectPhoto'));

      // 파일 선택 시뮬레이션
      const fileInput = screen.getByLabelText('hair.photoSelectAria');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await fireEvent.change(fileInput, { target: { files: [file] } });

      // 분석 시작 버튼 클릭
      const analyzeButton = screen.getByLabelText('hair.startAnalysisAria');
      await user.click(analyzeButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert.textContent).toContain('error.analysisProblem');
      });
    });
  });

  // ===========================================================================
  // 결과 단계
  // ===========================================================================
  describe('결과 단계 (알고있는 타입 경로)', () => {
    it('종합 점수가 표시된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.alreadyKnow'));
      await user.click(screen.getByText('직모'));
      await user.click(screen.getByText('action.viewResult'));

      await waitFor(() => {
        expect(screen.getByTestId('hair-analysis-result')).toBeInTheDocument();
      });
    });

    it('다시 분석하기 버튼이 표시된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.alreadyKnow'));
      await user.click(screen.getByText('직모'));
      await user.click(screen.getByText('action.viewResult'));

      await waitFor(() => {
        expect(screen.getByText('action.reAnalyze')).toBeInTheDocument();
      });
    });

    it('다시 분석하기 클릭 시 가이드 단계로 돌아간다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.alreadyKnow'));
      await user.click(screen.getByText('직모'));
      await user.click(screen.getByText('action.viewResult'));

      await waitFor(() => {
        expect(screen.getByText('action.reAnalyze')).toBeInTheDocument();
      });

      await user.click(screen.getByText('action.reAnalyze'));

      await waitFor(() => {
        // 가이드 단계 복귀 확인: 사진 선택하기 버튼 존재
        expect(screen.getByText('action.selectPhoto')).toBeInTheDocument();
      });
    });
  });
});

// =============================================================================
// 에러 페이지 테스트
// =============================================================================

describe('HairAnalysisError', () => {
  // error.tsx는 별도 import - 글로벌 mock과 충돌 방지를 위해 lazy import
  it('에러 페이지가 정상 렌더링된다', async () => {
    const HairAnalysisError = (await import('@/app/(main)/analysis/hair/error')).default;
    const mockReset = vi.fn();
    const mockError = new Error('테스트 에러');

    render(<HairAnalysisError error={mockError} reset={mockReset} />);

    expect(screen.getByTestId('hair-error-page')).toBeInTheDocument();
  });

  it('에러 메시지가 표시된다', async () => {
    const HairAnalysisError = (await import('@/app/(main)/analysis/hair/error')).default;
    const mockReset = vi.fn();
    const mockError = new Error('테스트 에러');

    render(<HairAnalysisError error={mockError} reset={mockReset} />);

    expect(screen.getByText('문제가 발생했어요')).toBeInTheDocument();
    expect(
      screen.getByText('헤어 분석 페이지를 불러오는 중 오류가 발생했어요')
    ).toBeInTheDocument();
  });

  it('분석 목록으로 링크가 표시된다', async () => {
    const HairAnalysisError = (await import('@/app/(main)/analysis/hair/error')).default;
    const mockReset = vi.fn();
    const mockError = new Error('테스트 에러');

    render(<HairAnalysisError error={mockError} reset={mockReset} />);

    expect(screen.getByText('분석 목록으로')).toBeInTheDocument();
  });

  it('다시 시도 버튼 클릭 시 reset이 호출된다', async () => {
    const HairAnalysisError = (await import('@/app/(main)/analysis/hair/error')).default;
    const user = userEvent.setup();
    const mockReset = vi.fn();
    const mockError = new Error('테스트 에러');

    render(<HairAnalysisError error={mockError} reset={mockReset} />);

    await user.click(screen.getByText('다시 시도'));

    expect(mockReset).toHaveBeenCalledOnce();
  });
});

// =============================================================================
// 결과 에러 페이지 테스트
// =============================================================================

describe('HairResultError', () => {
  it('결과 에러 페이지가 정상 렌더링된다', async () => {
    const HairResultError = (await import('@/app/(main)/analysis/hair/result/[id]/error')).default;
    const mockReset = vi.fn();
    const mockError = new Error('결과 에러');

    render(<HairResultError error={mockError} reset={mockReset} />);

    expect(screen.getByTestId('hair-result-error-page')).toBeInTheDocument();
  });

  it('결과 에러 메시지가 표시된다', async () => {
    const HairResultError = (await import('@/app/(main)/analysis/hair/result/[id]/error')).default;
    const mockReset = vi.fn();
    const mockError = new Error('결과 에러');

    render(<HairResultError error={mockError} reset={mockReset} />);

    expect(screen.getByText('문제가 발생했어요')).toBeInTheDocument();
    expect(screen.getByText('헤어 분석 결과를 불러오는 중 오류가 발생했어요')).toBeInTheDocument();
  });

  it('다시 시도 버튼 클릭 시 reset이 호출된다', async () => {
    const HairResultError = (await import('@/app/(main)/analysis/hair/result/[id]/error')).default;
    const user = userEvent.setup();
    const mockReset = vi.fn();
    const mockError = new Error('결과 에러');

    render(<HairResultError error={mockError} reset={mockReset} />);

    await user.click(screen.getByText('다시 시도'));

    expect(mockReset).toHaveBeenCalledOnce();
  });
});

// =============================================================================
// 페이지 엣지 케이스 및 상호작용 보강
// =============================================================================

describe('HairAnalysisPage 엣지 케이스', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('고민 다중 선택', () => {
    it('고민을 여러 개 선택할 수 있다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.alreadyKnow'));

      await waitFor(() => {
        expect(screen.getByText('hair.selectConcerns')).toBeInTheDocument();
      });

      // 여러 고민 선택
      await user.click(screen.getByText(/탈모/));
      await user.click(screen.getByText(/비듬/));
      await user.click(screen.getByText(/푸석함/));

      // 선택 상태 확인 (CSS 클래스 변경)
      const hairlossBtn = screen.getByText(/탈모/).closest('button');
      expect(hairlossBtn).toHaveClass('bg-amber-500');
    });

    it('선택된 고민을 다시 클릭하면 해제된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.alreadyKnow'));

      await waitFor(() => {
        expect(screen.getByText('hair.selectConcerns')).toBeInTheDocument();
      });

      // 선택 후 해제
      await user.click(screen.getByText(/탈모/));
      const btn = screen.getByText(/탈모/).closest('button');
      expect(btn).toHaveClass('bg-amber-500');

      await user.click(screen.getByText(/탈모/));
      expect(btn).toHaveClass('bg-muted');
    });
  });

  describe('이미지 선택 후 프리뷰', () => {
    it('이미지 선택 후 프리뷰가 표시된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.selectPhoto'));

      const fileInput = screen.getByLabelText('hair.photoSelectAria');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        const img = screen.getByAltText('upload.selectedImage');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'blob:http://localhost/fake-preview');
      });
    });

    it('이미지 선택 후 다른 사진 선택 버튼이 표시된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.selectPhoto'));

      const fileInput = screen.getByLabelText('hair.photoSelectAria');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('action.selectOtherPhoto')).toBeInTheDocument();
      });
    });

    it('이미지 선택 후 분석 시작 버튼이 표시된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.selectPhoto'));

      const fileInput = screen.getByLabelText('hair.photoSelectAria');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByLabelText('hair.startAnalysisAria')).toBeInTheDocument();
      });
    });
  });

  describe('API 호출 성공 시 결과 표시', () => {
    it('분석 API 성공 시 결과 단계로 전환된다', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            result: {
              overallScore: 85,
              hairType: 'straight',
              hairTypeLabel: '직모',
              hairThicknessLabel: '보통',
              scalpTypeLabel: '중성 두피',
              concerns: [],
              insight: '건강한 모발이에요',
              metrics: [{ id: 'hydration', label: '수분도', value: 80, status: 'good' }],
              recommendedIngredients: ['케라틴'],
              careTips: ['관리 잘 하고 계세요'],
              analyzedAt: new Date().toISOString(),
            },
            data: { id: 'new-result-123' },
          }),
      });

      render(<HairAnalysisPage />);

      // 업로드 단계로 이동
      await user.click(screen.getByText('action.selectPhoto'));

      // 파일 선택
      const fileInput = screen.getByLabelText('hair.photoSelectAria');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await fireEvent.change(fileInput, { target: { files: [file] } });

      // 분석 시작
      const analyzeButton = screen.getByLabelText('hair.startAnalysisAria');
      await user.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByTestId('hair-analysis-result')).toBeInTheDocument();
      });
    });
  });

  describe('로딩 단계', () => {
    it('분석 중 로딩 UI가 표시된다', async () => {
      const user = userEvent.setup();

      // fetch가 오래 걸리도록 설정
      mockFetch.mockReturnValue(
        new Promise(() => {
          /* 영원히 대기 */
        })
      );

      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.selectPhoto'));

      const fileInput = screen.getByLabelText('hair.photoSelectAria');
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await fireEvent.change(fileInput, { target: { files: [file] } });

      const analyzeButton = screen.getByLabelText('hair.startAnalysisAria');
      await user.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText('hair.aiAnalyzingHair')).toBeInTheDocument();
        expect(screen.getByText('loading.pleaseWait')).toBeInTheDocument();
      });
    });
  });

  describe('Supabase 에러 처리', () => {
    it('기존 분석 조회 실패 시에도 페이지가 정상 렌더링된다', async () => {
      mockSingle.mockRejectedValue(new Error('Network error'));

      render(<HairAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByTestId('hair-analysis-page')).toBeInTheDocument();
        expect(screen.getByText('action.selectPhoto')).toBeInTheDocument();
      });
    });
  });

  describe('기존 분석 결과 배너 날짜 표시', () => {
    it('오늘 분석된 결과는 오늘로 표시된다', async () => {
      mockSingle.mockResolvedValue({
        data: {
          id: 'today-analysis',
          overall_score: 75,
          hair_type: 'curly',
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      render(<HairAnalysisPage />);

      await waitFor(() => {
        expect(screen.getByText('date.today')).toBeInTheDocument();
      });
    });
  });

  describe('결과 뷰 상세 내용', () => {
    it('분석 요약 섹션이 표시된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.alreadyKnow'));
      await user.click(screen.getByText('곱슬'));
      await user.click(screen.getByText('action.viewResult'));

      await waitFor(() => {
        expect(screen.getByText('hair.resultSummary')).toBeInTheDocument();
      });
    });

    it('항목별 점수 섹션이 표시된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.alreadyKnow'));
      await user.click(screen.getByText('곱슬'));
      await user.click(screen.getByText('action.viewResult'));

      await waitFor(() => {
        expect(screen.getByText('hair.metricScores')).toBeInTheDocument();
      });
    });

    it('추천 성분 섹션이 표시된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.alreadyKnow'));
      await user.click(screen.getByText('곱슬'));
      await user.click(screen.getByText('action.viewResult'));

      await waitFor(() => {
        expect(screen.getByText('hair.recommendedIngredients')).toBeInTheDocument();
      });
    });

    it('케어 팁 섹션이 표시된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisPage />);

      await user.click(screen.getByText('action.alreadyKnow'));
      await user.click(screen.getByText('곱슬'));
      await user.click(screen.getByText('action.viewResult'));

      await waitFor(() => {
        expect(screen.getByText('hair.careTips')).toBeInTheDocument();
      });
    });
  });
});
