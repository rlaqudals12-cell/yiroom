/**
 * M-1 메이크업 결과 페이지 — 결론 액션 카드(TopActionsCard) 테스트
 * apps/web/app/(main)/analysis/makeup/result/[id]/page.tsx
 *
 * ADR-111 표현 원칙 1(결론 먼저): 기본 탭 상단에 "그래서 이렇게 하세요" 액션 카드가
 * 기존 결과 데이터에서 규칙 기반으로 조립되어 노출되는지 검증한다.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockPush = vi.fn();
const mockParams = { id: 'makeup-123' };

vi.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ isSignedIn: true, isLoaded: true }),
  useUser: () => ({ user: { id: 'user-1' }, isLoaded: true, isSignedIn: true }),
}));

// 직전 대비 추이 훅 — 첫 분석이므로 null (외부 쿼리 회피)
vi.mock('@/hooks/useScoreTrend', () => ({
  useScoreTrend: () => null,
}));

const mockSupabaseSelect = vi.fn();
const mockSupabaseFrom = vi.fn(() => ({ select: mockSupabaseSelect }));
vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({ from: mockSupabaseFrom }),
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, sizes, priority, ...rest } = props;
    // eslint-disable-next-line jsx-a11y/alt-text -- 테스트 mock
    return <img {...rest} />;
  },
}));

const mockShare = vi.fn();
vi.mock('@/hooks/useAnalysisShare', () => ({
  useAnalysisShare: () => ({ share: mockShare, loading: false }),
  createMakeupShareData: vi.fn(() => ({
    analysisType: 'makeup',
    title: '테스트 메이크업 분석',
    subtitle: '종합 점수 68점',
  })),
}));

vi.mock('@/components/insights', () => ({
  ResultPageInsights: () => <div data-testid="result-page-insights" />,
}));

vi.mock('@/components/analysis/ContextLinkingCard', () => ({
  ContextLinkingCard: () => <div data-testid="context-linking-card" />,
}));

vi.mock('@/components/analysis/visual-report/VisualReportCard', () => ({
  VisualReportCard: ({ overallScore }: { overallScore?: number }) => (
    <div data-testid="visual-report-card">
      {overallScore !== undefined && <span>{overallScore}</span>}
    </div>
  ),
}));

vi.mock('@/components/common/AIBadge', () => ({
  AIBadge: () => <span data-testid="ai-badge" />,
  AITransparencyNotice: () => <div data-testid="ai-transparency" />,
}));

// DB 데이터 (추천 스타일·컬러·퍼스널컬러 연동 포함 → 결론 액션 3개 조립)
const mockDbMakeupAnalysis = {
  id: 'makeup-123',
  clerk_user_id: 'user-1',
  image_url: 'makeup.jpg',
  undertone: 'warm',
  eye_shape: 'almond',
  lip_shape: 'full',
  face_shape: 'oval',
  skin_texture: 75,
  skin_tone_uniformity: 70,
  hydration: 65,
  pore_visibility: 60,
  oil_balance: 72,
  overall_score: 68,
  concerns: ['dark-circles'],
  recommendations: {
    insight: '웜톤에 계란형 얼굴형이시네요.',
    styles: ['natural', 'glam'],
    colors: [
      {
        category: 'lip',
        categoryLabel: '립',
        colors: [{ name: '코랄 오렌지', hex: '#FF6B4A', description: '화사한 코랄' }],
      },
    ],
    tips: [{ category: '베이스', tips: ['프라이머로 모공을 먼저 메워주세요'] }],
    personalColorConnection: {
      season: 'spring',
      compatibility: 'high',
      note: '봄 웜톤이라 코랄 계열이 얼굴을 화사하게 살려줘요',
    },
  },
  analysis_reliability: 'high',
  created_at: new Date().toISOString(),
};

import MakeupAnalysisResultPage from '@/app/(main)/analysis/makeup/result/[id]/page';

describe('MakeupAnalysisResultPage — 결론 액션 카드', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockSupabaseSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockDbMakeupAnalysis, error: null }),
      }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('결론 액션 카드가 기본 탭 상단에 표시된다', async () => {
    render(<MakeupAnalysisResultPage />);

    await waitFor(() => {
      expect(screen.getByTestId('top-actions-card')).toBeInTheDocument();
    });
  });

  it('추천 스타일이 행동형 문구로 조립된다', async () => {
    render(<MakeupAnalysisResultPage />);

    await waitFor(() => {
      // recommendedStyles[0] = 'natural' → 라벨 '내추럴'
      expect(screen.getByText('내추럴 스타일이 잘 어울려요')).toBeInTheDocument();
    });
  });

  it('첫 립 컬러가 색 견본과 함께 조립되고 탭 링크 대신 안내 문구만 노출된다', async () => {
    render(<MakeupAnalysisResultPage />);

    await waitFor(() => {
      expect(screen.getByText('립은 코랄 오렌지부터 발라보세요')).toBeInTheDocument();
      expect(screen.getByText('컬러 탭에서 전체 추천 색상을 확인할 수 있어요')).toBeInTheDocument();
    });
  });

  it('퍼스널 컬러 연동 노트가 결론 액션에 반영된다', async () => {
    render(<MakeupAnalysisResultPage />);

    await waitFor(() => {
      expect(
        screen.getByText('봄 웜톤이라 코랄 계열이 얼굴을 화사하게 살려줘요')
      ).toBeInTheDocument();
    });
  });
});
