import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ClosetInsightCard } from '@/components/inventory/recommendation/ClosetInsightCard';
import type { InventoryItem } from '@/types/inventory';

const NOW = new Date('2026-09-02T00:00:00Z');

function createMockItem(id: string, overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id,
    clerkUserId: 'user-1',
    category: 'closet',
    subCategory: 'top',
    name: `테스트 옷 ${id}`,
    imageUrl: '',
    originalImageUrl: null,
    brand: null,
    tags: [],
    isFavorite: false,
    useCount: 0,
    lastUsedAt: null,
    expiryDate: null,
    metadata: { color: [], season: [], occasion: [] },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('ClosetInsightCard 옷장 감사', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('옷이 없으면 계산값을 만들지 않고 빈 기록을 알린다', () => {
    render(<ClosetInsightCard items={[]} />);

    expect(screen.getByTestId('closet-insight-card')).toBeInTheDocument();
    expect(screen.getByText('옷장 감사')).toBeInTheDocument();
    expect(screen.getByTestId('closet-audit-empty')).toHaveTextContent(
      '등록된 옷이 없어 아직 감사할 기록이 없어요'
    );
  });

  it('가격·구매일이 없으면 임의 값을 보충하지 않고 필요한 기록을 안내한다', () => {
    render(<ClosetInsightCard items={[createMockItem('missing')]} />);

    expect(screen.getByTestId('closet-audit-empty')).toHaveTextContent(
      '감사에 필요한 기록이 아직 없어요'
    );
    expect(screen.queryByText('0원')).not.toBeInTheDocument();
  });

  it('기존 CPW 엔진 결과를 실제 화면에 표시한다', () => {
    const item = createMockItem('worn', {
      name: '네이비 재킷',
      useCount: 10,
      lastUsedAt: '2026-08-30T00:00:00Z',
      metadata: {
        color: ['네이비'],
        season: ['autumn'],
        occasion: ['work'],
        price: 100_000,
        purchaseDate: '2026-01-01',
      },
    });

    render(<ClosetInsightCard items={[item]} />);

    expect(screen.getByTestId('closet-audit-results')).toBeInTheDocument();
    expect(screen.getByText('100,000원')).toBeInTheDocument();
    expect(screen.getByText('10,000원')).toBeInTheDocument();
    expect(screen.getAllByText(/10,000원/)).toHaveLength(2);
    expect(screen.getByText(/기록이 갖춰진 1벌 기준/)).toBeInTheDocument();
  });

  it('90일 넘게 입지 않은 저활용 옷을 처분 확정이 아닌 다시 볼 후보로 표시한다', () => {
    const item = createMockItem('unworn', {
      name: '베이지 블라우스',
      useCount: 0,
      metadata: {
        color: ['베이지'],
        season: ['spring'],
        occasion: ['wedding_guest'],
        price: 80_000,
        purchaseDate: '2026-01-01',
      },
    });

    render(<ClosetInsightCard items={[item]} />);

    expect(screen.getByTestId('declutter-suggestions')).toHaveTextContent('베이지 블라우스');
    expect(screen.getByTestId('declutter-suggestions')).toHaveTextContent('한 번도 입지 않았어요');
    expect(screen.getByTestId('declutter-suggestions')).toHaveTextContent('판매를 고려해보세요');
    expect(screen.getByText(/처분을 결정하지 않아요/)).toBeInTheDocument();
  });

  it('불완전한 옷은 감사 분모에서 제외하고 갖춰진 기록만 센다', () => {
    const complete = createMockItem('complete', {
      metadata: {
        color: [],
        season: [],
        occasion: [],
        price: 30_000,
        purchaseDate: '2026-08-01',
      },
    });

    render(<ClosetInsightCard items={[complete, createMockItem('missing')]} />);

    expect(screen.getByText(/기록이 갖춰진 1벌 기준/)).toBeInTheDocument();
  });

  it('className을 보존한다', () => {
    render(<ClosetInsightCard items={[]} className="custom-class" />);
    expect(screen.getByTestId('closet-insight-card')).toHaveClass('custom-class');
  });
});
