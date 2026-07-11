/**
 * TodayFocusBadge — 오늘의 저녁 포커스 상단 배지 (G4 일변화 체감)
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TodayFocusBadge } from '@/components/skincare/TodayFocusBadge';
import type { EveningCycle, CycleChange } from '@/components/skincare/routine-v2-contract';

const RETINOID: EveningCycle = {
  focus: 'retinoid',
  label: '레티노이드의 날',
  reason: '문헌에서 권장하는 주기예요',
};

describe('TodayFocusBadge', () => {
  it('label이 비면 렌더하지 않는다 (엔진 미배포/데이터 없음)', () => {
    const { container } = render(
      <TodayFocusBadge
        eveningCycle={{ focus: 'recovery', label: '', reason: '' }}
        cycleChange={null}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('요일 + 오늘 저녁 포커스를 렌더한다', () => {
    // 2026-07-11 = 토요일
    render(
      <TodayFocusBadge
        eveningCycle={RETINOID}
        cycleChange={null}
        date={new Date('2026-07-11T20:00:00')}
      />
    );
    expect(screen.getByTestId('today-focus-badge')).toBeInTheDocument();
    expect(screen.getByText('토요일')).toBeInTheDocument();
    expect(screen.getByText('🌙 오늘 저녁 포커스: 레티노이드의 날')).toBeInTheDocument();
  });

  it('변화가 있으면 어제 대비 1줄을 렌더한다', () => {
    const change: CycleChange = {
      today: 'retinoid',
      yesterday: 'recovery',
      message: '어제(회복의 날)와 달라졌어요',
    };
    render(
      <TodayFocusBadge
        eveningCycle={RETINOID}
        cycleChange={change}
        date={new Date('2026-07-11T20:00:00')}
      />
    );
    expect(screen.getByTestId('today-focus-change')).toHaveTextContent(
      '어제(회복의 날)와 달라졌어요'
    );
  });

  it('변화가 없으면(null) 어제 대비 줄을 숨긴다', () => {
    render(
      <TodayFocusBadge
        eveningCycle={RETINOID}
        cycleChange={null}
        date={new Date('2026-07-11T20:00:00')}
      />
    );
    expect(screen.queryByTestId('today-focus-change')).not.toBeInTheDocument();
  });
});
