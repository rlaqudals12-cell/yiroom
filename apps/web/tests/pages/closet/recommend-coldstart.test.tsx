/**
 * 옷장 추천 콜드스타트 테스트 (배치 G3)
 * @description 창업자 지적: 옷장이 비면 "옷 추가하기"만 남아 수동 입력 강요로 느껴짐.
 *   빈 옷장이어도 진단(컬러·체형)으로 코디 "방향"을 제안하되,
 *   실제 옷을 지어내지 않고(소유 옷 카드/가짜 매칭 점수 없음) 색·스타일 가이드로만 제안하는지 검증.
 *   또한 "한 벌씩"이 아닌 일괄(사진 여러 장) 등록을 우선 안내하는지 확인.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

const { mockSupabaseFrom, stableClient } = vi.hoisted(() => {
  const from = vi.fn();
  return { mockSupabaseFrom: from, stableClient: { from } };
});

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => stableClient,
}));

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: pushMock }),
  useSearchParams: () => ({ get: () => null }),
}));

vi.mock('@/lib/weather', () => ({
  getWeatherWithGeolocation: vi.fn().mockResolvedValue(null),
}));

import ClosetRecommendPage from '@/app/(main)/closet/recommend/page';

type QueryResult = { data: unknown; error: unknown };

const state: { inventory: QueryResult; pc: QueryResult; body: QueryResult } = {
  inventory: { data: [], error: null },
  pc: { data: null, error: null },
  body: { data: null, error: null },
};

function makeChain(getResult: () => QueryResult) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn(async () => getResult()),
    then: (onF: (v: QueryResult) => unknown, onR?: (e: unknown) => unknown) =>
      Promise.resolve(getResult()).then(onF, onR),
  };
  return chain;
}

describe('ClosetRecommendPage 콜드스타트(빈 옷장 진단 제안)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.inventory = { data: [], error: null };
    state.pc = { data: null, error: null };
    state.body = { data: null, error: null };
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'user_inventory') return makeChain(() => state.inventory);
      if (table === 'personal_color_assessments') return makeChain(() => state.pc);
      if (table === 'body_analyses') return makeChain(() => state.body);
      return makeChain(() => ({ data: null, error: null }));
    });
  });

  it('빈 옷장 + 퍼스널컬러 진단 → 배색 제안을 렌더하고 실제 옷을 지어내지 않는다', async () => {
    state.pc = {
      data: {
        season: 'spring',
        best_colors: [
          { name: '라이트 핑크', hex: '#FFB6C1' },
          { name: '피치', hex: '#FFDAB9' },
          { name: '골드', hex: '#FFD700' },
        ],
        image_analysis: null,
      },
      error: null,
    };

    render(<ClosetRecommendPage />);

    // 진단 제안 컨테이너 + 배색 팔레트 렌더
    await waitFor(() => {
      expect(screen.getByTestId('coldstart-suggestions')).toBeInTheDocument();
    });
    expect(screen.getByTestId('coldstart-outfit-palette')).toBeInTheDocument();
    // 색·역할 블록(상의/하의/신발/가방/포인트) 5개
    expect(screen.getAllByTestId('coldstart-outfit-block')).toHaveLength(5);
    // 정직성: "실제 옷이 아니라 색·스타일 가이드"임을 명시
    expect(screen.getByText(/실제 옷이 아니라 색·스타일 가이드/)).toBeInTheDocument();
    expect(screen.getByTestId('coldstart-outfit-caption')).toBeInTheDocument();

    // 아이템 미발명(재발 방지): 소유 옷 카드(링크)·가짜 "추천 코디" 점수 헤더가 없어야 함
    expect(screen.queryByText('추천 코디')).not.toBeInTheDocument();
    expect(document.querySelectorAll('a[href^="/closet/"]').length).toBe(0);

    // 일괄(여러 장) 등록 우선 안내
    expect(screen.getByTestId('closet-register-cta')).toBeInTheDocument();
    expect(screen.getByText(/한 벌씩 넣지 않아도 돼요/)).toBeInTheDocument();
    expect(screen.getByTestId('closet-empty-cta')).toHaveTextContent('사진 여러 장 한 번에 등록');
  });

  it('빈 옷장 + 체형 진단만 있어도 체형 스타일 가이드를 제안한다', async () => {
    state.body = { data: { body_type: 'W' }, error: null };

    render(<ClosetRecommendPage />);

    await waitFor(() => {
      expect(screen.getByTestId('coldstart-body-tips')).toBeInTheDocument();
    });
    // 컬러 진단이 없으므로 배색 팔레트는 없음(지어내지 않음)
    expect(screen.queryByTestId('coldstart-outfit-palette')).not.toBeInTheDocument();
    // 일괄 등록 CTA는 항상
    expect(screen.getByTestId('closet-register-cta')).toBeInTheDocument();
  });

  it('진단이 전혀 없으면 진단 제안 없이 분석 유도 + 등록 CTA만 보여준다', async () => {
    render(<ClosetRecommendPage />);

    await waitFor(() => {
      expect(screen.getByTestId('closet-empty-state')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('coldstart-suggestions')).not.toBeInTheDocument();
    expect(screen.getByText('옷장이 비어있어요')).toBeInTheDocument();
    expect(screen.getByTestId('closet-register-cta')).toBeInTheDocument();
  });

  it('옷장에 옷이 있으면 콜드스타트가 아니라 기존 추천 경로를 렌더한다', async () => {
    state.inventory = {
      data: [
        {
          id: 'item-1',
          clerk_user_id: 'u1',
          category: 'closet',
          sub_category: 'top',
          name: '흰 셔츠',
          image_url: null,
          original_image_url: null,
          brand: null,
          tags: [],
          is_favorite: false,
          use_count: 0,
          last_used_at: null,
          expiry_date: null,
          metadata: { color: ['#FFFFFF'], season: [], occasion: [] },
          created_at: '2026-07-01T00:00:00Z',
          updated_at: '2026-07-01T00:00:00Z',
        },
      ],
      error: null,
    };

    render(<ClosetRecommendPage />);

    // 기존 경로 마커(상황 칩)만 뜨고 콜드스타트 제안은 없어야 함
    await waitFor(() => {
      expect(screen.getByTestId('occasion-chips')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('coldstart-suggestions')).not.toBeInTheDocument();
    expect(screen.queryByTestId('closet-empty-state')).not.toBeInTheDocument();
  });
});
