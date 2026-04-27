/**
 * 액션 플랜 테스트 (ADR-104 체크리스트 #2)
 *
 * @see lib/analysis/integrated/action-plan.ts
 */

import { describe, it, expect } from 'vitest';
import { composeActionPlan } from '@/lib/analysis/integrated';
import type {
  AxisResult,
  PersonalColorAxisData,
  SkinAxisData,
  BodyAxisData,
  HairAxisData,
  MakeupAxisData,
} from '@/lib/analysis/integrated';

const pcSuccess: AxisResult<PersonalColorAxisData> = {
  success: true,
  usedFallback: false,
  data: { season: 'spring', tone: 'light-spring', undertone: 'warm', confidence: 88 },
};

const skinOily: AxisResult<SkinAxisData> = {
  success: true,
  usedFallback: false,
  data: { skinType: 'oily', overallScore: 70 },
};

const skinDry: AxisResult<SkinAxisData> = {
  success: true,
  usedFallback: false,
  data: { skinType: 'dry', overallScore: 72 },
};

const skinCombo: AxisResult<SkinAxisData> = {
  success: true,
  usedFallback: false,
  data: { skinType: 'combination', overallScore: 78 },
};

const bodySuccess: AxisResult<BodyAxisData> = {
  success: true,
  usedFallback: false,
  data: { bodyType: 'hourglass' },
};

const hairSuccess: AxisResult<HairAxisData> = {
  success: true,
  usedFallback: false,
  data: { faceShape: 'oval' },
};

const makeupSuccess: AxisResult<MakeupAxisData> = {
  success: true,
  usedFallback: false,
  data: { baseRecommendation: '코랄 듀이 베이스' },
};

const failedAxis: AxisResult<never> = {
  success: false,
  error: {
    code: 'MISSING_INPUT',
    message: 'no record',
    userMessage: '분석 결과 없음',
    retryable: true,
  },
};

function allFailed() {
  return {
    personalColor: failedAxis as AxisResult<PersonalColorAxisData>,
    skin: failedAxis as AxisResult<SkinAxisData>,
    body: failedAxis as AxisResult<BodyAxisData>,
    hair: failedAxis as AxisResult<HairAxisData>,
    makeup: failedAxis as AxisResult<MakeupAxisData>,
  };
}

describe('composeActionPlan', () => {
  it('성공 축 0개면 items 빈 배열', () => {
    const plan = composeActionPlan(allFailed());
    expect(plan.items).toEqual([]);
  });

  it('PC 단독 성공 → now 액션 1개 (립틴트)', () => {
    const plan = composeActionPlan({
      ...allFailed(),
      personalColor: pcSuccess,
    });
    expect(plan.items.length).toBeGreaterThan(0);
    const nowItem = plan.items.find((i) => i.horizon === 'now');
    expect(nowItem).toBeDefined();
    expect(nowItem?.axis).toBe('personal_color');
    expect(nowItem?.title).toContain('코랄');
  });

  it('지성 피부 → this_week에 T존 매트 파우더', () => {
    const plan = composeActionPlan({
      ...allFailed(),
      skin: skinOily,
    });
    const weekItem = plan.items.find((i) => i.horizon === 'this_week');
    expect(weekItem).toBeDefined();
    expect(weekItem?.axis).toBe('skin');
    expect(weekItem?.title).toContain('T존');
  });

  it('건성 피부 → 세라마이드 세럼', () => {
    const plan = composeActionPlan({
      ...allFailed(),
      skin: skinDry,
    });
    const weekItem = plan.items.find((i) => i.horizon === 'this_week');
    expect(weekItem?.title).toContain('세라마이드');
  });

  it('복합성 피부 → T존/U존 분리 케어', () => {
    const plan = composeActionPlan({
      ...allFailed(),
      skin: skinCombo,
    });
    const weekItem = plan.items.find((i) => i.horizon === 'this_week');
    expect(weekItem?.title).toContain('분리 케어');
  });

  it('체형 성공 → this_month 액션', () => {
    const plan = composeActionPlan({
      ...allFailed(),
      body: bodySuccess,
    });
    const monthItem = plan.items.find((i) => i.horizon === 'this_month');
    expect(monthItem).toBeDefined();
    expect(monthItem?.axis).toBe('body');
    expect(monthItem?.title).toContain('hourglass');
  });

  it('헤어만 성공 → this_month에 헤어 액션', () => {
    const plan = composeActionPlan({
      ...allFailed(),
      hair: hairSuccess,
    });
    const monthItem = plan.items.find((i) => i.horizon === 'this_month');
    expect(monthItem?.axis).toBe('hair');
  });

  it('5축 모두 성공 → 시점별 3개 (now/this_week/this_month)', () => {
    const plan = composeActionPlan({
      personalColor: pcSuccess,
      skin: skinCombo,
      body: bodySuccess,
      hair: hairSuccess,
      makeup: makeupSuccess,
    });
    expect(plan.items).toHaveLength(3);
    expect(plan.items.map((i) => i.horizon).sort()).toEqual(['now', 'this_month', 'this_week']);
  });

  it('우선순위 규칙: now는 makeup 우선 (PC + M 공존 시)', () => {
    const plan = composeActionPlan({
      ...allFailed(),
      personalColor: pcSuccess,
      makeup: makeupSuccess,
    });
    const nowItem = plan.items.find((i) => i.horizon === 'now');
    expect(nowItem?.axis).toBe('makeup');
  });

  it('우선순위 규칙: this_month는 body > hair', () => {
    const plan = composeActionPlan({
      ...allFailed(),
      body: bodySuccess,
      hair: hairSuccess,
    });
    const monthItem = plan.items.find((i) => i.horizon === 'this_month');
    expect(monthItem?.axis).toBe('body');
  });

  it('각 item에 필수 필드 존재 (axis/title/why/horizon)', () => {
    const plan = composeActionPlan({
      personalColor: pcSuccess,
      skin: skinCombo,
      body: bodySuccess,
      hair: hairSuccess,
      makeup: makeupSuccess,
    });
    for (const item of plan.items) {
      expect(item.axis).toBeDefined();
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.why.length).toBeGreaterThan(0);
      expect(['now', 'this_week', 'this_month']).toContain(item.horizon);
    }
  });
});
