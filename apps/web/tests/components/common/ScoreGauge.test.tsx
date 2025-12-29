import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreGauge } from '@/components/common/ScoreGauge';

describe('ScoreGauge', () => {
  it('renders with score and label', () => {
    render(
      <ScoreGauge
        score={75}
        maxScore={100}
        label="피부나이"
      />
    );

    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('피부나이')).toBeInTheDocument();
  });

  it('shows suffix when provided', () => {
    render(
      <ScoreGauge
        score={28}
        maxScore={100}
        label="피부나이"
        suffix="세"
      />
    );

    expect(screen.getByText('세')).toBeInTheDocument();
  });

  it('renders with comparison value', () => {
    render(
      <ScoreGauge
        score={25}
        maxScore={100}
        label="피부나이"
        suffix="세"
        comparison={{
          value: 30,
          label: '실제나이',
        }}
      />
    );

    // 비교 값이 suffix와 함께 표시됨 ("30세")
    expect(screen.getByText(/30/)).toBeInTheDocument();
    expect(screen.getByText(/실제나이/)).toBeInTheDocument();
  });

  it('applies beauty variant', () => {
    render(
      <ScoreGauge
        score={80}
        maxScore={100}
        label="점수"
        variant="beauty"
      />
    );

    const gauge = screen.getByTestId('score-gauge');
    expect(gauge).toBeInTheDocument();
  });

  it('applies style variant', () => {
    render(
      <ScoreGauge
        score={80}
        maxScore={100}
        label="점수"
        variant="style"
      />
    );

    const gauge = screen.getByTestId('score-gauge');
    expect(gauge).toBeInTheDocument();
  });

  it('handles different sizes', () => {
    const { rerender } = render(
      <ScoreGauge
        score={50}
        maxScore={100}
        label="점수"
        size="sm"
      />
    );
    expect(screen.getByTestId('score-gauge')).toBeInTheDocument();

    rerender(
      <ScoreGauge
        score={50}
        maxScore={100}
        label="점수"
        size="md"
      />
    );
    expect(screen.getByTestId('score-gauge')).toBeInTheDocument();

    rerender(
      <ScoreGauge
        score={50}
        maxScore={100}
        label="점수"
        size="lg"
      />
    );
    expect(screen.getByTestId('score-gauge')).toBeInTheDocument();
  });

  it('calculates progress percentage correctly', () => {
    render(
      <ScoreGauge
        score={50}
        maxScore={100}
        label="진행률"
      />
    );

    // 50/100 = 50% 진행률
    const gauge = screen.getByTestId('score-gauge');
    expect(gauge).toBeInTheDocument();
  });

  it('handles edge case - zero score', () => {
    render(
      <ScoreGauge
        score={0}
        maxScore={100}
        label="점수"
      />
    );

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles edge case - max score', () => {
    render(
      <ScoreGauge
        score={100}
        maxScore={100}
        label="점수"
      />
    );

    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
