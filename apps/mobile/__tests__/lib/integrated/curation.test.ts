/**
 * 모바일 통합 큐레이션 테스트 (Phase G — 옷장 우회 로직 검증)
 *
 * @see apps/mobile/lib/integrated/curation.ts
 */

import { composeCuration } from '@/lib/integrated/curation';
import type { IntegratedAnalysisResult, AxisResult, AxisData } from '@/lib/api';

const SESSION_ID = '7a3f1234-5678-4abc-def0-0123456789ab';

const pcWarm: AxisResult = {
  success: true,
  usedFallback: false,
  data: { season: 'spring', tone: 'light-spring', undertone: 'warm', confidence: 88 },
};

const pcCool: AxisResult = {
  success: true,
  usedFallback: false,
  data: { season: 'summer', tone: 'true-summer', undertone: 'cool', confidence: 85 },
};

const skinOily: AxisResult = {
  success: true,
  usedFallback: false,
  data: { skinType: 'oily', overallScore: 70 },
};

const skinDry: AxisResult = {
  success: true,
  usedFallback: false,
  data: { skinType: 'dry', overallScore: 72 },
};

const bodySuccess: AxisResult = {
  success: true,
  usedFallback: false,
  data: { bodyType: 'hourglass' },
};

const failed: AxisResult = {
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

describe('composeCuration (모바일)', () => {
  it('전축 실패 → 빈 items', () => {
    const r = composeCuration(allFailed(), SESSION_ID);
    expect(r.items).toEqual([]);
  });

  it('PC 단독 → 립 1개 (코랄)', () => {
    const r = composeCuration({ ...allFailed(), personalColor: pcWarm }, SESSION_ID);
    expect(r.items).toHaveLength(1);
    expect(r.items[0].category).toBe('lip');
    expect(r.items[0].title).toContain('코랄');
    expect(r.items[0].href).toContain('/(tabs)/beauty');
    expect(r.items[0].href).toContain('source=integrated');
    expect(r.items[0].href).toContain(`session=${SESSION_ID}`);
  });

  it('PC cool + S dry → 립(로즈) + 베이스(듀이)', () => {
    const r = composeCuration({ ...allFailed(), personalColor: pcCool, skin: skinDry }, SESSION_ID);
    expect(r.items).toHaveLength(2);
    expect(r.items[1].title).toContain('듀이');
  });

  it('PC warm + S oily → 립(코랄) + 베이스(매트)', () => {
    const r = composeCuration(
      { ...allFailed(), personalColor: pcWarm, skin: skinOily },
      SESSION_ID
    );
    expect(r.items[1].title).toContain('매트');
  });

  it('체형 성공 → outfit 카드 포함 (기본 /(closet)/recommend)', () => {
    const r = composeCuration({ ...allFailed(), body: bodySuccess }, SESSION_ID);
    const outfit = r.items.find((i) => i.category === 'outfit');
    expect(outfit).toBeDefined();
    expect(outfit?.href).toContain('/(closet)/recommend');
  });

  it('hasClosetItems=false → outfit 카드가 /(closet)/add 로 우회', () => {
    const r = composeCuration({ ...allFailed(), body: bodySuccess }, SESSION_ID, {
      hasClosetItems: false,
    });
    const outfit = r.items.find((i) => i.category === 'outfit');
    expect(outfit?.href).toMatch(/^\/\(closet\)\/add\?/);
    expect(outfit?.href).toContain(`session=${SESSION_ID}`);
    expect(outfit?.cta).toContain('옷장 등록');
  });

  it('hasClosetItems=true → outfit 카드가 /(closet)/recommend 유지', () => {
    const r = composeCuration({ ...allFailed(), body: bodySuccess }, SESSION_ID, {
      hasClosetItems: true,
    });
    const outfit = r.items.find((i) => i.category === 'outfit');
    expect(outfit?.href).toContain('/(closet)/recommend');
    expect(outfit?.cta).toBe('코디 보러가기');
  });

  it('hasClosetItems=undefined(정보없음) → 기본 경로', () => {
    const r = composeCuration({ ...allFailed(), body: bodySuccess }, SESSION_ID);
    const outfit = r.items.find((i) => i.category === 'outfit');
    expect(outfit?.href).toContain('/(closet)/recommend');
  });

  it('최대 3개로 제한', () => {
    const r = composeCuration(
      {
        personalColor: pcWarm,
        skin: skinDry,
        body: bodySuccess,
        hair: failed,
        makeup: failed,
      },
      SESSION_ID
    );
    expect(r.items.length).toBeLessThanOrEqual(3);
  });

  it('각 item에 필수 필드 존재', () => {
    const r = composeCuration(
      {
        personalColor: pcWarm,
        skin: skinDry,
        body: bodySuccess,
        hair: failed,
        makeup: failed,
      },
      SESSION_ID
    );
    for (const item of r.items) {
      expect(item.category).toBeTruthy();
      expect(item.title.length).toBeGreaterThan(0);
      expect(item.reason.length).toBeGreaterThan(0);
      expect(item.href).toMatch(/^\//);
      expect(item.cta.length).toBeGreaterThan(0);
    }
  });
});
