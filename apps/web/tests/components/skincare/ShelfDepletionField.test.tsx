/**
 * ShelfDepletionField — 개봉일 입력 + 소진 예상 (ADR-117 루틴 v2)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { ShelfItem } from '@/lib/scan/product-shelf';

// 엔진(estimateShelfDepletion)만 모킹 — 실제 배럴 실행 회피
const { estimateMock } = vi.hoisted(() => ({ estimateMock: vi.fn() }));
vi.mock('@/components/skincare/routine-v2-contract', () => ({
  estimateShelfDepletion: (item: unknown) => estimateMock(item),
}));

import { ShelfDepletionField } from '@/components/skincare/ShelfDepletionField';

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

function makeItem(overrides: Partial<ShelfItem> = {}): ShelfItem {
  return {
    id: 'shelf-1',
    clerkUserId: 'u1',
    productName: '수분 토너',
    productIngredients: [],
    scannedAt: new Date('2026-06-01'),
    scanMethod: 'manual',
    status: 'owned',
    createdAt: new Date('2026-06-01'),
    updatedAt: new Date('2026-06-01'),
    ...overrides,
  };
}

describe('ShelfDepletionField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  it('개봉일 미입력이면 소진 예상을 표시하지 않는다', () => {
    render(<ShelfDepletionField item={makeItem()} />);
    expect(screen.getByTestId('opened-at-input')).toHaveValue('');
    expect(screen.queryByTestId('depletion-estimate')).not.toBeInTheDocument();
  });

  it('개봉일 입력 시 PUT 저장하고 소진 예상을 표시한다', async () => {
    estimateMock.mockReturnValue({ daysRemaining: 20, confidence: 'medium' });
    render(<ShelfDepletionField item={makeItem()} />);

    fireEvent.change(screen.getByTestId('opened-at-input'), { target: { value: '2026-06-15' } });

    expect(screen.getByTestId('depletion-estimate')).toHaveTextContent('약 20일 후 소진 예상');
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/scan/shelf/shelf-1',
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  it('estimate가 null이면 소진 예상을 표시하지 않는다', () => {
    estimateMock.mockReturnValue(null);
    render(<ShelfDepletionField item={makeItem({ openedAt: new Date('2026-06-01') })} />);
    expect(screen.queryByTestId('depletion-estimate')).not.toBeInTheDocument();
  });

  it('소진 30일 이내면 재구매 준비 칩을 표시한다', () => {
    estimateMock.mockReturnValue({ daysRemaining: 10, confidence: 'high' });
    render(<ShelfDepletionField item={makeItem({ openedAt: new Date('2026-06-01') })} />);
    expect(screen.getByTestId('depletion-repurchase')).toBeInTheDocument();
  });

  it('소진 30일 초과면 재구매 준비 칩을 표시하지 않는다', () => {
    estimateMock.mockReturnValue({ daysRemaining: 45, confidence: 'low' });
    render(<ShelfDepletionField item={makeItem({ openedAt: new Date('2026-06-01') })} />);
    expect(screen.queryByTestId('depletion-repurchase')).not.toBeInTheDocument();
  });
});
