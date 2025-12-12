import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WorkoutInsightCard from '@/components/workout/result/WorkoutInsightCard';
import { GeminiWorkoutInsightResult } from '@/lib/gemini';

// 테스트용 기본 인사이트 데이터
const mockInsights: GeminiWorkoutInsightResult = {
  insights: [
    {
      type: 'balance',
      message: '하체 운동이 부족해요! 균형 잡힌 운동을 위해 추가해보세요',
      priority: 'high',
      data: {
        percentage: 20,
        targetArea: '하체',
      },
    },
    {
      type: 'progress',
      message: '지난주보다 볼륨 +15%! 성장하고 있어요',
      priority: 'medium',
      data: {
        percentage: 15,
        trend: 'up',
      },
    },
    {
      type: 'streak',
      message: '7일 연속 운동 성공! 대단해요!',
      priority: 'high',
      data: {
        percentage: 7,
      },
    },
  ],
  weeklyHighlight: '이번 주 5회 이상 운동 달성! 최고의 한 주였어요!',
  motivationalMessage: '오늘의 노력이 내일의 나를 만들어요. 힘내세요!',
};

describe('WorkoutInsightCard', () => {
  it('renders without crashing', () => {
    render(<WorkoutInsightCard insights={mockInsights} />);
    expect(screen.getByTestId('workout-insight-card')).toBeInTheDocument();
  });

  it('displays the header with AI 인사이트', () => {
    render(<WorkoutInsightCard insights={mockInsights} />);
    expect(screen.getByText('AI 인사이트')).toBeInTheDocument();
  });

  it('displays weekly highlight', () => {
    render(<WorkoutInsightCard insights={mockInsights} />);
    expect(screen.getByText('이번 주 하이라이트')).toBeInTheDocument();
    expect(screen.getByText(mockInsights.weeklyHighlight)).toBeInTheDocument();
  });

  it('displays motivational message', () => {
    render(<WorkoutInsightCard insights={mockInsights} />);
    expect(screen.getByText(mockInsights.motivationalMessage)).toBeInTheDocument();
  });

  it('displays all insight items', () => {
    render(<WorkoutInsightCard insights={mockInsights} />);

    // balance 인사이트
    expect(screen.getByTestId('insight-item-balance')).toBeInTheDocument();
    expect(screen.getByText(/하체 운동이 부족해요/)).toBeInTheDocument();

    // progress 인사이트
    expect(screen.getByTestId('insight-item-progress')).toBeInTheDocument();
    expect(screen.getByText(/지난주보다 볼륨/)).toBeInTheDocument();

    // streak 인사이트
    expect(screen.getByTestId('insight-item-streak')).toBeInTheDocument();
    expect(screen.getByText(/7일 연속 운동 성공/)).toBeInTheDocument();
  });

  it('shows high priority label for high priority insights', () => {
    render(<WorkoutInsightCard insights={mockInsights} />);
    // 'high' 우선순위인 인사이트에 '중요' 라벨이 표시되어야 함
    const importantLabels = screen.getAllByText('중요');
    expect(importantLabels.length).toBeGreaterThan(0);
  });

  it('displays trend indicator for progress insight', () => {
    render(<WorkoutInsightCard insights={mockInsights} />);
    // progress 인사이트 컨테이너 내에 트렌드 정보 확인
    const progressInsight = screen.getByTestId('insight-item-progress');
    // 상승 트렌드 표시가 있는지 확인 (text-green-600 클래스)
    const trendSpan = progressInsight.querySelector('.text-green-600');
    expect(trendSpan).toBeInTheDocument();
    // 화살표와 퍼센트 값이 포함되어 있는지 확인
    expect(trendSpan?.textContent).toContain('↑');
    expect(trendSpan?.textContent).toContain('15%');
  });

  it('displays target area for balance insight', () => {
    render(<WorkoutInsightCard insights={mockInsights} />);
    expect(screen.getByText(/집중 부위: 하체/)).toBeInTheDocument();
  });

  it('renders empty state when no insights', () => {
    const emptyInsights: GeminiWorkoutInsightResult = {
      insights: [],
      weeklyHighlight: '',
      motivationalMessage: '',
    };

    render(<WorkoutInsightCard insights={emptyInsights} />);
    expect(screen.getByText('아직 인사이트가 없습니다')).toBeInTheDocument();
  });

  it('handles partial data gracefully', () => {
    const partialInsights: GeminiWorkoutInsightResult = {
      insights: [
        {
          type: 'tip',
          message: '운동 전 충분한 워밍업을 해주세요!',
          priority: 'low',
        },
      ],
      weeklyHighlight: '',
      motivationalMessage: '힘내세요!',
    };

    render(<WorkoutInsightCard insights={partialInsights} />);
    expect(screen.getByText(/워밍업/)).toBeInTheDocument();
    expect(screen.getByText('힘내세요!')).toBeInTheDocument();
    expect(screen.queryByText('이번 주 하이라이트')).not.toBeInTheDocument();
  });

  it('displays comparison insight correctly', () => {
    const comparisonInsights: GeminiWorkoutInsightResult = {
      insights: [
        {
          type: 'comparison',
          message: '20대 여성 중 상위 15%!',
          priority: 'medium',
          data: {
            percentage: 15,
          },
        },
      ],
      weeklyHighlight: '',
      motivationalMessage: '',
    };

    render(<WorkoutInsightCard insights={comparisonInsights} />);
    expect(screen.getByTestId('insight-item-comparison')).toBeInTheDocument();
    expect(screen.getByText(/상위 15%/)).toBeInTheDocument();
  });
});
