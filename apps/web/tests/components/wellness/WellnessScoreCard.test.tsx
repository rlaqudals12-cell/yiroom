import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WellnessScoreCard } from '@/components/wellness/WellnessScoreCard';
import type { WellnessScore } from '@/types/wellness';

const mockScore: WellnessScore = {
  id: 'test-id',
  clerkUserId: 'user-123',
  date: '2024-01-15',
  totalScore: 75,
  workoutScore: 20,
  nutritionScore: 18,
  skinScore: 22,
  bodyScore: 15,
  scoreBreakdown: {
    workout: { streak: 8, frequency: 8, goal: 4 },
    nutrition: { calorie: 8, balance: 6, water: 4 },
    skin: { analysis: 10, routine: 8, matching: 4 },
    body: { analysis: 8, progress: 4, workout: 3 },
  },
  insights: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('WellnessScoreCard', () => {
  it('로딩 상태 표시', () => {
    render(<WellnessScoreCard score={null} isLoading />);
    expect(screen.getByTestId('wellness-score-card-loading')).toBeInTheDocument();
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('빈 상태 표시', () => {
    render(<WellnessScoreCard score={null} />);
    expect(screen.getByTestId('wellness-score-card-empty')).toBeInTheDocument();
    expect(screen.getByText(/오늘의 웰니스 스코어가 아직 없습니다/)).toBeInTheDocument();
  });

  it('점수 표시', () => {
    render(<WellnessScoreCard score={mockScore} />);
    expect(screen.getByTestId('wellness-score-card')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('등급 표시', () => {
    render(<WellnessScoreCard score={mockScore} />);
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('날짜 표시', () => {
    render(<WellnessScoreCard score={mockScore} />);
    expect(screen.getByText('2024-01-15')).toBeInTheDocument();
  });

  it('영역별 점수 표시', () => {
    render(<WellnessScoreCard score={mockScore} showBreakdown />);
    expect(screen.getByText('운동')).toBeInTheDocument();
    expect(screen.getByText('영양')).toBeInTheDocument();
    expect(screen.getByText('피부')).toBeInTheDocument();
    expect(screen.getByText('체형')).toBeInTheDocument();
    expect(screen.getByText('20 / 25')).toBeInTheDocument();
    expect(screen.getByText('18 / 25')).toBeInTheDocument();
    expect(screen.getByText('22 / 25')).toBeInTheDocument();
    expect(screen.getByText('15 / 25')).toBeInTheDocument();
  });

  it('showBreakdown false면 영역별 점수 숨김', () => {
    render(<WellnessScoreCard score={mockScore} showBreakdown={false} />);
    expect(screen.queryByText('운동')).not.toBeInTheDocument();
  });

  it('S 등급 표시 (90점 이상)', () => {
    const highScore: WellnessScore = { ...mockScore, totalScore: 95 };
    render(<WellnessScoreCard score={highScore} />);
    expect(screen.getByText('S')).toBeInTheDocument();
  });

  it('A 등급 표시 (80점 이상)', () => {
    const goodScore: WellnessScore = { ...mockScore, totalScore: 85 };
    render(<WellnessScoreCard score={goodScore} />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('F 등급 표시 (50점 미만)', () => {
    const lowScore: WellnessScore = { ...mockScore, totalScore: 30 };
    render(<WellnessScoreCard score={lowScore} />);
    expect(screen.getByText('F')).toBeInTheDocument();
  });
});
