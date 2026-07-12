/**
 * 모바일 액션 플랜 라벨 한국어화 테스트 (표현 레이어 수리)
 *
 * 회귀 방지: 조립 문구에 원시 영문/코드(season='spring', tone='true-spring',
 * bodyType='W', faceShape='oval')가 그대로 노출되지 않고 웹 정본과 동일한
 * 한국어 표기("봄 웜톤"·"트루 스프링"·"W(웨이브)"·"계란형")로 나오는지 검증.
 *
 * @see apps/mobile/lib/integrated/action-plan.ts
 * @see apps/mobile/lib/integrated/labels.ts
 */

import { composeActionPlan } from '@/lib/integrated/action-plan';
import type { IntegratedAnalysisResult, AxisResult, AxisData } from '@/lib/api';

const failed: AxisResult<AxisData> = {
  success: false,
  error: { code: 'MISSING_INPUT', message: 'x', userMessage: 'x', retryable: true },
};

function allFailed(): IntegratedAnalysisResult['axes'] {
  return {
    personalColor: failed,
    skin: failed,
    body: failed,
    hair: failed,
    makeup: failed,
  };
}

const pcWarmSpring: AxisResult<AxisData> = {
  success: true,
  usedFallback: false,
  data: { season: 'spring', undertone: 'warm', tone: 'true-spring' },
};

const bodyWave: AxisResult<AxisData> = {
  success: true,
  usedFallback: false,
  data: { bodyType: 'W' },
};

const hairOval: AxisResult<AxisData> = {
  success: true,
  usedFallback: false,
  data: { faceShape: 'oval' },
};

describe('composeActionPlan (모바일) — 라벨 한국어화', () => {
  it('PC now 액션 why는 "봄 웜톤" (원시 spring/warm 노출 금지)', () => {
    const { items } = composeActionPlan({ ...allFailed(), personalColor: pcWarmSpring });
    const now = items.find((i) => i.horizon === 'now');
    expect(now?.why).toContain('봄 웜톤');
    expect(now?.why).not.toContain('spring');
    expect(now?.why).not.toContain('warm');
  });

  it('PC this_week 제목은 12톤 한글 "트루 스프링" (원시 true-spring 노출 금지)', () => {
    // skin 실패 → this_week는 PC 액션이 선택됨
    const { items } = composeActionPlan({ ...allFailed(), personalColor: pcWarmSpring });
    const week = items.find((i) => i.horizon === 'this_week');
    expect(week?.title).toContain('트루 스프링');
    expect(week?.title).not.toContain('true-spring');
  });

  it('체형 액션 제목은 "W(웨이브)" 병기 (원값 "W 체형" 노출 금지)', () => {
    const { items } = composeActionPlan({ ...allFailed(), body: bodyWave });
    const month = items.find((i) => i.horizon === 'this_month');
    expect(month?.title).toContain('W(웨이브)');
    expect(month?.title).not.toContain('W 체형');
  });

  it('헤어 액션 제목은 한글 얼굴형 "계란형" (원시 oval 노출 금지)', () => {
    // body 실패 → this_month는 hair 액션이 선택됨
    const { items } = composeActionPlan({ ...allFailed(), hair: hairOval });
    const month = items.find((i) => i.horizon === 'this_month');
    expect(month?.title).toContain('계란형');
    expect(month?.title).not.toContain('oval');
  });
});
