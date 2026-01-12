/**
 * RecipeVariationCard 컴포넌트 테스트
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecipeVariationCard } from '@/components/nutrition/RecipeVariationCard';
import { RecipeVariation } from '@/lib/nutrition/ingredient-substitutes';

describe('RecipeVariationCard', () => {
  const mockOriginalNutrition = {
    calories: 650,
    protein: 45,
    carbs: 55,
  };

  const mockDietVariation: RecipeVariation = {
    type: 'diet',
    name: '다이어트 찜닭',
    description: '칼로리를 줄인 다이어트 버전의 찜닭입니다.',
    substitutions: [
      { original: '설탕', substitute: '알룰로스', benefit: '칼로리 95% 감소' },
      { original: '물엿', substitute: '올리고당', benefit: '혈당 지수 낮음' },
      { original: '감자', substitute: '제거', benefit: '탄수화물 감소' },
    ],
    nutritionChange: {
      caloriesReduction: 35,
      proteinChange: 0,
      carbsChange: 20,
    },
    tips: ['감자 → 제거: 감자 제외하고 조리'],
  };

  it('변형 카드가 렌더링되어야 함', () => {
    render(
      <RecipeVariationCard
        variation={mockDietVariation}
        originalNutrition={mockOriginalNutrition}
      />
    );

    expect(screen.getByTestId('recipe-variation-card')).toBeInTheDocument();
  });

  it('변형 이름과 설명을 표시해야 함', () => {
    render(
      <RecipeVariationCard
        variation={mockDietVariation}
        originalNutrition={mockOriginalNutrition}
      />
    );

    expect(screen.getByText('다이어트 찜닭')).toBeInTheDocument();
    expect(screen.getByText('칼로리를 줄인 다이어트 버전의 찜닭입니다.')).toBeInTheDocument();
  });

  it('목표 배지를 표시해야 함', () => {
    render(
      <RecipeVariationCard
        variation={mockDietVariation}
        originalNutrition={mockOriginalNutrition}
      />
    );

    expect(screen.getByText('DIET')).toBeInTheDocument();
  });

  it('영양 성분 변화를 표시해야 함', () => {
    render(
      <RecipeVariationCard
        variation={mockDietVariation}
        originalNutrition={mockOriginalNutrition}
      />
    );

    expect(screen.getByText('영양 성분 변화')).toBeInTheDocument();
    expect(screen.getByText('칼로리')).toBeInTheDocument();
    expect(screen.getByText('단백질')).toBeInTheDocument();
    expect(screen.getByText('탄수화물')).toBeInTheDocument();
  });

  it('대체 재료 목록을 표시해야 함', () => {
    render(
      <RecipeVariationCard
        variation={mockDietVariation}
        originalNutrition={mockOriginalNutrition}
      />
    );

    expect(screen.getByText('대체 재료')).toBeInTheDocument();
    expect(screen.getByText('설탕')).toBeInTheDocument();
    expect(screen.getByText('알룰로스')).toBeInTheDocument();
    expect(screen.getByText('칼로리 95% 감소')).toBeInTheDocument();
  });

  it('조리 팁을 표시해야 함', () => {
    render(
      <RecipeVariationCard
        variation={mockDietVariation}
        originalNutrition={mockOriginalNutrition}
      />
    );

    expect(screen.getByText('조리 팁')).toBeInTheDocument();
    expect(screen.getByText(/감자 → 제거: 감자 제외하고 조리/)).toBeInTheDocument();
  });

  it('린매스 변형도 렌더링되어야 함', () => {
    const leanVariation: RecipeVariation = {
      type: 'lean',
      name: '린매스 연어 스테이크',
      description: '단백질을 높이고 지방을 줄인 린매스 버전의 연어 스테이크입니다.',
      substitutions: [{ original: '식용유', substitute: '올리브오일', benefit: '불포화지방' }],
      nutritionChange: {
        caloriesReduction: 0,
        proteinChange: 10,
        carbsChange: 0,
      },
      tips: [],
    };

    render(
      <RecipeVariationCard variation={leanVariation} originalNutrition={mockOriginalNutrition} />
    );

    expect(screen.getByText('LEAN')).toBeInTheDocument();
  });

  it('대체 재료가 없으면 대체 재료 섹션을 표시하지 않음', () => {
    const noSubstitutionVariation: RecipeVariation = {
      type: 'diet',
      name: '다이어트 물',
      description: '칼로리를 줄인 다이어트 버전의 물입니다.',
      substitutions: [],
      nutritionChange: {
        caloriesReduction: 0,
        proteinChange: 0,
        carbsChange: 0,
      },
      tips: [],
    };

    render(
      <RecipeVariationCard
        variation={noSubstitutionVariation}
        originalNutrition={mockOriginalNutrition}
      />
    );

    expect(screen.queryByText('대체 재료')).not.toBeInTheDocument();
  });

  it('조리 팁이 없으면 조리 팁 섹션을 표시하지 않음', () => {
    const noTipsVariation: RecipeVariation = {
      type: 'diet',
      name: '다이어트 찜닭',
      description: '칼로리를 줄인 다이어트 버전의 찜닭입니다.',
      substitutions: [{ original: '설탕', substitute: '알룰로스', benefit: '칼로리 95% 감소' }],
      nutritionChange: {
        caloriesReduction: 35,
        proteinChange: 0,
        carbsChange: 20,
      },
      tips: [],
    };

    render(
      <RecipeVariationCard variation={noTipsVariation} originalNutrition={mockOriginalNutrition} />
    );

    expect(screen.queryByText('조리 팁')).not.toBeInTheDocument();
  });
});
