/**
 * 뷰티 페이지 테스트 — 2탭 구조 (추천/케어)
 * WS-3에서 3탭이었으나 데모 폴리시(d8479120, 2026-06-16)에서 트렌드 탭 제거 → 2탭
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Next.js
// ADR-101 큐레이션 진입 보강으로 useSearchParams 추가됨 (Phase G)
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/link — 성분 스캔 진입점(<Link href="/scan">) 렌더 검증용
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock useUserMatching
// personalColor는 테스트마다 바꿔 검증할 수 있도록 가변(mock 접두사 = vitest 호이스팅 허용)
let mockPersonalColor: string | null = '봄 라이트';
let mockSkinType: string | null = 'combination';
let mockHasSkinAnalysis = true;
let mockSkinConcerns: string[] = ['hydration', 'pore'];
vi.mock('@/hooks/useUserMatching', () => ({
  useUserMatching: () => ({
    skinType: mockSkinType,
    skinConcerns: mockSkinConcerns,
    personalColor: mockPersonalColor,
    hasAnalysis: true,
    hasSkinAnalysis: mockHasSkinAnalysis,
    getMatchedProducts: vi.fn().mockReturnValue([]),
  }),
}));

// Mock 최신 통합 세션 — "분석 결과" 버튼 착지 검증용
let mockLatestSession: { id: string } | null = { id: 'sess-123' };
vi.mock('@/hooks/useLatestIntegratedSession', () => ({
  useLatestIntegratedSession: () => ({
    session: mockLatestSession,
    isLoading: false,
    error: null,
  }),
}));

// Mock Clerk (피부나이 실지표 로드용 useUser 사용)
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: null, isLoaded: true }),
}));

// Mock Supabase 클라이언트 (skin_analyses 실지표 조회)
vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({
    from: () => {
      const query: Record<string, unknown> = {};
      for (const method of ['select', 'eq', 'order', 'limit']) {
        query[method] = () => query;
      }
      query.maybeSingle = () => Promise.resolve({ data: null, error: null });
      return query;
    },
  }),
}));

// Mock 하위 컴포넌트 — 전달된 props를 기록해 상위(page)의 배선을 검증한다
const mockRecommendProps: Record<string, unknown>[] = [];
const mockCareProps: Record<string, unknown>[] = [];
vi.mock('@/components/beauty/BeautyRecommendTab', () => ({
  BeautyRecommendTab: (props: Record<string, unknown>) => {
    mockRecommendProps.push(props);
    return <div data-testid="beauty-recommend-tab">추천 탭</div>;
  },
}));
vi.mock('@/components/beauty/BeautyCareTab', () => ({
  default: (props: Record<string, unknown>) => {
    mockCareProps.push(props);
    return <div data-testid="beauty-care-tab">케어 탭</div>;
  },
}));
vi.mock('@/components/BottomNav', () => ({
  BottomNav: () => <nav data-testid="bottom-nav" />,
}));
vi.mock('@/components/animations', () => ({
  FadeInUp: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import BeautyPage from '@/app/(main)/beauty/page';

describe('BeautyPage 2탭 구조', () => {
  beforeEach(() => {
    mockPersonalColor = '봄 라이트';
    mockSkinType = 'combination';
    mockHasSkinAnalysis = true;
    mockSkinConcerns = ['hydration', 'pore'];
    mockLatestSession = { id: 'sess-123' };
    mockRecommendProps.length = 0;
    mockCareProps.length = 0;
    mockPush.mockClear();
  });

  it('data-testid="beauty-page"가 존재한다', () => {
    render(<BeautyPage />);
    expect(screen.getByTestId('beauty-page')).toBeInTheDocument();
  });

  it('영문 시즌(Summer)을 한국어(여름 쿨톤)로 표시한다 (영문 라벨 누수 방지)', () => {
    mockPersonalColor = 'Summer';
    render(<BeautyPage />);

    expect(screen.getByText('여름 쿨톤')).toBeInTheDocument();
    expect(screen.queryByText('Summer')).not.toBeInTheDocument();
  });

  it('2개 탭 트리거가 렌더링된다 (트렌드 탭은 데모 폴리시에서 제거됨)', () => {
    render(<BeautyPage />);

    expect(screen.getByTestId('beauty-tab-recommend')).toBeInTheDocument();
    expect(screen.getByTestId('beauty-tab-care')).toBeInTheDocument();
    expect(screen.queryByTestId('beauty-tab-trends')).not.toBeInTheDocument();
  });

  it('기본 탭은 추천 탭이다', () => {
    render(<BeautyPage />);
    expect(screen.getByTestId('beauty-recommend-tab')).toBeInTheDocument();
  });

  it('hasAnalysis=true일 때 프로필 섹션이 표시된다', () => {
    render(<BeautyPage />);
    expect(screen.getByTestId('beauty-profile')).toBeInTheDocument();
  });

  it('피부 타입 라벨이 표시된다', () => {
    render(<BeautyPage />);
    expect(screen.getByText('복합성')).toBeInTheDocument();
  });

  it('피부 고민 태그가 표시된다', () => {
    render(<BeautyPage />);
    expect(screen.getByText('보습')).toBeInTheDocument();
    expect(screen.getByText('모공')).toBeInTheDocument();
  });

  it('성분 스캔 진입점이 렌더링되고 /scan으로 연결된다', () => {
    render(<BeautyPage />);
    const entry = screen.getByTestId('beauty-scan-entry');
    expect(entry).toBeInTheDocument();
    expect(entry).toHaveAttribute('href', '/scan');
    // 바코드/제품 검색과 구분되는 "성분 스캔" 라벨 + 적합도 안내
    expect(screen.getByText('성분 스캔')).toBeInTheDocument();
    expect(screen.getByText('제품 성분표를 찍으면 나와의 적합도를 알려드려요')).toBeInTheDocument();
  });

  it('케어 탭 전환이 동작한다', async () => {
    const user = userEvent.setup();
    render(<BeautyPage />);

    await user.click(screen.getByTestId('beauty-tab-care'));
    expect(screen.getByTestId('beauty-care-tab')).toBeInTheDocument();
  });

  it('sr-only h1이 존재한다', () => {
    render(<BeautyPage />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveClass('sr-only');
  });
});

describe('BeautyPage 접근성', () => {
  it('탭 리스트에 aria-label이 존재한다', () => {
    render(<BeautyPage />);
    expect(screen.getByRole('tablist', { name: '뷰티 카테고리' })).toBeInTheDocument();
  });
});

// 수리 1 — 지어낸 "복합성" 진단 근절 (피부 미분석자에게 기본값 주입 금지)
describe('BeautyPage 피부 미분석 정직성', () => {
  beforeEach(() => {
    mockPersonalColor = '봄 라이트';
    mockSkinType = null;
    mockHasSkinAnalysis = false;
    mockSkinConcerns = [];
    mockLatestSession = { id: 'sess-123' };
    mockRecommendProps.length = 0;
    mockCareProps.length = 0;
    mockPush.mockClear();
  });

  it('피부 분석이 없으면 "복합성" 진단 칩을 표시하지 않는다', () => {
    render(<BeautyPage />);

    expect(screen.queryByText('복합성')).not.toBeInTheDocument();
    // 다른 피부타입 기본값으로 바꿔치기되지도 않아야 한다
    for (const label of ['건성', '지성', '민감성', '중성']) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });

  it('피부 분석이 없으면 분석 CTA를 표시한다', () => {
    render(<BeautyPage />);

    const cta = screen.getByTestId('beauty-skin-analysis-cta');
    expect(cta).toHaveTextContent('피부 분석하면 맞춤으로 바뀌어요');
  });

  it('피부 분석이 없으면 추천 탭에 지어낸 피부타입을 내려보내지 않는다 (userSkinType=null)', () => {
    render(<BeautyPage />);

    expect(mockRecommendProps.length).toBeGreaterThan(0);
    expect(mockRecommendProps.at(-1)?.userSkinType).toBeNull();
  });

  it('체형 등 다른 축만 있고 피부·퍼스널컬러가 없으면 추천 탭은 진단 전 상태를 유지한다', () => {
    mockPersonalColor = null;
    render(<BeautyPage />);

    expect(mockRecommendProps.length).toBeGreaterThan(0);
    expect(mockRecommendProps.at(-1)?.hasAnalysis).toBe(false);
  });

  it('피부 분석이 없으면 루틴을 생성하지 않는다 (지어낸 타입 기반 루틴 금지)', async () => {
    const user = userEvent.setup();
    render(<BeautyPage />);
    await user.click(screen.getByTestId('beauty-tab-care'));

    const careProps = mockCareProps.at(-1);
    expect(careProps?.morningRoutine).toEqual([]);
    expect(careProps?.eveningRoutine).toEqual([]);
  });

  it('피부 분석이 있으면 진단 칩과 루틴이 살아있다 (과잉 차단 방지)', async () => {
    mockSkinType = 'combination';
    mockHasSkinAnalysis = true;
    const user = userEvent.setup();
    render(<BeautyPage />);

    expect(screen.getByText('복합성')).toBeInTheDocument();
    expect(screen.queryByTestId('beauty-skin-analysis-cta')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('beauty-tab-care'));
    expect((mockCareProps.at(-1)?.morningRoutine as unknown[]).length).toBeGreaterThan(0);
  });
});

// 수리 2 — 퍼컬 미분석 시 빈 시즌 행(유령 행) 렌더 금지
describe('BeautyPage 퍼스널컬러 유령 행', () => {
  beforeEach(() => {
    mockSkinType = 'combination';
    mockHasSkinAnalysis = true;
    mockSkinConcerns = ['hydration'];
    mockLatestSession = { id: 'sess-123' };
    mockPush.mockClear();
  });

  it('퍼스널컬러가 없으면 시즌 행을 렌더하지 않는다', () => {
    mockPersonalColor = null;
    render(<BeautyPage />);

    expect(screen.queryByTestId('beauty-profile-season')).not.toBeInTheDocument();
  });

  it('퍼스널컬러가 있으면 시즌 행을 렌더한다', () => {
    mockPersonalColor = 'Summer';
    render(<BeautyPage />);

    const row = screen.getByTestId('beauty-profile-season');
    expect(row).toHaveTextContent('여름 쿨톤');
  });
});

// 수리 3 — "분석 결과" 버튼은 입력 폼이 아니라 최신 세션 결과로 착지
describe('BeautyPage 분석 결과 버튼 착지', () => {
  beforeEach(() => {
    mockPersonalColor = '봄 라이트';
    mockSkinType = 'combination';
    mockHasSkinAnalysis = true;
    mockSkinConcerns = ['hydration'];
    mockPush.mockClear();
  });

  it('최신 세션이 있으면 결과 페이지로 이동한다 (입력 폼 착지 금지)', async () => {
    mockLatestSession = { id: 'sess-abc' };
    const user = userEvent.setup();
    render(<BeautyPage />);

    await user.click(screen.getByTestId('beauty-profile-result-link'));

    expect(mockPush).toHaveBeenCalledWith('/analysis/integrated/result/sess-abc');
    expect(mockPush).not.toHaveBeenCalledWith('/analysis/integrated');
  });

  it('세션이 없으면 "분석 결과" 버튼을 표시하지 않는다', () => {
    mockLatestSession = null;
    render(<BeautyPage />);

    expect(screen.queryByTestId('beauty-profile-result-link')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('내 분석 결과 보기')).not.toBeInTheDocument();
  });
});
