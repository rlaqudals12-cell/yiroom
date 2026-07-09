/**
 * ShelfRedundancyNotice — 화장대 중복 안내 (ADR-117 루틴 v2)
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShelfRedundancyNotice } from '@/components/skincare/ShelfRedundancyNotice';

describe('ShelfRedundancyNotice', () => {
  it('항목이 없으면 렌더하지 않는다', () => {
    const { container } = render(<ShelfRedundancyNotice items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('중복 항목의 엔진 메시지를 렌더한다', () => {
    render(
      <ShelfRedundancyNotice
        items={[
          {
            category: 'toner',
            count: 3,
            message: '토너를 3개 보유 중이에요. 하나씩 소진해보세요.',
          },
          { category: 'serum', count: 2, message: '세럼이 2개 있어요.' },
        ]}
      />
    );
    expect(screen.getByTestId('shelf-redundancy')).toBeInTheDocument();
    expect(screen.getAllByTestId('shelf-redundancy-item')).toHaveLength(2);
    expect(screen.getByText('토너를 3개 보유 중이에요. 하나씩 소진해보세요.')).toBeInTheDocument();
  });
});
