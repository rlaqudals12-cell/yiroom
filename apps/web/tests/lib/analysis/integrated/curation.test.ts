/**
 * 통합 큐레이션 테스트 (ADR-104 체크리스트 #5)
 *
 * @see lib/analysis/integrated/curation.ts
 */

import { describe, it, expect } from 'vitest';
import { composeCuration } from '@/lib/analysis/integrated';
import type {
  AxisResult,
  PersonalColorAxisData,
  SkinAxisData,
  BodyAxisData,
  HairAxisData,
  MakeupAxisData,
} from '@/lib/analysis/integrated';

const SESSION_ID = '7a3f1234-5678-4abc-def0-0123456789ab';

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

const bodySuccess: AxisResult<BodyAxisData> = {
  success: true,
  usedFallback: false,
  data: { bodyType: 'hourglass' },
};

const failed: AxisResult<never> = {
  success: false,
  error: { code: 'MISSING_INPUT', message: 'x', userMessage: 'x', retryable: true },
};

function allFailed() {
  return {
    personalColor: failed as AxisResult<PersonalColorAxisData>,
    skin: failed as AxisResult<SkinAxisData>,
    body: failed as AxisResult<BodyAxisData>,
    hair: failed as AxisResult<HairAxisData>,
    makeup: failed as AxisResult<MakeupAxisData>,
  };
}

describe('composeCuration', () => {
  it('전축 실패 → 빈 items', () => {
    const r = composeCuration({ ...allFailed(), sessionId: SESSION_ID });
    expect(r.items).toEqual([]);
  });

  it('PC 단독 → 립 1개', () => {
    const r = composeCuration({
      ...allFailed(),
      personalColor: pcWarm,
      sessionId: SESSION_ID,
    });
    expect(r.items).toHaveLength(1);
    expect(r.items[0].category).toBe('lip');
    expect(r.items[0].title).toContain('코랄');
  });

  it('PC cool + S dry → 립(로즈) + 베이스(듀이)', () => {
    const r = composeCuration({
      ...allFailed(),
      personalColor: pcCool,
      skin: skinDry,
      sessionId: SESSION_ID,
    });
    expect(r.items).toHaveLength(2);
    expect(r.items[0].category).toBe('lip');
    expect(r.items[0].title).toContain('로즈');
    expect(r.items[1].category).toBe('base');
    expect(r.items[1].title).toContain('듀이');
  });

  it('PC warm + S oily → 립(코랄) + 베이스(매트)', () => {
    const r = composeCuration({
      ...allFailed(),
      personalColor: pcWarm,
      skin: skinOily,
      sessionId: SESSION_ID,
    });
    expect(r.items[1].title).toContain('매트');
  });

  it('S만 있고 PC 없음 → 스킨케어 1개', () => {
    const r = composeCuration({
      ...allFailed(),
      skin: skinOily,
      sessionId: SESSION_ID,
    });
    expect(r.items).toHaveLength(1);
    expect(r.items[0].category).toBe('skincare');
    expect(r.items[0].title).toContain('T존 유분 조절');
  });

  it('체형 성공 → outfit 카드 포함', () => {
    const r = composeCuration({
      ...allFailed(),
      body: bodySuccess,
      sessionId: SESSION_ID,
    });
    const outfit = r.items.find((i) => i.category === 'outfit');
    expect(outfit).toBeDefined();
    expect(outfit?.title).toContain('모래시계형');
  });

  it('5축 성공 시 최대 3개로 제한', () => {
    const r = composeCuration({
      personalColor: pcWarm,
      skin: skinDry,
      body: bodySuccess,
      hair: failed as AxisResult<HairAxisData>,
      makeup: failed as AxisResult<MakeupAxisData>,
      sessionId: SESSION_ID,
    });
    expect(r.items.length).toBeLessThanOrEqual(3);
  });

  it('href에 sessionId가 포함됨 (기여도 추적)', () => {
    const r = composeCuration({
      ...allFailed(),
      personalColor: pcWarm,
      sessionId: SESSION_ID,
    });
    expect(r.items[0].href).toContain(SESSION_ID);
    expect(r.items[0].href).toContain('source=integrated');
  });

  it('각 item에 필수 필드 존재 (category/title/reason/href/cta)', () => {
    const r = composeCuration({
      personalColor: pcWarm,
      skin: skinDry,
      body: bodySuccess,
      hair: failed as AxisResult<HairAxisData>,
      makeup: failed as AxisResult<MakeupAxisData>,
      sessionId: SESSION_ID,
    });
    for (const item of r.items) {
      expect(item.category).toBeTruthy();
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.reason.length).toBeGreaterThan(0);
      expect(item.href).toMatch(/^\//);
      expect(item.cta.length).toBeGreaterThan(0);
    }
  });

  it('남성 → 립틴트 대신 그루밍(선크림·립밤) 큐레이션', () => {
    const r = composeCuration({
      ...allFailed(),
      personalColor: pcWarm,
      sessionId: SESSION_ID,
      gender: 'male',
    });
    expect(r.items.find((i) => i.category === 'lip')).toBeUndefined();
    expect(r.items.some((i) => i.title.includes('선크림'))).toBe(true);
  });

  it('남성 + PC + 지성 피부 → 베이스 메이크업 카드 제외', () => {
    const r = composeCuration({
      ...allFailed(),
      personalColor: pcWarm,
      skin: skinOily,
      sessionId: SESSION_ID,
      gender: 'male',
    });
    expect(r.items.find((i) => i.category === 'base')).toBeUndefined();
  });

  it('여성 → 기존 립틴트 큐레이션 유지', () => {
    const r = composeCuration({
      ...allFailed(),
      personalColor: pcWarm,
      sessionId: SESSION_ID,
      gender: 'female',
    });
    expect(r.items[0].category).toBe('lip');
    expect(r.items[0].title).toContain('코랄');
  });

  it('hasClosetItems=false → outfit 카드가 /closet/add로 우회', () => {
    const r = composeCuration({
      ...allFailed(),
      body: bodySuccess,
      sessionId: SESSION_ID,
      hasClosetItems: false,
    });
    const outfit = r.items.find((i) => i.category === 'outfit');
    expect(outfit).toBeDefined();
    expect(outfit?.href).toMatch(/^\/closet\/add\?/);
    expect(outfit?.href).toContain(`session=${SESSION_ID}`);
    expect(outfit?.cta).toContain('옷장 등록');
  });

  it('hasClosetItems=true → outfit 카드가 /closet/recommend 유지', () => {
    const r = composeCuration({
      ...allFailed(),
      body: bodySuccess,
      sessionId: SESSION_ID,
      hasClosetItems: true,
    });
    const outfit = r.items.find((i) => i.category === 'outfit');
    expect(outfit?.href).toMatch(/^\/closet\/recommend\?/);
    expect(outfit?.cta).toBe('코디 보러가기');
  });

  it('hasClosetItems=undefined (정보없음) → 기본 /closet/recommend 경로', () => {
    const r = composeCuration({
      ...allFailed(),
      body: bodySuccess,
      sessionId: SESSION_ID,
    });
    const outfit = r.items.find((i) => i.category === 'outfit');
    expect(outfit?.href).toMatch(/^\/closet\/recommend\?/);
  });
});
