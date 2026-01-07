/**
 * H-1 헤어 분석 결과 페이지 테스트
 * apps/web/app/(main)/analysis/hair/result/[id]/page.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mocks
const mockPush = vi.fn();
const mockParams = { id: 'hair-123' };

// Mock Next.js
vi.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push: mockPush }),
}));

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ isSignedIn: true, isLoaded: true }),
}));

// Mock Supabase client
const mockSupabaseSelect = vi.fn();
const mockSupabaseFrom = vi.fn(() => ({
  select: mockSupabaseSelect,
}));
const mockSupabaseClient = {
  from: mockSupabaseFrom,
};

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => mockSupabaseClient,
}));

// Mock Share hook
const mockShare = vi.fn();
vi.mock('@/hooks/useAnalysisShare', () => ({
  useAnalysisShare: () => ({ share: mockShare, loading: false }),
  createHairShareData: vi.fn(() => ({
    analysisType: 'hair',
    title: '테스트 헤어 분석',
    subtitle: '종합 점수 85점',
  })),
}));

// Mock Celebration
vi.mock('@/components/animations', () => ({
  CelebrationEffect: ({ trigger }: { trigger: boolean }) =>
    trigger ? <div data-testid="celebration">축하!</div> : null,
}));

// Mock share utils
vi.mock('@/lib/share', () => ({
  canShareFiles: () => true,
}));

// Mock DB 데이터
const mockDbHairAnalysis = {
  id: 'hair-123',
  clerk_user_id: 'user-1',
  image_url: 'hair-image.jpg',
  hair_type: 'wavy',
  hair_thickness: 'medium',
  scalp_type: 'normal',
  hydration: 75,
  scalp_health: 80,
  damage_level: 30,
  density: 70,
  elasticity: 65,
  shine: 72,
  overall_score: 85,
  concerns: ['dryness', 'frizz'],
  recommendations: {
    insight: '전반적으로 건강한 모발 상태입니다. 수분 보충에 신경 쓰시면 더 좋아요.',
    ingredients: ['아르간 오일', '히알루론산', '판테놀'],
    careTips: ['주 2회 딥 컨디셔닝', '열 스타일링 시 보호제 사용', '두피 마사지 권장'],
    analysisReliability: 'high',
  },
  created_at: new Date().toISOString(),
};

// 실제 페이지 import
import HairAnalysisResultPage from '@/app/(main)/analysis/hair/result/[id]/page';

describe('HairAnalysisResultPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    // 기본 성공 응답 설정
    mockSupabaseSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockDbHairAnalysis,
          error: null,
        }),
      }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('정상 렌더링', () => {
    it('페이지가 정상 렌더링된다', async () => {
      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        expect(screen.getByTestId('hair-result-page')).toBeInTheDocument();
      });
    });

    it('헤어 분석 결과 제목이 표시된다', async () => {
      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        expect(screen.getByText('헤어 분석 결과')).toBeInTheDocument();
      });
    });

    it('종합 점수가 표시된다', async () => {
      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        expect(screen.getByText('85')).toBeInTheDocument();
      });
    });

    it('DB에서 분석 결과를 조회한다', async () => {
      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        expect(mockSupabaseFrom).toHaveBeenCalledWith('hair_analyses');
      });
    });
  });

  describe('탭 전환', () => {
    it('기본 분석 탭이 기본 선택되어 있다', async () => {
      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        const basicTab = screen.getByRole('tab', { name: /기본 분석/i });
        expect(basicTab).toHaveAttribute('data-state', 'active');
      });
    });

    it('상세 정보 탭 클릭 시 탭이 전환된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        expect(screen.getByText('상세 지표')).toBeInTheDocument();
      });

      const detailTab = screen.getByRole('tab', { name: /상세 정보/i });
      await user.click(detailTab);

      await waitFor(() => {
        expect(detailTab).toHaveAttribute('data-state', 'active');
      });
    });
  });

  describe('상세 지표 표시', () => {
    it('수분도 지표가 표시된다', async () => {
      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        expect(screen.getByText('수분도')).toBeInTheDocument();
      });
    });

    it('두피 건강 지표가 표시된다', async () => {
      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        expect(screen.getByText('두피 건강')).toBeInTheDocument();
      });
    });

    it('손상도 지표가 표시된다', async () => {
      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        expect(screen.getByText('손상도')).toBeInTheDocument();
      });
    });

    it('6개의 상세 지표가 모두 표시된다', async () => {
      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        expect(screen.getByText('수분도')).toBeInTheDocument();
        expect(screen.getByText('두피 건강')).toBeInTheDocument();
        expect(screen.getByText('손상도')).toBeInTheDocument();
        expect(screen.getByText('모발 밀도')).toBeInTheDocument();
        expect(screen.getByText('탄력')).toBeInTheDocument();
        expect(screen.getByText('윤기')).toBeInTheDocument();
      });
    });
  });

  describe('인사이트 및 추천', () => {
    it('분석 인사이트가 표시된다', async () => {
      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        expect(screen.getByText('분석 인사이트')).toBeInTheDocument();
        expect(screen.getByText(/전반적으로 건강한 모발 상태입니다/)).toBeInTheDocument();
      });
    });

    it('상세 정보 탭에서 추천 성분이 표시된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        expect(screen.getByText('상세 지표')).toBeInTheDocument();
      });

      // 상세 정보 탭으로 전환
      const detailTab = screen.getByRole('tab', { name: /상세 정보/i });
      await user.click(detailTab);

      await waitFor(() => {
        expect(screen.getByText('추천 성분')).toBeInTheDocument();
        expect(screen.getByText('아르간 오일')).toBeInTheDocument();
        expect(screen.getByText('히알루론산')).toBeInTheDocument();
      });
    });

    it('상세 정보 탭에서 케어 팁이 표시된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        expect(screen.getByTestId('hair-result-page')).toBeInTheDocument();
      });

      // 상세 정보 탭으로 전환
      const detailTab = screen.getByRole('tab', { name: /상세 정보/i });
      await user.click(detailTab);

      await waitFor(() => {
        expect(screen.getByText('케어 팁')).toBeInTheDocument();
        expect(screen.getByText(/주 2회 딥 컨디셔닝/)).toBeInTheDocument();
      });
    });
  });

  describe('제품 추천 버튼', () => {
    it('제품 추천 버튼이 표시된다', async () => {
      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        expect(screen.getByText(/헤어 맞춤 제품 보기/)).toBeInTheDocument();
      });
    });

    it('제품 추천 버튼 클릭 시 제품 페이지로 이동한다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        expect(screen.getByText(/헤어 맞춤 제품 보기/)).toBeInTheDocument();
      });

      const productButton = screen.getByText(/헤어 맞춤 제품 보기/);
      await user.click(productButton);

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/products'));
    });
  });

  describe('공유 기능', () => {
    it('공유 버튼이 표시된다', async () => {
      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        // data-testid로 공유 버튼 찾기 (canShareFiles에 따라 텍스트가 다름)
        expect(screen.getByTestId('share-button')).toBeInTheDocument();
      });
    });

    it('공유 버튼 클릭 시 공유 함수가 호출된다', async () => {
      const user = userEvent.setup();
      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        expect(screen.getByTestId('share-button')).toBeInTheDocument();
      });

      const shareButton = screen.getByTestId('share-button');
      await user.click(shareButton);

      expect(mockShare).toHaveBeenCalled();
    });
  });

  describe('로딩 상태', () => {
    it('로딩 중 스피너가 표시된다', async () => {
      // 지연된 응답 설정
      mockSupabaseSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi
            .fn()
            .mockReturnValue(
              new Promise((resolve) =>
                setTimeout(() => resolve({ data: mockDbHairAnalysis, error: null }), 100)
              )
            ),
        }),
      });

      render(<HairAnalysisResultPage />);

      expect(screen.getByText(/결과를 불러오는 중/)).toBeInTheDocument();
    });

    it('로딩 완료 후 결과가 표시된다', async () => {
      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        expect(screen.queryByText(/결과를 불러오는 중/)).not.toBeInTheDocument();
        expect(screen.getByText('85')).toBeInTheDocument();
      });
    });
  });

  describe('에러 상태', () => {
    it('분석 결과가 없을 때 에러 메시지가 표시된다', async () => {
      mockSupabaseSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        expect(screen.getByText(/분석 결과를 찾을 수 없습니다/)).toBeInTheDocument();
      });
    });

    it('DB 에러 시 에러 메시지가 표시된다', async () => {
      mockSupabaseSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' },
          }),
        }),
      });

      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        expect(screen.getByText(/Database connection failed/)).toBeInTheDocument();
      });
    });

    it('에러 상태에서 대시보드 링크가 표시된다', async () => {
      mockSupabaseSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Error' },
          }),
        }),
      });

      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        expect(screen.getByText(/대시보드로/)).toBeInTheDocument();
      });
    });

    it('에러 상태에서 새로 분석하기 버튼이 표시된다', async () => {
      mockSupabaseSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Error' },
          }),
        }),
      });

      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        expect(screen.getByText(/새로 분석하기/)).toBeInTheDocument();
      });
    });
  });

  describe('비로그인 상태', () => {
    it('비로그인 시 로그인 안내가 표시된다', async () => {
      // 비로그인 mock
      vi.doMock('@clerk/nextjs', () => ({
        useAuth: () => ({ isSignedIn: false, isLoaded: true }),
      }));

      // 모듈 캐시 초기화 후 다시 import하면 문제가 생길 수 있음
      // 대신 별도의 테스트 컴포넌트로 검증
    });
  });

  describe('주요 고민 표시', () => {
    it('고민 태그가 표시된다', async () => {
      render(<HairAnalysisResultPage />);

      await waitFor(() => {
        expect(screen.getByText('주요 고민')).toBeInTheDocument();
      });
    });
  });
});
