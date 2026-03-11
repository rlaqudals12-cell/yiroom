/**
 * DeteriorationAlertCard 컴포넌트 테스트
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import DeteriorationAlertCard from '@/components/skin/diary/DeteriorationAlertCard';
import type { DeteriorationAlert } from '@/lib/analysis/skin-v2/skin-diary-zone';

function makeAlert(overrides: Partial<DeteriorationAlert> = {}): DeteriorationAlert {
  return {
    zoneId: 'cheek_left',
    label: '왼쪽 볼',
    currentScore: 35,
    previousAverage: 65,
    drop: 30,
    severity: 'severe',
    suggestion: '보습 강화가 필요해요.',
    ...overrides,
  };
}

describe('DeteriorationAlertCard', () => {
  it('알림이 없으면 렌더링하지 않는다', () => {
    const { container } = render(<DeteriorationAlertCard alerts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('알림이 있으면 렌더링된다', () => {
    render(<DeteriorationAlertCard alerts={[makeAlert()]} />);
    expect(screen.getByTestId('deterioration-alert-card')).toBeInTheDocument();
    expect(screen.getByText('피부 변화 알림')).toBeInTheDocument();
  });

  it('알림 건수를 표시한다', () => {
    const alerts = [
      makeAlert({ zoneId: 'cheek_left' }),
      makeAlert({ zoneId: 'nose_tip', label: '코끝', severity: 'moderate' }),
    ];
    render(<DeteriorationAlertCard alerts={alerts} />);
    expect(screen.getByText('2건')).toBeInTheDocument();
  });

  it('존 이름과 권장 조치를 표시한다', () => {
    render(<DeteriorationAlertCard alerts={[makeAlert()]} />);
    expect(screen.getByText('왼쪽 볼')).toBeInTheDocument();
    expect(screen.getByText('보습 강화가 필요해요.')).toBeInTheDocument();
  });

  it('심각도별 뱃지를 표시한다', () => {
    const alerts = [
      makeAlert({ zoneId: 'cheek_left', severity: 'severe' }),
      makeAlert({ zoneId: 'nose_tip', label: '코끝', severity: 'moderate' }),
      makeAlert({ zoneId: 'chin_center', label: '턱 중앙', severity: 'mild' }),
    ];
    render(<DeteriorationAlertCard alerts={alerts} />);
    expect(screen.getByText('심각')).toBeInTheDocument();
    expect(screen.getByText('주의')).toBeInTheDocument();
    expect(screen.getByText('참고')).toBeInTheDocument();
  });

  it('심각 → 주의 → 참고 순으로 정렬한다', () => {
    const alerts = [
      makeAlert({ zoneId: 'chin_center', label: '턱', severity: 'mild' }),
      makeAlert({ zoneId: 'cheek_left', label: '볼', severity: 'severe' }),
    ];
    render(<DeteriorationAlertCard alerts={alerts} />);

    const alertElements = screen.getAllByTestId(/^alert-/);
    expect(alertElements[0]).toHaveAttribute('data-testid', 'alert-cheek_left');
    expect(alertElements[1]).toHaveAttribute('data-testid', 'alert-chin_center');
  });

  it('점수 하락 정보를 표시한다', () => {
    render(<DeteriorationAlertCard alerts={[makeAlert({ drop: 25 })]} />);
    expect(screen.getByText(/평균 대비 -25점 하락/)).toBeInTheDocument();
  });
});
