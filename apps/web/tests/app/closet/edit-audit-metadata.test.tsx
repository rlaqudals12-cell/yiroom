/** 옷 수정 화면에서 옷장 감사용 구매 기록을 읽고 다시 저장하는 회귀 테스트. */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { InventoryItemDB } from '@/types/inventory';

const pushMock = vi.fn();
const updateMock = vi.fn();
const updateEqMock = vi.fn();
const selectSingleMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn() }),
  useParams: () => ({ id: 'closet-1' }),
}));

vi.mock('@/lib/inventory/image-url', () => ({
  signInventoryImagePaths: vi.fn().mockResolvedValue(new Map()),
  resolveInventoryImageUrl: () => '/closet-test.jpg',
}));

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      single: selectSingleMock,
      update: updateMock,
      delete: vi.fn(),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    query.delete.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    updateMock.mockReturnValue({ eq: updateEqMock });
    return { from: vi.fn(() => query) };
  },
}));

import EditClothingPage from '@/app/(main)/closet/[id]/edit/page';

function makeItem(metadata: InventoryItemDB['metadata']): InventoryItemDB {
  return {
    id: 'closet-1',
    clerk_user_id: 'user-1',
    category: 'closet',
    sub_category: 'top',
    name: '화이트 셔츠',
    image_url: '',
    original_image_url: null,
    brand: null,
    tags: [],
    is_favorite: false,
    use_count: 4,
    last_used_at: null,
    expiry_date: null,
    metadata,
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-01T00:00:00Z',
  };
}

describe('옷 수정 — 옷장 감사 기록', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateEqMock.mockResolvedValue({ error: null });
  });

  it('기존 가격·구매일을 불러오고 수정값을 metadata에 저장한다', async () => {
    selectSingleMock.mockResolvedValue({
      data: makeItem({
        color: [],
        season: [],
        occasion: [],
        price: 50_000,
        purchaseDate: '2026-01-15',
      }),
      error: null,
    });
    render(<EditClothingPage />);

    const priceInput = await screen.findByLabelText('구매 가격 (선택)');
    const dateInput = screen.getByLabelText('구매일 (선택)');
    expect(priceInput).toHaveValue(50_000);
    expect(dateInput).toHaveValue('2026-01-15');

    fireEvent.change(priceInput, { target: { value: '75000' } });
    fireEvent.change(dateInput, { target: { value: '2026-08-20' } });
    fireEvent.click(screen.getByRole('button', { name: /저장하기/ }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/closet'));
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ price: 75_000, purchaseDate: '2026-08-20' }),
      })
    );
  });

  it('잘못된 기존 구매 기록은 입력이나 저장값으로 살리지 않는다', async () => {
    selectSingleMock.mockResolvedValue({
      data: makeItem({
        color: [],
        season: [],
        occasion: [],
        price: -1,
        purchaseDate: '2026-02-31',
      }),
      error: null,
    });
    render(<EditClothingPage />);

    expect(await screen.findByLabelText('구매 가격 (선택)')).toHaveValue(null);
    expect(screen.getByLabelText('구매일 (선택)')).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: /저장하기/ }));

    await waitFor(() => expect(updateMock).toHaveBeenCalled());
    const payload = updateMock.mock.calls[0]?.[0] as {
      metadata: { price?: number; purchaseDate?: string };
    };
    expect(payload.metadata).not.toHaveProperty('price');
    expect(payload.metadata).not.toHaveProperty('purchaseDate');
  });
});
