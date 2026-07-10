/**
 * 결론 카드 조립 로직 테스트 (ADR-111 표현 원칙 1: 결론 먼저)
 *
 * 검증:
 * - 축별 "첫 화면에 액션 1~3개" (규칙 조립 결과)
 * - "빈 데이터 = 미노출" (데이터 없으면 빈 배열 — 지어내지 않음)
 * - 법적 금지 표현("처방/치료/완치") 없음
 */
import {
  buildSkinTopActions,
  buildPersonalColorTopActions,
  buildBodyTopActions,
  buildHairTopActions,
  buildMakeupTopActions,
  type TopAction,
} from '../../../lib/analysis/top-actions';

// 금지 표현 검사 헬퍼 — 모든 title/detail 문자열 수집
function allText(actions: TopAction[]): string {
  return actions.flatMap((a) => [a.title, a.detail ?? '', a.hrefLabel ?? '']).join(' ');
}

const FORBIDDEN = /처방|치료|완치/;

describe('buildSkinTopActions (S-1)', () => {
  const full = {
    tips: ['고보습 크림 사용을 권장해요', '토너를 발라주세요'],
    recommendedIngredients: ['히알루론산', '세라마이드'],
    avoidIngredients: ['알코올'],
  };

  it('데이터가 있으면 1~3개의 액션을 조립한다', () => {
    const actions = buildSkinTopActions(full);
    expect(actions.length).toBeGreaterThanOrEqual(1);
    expect(actions.length).toBeLessThanOrEqual(3);
  });

  it('첫 액션은 전체 루틴으로 유도하는 href를 가진다', () => {
    const actions = buildSkinTopActions(full);
    expect(actions[0].href).toBe('/(analysis)/skin/routine');
    expect(actions[0].hrefLabel).toBe('전체 루틴 보기');
  });

  it('추천/주의 성분을 각각 반영한다', () => {
    const actions = buildSkinTopActions(full);
    const text = allText(actions);
    expect(text).toContain('히알루론산');
    expect(text).toContain('알코올');
  });

  it('빈 데이터면 빈 배열을 반환한다 (미노출)', () => {
    expect(
      buildSkinTopActions({ tips: [], recommendedIngredients: [], avoidIngredients: [] })
    ).toEqual([]);
  });

  it('금지 표현이 없다', () => {
    expect(allText(buildSkinTopActions(full))).not.toMatch(FORBIDDEN);
  });
});

describe('buildPersonalColorTopActions (PC-1)', () => {
  const full = {
    bestColors: ['#FFB6C1', '#FFDAB9', '#FFA07A', '#F0E68C'],
    toneLabel: '봄 웜톤',
    stylingTips: ['코랄 립을 발라보세요', '골드 주얼리를 활용하세요'],
  };

  it('데이터가 있으면 1~3개의 액션을 조립한다', () => {
    const actions = buildPersonalColorTopActions(full);
    expect(actions.length).toBeGreaterThanOrEqual(1);
    expect(actions.length).toBeLessThanOrEqual(3);
  });

  it('첫 액션은 베스트 컬러 스와치를 최대 3개 포함한다', () => {
    const actions = buildPersonalColorTopActions(full);
    expect(actions[0].swatches?.length).toBe(3);
    expect(actions[0].detail).toContain('봄 웜톤');
  });

  it('색 견본 이름은 hex 코드를 그대로 사용한다 (지어내지 않음)', () => {
    const actions = buildPersonalColorTopActions(full);
    expect(actions[0].swatches?.[0]).toEqual({ hex: '#FFB6C1', name: '#FFB6C1' });
  });

  it('빈 데이터면 빈 배열을 반환한다 (미노출)', () => {
    expect(
      buildPersonalColorTopActions({ bestColors: [], toneLabel: '봄 웜톤', stylingTips: [] })
    ).toEqual([]);
  });

  it('금지 표현이 없다', () => {
    expect(allText(buildPersonalColorTopActions(full))).not.toMatch(FORBIDDEN);
  });
});

describe('buildBodyTopActions (C-1)', () => {
  const full = {
    recommendations: ['벨트로 허리 강조', 'A라인 스커트'],
    avoidItems: ['일자 실루엣'],
  };

  it('데이터가 있으면 1~3개의 액션을 조립한다', () => {
    const actions = buildBodyTopActions(full);
    expect(actions.length).toBeGreaterThanOrEqual(1);
    expect(actions.length).toBeLessThanOrEqual(3);
  });

  it('추천 스타일과 피할 스타일을 반영한다', () => {
    const text = allText(buildBodyTopActions(full));
    expect(text).toContain('벨트로 허리 강조');
    expect(text).toContain('일자 실루엣');
  });

  it('빈 데이터면 빈 배열을 반환한다 (미노출)', () => {
    expect(buildBodyTopActions({ recommendations: [], avoidItems: [] })).toEqual([]);
  });

  it('금지 표현이 없다', () => {
    expect(allText(buildBodyTopActions(full))).not.toMatch(FORBIDDEN);
  });
});

describe('buildHairTopActions (H-1)', () => {
  const full = {
    careRoutine: ['주 1회 딥 컨디셔닝', '두피 스케일링'],
    recommendedStyles: ['레이어드 컷', '단발'],
  };

  it('데이터가 있으면 1~3개의 액션을 조립한다', () => {
    const actions = buildHairTopActions(full);
    expect(actions.length).toBeGreaterThanOrEqual(1);
    expect(actions.length).toBeLessThanOrEqual(3);
  });

  it('컷·염색은 통합 분석으로 정직하게 유도한다 (실존 라우트)', () => {
    const actions = buildHairTopActions(full);
    const link = actions.find((a) => a.href === '/(analysis)/integrated');
    expect(link).toBeDefined();
    expect(link?.hrefLabel).toBe('통합 분석 보기');
  });

  it('케어·스타일 데이터가 없어도 통합 분석 유도만 남는다 (정직한 폴백)', () => {
    const actions = buildHairTopActions({ careRoutine: [], recommendedStyles: [] });
    expect(actions).toHaveLength(1);
    expect(actions[0].href).toBe('/(analysis)/integrated');
  });

  it('금지 표현이 없다', () => {
    expect(allText(buildHairTopActions(full))).not.toMatch(FORBIDDEN);
  });
});

describe('buildMakeupTopActions (M-1)', () => {
  const full = {
    bestColors: ['#E8A090', '#C97B6B', '#D4A19A'],
    lip: '코랄 립을 얇게 발라보세요',
    eye: '골드 섀도로 화사하게',
  };

  it('데이터가 있으면 1~3개의 액션을 조립한다', () => {
    const actions = buildMakeupTopActions(full);
    expect(actions.length).toBeGreaterThanOrEqual(1);
    expect(actions.length).toBeLessThanOrEqual(3);
  });

  it('추천 컬러 스와치와 립/아이 포인트를 반영한다', () => {
    const actions = buildMakeupTopActions(full);
    expect(actions[0].swatches?.length).toBe(3);
    const text = allText(actions);
    expect(text).toContain('코랄 립을 얇게 발라보세요');
    expect(text).toContain('골드 섀도로 화사하게');
  });

  it('빈 데이터면 빈 배열을 반환한다 (미노출)', () => {
    expect(buildMakeupTopActions({ bestColors: [], lip: '', eye: '' })).toEqual([]);
  });

  it('금지 표현이 없다', () => {
    expect(allText(buildMakeupTopActions(full))).not.toMatch(FORBIDDEN);
  });
});
