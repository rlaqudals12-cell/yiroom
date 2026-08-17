/**
 * 오늘의 코디 — 디자인 계약 회귀 테스트 (2026-08 수리)
 *
 * 배경(수리 전):
 *  - 👕 🎨 💡 ☔ 💄 📌 ⚠️ 👗 등 장식 이모지가 화면 곳곳에 박혀 있었다(무단 이모지 금지 위반).
 *  - sticky 헤더가 `bg-background/95 backdrop-blur-sm` 반투명 유리판이라
 *    스크롤 시 아래 콘텐츠가 비쳐 글자 대비가 무너졌다(불투명 지면 원칙 위반).
 *
 * 범위 밖(의도적):
 *  - 아이템 점수 막대·종합점수 원은 제품 결정 D2 대기 중이라 이 테스트가 강제하지 않는다.
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

const state: { inventory: QueryResult } = { inventory: { data: [], error: null } };

/** 장식 이모지(그림문자) 전수 검사 — 텍스트 불릿(•)·°C 같은 기호는 대상이 아니다 */
const PICTOGRAPH = /\p{Extended_Pictographic}/u;

beforeEach(() => {
  vi.clearAllMocks();
  state.inventory = { data: [], error: null };
  global.fetch = vi.fn(async () => ({
    ok: true,
    json: async () => ({ outfits: [] }),
  })) as unknown as typeof fetch;
  mockSupabaseFrom.mockImplementation((table: string) => {
    if (table === 'user_inventory') return makeChain(() => state.inventory);
    return makeChain(() => ({ data: null, error: null }));
  });
});

describe('오늘의 코디 — 장식 이모지 부재', () => {
  it('코디가 조립된 화면에 이모지를 렌더하지 않는다', async () => {
    state.inventory = {
      data: [makeRow('top-1', '티셔츠', '화이트 셔츠'), makeRow('bottom-1', '슬랙스', '슬랙스')],
      error: null,
    };

    const { container } = render(<ClosetRecommendPage />);

    await waitFor(() => {
      expect(screen.getByTestId('occasion-chips')).toBeInTheDocument();
    });
    expect(container.textContent ?? '').not.toMatch(PICTOGRAPH);
  });

  it('빈 옷장 화면에 이모지를 렌더하지 않는다', async () => {
    const { container } = render(<ClosetRecommendPage />);

    await waitFor(() => {
      expect(screen.getByTestId('closet-empty-state')).toBeInTheDocument();
    });
    expect(container.textContent ?? '').not.toMatch(PICTOGRAPH);
  });

  it('조회 오류 화면에 이모지를 렌더하지 않는다', async () => {
    state.inventory = { data: null, error: { message: 'boom' } };

    const { container } = render(<ClosetRecommendPage />);

    await waitFor(() => {
      expect(screen.getByTestId('closet-error-state')).toBeInTheDocument();
    });
    expect(container.textContent ?? '').not.toMatch(PICTOGRAPH);
  });

  it('코디 불발 화면에 이모지를 렌더하지 않는다', async () => {
    state.inventory = { data: [makeRow('top-1', '티셔츠', '화이트 셔츠')], error: null };

    const { container } = render(<ClosetRecommendPage />);

    await waitFor(() => {
      expect(screen.getByTestId('outfit-missing-slots')).toBeInTheDocument();
    });
    expect(container.textContent ?? '').not.toMatch(PICTOGRAPH);
  });
});

describe('오늘의 코디 — sticky 헤더 불투명 지면', () => {
  it('반투명 유리판(backdrop-blur)을 쓰지 않고 불투명 배경을 쓴다', async () => {
    state.inventory = {
      data: [makeRow('top-1', '티셔츠', '화이트 셔츠'), makeRow('bottom-1', '슬랙스', '슬랙스')],
      error: null,
    };

    const { container } = render(<ClosetRecommendPage />);

    await waitFor(() => {
      expect(screen.getByTestId('occasion-chips')).toBeInTheDocument();
    });

    expect(container.querySelectorAll('[class*="backdrop-blur"]').length).toBe(0);
    const header = container.querySelector('.sticky');
    expect(header).not.toBeNull();
    expect(header!.className).toContain('bg-background');
    // 반투명 알파(bg-background/95)도 남아 있으면 안 된다
    expect(header!.className).not.toMatch(/bg-background\//);
  });

  it('빈 옷장·오류 화면 헤더도 불투명 지면을 쓴다', async () => {
    const empty = render(<ClosetRecommendPage />);
    await waitFor(() => {
      expect(screen.getByTestId('closet-empty-state')).toBeInTheDocument();
    });
    expect(empty.container.querySelectorAll('[class*="backdrop-blur"]').length).toBe(0);
    empty.unmount();

    state.inventory = { data: null, error: { message: 'boom' } };
    const errored = render(<ClosetRecommendPage />);
    await waitFor(() => {
      expect(screen.getByTestId('closet-error-state')).toBeInTheDocument();
    });
    expect(errored.container.querySelectorAll('[class*="backdrop-blur"]').length).toBe(0);
  });
});
