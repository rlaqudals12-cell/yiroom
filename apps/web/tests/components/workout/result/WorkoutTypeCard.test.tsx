import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// WORKOUT_TYPE_INFO mock
vi.mock('@/lib/workout/classifyWorkoutType', () => ({
  WORKOUT_TYPE_INFO: {
    toner: {
      label: '토너',
      icon: '...',
      description: '근육 탄력과 라인 만들기에 집중',
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
    },
    builder: {
      label: '빌더',
      icon: '...',
      description: '근육량 증가와 근력 강화에 집중',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
    },
    burner: {
      label: '버너',
      icon: '...',
      description: '체지방 연소와 체중 감량에 집중',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
    },
    mover: {
      label: '무버',
      icon: '...',
      description: '체력 향상과 심폐 기능 강화에 집중',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
    },
    flexer: {
      label: '플렉서',
      icon: '...',
      description: '유연성과 균형감각 향상에 집중',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
    },
  },
}));

import { vi } from 'vitest';
import WorkoutTypeCard from '@/components/workout/result/WorkoutTypeCard';
import type { WorkoutType } from '@/types/workout';

describe('WorkoutTypeCard', () => {
  it('data-testid가 존재한다', () => {
    render(<WorkoutTypeCard type="toner" reason="균형 잡힌 체형에 적합" />);
    expect(screen.getByTestId('workout-type-card')).toBeInTheDocument();
  });

  it('당신의 운동 타입 라벨이 표시된다', () => {
    render(<WorkoutTypeCard type="toner" reason="테스트 이유" />);
    expect(screen.getByText('당신의 운동 타입')).toBeInTheDocument();
  });

  it('운동 타입 라벨이 표시된다', () => {
    render(<WorkoutTypeCard type="toner" reason="테스트 이유" />);
    expect(screen.getByText('토너')).toBeInTheDocument();
  });

  it('운동 타입 설명이 표시된다', () => {
    render(<WorkoutTypeCard type="toner" reason="테스트 이유" />);
    expect(screen.getByText('근육 탄력과 라인 만들기에 집중')).toBeInTheDocument();
  });

  it('분류 이유가 표시된다', () => {
    render(<WorkoutTypeCard type="builder" reason="근력 증가를 위한 최적의 타입" />);
    expect(screen.getByText('근력 증가를 위한 최적의 타입')).toBeInTheDocument();
  });

  it.each([
    ['toner', '토너'],
    ['builder', '빌더'],
    ['burner', '버너'],
    ['mover', '무버'],
    ['flexer', '플렉서'],
  ] as const)('%s 타입에서 %s 라벨이 표시된다', (type, label) => {
    render(<WorkoutTypeCard type={type as WorkoutType} reason="테스트" />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
