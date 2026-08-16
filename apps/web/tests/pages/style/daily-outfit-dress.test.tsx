/**
 * 스타일 탭 오늘의 코디 — 원피스 슬롯 배선 회귀 테스트
 *
 * 배경: 조립기(closetMatcher)는 상·하의 쌍이 없으면 원피스 한 벌로 코디를 만든다.
 * 그런데 /style 소비처의 슬롯 목록에 dress가 빠져 있어, 원피스 위주 옷장에서는
 * 코디가 통째로 비어(dailyOutfit.length === 0) "옷장에 옷을 등록하면..." 빈 CTA로
 * 되돌아갔다. 원피스가 슬롯에 포함돼 한국어 라벨로 보이는지 고정한다.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { InventoryItemDB } from '@/types/inventory';

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ isSignedIn: true, isLoaded: true, user: { id: 'user-1' } }),
  useAuth: () => ({ isSignedIn: true, isLoaded: true, userId: 'user-1' }),
}));

// 하단 네비·취향 칩은 이 테스트의 관심사가 아니므로 경량 대체
vi.mock('@/components/BottomNav', () => ({
  BottomNav: () => React.createElement('nav', { 'data-testid': 'bottom-nav' }),
}));
vi.mock('@/components/style/StylePreferenceChips', () => ({
  StylePreferenceChips: () => React.createElement('div', { 'data-testid': 'style-pref-chips' }),
}));
vi.mock('@/components/style/MaterialFavoriteFilter', () => ({
  MaterialFavoriteFilter: () => React.createElement('div', { 'data-testid': 'material-filter' }),
}));

function makeRow(overrides: Partial<InventoryItemDB> = {}): InventoryItemDB {
  return {
    id: 'row-1',
    clerk_user_id: 'user-1',
    category: 'closet',
    sub_category: '원피스',
    name: '플로럴 원피스',
    image_url: '',
    original_image_url: null,
    brand: null,
    tags: [],
    is_favorite: false,
    use_count: 0,
    last_used_at: null,
    expiry_date: null,
    // 시즌 태그 없음 = 계절 가드에 걸리지 않아 실행 월과 무관하게 결정적
    metadata: { color: ['아이보리'], season: [], occasion: [] },
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
    ...overrides,
  };
}

// Supabase 체인 mock — user_inventory만 옷장 행을 돌려준다 (분석 결과는 없음)
let closetRows: InventoryItemDB[] = [];

function makeQuery(table: string): Record<string, unknown> {
  const result =
    table === 'user_inventory' ? { data: closetRows, error: null } : { data: null, error: null };
  const query: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'order', 'limit']) {
    query[method] = vi.fn(() => query);
  }
  query.maybeSingle = vi.fn(() => Promise.resolve(result));
  query.single = vi.fn(() => Promise.resolve(result));
  query.then = (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve);
  return query;
}

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({ from: vi.fn((table: string) => makeQuery(table)) }),
}));

import StylePage from '@/app/(main)/style/page';

describe('StylePage 오늘의 코디 — 원피스', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    closetRows = [];
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === '/api/user/measurements') {
        return { ok: true, json: async () => ({ hasMeasurements: true }) } as Response;
      }
      return { ok: true, json: async () => ({ preferences: [] }) } as Response;
    }) as unknown as typeof fetch;
  });

  it('원피스만 있고 신발이 없는 옷장에서도 빈 CTA 대신 코디를 보여준다', async () => {
    closetRows = [makeRow()];

    render(<StylePage />);

    // 코디 카드가 뜬다 — 수리 전에는 슬롯에 dress가 없어 빈 상태 CTA로 떨어졌다
    expect(await screen.findByTestId('outfit-routine-card')).toBeInTheDocument();
    expect(screen.getByText('플로럴 원피스')).toBeInTheDocument();
    expect(screen.getByText('원피스')).toBeInTheDocument();

    // 빈 상태 CTA는 나타나지 않는다
    expect(screen.queryByText('사진으로 옷장 한 번에 등록하기')).not.toBeInTheDocument();
    expect(
      screen.queryByText('옷장에 옷을 등록하면 내 옷으로 매일 코디를 추천해드려요')
    ).not.toBeInTheDocument();
  });

  it('원피스 + 신발 조합에서 두 슬롯이 모두 렌더된다', async () => {
    closetRows = [
      makeRow(),
      makeRow({
        id: 'row-2',
        sub_category: '로퍼',
        name: '브라운 로퍼',
        metadata: { color: ['브라운'], season: [], occasion: [] },
      }),
    ];

    render(<StylePage />);

    expect(await screen.findByTestId('outfit-routine-card')).toBeInTheDocument();
    expect(screen.getByText('플로럴 원피스')).toBeInTheDocument();
    expect(screen.getByText('브라운 로퍼')).toBeInTheDocument();
    expect(screen.getByText('원피스')).toBeInTheDocument();
    expect(screen.getByText('신발')).toBeInTheDocument();
  });

  it('옷장이 비어 있으면 기존 빈 상태 CTA를 유지한다', async () => {
    closetRows = [];

    render(<StylePage />);

    expect(await screen.findByText('사진으로 옷장 한 번에 등록하기')).toBeInTheDocument();
    expect(screen.queryByTestId('outfit-routine-card')).not.toBeInTheDocument();
  });
});
