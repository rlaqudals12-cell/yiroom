/**
 * M-1 메이크업 결과 페이지 — 미측정 항목 표시 차단 회귀 테스트
 * apps/web/app/(main)/analysis/makeup/result/[id]/page.tsx
 *
 * 배경 (2026-08 수리): 통합분석이 만든 makeup_analyses 레코드는 얼굴형·눈·입술을
 * 측정 없이 상수('oval'/'almond'/'full')로 저장했고, 결과 페이지가 이를 개인 판정
 * 헤드라인·속성표로 렌더했다. 이제 recommendations.measured가 false인 항목은
 * 아예 표시하지 않고, 미측정 사실을 신뢰 푸터에 고지한다.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockParams = { id: 'makeup-123' };

vi.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ isSignedIn: true, isLoaded: true }),
  useUser: () => ({ user: { id: 'user-1' }, isLoaded: true, isSignedIn: true }),
}));

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
    // next/image 전용 prop은 DOM에 넘기지 않는다 (rest만 전달)
    const { fill, sizes, priority, ...rest } = props;
    // eslint-disable-next-line jsx-a11y/alt-text -- 테스트 mock
    return <img {...rest} />;
  },
}));

vi.mock('@/hooks/useAnalysisShare', () => ({
  useAnalysisShare: () => ({ share: vi.fn(), loading: false }),
  createMakeupShareData: vi.fn(() => ({
    analysisType: 'makeup',
    title: '테스트 메이크업 분석',
    subtitle: '종합 점수 68점',
  })),
}));

vi.mock('@/components/insights', () => ({
  ResultPageInsights: () => <div data-testid="result-page-insights" />,
}));

vi.mock('@/components/common/AIBadge', () => ({
  AIBadge: () => <span data-testid="ai-badge" />,
  AITransparencyNotice: () => <div data-testid="ai-transparency" />,
}));

/** 통합분석 composer가 저장하는 형태 — 얼굴형만 H-1 실측 승계, 나머지는 미측정 */
const integratedRow = {
  id: 'makeup-123',
  clerk_user_id: 'user-1',
  image_url: 'integrated://face/session-1',
  undertone: 'warm',
  // NOT NULL 컬럼이라 placeholder가 들어있다 — 표시되면 안 된다
  eye_shape: 'almond',
  lip_shape: 'full',
  face_shape: 'heart',
  skin_texture: null,
  skin_tone_uniformity: null,
  hydration: null,
  pore_visibility: null,
  oil_balance: null,
  overall_score: 68,
  concerns: [],
  recommendations: {
    baseRecommendation: '건성 피부에는 듀이 피니시 + 라이트 커버가 어울려요.',
    source: 'integrated',
    usedMock: false,
    measured: { faceShape: true, eyeShape: false, lipShape: false },
  },
  analysis_reliability: 'medium',
  created_at: new Date().toISOString(),
};

/** 단독 M-1 분석 행 — measured 미표기 = 전부 실측 (하위호환 회귀 방지) */
const standaloneRow = {
  ...integratedRow,
  eye_shape: 'almond',
  lip_shape: 'full',
  face_shape: 'oval',
  skin_texture: 75,
  skin_tone_uniformity: 70,
  hydration: 65,
  pore_visibility: 60,
  oil_balance: 72,
  recommendations: {
    insight: '웜톤에 계란형 얼굴형이시네요.',
    styles: ['natural'],
    colors: [],
    tips: [],
  },
};

import MakeupAnalysisResultPage from '@/app/(main)/analysis/makeup/result/[id]/page';

function mockRow(row: unknown): void {
  mockSupabaseSelect.mockReturnValue({
    eq: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: row, error: null }),
    }),
  });
}

describe('MakeupAnalysisResultPage — 미측정 항목', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('통합분석 행: 눈·입술 placeholder를 판정으로 표시하지 않는다', async () => {
    mockRow(integratedRow);
    render(<MakeupAnalysisResultPage />);

    await waitFor(() => {
      expect(screen.getByTestId('makeup-report-attrs')).toBeInTheDocument();
    });

    expect(screen.queryByText('눈')).not.toBeInTheDocument();
    expect(screen.queryByText('입술')).not.toBeInTheDocument();
    // placeholder 라벨(아몬드형/도톰한 입술 등)이 화면 어디에도 없어야 한다
    expect(screen.queryByText('아몬드형')).not.toBeInTheDocument();
  });

  it('통합분석 행: 승계된 얼굴형(H-1 실측)은 표시한다', async () => {
    mockRow(integratedRow);
    render(<MakeupAnalysisResultPage />);

    await waitFor(() => {
      expect(screen.getByText('얼굴형')).toBeInTheDocument();
    });
    // face_shape='heart' → '하트형'
    expect(screen.getAllByText('하트형').length).toBeGreaterThan(0);
  });

  it('통합분석 행: 측정값 없는 피부 상태 섹션을 렌더하지 않는다', async () => {
    mockRow(integratedRow);
    render(<MakeupAnalysisResultPage />);

    await waitFor(() => {
      expect(screen.getByTestId('makeup-report-attrs')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('makeup-report-metrics')).not.toBeInTheDocument();
    expect(screen.queryByText('피부 상태')).not.toBeInTheDocument();
  });

  it('통합분석 행: 미측정 사실을 신뢰 푸터에 고지한다', async () => {
    mockRow(integratedRow);
    render(<MakeupAnalysisResultPage />);

    await waitFor(() => {
      expect(screen.getByTestId('makeup-unmeasured-note')).toBeInTheDocument();
    });

    expect(screen.getByTestId('makeup-unmeasured-note').textContent).toContain('측정하지 않아');
  });

  it('입력 축이 폴백이면 Mock 고지를 노출한다', async () => {
    mockRow({
      ...integratedRow,
      recommendations: { ...integratedRow.recommendations, usedMock: true },
    });
    render(<MakeupAnalysisResultPage />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-data-notice')).toBeInTheDocument();
    });
  });

  it('단독 분석 행(measured 미표기)은 기존대로 전 항목을 표시한다', async () => {
    mockRow(standaloneRow);
    render(<MakeupAnalysisResultPage />);

    await waitFor(() => {
      expect(screen.getByTestId('makeup-report-attrs')).toBeInTheDocument();
    });

    expect(screen.getByText('눈')).toBeInTheDocument();
    expect(screen.getByText('입술')).toBeInTheDocument();
    expect(screen.getByText('얼굴형')).toBeInTheDocument();
    expect(screen.getByTestId('makeup-report-metrics')).toBeInTheDocument();
    expect(screen.queryByTestId('makeup-unmeasured-note')).not.toBeInTheDocument();
  });
});
