/**
 * H-1 헤어 결과 페이지 — 퍼스널컬러 기반 염색 컬러 처방(5축 고유 산출물) 테스트
 * apps/web/app/(main)/analysis/hair/result/[id]/page.tsx
 *
 * 검증:
 *  - 퍼컬 시즌이 있으면 하드코딩 팔레트(hex)×시즌으로 스와치를 렌더한다(AI 콜 0).
 *  - 퍼컬 미진단이면 색을 지어내지 않고 정직한 빈 상태(퍼컬 진단 유도)를 렌더한다.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const mockPush = vi.fn();
const mockParams = { id: 'hair-123' };

vi.mock('next/navigation', () => ({
  useParams: () => mockParams,
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ isSignedIn: true, isLoaded: true }),
  useUser: () => ({ user: { id: 'user-1' }, isLoaded: true, isSignedIn: true }),
}));

// 퍼컬 조회 응답 — 테스트별로 교체 가능(시즌 있음/없음 분기)
let pcResponse: { data: { season: string } | null; error: unknown } = {
  data: { season: 'Spring' },
  error: null,
};

// 퍼컬 조회 체인: select→order→limit→single (중첩 4단 초과 방지를 위해 평탄화)
const pcSingle = () => Promise.resolve(pcResponse);
const pcLimit = () => ({ single: pcSingle });
const pcOrder = () => ({ limit: pcLimit });
const pcSelect = () => ({ order: pcOrder });

// 헤어 결과 체인: select→eq→single
const hairSingle = () => Promise.resolve({ data: mockDbHairAnalysis, error: null });
const hairEq = () => ({ single: hairSingle });
const hairSelect = () => ({ eq: hairEq });

// 테이블별 라우팅 supabase mock:
//  - hair_analyses: 메인 결과 조회. useScoreTrend의 .lt 체인은 자체 try/catch로
//    조용히 실패(추이는 부가 정보) — 별도 모킹 불필요.
//  - personal_color_assessments: 시즌 조회
const mockSupabaseFrom = vi.fn((table: string) =>
  table === 'personal_color_assessments' ? { select: pcSelect } : { select: hairSelect }
);

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({ from: mockSupabaseFrom }),
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, sizes, priority, ...rest } = props;
    // eslint-disable-next-line jsx-a11y/alt-text -- 테스트 mock: next/image 속성 그대로 전달
    return <img {...rest} />;
  },
}));

const mockShare = vi.fn();
vi.mock('@/hooks/useAnalysisShare', () => ({
  useAnalysisShare: () => ({ share: mockShare, loading: false }),
  createHairShareData: vi.fn(() => ({
    analysisType: 'hair',
    title: '테스트 헤어 분석',
    subtitle: '종합 점수 85점',
  })),
}));

vi.mock('@/components/animations', () => ({
  CelebrationEffect: ({ trigger }: { trigger: boolean }) =>
    trigger ? <div data-testid="celebration">축하!</div> : null,
  FadeInUp: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Confetti: () => null,
}));

vi.mock('@/components/insights', () => ({
  ResultPageInsights: () => <div data-testid="result-page-insights" />,
}));

vi.mock('@/components/common/AIBadge', () => ({
  AIBadge: () => <span data-testid="ai-badge" />,
  AITransparencyNotice: () => <div data-testid="ai-transparency" />,
}));

vi.mock('@/components/share', () => ({
  ShareButton: ({ onShare }: { onShare?: () => void }) => (
    <button data-testid="share-button" onClick={onShare}>
      공유
    </button>
  ),
  PrintButton: () => <button data-testid="print-button">PDF 저장</button>,
  ShareThemePicker: ({ value, onChange }: { value?: string; onChange?: (v: string) => void }) => (
    <select
      data-testid="share-theme-picker"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    >
      <option value="default">default</option>
    </select>
  ),
}));

vi.mock('@/lib/share', () => ({
  canShareFiles: () => true,
}));

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
  concerns: ['dryness'],
  recommendations: {
    insight: '건강한 모발 상태입니다.',
    ingredients: ['아르간 오일'],
    careTips: ['주 2회 딥 컨디셔닝'],
    analysisReliability: 'high',
  },
  created_at: new Date().toISOString(),
};

import HairAnalysisResultPage from '@/app/(main)/analysis/hair/result/[id]/page';

describe('HairAnalysisResultPage — 염색 컬러 처방', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    pcResponse = { data: { season: 'Spring' }, error: null };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('퍼컬 시즌(봄)이 있으면 시즌 팔레트 스와치를 렌더한다(AI 콜 0)', async () => {
    render(<HairAnalysisResultPage />);

    // 프리스크립션 섹션은 결과 로드 후 항상 존재
    await waitFor(() => {
      expect(screen.getByTestId('hair-color-prescription')).toBeInTheDocument();
    });

    // 시즌 조회 반영 후 스와치가 나타난다(봄 = 4색)
    await waitFor(() => {
      expect(screen.getByTestId('hair-color-swatches')).toBeInTheDocument();
    });
    const swatches = screen.getAllByTestId('hair-color-swatch');
    expect(swatches).toHaveLength(4);

    // 봄 팔레트 첫 컬러명 + hex 스와치 렌더 확인(하드코딩 팔레트)
    expect(screen.getByText('골드 브라운')).toBeInTheDocument();
    const chip = swatches[0].querySelector('span[style]') as HTMLElement;
    expect(chip.style.backgroundColor).not.toBe('');

    // 빈 상태는 없어야 한다
    expect(screen.queryByTestId('hair-color-empty')).not.toBeInTheDocument();
  });

  it('적합도를 %로 표기하지 않고 추천 순위로만 노출한다(조작된 정밀도 금지)', async () => {
    render(<HairAnalysisResultPage />);

    await waitFor(() => {
      expect(screen.getByTestId('hair-color-swatches')).toBeInTheDocument();
    });

    // 4시즌 공통 사다리(90/85/80/75)를 개인 적합도처럼 % 표기하던 회귀 방지
    const section = screen.getByTestId('hair-color-prescription');
    expect(section).not.toHaveTextContent('어울림');
    expect(section.textContent).not.toMatch(/\d+%/);

    // 서열은 유지 — 순위 라벨이 카탈로그 순서대로 렌더된다
    const ranks = screen.getAllByTestId('hair-color-rank').map((el) => el.textContent);
    expect(ranks).toEqual(['추천 1순위', '추천 2순위', '추천 3순위', '추천 4순위']);
  });

  it('퍼컬 미진단이면 색을 지어내지 않고 빈 상태(퍼컬 진단 유도)를 렌더한다', async () => {
    pcResponse = { data: null, error: { message: 'no rows' } };

    render(<HairAnalysisResultPage />);

    await waitFor(() => {
      expect(screen.getByTestId('hair-color-prescription')).toBeInTheDocument();
    });

    // 빈 상태 + 퍼컬 진단 CTA 링크
    expect(screen.getByTestId('hair-color-empty')).toBeInTheDocument();
    const cta = screen.getByTestId('hair-color-pc-cta');
    expect(cta).toHaveAttribute('href', '/analysis/personal-color');

    // 스와치는 렌더되지 않는다(색 지어내기 0)
    expect(screen.queryByTestId('hair-color-swatches')).not.toBeInTheDocument();
  });
});
