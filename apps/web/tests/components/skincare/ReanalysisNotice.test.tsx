/**
 * ReanalysisNotice — 재분석 주기 안내 (G4)
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReanalysisNotice, REANALYSIS_STALE_DAYS } from '@/components/skincare/ReanalysisNotice';

const NOW = new Date('2026-07-11T09:00:00');

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 86_400_000);
}

describe('ReanalysisNotice', () => {
  it('임계(7일) 이하면 렌더하지 않는다', () => {
    const { container } = render(
      <ReanalysisNotice
        analyzedAt={daysAgo(REANALYSIS_STALE_DAYS)}
        onReanalyze={vi.fn()}
        now={NOW}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('임계 초과면 실경과일을 안내한다', () => {
    render(<ReanalysisNotice analyzedAt={daysAgo(10)} onReanalyze={vi.fn()} now={NOW} />);
    expect(screen.getByTestId('reanalysis-notice')).toHaveTextContent(
      '피부 상태는 10일 전 분석 기준이에요'
    );
  });

  it('다시 분석 클릭 시 콜백 호출', () => {
    const onReanalyze = vi.fn();
    render(<ReanalysisNotice analyzedAt={daysAgo(14)} onReanalyze={onReanalyze} now={NOW} />);
    fireEvent.click(screen.getByTestId('reanalysis-cta'));
    expect(onReanalyze).toHaveBeenCalledOnce();
  });
});
