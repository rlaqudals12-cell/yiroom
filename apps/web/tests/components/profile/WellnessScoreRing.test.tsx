/**
 * 웰니스 스코어 링 차트 컴포넌트 테스트
 * K-5 프로필 리디자인 - 미니멀 데이터 시각화
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WellnessScoreRing, WellnessScoreMini } from '@/components/profile/WellnessScoreRing';

describe('WellnessScoreRing', () => {
  it('점수를 표시한다', () => {
    render(<WellnessScoreRing score={75} />);

    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('/ 100')).toBeInTheDocument();
  });

  it('라벨을 표시한다', () => {
    render(<WellnessScoreRing score={85} showLabel />);

    // 85점은 '우수' 등급
    expect(screen.getByText('우수')).toBeInTheDocument();
  });

  it('라벨 없이 렌더링할 수 있다', () => {
    render(<WellnessScoreRing score={75} showLabel={false} />);

    expect(screen.queryByText('양호')).not.toBeInTheDocument();
  });

  it('작은 크기로 렌더링한다', () => {
    render(<WellnessScoreRing score={50} size="sm" />);

    // sm 크기에서는 '/ 100' 표시 안 함
    expect(screen.queryByText('/ 100')).not.toBeInTheDocument();
  });

  it('점수별 등급 라벨이 정확하다', () => {
    const { rerender } = render(<WellnessScoreRing score={95} showLabel />);
    expect(screen.getByText('최상')).toBeInTheDocument();

    rerender(<WellnessScoreRing score={85} showLabel />);
    expect(screen.getByText('우수')).toBeInTheDocument();

    rerender(<WellnessScoreRing score={75} showLabel />);
    expect(screen.getByText('양호')).toBeInTheDocument();

    rerender(<WellnessScoreRing score={65} showLabel />);
    expect(screen.getByText('보통')).toBeInTheDocument();

    rerender(<WellnessScoreRing score={45} showLabel />);
    expect(screen.getByText('주의')).toBeInTheDocument();

    rerender(<WellnessScoreRing score={30} showLabel />);
    expect(screen.getByText('관심 필요')).toBeInTheDocument();
  });

  it('SVG 요소가 렌더링된다', () => {
    render(<WellnessScoreRing score={50} />);

    const container = screen.getByTestId('wellness-score-ring');
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('원형 차트가 두 개의 circle을 포함한다', () => {
    render(<WellnessScoreRing score={50} />);

    const container = screen.getByTestId('wellness-score-ring');
    const circles = container.querySelectorAll('circle');
    // 배경 원 + 점수 원
    expect(circles.length).toBe(2);
  });
});

describe('WellnessScoreMini', () => {
  it('점수를 표시한다', () => {
    render(<WellnessScoreMini score={80} />);

    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('웰니스')).toBeInTheDocument();
  });

  it('등급 라벨을 표시한다', () => {
    render(<WellnessScoreMini score={85} />);

    expect(screen.getByText('우수')).toBeInTheDocument();
  });

  it('낮은 점수의 등급을 올바르게 표시한다', () => {
    render(<WellnessScoreMini score={35} />);

    expect(screen.getByText('관심 필요')).toBeInTheDocument();
  });

  it('data-testid가 있다', () => {
    render(<WellnessScoreMini score={50} />);

    expect(screen.getByTestId('wellness-score-mini')).toBeInTheDocument();
  });
});
