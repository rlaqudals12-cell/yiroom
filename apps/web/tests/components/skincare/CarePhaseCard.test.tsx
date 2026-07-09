/**
 * CarePhaseCard — 단계 계획 카드 (ADR-117 루틴 v2)
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CarePhaseCard } from '@/components/skincare/CarePhaseCard';

describe('CarePhaseCard', () => {
  it('message가 비면 렌더하지 않는다 (엔진 미배포)', () => {
    const { container } = render(
      <CarePhaseCard phase={{ phase: 'goal', label: '', message: '' }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('barrier 단계를 렌더한다 (data-phase=barrier + 엔진 문구)', () => {
    render(
      <CarePhaseCard
        phase={{
          phase: 'barrier',
          label: '장벽 회복이 먼저예요',
          message: '지금은 장벽 회복이 먼저예요. 자극을 줄이고 보습에 집중하세요.',
        }}
      />
    );
    const card = screen.getByTestId('care-phase-card');
    expect(card).toHaveAttribute('data-phase', 'barrier');
    expect(screen.getByText('장벽 회복이 먼저예요')).toBeInTheDocument();
    expect(
      screen.getByText('지금은 장벽 회복이 먼저예요. 자극을 줄이고 보습에 집중하세요.')
    ).toBeInTheDocument();
  });

  it('goal 단계를 렌더한다 (data-phase=goal)', () => {
    render(
      <CarePhaseCard
        phase={{
          phase: 'goal',
          label: '목표 집중 단계',
          message: '목표에 맞춘 활성 성분을 더해요.',
        }}
      />
    );
    expect(screen.getByTestId('care-phase-card')).toHaveAttribute('data-phase', 'goal');
    expect(screen.getByText('목표 집중 단계')).toBeInTheDocument();
  });
});
