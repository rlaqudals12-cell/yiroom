/**
 * 오늘의 코디 — 정직성·중복 제거 회귀 테스트 (2026-08 수리)
 *
 * 배경(수리 전):
 *  - 계절 추정 온도(월 기준)를 실측처럼 "27°C ☀️ 맑음"처럼 단정해 보여줬다.
 *  - 코디가 불발인데도 TPO 칩 6개가 활성이라 눌러도 아무 변화가 없었다.
 *  - 불발 문구와 요약 팁이 같은 등록(하의)을 한 화면에서 두 번 요구했다.
 *  - '내 옷장 분석' 집계가 무엇을 기준으로 매긴 값인지 화면에 없었다.
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

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

// 위치 미동의(기본) → 계절 추정 경로
vi.mock('@/lib/weather', () => ({
  getWeatherWithGeolocation: vi.fn().mockResolvedValue(null),
  RAIN_THRESHOLD_MM: 0.1,
}));

import ClosetRecommendPage from '@/app/(main)/closet/recommend/page';

type QueryResult = { data: unknown; error: unknown };

function makeRow(id: string, subCategory: string, name: string) {
  return {
    id,
    clerk_user_id: 'user-1',
    category: 'closet',
    sub_category: subCategory,
    name,
    image_url: '',
    original_image_url: null,
    brand: null,
    tags: [],
    is_favorite: false,
    use_count: 0,
    last_used_at: null,
    expiry_date: null,
    metadata: { color: ['화이트'], season: [], occasion: [] },
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
  };
}

const state: { inventory: QueryResult } = { inventory: { data: [], error: null } };

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

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn(async () => ({
    ok: true,
    json: async () => ({ outfits: [] }),
  })) as unknown as typeof fetch;
  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table === 'user_inventory') return makeChain(() => state.inventory);
    return makeChain(() => ({ data: null, error: null }));
  });
});

describe('추정 온도 표기', () => {
  it('위치 실측이 없으면 온도에 "추정" 배지를 붙이고 날씨를 단정하지 않는다', async () => {
    state.inventory = {
      data: [makeRow('top-1', '티셔츠', '화이트 셔츠'), makeRow('bottom-1', '슬랙스', '슬랙스')],
      error: null,
    };

    render(<ClosetRecommendPage />);

    await waitFor(() => {
      expect(screen.getByTestId('temp-estimated-badge')).toBeInTheDocument();
    });
    expect(screen.getByText('계절 기준 추정')).toBeInTheDocument();
    // '현재 날씨'(실측) 배지는 뜨지 않는다
    expect(screen.queryByText('현재 날씨')).not.toBeInTheDocument();
  });
});

describe('코디 불발 화면', () => {
  beforeEach(() => {
    // 상의만 1벌 → 상·하의 쌍도 원피스도 없어 조립 불발
    state.inventory = { data: [makeRow('top-1', '티셔츠', '화이트 셔츠')], error: null };
  });

  it('누를 수 없는 TPO 칩을 렌더하지 않고 대신 이유를 한 줄로 알린다', async () => {
    render(<ClosetRecommendPage />);

    await waitFor(() => {
      expect(screen.getByTestId('outfit-missing-slots')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('occasion-chips')).not.toBeInTheDocument();
    expect(screen.getByTestId('occasion-unavailable')).toHaveTextContent(
      '옷을 더 등록하면 상황별로 골라드려요'
    );
  });

  it('불발 문구와 요약 팁이 같은 등록을 두 번 요구하지 않는다', async () => {
    render(<ClosetRecommendPage />);

    await waitFor(() => {
      expect(screen.getByTestId('outfit-missing-slots')).toBeInTheDocument();
    });

    // 불발 문구가 1주인공 — 요약의 부재 카테고리 안내는 접힌다
    expect(screen.getByText(/하의나 원피스를 1벌 등록하면/)).toBeInTheDocument();
    expect(screen.queryByText(/아직 등록 안 됐어요/)).not.toBeInTheDocument();
  });
});

describe('내 옷장 분석 요약', () => {
  it('무엇을 기준으로 매긴 집계인지 화면에 밝힌다', async () => {
    state.inventory = {
      data: [makeRow('top-1', '티셔츠', '화이트 셔츠'), makeRow('bottom-1', '슬랙스', '슬랙스')],
      error: null,
    };

    render(<ClosetRecommendPage />);

    await waitFor(() => {
      expect(screen.getByTestId('summary-basis')).toBeInTheDocument();
    });
    expect(screen.getByTestId('summary-basis')).toHaveTextContent('퍼스널컬러·체형 기준이에요');
  });

  it('코디가 조립되면 부재 카테고리 안내를 그대로 보여준다', async () => {
    state.inventory = {
      data: [makeRow('top-1', '티셔츠', '화이트 셔츠'), makeRow('bottom-1', '슬랙스', '슬랙스')],
      error: null,
    };

    render(<ClosetRecommendPage />);

    await waitFor(() => {
      expect(screen.getByTestId('occasion-chips')).toBeInTheDocument();
    });
    expect(screen.getByText(/아직 등록 안 됐어요/)).toBeInTheDocument();
  });
});
