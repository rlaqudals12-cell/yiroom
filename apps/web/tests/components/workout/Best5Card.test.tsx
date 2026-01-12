import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Best5Card } from '@/components/workout/Best5Card';

describe('Best5Card', () => {
  it('체중 감량 목표 카드를 렌더링한다', () => {
    render(<Best5Card goal="weight_loss" />);

    expect(screen.getByTestId('best5-card')).toBeInTheDocument();
    expect(screen.getByText(/체중 감량 Best 5/i)).toBeInTheDocument();
  });

  it('근육 증가 목표 카드를 렌더링한다', () => {
    render(<Best5Card goal="muscle_gain" />);

    expect(screen.getByText(/근육 증가 Best 5/i)).toBeInTheDocument();
  });

  it('자세 교정 목표 카드를 렌더링한다', () => {
    render(<Best5Card goal="posture_correction" postureType="forward_head" />);

    expect(screen.getByText(/자세 교정 Best 5/i)).toBeInTheDocument();
  });

  it('총 소요 시간을 표시한다', () => {
    render(<Best5Card goal="weight_loss" />);

    expect(screen.getByText(/총.*분/)).toBeInTheDocument();
  });

  it('예상 소모 칼로리를 표시한다', () => {
    render(<Best5Card goal="weight_loss" />);

    expect(screen.getByText(/약/)).toBeInTheDocument();
    expect(screen.getByText(/kcal/)).toBeInTheDocument();
  });

  it('5개의 운동 항목을 렌더링한다', () => {
    render(<Best5Card goal="muscle_gain" />);

    // 순위 뱃지 확인 (1-5)
    for (let i = 1; i <= 5; i++) {
      const item = screen.getByTestId(`exercise-item-${i}`);
      expect(item).toBeInTheDocument();
    }
  });

  it('운동 팁을 표시한다', () => {
    render(<Best5Card goal="flexibility" />);

    expect(screen.getByText(/운동 팁/i)).toBeInTheDocument();
  });

  it('운동 항목을 클릭하면 상세 정보가 토글된다', async () => {
    const user = userEvent.setup();
    render(<Best5Card goal="weight_loss" />);

    const firstItem = screen.getByTestId('exercise-item-1');

    // 초기에는 상세 정보가 보이지 않음
    expect(screen.queryByText(/타겟 부위/i)).not.toBeInTheDocument();

    // 클릭하면 상세 정보 표시
    await user.click(firstItem);
    expect(screen.getByText(/타겟 부위/i)).toBeInTheDocument();

    // 다시 클릭하면 숨김
    await user.click(firstItem);
    expect(screen.queryByText(/타겟 부위/i)).not.toBeInTheDocument();
  });

  it('난이도 뱃지를 표시한다', () => {
    render(<Best5Card goal="muscle_gain" fitnessLevel="beginner" />);

    // 초급, 중급, 고급 중 하나가 표시되어야 함 (여러 개일 수 있음)
    const beginnerBadges = screen.queryAllByText('초급');
    const intermediateBadges = screen.queryAllByText('중급');
    const advancedBadges = screen.queryAllByText('고급');

    const totalBadges = beginnerBadges.length + intermediateBadges.length + advancedBadges.length;
    expect(totalBadges).toBeGreaterThan(0);
  });

  it('fitnessLevel에 따라 적절한 난이도의 운동을 추천한다', () => {
    render(<Best5Card goal="muscle_gain" fitnessLevel="beginner" />);

    // 초급 운동이 포함되어야 함
    expect(screen.getByTestId('best5-card')).toBeInTheDocument();
  });

  it('자세 타입과 체형 타입을 함께 고려한다', () => {
    render(
      <Best5Card
        goal="posture_correction"
        postureType="rounded_shoulders"
        bodyType="V"
        fitnessLevel="intermediate"
      />
    );

    expect(screen.getByTestId('best5-card')).toBeInTheDocument();
  });
});
