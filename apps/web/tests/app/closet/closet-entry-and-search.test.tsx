/**
 * 내 옷장 — 등록 진입 경로 통일 + 검색어 이스케이프 회귀 테스트
 *
 * 배경(수리 전):
 *  - 검색어를 `name.ilike.%${q}%,brand.ilike.%${q}%`에 그대로 끼워 넣어,
 *    쉼표·괄호가 든 검색어는 조건이 쪼개지거나 쿼리가 실패했다.
 *  - 등록 진입점이 화면마다 갈렸다(헤더=단건, 추천 화면=일괄). 기본은 일괄로 통일하고
 *    한 벌씩 경로는 일괄 화면에서 이어간다.
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { InventoryItem, InventoryItemDB } from '@/types/inventory';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn() }),
}));

// 그리드·상세 시트는 관심사가 아니므로 경량 대체 (등록 CTA만 그대로 노출)
vi.mock('@/components/inventory', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/inventory')>();
  return {
    ...actual,
    InventoryGrid: ({
      items,
      emptyAction,
    }: {
      items: InventoryItem[];
      emptyAction?: { label: string; onClick: () => void };
    }) =>
      React.createElement(
        'div',
        { 'data-testid': 'inventory-grid-stub' },
        items.map((item) =>
          React.createElement('div', { key: item.id, 'data-testid': 'closet-item' }, item.name)
        ),
        emptyAction
          ? React.createElement(
              'button',
              { 'data-testid': 'empty-action', onClick: emptyAction.onClick },
              emptyAction.label
            )
          : null
      ),
    ItemDetailSheet: () => null,
  };
});

let queryResult: { data: unknown; error: unknown } = { data: [], error: null };
const orCalls = vi.fn();

function makeQuery(): Record<string, unknown> {
  const query: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'order', 'or', 'range', 'limit'] as const) {
    query[method] = vi.fn((...args: unknown[]) => {
      if (method === 'or') orCalls(...args);
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
    metadata: { color: [], season: [], occasion: [] },
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
    ...overrides,
  };
}

describe('옷장 검색어 이스케이프', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResult = { data: [makeRow()], error: null };
  });

  it('쉼표가 든 검색어도 조건을 쪼개지 않는다 (값을 따옴표로 가둠)', async () => {
    render(<ClosetPage />);
    await waitFor(() => expect(screen.getByTestId('inventory-grid-stub')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('옷 검색...'), {
      target: { value: '셔츠, 여름' },
    });

    await waitFor(() => {
      expect(orCalls).toHaveBeenCalledWith('name.ilike."%셔츠, 여름%",brand.ilike."%셔츠, 여름%"');
    });
    // 재발 방지: 따옴표 없는 원시 삽입으로 되돌아가면 안 된다
    expect(orCalls).not.toHaveBeenCalledWith('name.ilike.%셔츠, 여름%,brand.ilike.%셔츠, 여름%');
  });

  it('검색어가 없으면 or 필터를 걸지 않는다', async () => {
    render(<ClosetPage />);

    await waitFor(() => expect(screen.getByTestId('inventory-grid-stub')).toBeInTheDocument());
    expect(orCalls).not.toHaveBeenCalled();
  });
});

describe('등록 진입 경로', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryResult = { data: [makeRow()], error: null };
  });

  it('헤더 추가 버튼은 일괄 등록으로 간다', async () => {
    render(<ClosetPage />);
    await waitFor(() => expect(screen.getByTestId('inventory-grid-stub')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /추가/ }));

    expect(pushMock).toHaveBeenCalledWith('/closet/add/batch');
  });

  it('빈 옷장 CTA도 일괄 등록으로 간다', async () => {
    render(<ClosetPage />);
    await waitFor(() => expect(screen.getByTestId('empty-action')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('empty-action'));

    expect(pushMock).toHaveBeenCalledWith('/closet/add/batch');
  });
});
