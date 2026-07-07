/**
 * "직전 분석 대비" 추이 칩 테스트
 * @see components/analysis/ScoreTrendChip.tsx
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreTrendChip } from '@/components/analysis/ScoreTrendChip';

const base = { prevScore: 70, prevDate: '2026-07-01T00:00:00Z' };

describe('ScoreTrendChip', () => {
  it('trend가 null이면(첫 분석) 렌더하지 않는다', () => {
    render(<ScoreTrendChip trend={null} />);
    expect(screen.queryByTestId('score-trend-chip')).not.toBeInTheDocument();
  });

  it('상승 추이를 +N점으로 표시한다', () => {
    render(<ScoreTrendChip trend={{ ...base, delta: 5, trend: 'up' }} />);
    expect(screen.getByTestId('score-trend-chip')).toHaveTextContent('지난 분석 대비 +5점');
  });

  it('하락 추이를 −N점으로 표시한다', () => {
    render(<ScoreTrendChip trend={{ ...base, delta: -3, trend: 'down' }} />);
    expect(screen.getByTestId('score-trend-chip')).toHaveTextContent('지난 분석 대비 -3점');
  });

  it('동일 점수는 "지난 분석과 동일"', () => {
    render(<ScoreTrendChip trend={{ ...base, delta: 0, trend: 'flat' }} />);
    expect(screen.getByTestId('score-trend-chip')).toHaveTextContent('지난 분석과 동일');
  });

  it('직전 분석 날짜·점수를 title로 제공한다 (접근성)', () => {
    render(<ScoreTrendChip trend={{ ...base, delta: 5, trend: 'up' }} />);
    expect(screen.getByTestId('score-trend-chip')).toHaveAttribute(
      'title',
      expect.stringContaining('70점')
    );
  });
});
