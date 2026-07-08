/**
 * S-1 결과 "그래서, 이렇게 하세요" 조립 테스트 (ADR-111 표현 원칙 1: 결론 먼저)
 *
 * buildSkinTopActions가 기존 결과 데이터에서 규칙 기반으로 행동을 조립하고,
 * TopActionsCard가 이를 결론 카드로 렌더하는지 검증한다.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { buildSkinTopActions } from '@/components/analysis/skin/skinTopActions';
import { TopActionsCard } from '@/components/analysis/TopActionsCard';
import { generateMockAnalysisResult } from '@/lib/mock/skin-analysis';
import { generateRoutine } from '@/lib/skincare';
import type { SkinAnalysisResult } from '@/lib/mock/skin-analysis';

describe('buildSkinTopActions', () => {
  it('result가 없으면 빈 배열을 반환한다', () => {
    expect(buildSkinTopActions(null, 'dry')).toEqual([]);
  });

  it('① 아침 루틴 첫 스텝을 정본 generateRoutine에서 파생한다', () => {
    const result = generateMockAnalysisResult();
    const actions = buildSkinTopActions(result, 'dry');

    const expectedFirst = generateRoutine({
      skinType: 'dry',
      concerns: [],
      timeOfDay: 'morning',
      includeOptional: false,
    }).routine[0];

    expect(expectedFirst).toBeDefined();
    // 첫 행동 제목에 정본 루틴 첫 스텝명이 포함 + 심화 페이지 링크
    expect(actions[0].title).toContain(expectedFirst.name);
    expect(actions[0].href).toBe('/analysis/skin/routine');
    expect(actions[0].hrefLabel).toBe('전체 루틴 보기');
  });

  it('② 추천 성분 1개를 행동으로 조립한다', () => {
    const result = generateMockAnalysisResult();
    const ingredient = result.recommendedIngredients[0];
    const actions = buildSkinTopActions(result, 'oily');

    expect(actions.some((a) => a.title.includes(ingredient.name))).toBe(true);
  });

  it('③ 성분 경고가 있으면 "피하세요" 행동을 조립한다', () => {
    const base = generateMockAnalysisResult();
    const result: SkinAnalysisResult = {
      ...base,
      ingredientWarnings: [
        { ingredient: '알코올', level: 'high', reason: '건조함 유발', ewgGrade: null },
      ],
    };

    const actions = buildSkinTopActions(result, 'dry');
    const avoid = actions.find((a) => a.title.includes('알코올'));
    expect(avoid).toBeDefined();
    expect(avoid?.title).toContain('피하세요');
    expect(avoid?.detail).toBe('건조함 유발');
  });

  it('성분 경고가 없으면 초보자 팁의 avoidTip으로 주의 행동을 대체한다', () => {
    const base = generateMockAnalysisResult();
    const result: SkinAnalysisResult = {
      ...base,
      ingredientWarnings: [],
      easySkinTip: {
        summary: '요약',
        easyExplanation: '설명',
        morningRoutine: [],
        eveningRoutine: [],
        productTip: '추천 팁',
        avoidTip: '뜨거운 물 세안 피하기',
      },
    };

    const actions = buildSkinTopActions(result, 'normal');
    expect(actions.some((a) => a.detail === '뜨거운 물 세안 피하기')).toBe(true);
  });

  it('조립된 행동을 TopActionsCard가 결론 카드로 렌더한다', () => {
    const result = generateMockAnalysisResult();
    const actions = buildSkinTopActions(result, 'combination');

    render(<TopActionsCard actions={actions} />);

    // 결론 카드 컨테이너 + 첫 행동 제목 노출
    expect(screen.getByTestId('top-actions-card')).toBeInTheDocument();
    expect(screen.getByText(actions[0].title)).toBeInTheDocument();
    // 최대 3개까지만 조립
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.length).toBeLessThanOrEqual(3);
  });
});
