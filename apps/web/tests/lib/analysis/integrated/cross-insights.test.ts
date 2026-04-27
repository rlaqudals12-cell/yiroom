/**
 * 축 조합 인사이트 테스트 (ADR-104 체크리스트 #4)
 *
 * @see lib/analysis/integrated/cross-insights.ts
 */

import { describe, it, expect } from 'vitest';
import { composeCrossInsights } from '@/lib/analysis/integrated';
import type {
  AxisResult,
  PersonalColorAxisData,
  SkinAxisData,
  BodyAxisData,
  HairAxisData,
  MakeupAxisData,
} from '@/lib/analysis/integrated';

// ============================================
// Fixtures
// ============================================

const pcWarm: AxisResult<PersonalColorAxisData> = {
  success: true,
  usedFallback: false,
  data: { season: 'spring', tone: 'light-spring', undertone: 'warm', confidence: 88 },
};

const pcCool: AxisResult<PersonalColorAxisData> = {
  success: true,
  usedFallback: false,
  data: { season: 'summer', tone: 'true-summer', undertone: 'cool', confidence: 85 },
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

const skinSensitive: AxisResult<SkinAxisData> = {
  success: true,
  usedFallback: false,
  data: { skinType: 'sensitive', overallScore: 60 },
};

const bodySuccess: AxisResult<BodyAxisData> = {
  success: true,
  usedFallback: false,
  data: { bodyType: 'hourglass' },
};

const hairOval: AxisResult<HairAxisData> = {
  success: true,
  usedFallback: false,
  data: { faceShape: 'oval' },
};

const hairRound: AxisResult<HairAxisData> = {
  success: true,
  usedFallback: false,
  data: { faceShape: 'round' },
};

const makeupSuccess: AxisResult<MakeupAxisData> = {
  success: true,
  usedFallback: false,
  data: { baseRecommendation: '코랄 듀이 베이스' },
};

const failedAxis: AxisResult<never> = {
  success: false,
  error: { code: 'MISSING_INPUT', message: 'x', userMessage: 'x', retryable: true },
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

// ============================================
// Tests
// ============================================

describe('composeCrossInsights', () => {
  it('성공 축 0개 → items 빈 배열', () => {
    expect(composeCrossInsights(allFailed()).items).toEqual([]);
  });

  it('PC 단독 → 축 조합 없으므로 빈 배열', () => {
    const r = composeCrossInsights({ ...allFailed(), personalColor: pcWarm });
    expect(r.items).toEqual([]);
  });

  it('PC + S 성공 → pc_s 인사이트 1개 (코랄 × 피니시)', () => {
    const r = composeCrossInsights({
      ...allFailed(),
      personalColor: pcWarm,
      skin: skinOily,
    });
    expect(r.items).toHaveLength(1);
    expect(r.items[0].id).toBe('pc_s');
    expect(r.items[0].combo).toContain('색');
    expect(r.items[0].title).toContain('코랄');
    expect(r.items[0].title).toContain('매트');
  });

  it('PC cool + S dry → 로즈 × 듀이 피니시', () => {
    const r = composeCrossInsights({
      ...allFailed(),
      personalColor: pcCool,
      skin: skinDry,
    });
    expect(r.items[0].title).toContain('로즈');
    expect(r.items[0].title).toContain('듀이');
  });

  it('PC + M → pc_m 인사이트 (립 + 섀도)', () => {
    const r = composeCrossInsights({
      ...allFailed(),
      personalColor: pcWarm,
      makeup: makeupSuccess,
    });
    expect(r.items[0].id).toBe('pc_m');
    expect(r.items[0].title).toContain('립');
    expect(r.items[0].title).toContain('섀도');
  });

  it('C + H → c_h 인사이트 (체형 × 얼굴형 헤어)', () => {
    const r = composeCrossInsights({
      ...allFailed(),
      body: bodySuccess,
      hair: hairOval,
    });
    expect(r.items[0].id).toBe('c_h');
    expect(r.items[0].combo).toContain('체형');
  });

  it('C + H round → 얼굴선 사이드 컷 조언', () => {
    const r = composeCrossInsights({
      ...allFailed(),
      body: bodySuccess,
      hair: hairRound,
    });
    expect(r.items[0].title).toContain('사이드 컷');
  });

  it('S sensitive + M → 저자극 베이스 조언', () => {
    const r = composeCrossInsights({
      ...allFailed(),
      skin: skinSensitive,
      makeup: makeupSuccess,
    });
    expect(r.items[0].id).toBe('s_m');
    expect(r.items[0].title).toContain('저자극');
  });

  it('PC + C → pc_c 인사이트 (의류 톤 + 핏)', () => {
    const r = composeCrossInsights({
      ...allFailed(),
      personalColor: pcWarm,
      body: bodySuccess,
    });
    expect(r.items[0].id).toBe('pc_c');
    expect(r.items[0].title).toContain('핏');
  });

  it('5축 모두 성공 → 5개 조합 인사이트 반환 (순서: pc_s, pc_m, c_h, s_m, pc_c)', () => {
    const r = composeCrossInsights({
      personalColor: pcWarm,
      skin: skinOily,
      body: bodySuccess,
      hair: hairOval,
      makeup: makeupSuccess,
    });
    expect(r.items).toHaveLength(5);
    expect(r.items.map((i) => i.id)).toEqual(['pc_s', 'pc_m', 'c_h', 's_m', 'pc_c']);
  });

  it('각 item에 필수 필드 존재 (id/combo/title/body)', () => {
    const r = composeCrossInsights({
      personalColor: pcWarm,
      skin: skinOily,
      body: bodySuccess,
      hair: hairOval,
      makeup: makeupSuccess,
    });
    for (const item of r.items) {
      expect(item.id).toBeTruthy();
      expect(item.combo.length).toBeGreaterThan(0);
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.body.length).toBeGreaterThan(0);
    }
  });
});
