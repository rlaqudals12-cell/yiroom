/**
 * 내 옷장 — 카테고리·시즌 필터 부활 회귀 테스트
 *
 * 배경(수리 전): 카테고리는 `in('sub_category', ['top'])`으로 물었으나 실제 저장값은
 * 한글 세부종류('티셔츠')라 항상 0건, 시즌은 jsonb 컬럼에 배열 연산자(overlaps)를 써
 * 쿼리 자체가 실패했고 실패는 조용히 삼켜졌다. 이제는
 * (1) 조회 후 클라이언트에서 정규화 기준으로 거르고
 * (2) 조회 실패를 "옷이 없어요"로 위장하지 않으며
 * (3) 필터가 켜져도 무한 스크롤이 조기 종료되지 않는다.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { InventoryItem, InventoryItemDB } from '@/types/inventory';

// 그리드·상세 시트는 이 테스트의 관심사가 아니므로 경량 대체.
// (필터 칩은 실제 CategoryFilter를 써야 하므로 barrel의 나머지는 그대로 둔다)
vi.mock('@/components/inventory', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/inventory')>();
  return {
    ...actual,
    InventoryGrid: ({ items, hasMore }: { items: InventoryItem[]; hasMore?: boolean }) =>
      React.createElement(
        'div',
        { 'data-testid': 'inventory-grid-stub', 'data-has-more': String(hasMore ?? false) },
        items.map((item) =>
          React.createElement('div', { key: item.id, 'data-testid': 'closet-item' }, item.name)
        )
      ),
    ItemDetailSheet: () => null,
  };
});

// Supabase 쿼리 mock — 터미널 결과는 테스트마다 바꾸고, 호출된 연산자는 기록한다
let queryResult: { data: unknown; error: unknown } = { data: [], error: null };
const opCalls = {
  in: vi.fn(),
  overlaps: vi.fn(),
  range: vi.fn(),
};

function makeQuery(): Record<string, unknown> {
  const query: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'order', 'or', 'in', 'overlaps', 'range', 'limit'] as const;
  for (const method of methods) {
    query[method] = vi.fn((...args: unknown[]) => {
      const spy = (opCalls as Record<string, ReturnType<typeof vi.fn>>)[method];
      if (spy) spy(...args);
      return query;
    });
  }
  query.then = (resolve: (v: unknown) => void) => Promise.resolve(queryResult).then(resolve);
  return query;
}

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({ from: vi.fn(() => makeQuery()) }),
}));

import ClosetPage from '@/app/(main)/closet/page';

function makeRow(overrides: Partial<InventoryItemDB> = {}): InventoryItemDB {
  return {
    id: 'row-1',
    clerk_user_id: 'user-1',
    category: 'closet',
    sub_category: '티셔츠',
    name: '화이트 티셔츠',
    image_url: '',
    original_image_url: null,
    brand: null,
    tags: [],
    is_favorite: false,
    use_count: 0,
    last_used_at: null,
    expiry_date: null,
    metadata: { color: [], season: ['summer'], occasion: [] },
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
    ...overrides,
  };
}

/** 필터 시트를 여는 버튼 (아이콘 전용이라 아이콘 mock으로 찾는다) */
function openFilterSheet() {
  const filterButton = screen.getByTestId('lucide-slidershorizontal').closest('button');
  expect(filterButton).toBeTruthy();
  fireEvent.click(filterButton as HTMLElement);
}

describe('ClosetPage 필터', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResult = { data: [], error: null };
  });

  it('한글 sub_category 아이템도 카테고리 칩으로 걸러진다', async () => {
    queryResult = {
      data: [
        makeRow({ id: 'tee', sub_category: '티셔츠', name: '화이트 티셔츠' }),
        makeRow({ id: 'jeans', sub_category: '청바지', name: '연청 청바지' }),
      ],
      error: null,
    };

    render(<ClosetPage />);

    await waitFor(() => {
      expect(screen.getAllByTestId('closet-item')).toHaveLength(2);
    });

    // '상의' 칩 선택 — 수리 전에는 영문 값으로 DB를 물어 필터가 아무 일도 하지 않았다
    fireEvent.click(screen.getByText('상의'));

    await waitFor(() => {
      expect(screen.getAllByTestId('closet-item')).toHaveLength(1);
    });
    expect(screen.getByText('화이트 티셔츠')).toBeInTheDocument();
    expect(screen.queryByText('연청 청바지')).not.toBeInTheDocument();
  });

  it('시즌 다중 선택은 OR로 동작하고, 실패하던 jsonb 연산자를 다시 쓰지 않는다', async () => {
    queryResult = {
      data: [
        makeRow({ id: 'sp', name: '봄 자켓', metadata: { season: ['spring'] } }),
        makeRow({ id: 'wi', name: '겨울 코트', metadata: { season: ['winter'] } }),
        makeRow({ id: 'su', name: '여름 셔츠', metadata: { season: ['summer'] } }),
      ],
      error: null,
    };

    render(<ClosetPage />);
    await waitFor(() => {
      expect(screen.getAllByTestId('closet-item')).toHaveLength(3);
    });

    openFilterSheet();
    fireEvent.click(await screen.findByText('봄'));
    fireEvent.click(screen.getByText('겨울'));

    await waitFor(() => {
      expect(screen.getAllByTestId('closet-item')).toHaveLength(2);
    });
    expect(screen.getByText('봄 자켓')).toBeInTheDocument();
    expect(screen.getByText('겨울 코트')).toBeInTheDocument();
    expect(screen.queryByText('여름 셔츠')).not.toBeInTheDocument();

    // 근본 원인 재발 방지: jsonb 컬럼에 배열 연산자를 쓰지 않는다
    expect(opCalls.overlaps).not.toHaveBeenCalled();
    expect(opCalls.in).not.toHaveBeenCalled();
  });

  it('조회가 실패하면 빈 옷장으로 위장하지 않고 실패를 알린다', async () => {
    queryResult = { data: null, error: { message: 'operator does not exist' } };

    render(<ClosetPage />);

    await waitFor(() => {
      expect(screen.getByTestId('closet-fetch-error')).toBeInTheDocument();
    });
    expect(screen.getByText('옷장을 불러오지 못했어요')).toBeInTheDocument();
    expect(screen.getByTestId('closet-fetch-retry')).toBeInTheDocument();
    expect(screen.queryAllByTestId('closet-item')).toHaveLength(0);
  });

  it('조회에 성공하면 실패 안내를 띄우지 않는다', async () => {
    queryResult = { data: [makeRow()], error: null };

    render(<ClosetPage />);

    await waitFor(() => {
      expect(screen.getAllByTestId('closet-item')).toHaveLength(1);
    });
    expect(screen.queryByTestId('closet-fetch-error')).not.toBeInTheDocument();
  });

  it('필터가 켜져도 다음 페이지 판정은 걸러지기 전 행 수로 한다 (무한 스크롤 조기 종료 방지)', async () => {
    // 한 페이지(200행)가 꽉 찼지만 그중 '상의'는 1벌뿐인 상황
    const page = Array.from({ length: 200 }, (_, i) =>
      makeRow({
        id: `row-${i}`,
        sub_category: i === 0 ? '티셔츠' : '청바지',
        name: i === 0 ? '유일한 상의' : `하의 ${i}`,
      })
    );
    queryResult = { data: page, error: null };

    render(<ClosetPage />);
    await waitFor(() => {
      expect(screen.getByTestId('inventory-grid-stub')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('상의'));

    await waitFor(() => {
      expect(screen.getAllByTestId('closet-item')).toHaveLength(1);
    });
    // 화면에 1벌만 남았다고 "더 없음"으로 끊으면 뒤쪽 상의가 영영 안 보인다
    expect(screen.getByTestId('inventory-grid-stub')).toHaveAttribute('data-has-more', 'true');
  });
});
