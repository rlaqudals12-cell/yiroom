/**
 * EveningFocusPanel — 저녁 포커스 + 주간 사이클 (ADR-117 루틴 v2)
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EveningFocusPanel } from '@/components/skincare/EveningFocusPanel';
import type {
  EveningCycle,
  WeeklyCycle,
  EveningFocus,
} from '@/components/skincare/routine-v2-contract';

function week(focus: EveningFocus | EveningFocus[]): WeeklyCycle {
  return {
    days: Array.from({ length: 7 }, (_, dow) => ({
      dow,
      focus: Array.isArray(focus) ? focus[dow] : focus,
      label: `${dow}일 포커스`,
    })),
  };
}

const EMPTY_CYCLE: EveningCycle = { focus: 'recovery', label: '', reason: '' };

describe('EveningFocusPanel', () => {
  it('표시할 내용이 없으면 렌더하지 않는다 (엔진 미배포)', () => {
    const { container } = render(
      <EveningFocusPanel
        eveningCycle={EMPTY_CYCLE}
        weeklyCycle={{ days: [] }}
        hasOwnedActives={false}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('오늘 저녁 포커스 배지(label + reason)를 렌더한다', () => {
    render(
      <EveningFocusPanel
        eveningCycle={{ focus: 'recovery', label: '회복의 날', reason: '어제 각질 관리를 했어요' }}
        weeklyCycle={{ days: [] }}
        hasOwnedActives
      />
    );
    expect(screen.getByTestId('evening-focus-badge')).toBeInTheDocument();
    expect(screen.getByText('🌙 오늘 저녁: 회복의 날')).toBeInTheDocument();
    expect(screen.getByText('어제 각질 관리를 했어요')).toBeInTheDocument();
  });

  it('주간 7칸 미리보기를 렌더하고 오늘을 강조한다', () => {
    const today = new Date().getDay();
    render(
      <EveningFocusPanel
        eveningCycle={{ focus: 'active', label: '액티브의 날', reason: '' }}
        weeklyCycle={week([
          'exfoliation',
          'recovery',
          'active',
          'retinoid',
          'recovery',
          'active',
          'recovery',
        ])}
        hasOwnedActives
      />
    );
    expect(screen.getByTestId('weekly-cycle-preview')).toBeInTheDocument();
    const days = screen.getAllByTestId('weekly-cycle-day');
    expect(days).toHaveLength(7);
    const highlighted = days.filter((d) => d.getAttribute('data-today') === 'true');
    expect(highlighted).toHaveLength(1);
    expect(days[today].getAttribute('data-today')).toBe('true');
  });

  it('활성 미보유로 전부 recovery면 미리보기 대신 1줄 안내', () => {
    render(
      <EveningFocusPanel
        eveningCycle={{ focus: 'recovery', label: '회복의 날', reason: '' }}
        weeklyCycle={week('recovery')}
        hasOwnedActives={false}
      />
    );
    expect(screen.getByTestId('weekly-cycle-fallback')).toHaveTextContent(
      '활성 제품이 화장대에 없어 기본 루틴이에요'
    );
    expect(screen.queryByTestId('weekly-cycle-preview')).not.toBeInTheDocument();
  });
});
