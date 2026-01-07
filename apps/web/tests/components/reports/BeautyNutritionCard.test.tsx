/**
 * BeautyNutritionCard 컴포넌트 테스트
 * H-1/M-1 → N-1 뷰티-영양 상관관계 카드
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BeautyNutritionCard } from '@/components/reports/BeautyNutritionCard';
import type { BeautyNutritionCorrelation } from '@/types/report';

describe('BeautyNutritionCard', () => {
  const fullCorrelation: BeautyNutritionCorrelation = {
    hairHealth: {
      scalpScore: 75,
      densityScore: 80,
      damageLevel: 65,
      overallScore: 73,
      analyzedAt: '2024-01-15T10:00:00Z',
    },
    skinHealth: {
      hydration: 65,
      texture: 70,
      overallScore: 68,
      analyzedAt: '2024-01-15T10:00:00Z',
    },
    nutrientImpacts: [
      {
        nutrient: 'biotin',
        label: '비오틴',
        intake: 25,
        recommended: 30,
        percentage: 83,
        impact: 'positive',
      },
      {
        nutrient: 'zinc',
        label: '아연',
        intake: 8,
        recommended: 10,
        percentage: 80,
        impact: 'positive',
      },
      {
        nutrient: 'iron',
        label: '철분',
        intake: 10,
        recommended: 15,
        percentage: 67,
        impact: 'neutral',
      },
      {
        nutrient: 'vitaminC',
        label: '비타민 C',
        intake: 60,
        recommended: 100,
        percentage: 60,
        impact: 'negative',
      },
    ],
    correlationSummary: {
      overallScore: 72,
      trend: 'stable',
      message: '뷰티-영양 균형이 좋아요!',
    },
    recommendations: ['비타민 C 섭취를 늘려보세요.', '콜라겐 음식을 더 챙겨 드세요.'],
    hasHairData: true,
    hasSkinData: true,
  };

  it('컴포넌트가 렌더링된다', () => {
    render(<BeautyNutritionCard correlation={fullCorrelation} />);

    expect(screen.getByTestId('beauty-nutrition-card')).toBeInTheDocument();
    expect(screen.getByText('뷰티-영양 상관관계')).toBeInTheDocument();
  });

  it('종합 점수를 표시한다', () => {
    render(<BeautyNutritionCard correlation={fullCorrelation} />);

    expect(screen.getByText('72점')).toBeInTheDocument();
    expect(screen.getByText('뷰티-영양 균형이 좋아요!')).toBeInTheDocument();
  });

  it('헤어 건강 섹션을 표시한다', () => {
    render(<BeautyNutritionCard correlation={fullCorrelation} />);

    expect(screen.getByText('헤어 건강')).toBeInTheDocument();
    expect(screen.getByText('두피')).toBeInTheDocument();
    expect(screen.getByText('밀도')).toBeInTheDocument();
    expect(screen.getByText('75점')).toBeInTheDocument(); // scalpScore
    expect(screen.getByText('80점')).toBeInTheDocument(); // densityScore
  });

  it('피부 건강 섹션을 표시한다', () => {
    render(<BeautyNutritionCard correlation={fullCorrelation} />);

    expect(screen.getByText('피부 건강')).toBeInTheDocument();
    expect(screen.getByText('수분')).toBeInTheDocument();
    expect(screen.getByText('텍스처')).toBeInTheDocument();
    expect(screen.getByText('65점')).toBeInTheDocument(); // hydration
    expect(screen.getByText('70점')).toBeInTheDocument(); // texture
  });

  it('영양소 임팩트를 표시한다', () => {
    render(<BeautyNutritionCard correlation={fullCorrelation} />);

    expect(screen.getByText('뷰티 영양소 섭취 현황')).toBeInTheDocument();
    expect(screen.getByText('비오틴')).toBeInTheDocument();
    expect(screen.getByText('아연')).toBeInTheDocument();
    expect(screen.getByText('83%')).toBeInTheDocument();
  });

  it('추천사항을 표시한다', () => {
    render(<BeautyNutritionCard correlation={fullCorrelation} />);

    expect(screen.getByText('영양 추천')).toBeInTheDocument();
    expect(screen.getByText('비타민 C 섭취를 늘려보세요.')).toBeInTheDocument();
    expect(screen.getByText('콜라겐 음식을 더 챙겨 드세요.')).toBeInTheDocument();
  });

  it('헤어 데이터만 있을 때 헤어 섹션만 표시한다', () => {
    const hairOnlyCorrelation: BeautyNutritionCorrelation = {
      ...fullCorrelation,
      skinHealth: null,
      hasSkinData: false,
    };

    render(<BeautyNutritionCard correlation={hairOnlyCorrelation} />);

    expect(screen.getByText('헤어 건강')).toBeInTheDocument();
    expect(screen.queryByText('피부 건강')).not.toBeInTheDocument();
  });

  it('피부 데이터만 있을 때 피부 섹션만 표시한다', () => {
    const skinOnlyCorrelation: BeautyNutritionCorrelation = {
      ...fullCorrelation,
      hairHealth: null,
      hasHairData: false,
    };

    render(<BeautyNutritionCard correlation={skinOnlyCorrelation} />);

    expect(screen.queryByText('헤어 건강')).not.toBeInTheDocument();
    expect(screen.getByText('피부 건강')).toBeInTheDocument();
  });

  it('영양소 임팩트가 없으면 해당 섹션을 숨긴다', () => {
    const noImpactsCorrelation: BeautyNutritionCorrelation = {
      ...fullCorrelation,
      nutrientImpacts: [],
    };

    render(<BeautyNutritionCard correlation={noImpactsCorrelation} />);

    expect(screen.queryByText('뷰티 영양소 섭취 현황')).not.toBeInTheDocument();
  });

  it('추천사항이 없으면 해당 섹션을 숨긴다', () => {
    const noRecsCorrelation: BeautyNutritionCorrelation = {
      ...fullCorrelation,
      recommendations: [],
    };

    render(<BeautyNutritionCard correlation={noRecsCorrelation} />);

    expect(screen.queryByText('영양 추천')).not.toBeInTheDocument();
  });

  it('최대 4개의 영양소 임팩트만 표시한다', () => {
    const manyImpactsCorrelation: BeautyNutritionCorrelation = {
      ...fullCorrelation,
      nutrientImpacts: [
        ...fullCorrelation.nutrientImpacts,
        {
          nutrient: 'omega3',
          label: '오메가3',
          intake: 1,
          recommended: 2,
          percentage: 50,
          impact: 'negative',
        },
        {
          nutrient: 'collagen',
          label: '콜라겐',
          intake: 3,
          recommended: 5,
          percentage: 60,
          impact: 'neutral',
        },
      ],
    };

    render(<BeautyNutritionCard correlation={manyImpactsCorrelation} />);

    // 처음 4개만 표시되어야 함
    expect(screen.getByText('비오틴')).toBeInTheDocument();
    expect(screen.getByText('아연')).toBeInTheDocument();
    expect(screen.getByText('철분')).toBeInTheDocument();
    expect(screen.getByText('비타민 C')).toBeInTheDocument();
    expect(screen.queryByText('오메가3')).not.toBeInTheDocument();
    expect(screen.queryByText('콜라겐')).not.toBeInTheDocument();
  });

  it('점수가 null이면 "-점"으로 표시한다', () => {
    const nullScoresCorrelation: BeautyNutritionCorrelation = {
      ...fullCorrelation,
      hairHealth: {
        ...fullCorrelation.hairHealth!,
        scalpScore: null,
        densityScore: null,
        overallScore: null,
      },
    };

    render(<BeautyNutritionCard correlation={nullScoresCorrelation} />);

    const dashScores = screen.getAllByText('-점');
    expect(dashScores.length).toBeGreaterThan(0);
  });
});
