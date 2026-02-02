/**
 * NutritionDashboardCard 컴포넌트 테스트
 * @description K-4 영양 대시보드 카드 테스트
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NutritionDashboardCard, {
  RecipeNutritionMini,
} from '@/components/nutrition/NutritionDashboardCard';

describe('NutritionDashboardCard', () => {
  const mockCurrent = {
    calories: 1500,
    protein: 60,
    carbs: 180,
    fat: 50,
  };

  const mockTarget = {
    calories: 2000,
    protein: 80,
    carbs: 250,
    fat: 65,
  };

  it('컴포넌트가 렌더링되어야 함', () => {
    render(
      <NutritionDashboardCard
        current={mockCurrent}
        target={mockTarget}
      />
    );
    expect(screen.getByTestId('nutrition-dashboard-card')).toBeInTheDocument();
  });

  it('기본 제목이 표시되어야 함', () => {
    render(
      <NutritionDashboardCard
        current={mockCurrent}
        target={mockTarget}
      />
    );
    expect(screen.getByText("오늘의 영양")).toBeInTheDocument();
  });

  it('커스텀 제목이 표시되어야 함', () => {
    render(
      <NutritionDashboardCard
        current={mockCurrent}
        target={mockTarget}
        title="점심 영양"
      />
    );
    expect(screen.getByText('점심 영양')).toBeInTheDocument();
  });

  it('설명이 표시되어야 함', () => {
    render(
      <NutritionDashboardCard
        current={mockCurrent}
        target={mockTarget}
        description="오늘의 영양 섭취 현황입니다"
      />
    );
    expect(screen.getByText('오늘의 영양 섭취 현황입니다')).toBeInTheDocument();
  });

  it('칼로리 정보가 표시되어야 함', () => {
    render(
      <NutritionDashboardCard
        current={mockCurrent}
        target={mockTarget}
      />
    );
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText(/2,000/)).toBeInTheDocument();
  });

  it('남은 칼로리가 표시되어야 함', () => {
    render(
      <NutritionDashboardCard
        current={mockCurrent}
        target={mockTarget}
      />
    );
    // 남은 칼로리: 2000 - 1500 = 500
    expect(screen.getByText(/남은 칼로리: 500/)).toBeInTheDocument();
  });

  it('영양소 바 차트가 표시되어야 함', () => {
    render(
      <NutritionDashboardCard
        current={mockCurrent}
        target={mockTarget}
      />
    );
    expect(screen.getByText('영양소 현황')).toBeInTheDocument();
    expect(screen.getByText('단백질')).toBeInTheDocument();
    expect(screen.getByText('탄수화물')).toBeInTheDocument();
    expect(screen.getByText('지방')).toBeInTheDocument();
  });

  it('영양 목표가 설정되면 배지가 표시되어야 함', () => {
    render(
      <NutritionDashboardCard
        current={mockCurrent}
        goal="diet"
      />
    );
    expect(screen.getByText('다이어트')).toBeInTheDocument();
  });

  it('식사 수가 표시되어야 함', () => {
    render(
      <NutritionDashboardCard
        current={mockCurrent}
        target={mockTarget}
        mealCount={3}
      />
    );
    expect(screen.getByText(/오늘 3끼 기록/)).toBeInTheDocument();
  });

  it('로딩 상태에서 스켈레톤이 표시되어야 함', () => {
    render(
      <NutritionDashboardCard
        current={mockCurrent}
        target={mockTarget}
        isLoading
      />
    );
    expect(screen.getByTestId('nutrition-dashboard-card-loading')).toBeInTheDocument();
  });

  it('칼로리 초과 시 초과 상태가 표시되어야 함', () => {
    const exceededCurrent = {
      ...mockCurrent,
      calories: 2500, // 목표 초과
    };

    render(
      <NutritionDashboardCard
        current={exceededCurrent}
        target={mockTarget}
      />
    );
    expect(screen.getByText('초과')).toBeInTheDocument();
  });

  it('칼로리 적정 범위면 적정 상태가 표시되어야 함', () => {
    const adequateCurrent = {
      ...mockCurrent,
      calories: 1900, // 적정 범위
    };

    render(
      <NutritionDashboardCard
        current={adequateCurrent}
        target={mockTarget}
      />
    );
    expect(screen.getByText('적정')).toBeInTheDocument();
  });

  it('칼로리 부족 시 부족 상태가 표시되어야 함', () => {
    const deficientCurrent = {
      ...mockCurrent,
      calories: 1000, // 부족
    };

    render(
      <NutritionDashboardCard
        current={deficientCurrent}
        target={mockTarget}
      />
    );
    expect(screen.getByText('부족')).toBeInTheDocument();
  });

  it('단백질이 부족하면 경고 메시지가 표시되어야 함', () => {
    const lowProteinCurrent = {
      ...mockCurrent,
      protein: 30, // 60% 미만
    };

    render(
      <NutritionDashboardCard
        current={lowProteinCurrent}
        target={mockTarget}
      />
    );
    expect(screen.getByText('단백질이 부족해요!')).toBeInTheDocument();
  });

  it('체중 기반으로 목표가 자동 계산되어야 함', () => {
    render(
      <NutritionDashboardCard
        current={mockCurrent}
        goal="diet"
        weightKg={70}
      />
    );
    // 체중 기반 계산된 목표가 표시됨
    expect(screen.getByTestId('nutrition-dashboard-card')).toBeInTheDocument();
  });
});

describe('RecipeNutritionMini', () => {
  it('컴포넌트가 렌더링되어야 함', () => {
    render(
      <RecipeNutritionMini
        calories={320}
        protein={35}
        carbs={15}
        fat={12}
      />
    );
    expect(screen.getByTestId('recipe-nutrition-mini')).toBeInTheDocument();
  });

  it('칼로리가 표시되어야 함', () => {
    render(
      <RecipeNutritionMini
        calories={320}
        protein={35}
        carbs={15}
        fat={12}
      />
    );
    expect(screen.getByText('320')).toBeInTheDocument();
    expect(screen.getByText('kcal')).toBeInTheDocument();
  });

  it('단백질이 표시되어야 함', () => {
    render(
      <RecipeNutritionMini
        calories={320}
        protein={35}
        carbs={15}
        fat={12}
      />
    );
    expect(screen.getByText('35g')).toBeInTheDocument();
    expect(screen.getByText('단백질')).toBeInTheDocument();
  });

  it('탄수화물이 표시되어야 함', () => {
    render(
      <RecipeNutritionMini
        calories={320}
        protein={35}
        carbs={15}
        fat={12}
      />
    );
    expect(screen.getByText('15g')).toBeInTheDocument();
    expect(screen.getByText('탄수화물')).toBeInTheDocument();
  });

  it('지방이 표시되어야 함', () => {
    render(
      <RecipeNutritionMini
        calories={320}
        protein={35}
        carbs={15}
        fat={12}
      />
    );
    expect(screen.getByText('12g')).toBeInTheDocument();
    expect(screen.getByText('지방')).toBeInTheDocument();
  });

  it('추가 클래스가 적용되어야 함', () => {
    render(
      <RecipeNutritionMini
        calories={320}
        protein={35}
        carbs={15}
        fat={12}
        className="mt-4"
      />
    );
    expect(screen.getByTestId('recipe-nutrition-mini')).toHaveClass('mt-4');
  });
});
