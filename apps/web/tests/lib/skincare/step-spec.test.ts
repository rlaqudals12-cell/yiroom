import { describe, it, expect } from 'vitest';
import { getStepSpec, isApprovedStepSpec } from '@/lib/skincare/step-spec';
import { generateRoutine } from '@/lib/skincare/routine';
import { isRecommendationAllowed } from '@/lib/skincare/recommendation-safety';
import type { RoutineSafetyProfile } from '@/lib/safety/routine-guard';
const safe: RoutineSafetyProfile = { consentGiven: true, conditions: [], medications: [] };
const restricted = [
  undefined,
  null,
  { ...safe, consentGiven: false },
  { ...safe, conditions: ['pregnancy'] },
  { ...safe, conditions: ['breastfeeding'] },
  { ...safe, medications: ['isotretinoin'] },
];
describe('스펙 안전 문맥', () => {
  it('미승인 ID, 근거 등급 변경, 출처 위조는 렌더 승인하지 않는다', () => {
    expect(isApprovedStepSpec('spec-cleanser', 'established', 'A1')).toBe(true);
    expect(isApprovedStepSpec('invented', 'established', 'A1')).toBe(false);
    expect(isApprovedStepSpec('spec-toner', 'established', 'LABEL')).toBe(false);
    expect(isApprovedStepSpec('spec-cleanser', 'established', 'invented')).toBe(false);
    expect(isApprovedStepSpec('spec-cleanser', 'unsupported', 'A1')).toBe(false);
  });
  it.each(restricted)('미문진/주의 상태 %j 에서 활성 추천 대신 일반 관리', (safetyProfile) => {
    const context = { safetyProfile, timeOfDay: 'evening' as const };
    const spec = getStepSpec('serum', 'normal', ['wrinkles', 'pigmentation'], 'goal', context);
    expect(spec?.specName).toBe('보습 관리');
    expect(spec?.specReason).not.toMatch(/레티놀|비타민C|농도/);
    const result = generateRoutine({ skinType: 'normal', concerns: ['wrinkles'], ...context });
    expect(result.routine.map((s) => s.specName).join(' ')).not.toContain('레티놀');
    expect(result.personalizationNote).toContain('일반');
  });
  it('오전에 레티놀 저녁 스펙을 배치하지 않는다', () => {
    expect(
      getStepSpec('serum', 'normal', ['wrinkles'], 'goal', {
        safetyProfile: safe,
        timeOfDay: 'morning',
      })
    ).toBeNull();
    expect(
      getStepSpec('serum', 'normal', ['wrinkles'], 'goal', {
        safetyProfile: safe,
        timeOfDay: 'evening',
      })?.claimId
    ).toBe('spec-retinol-evening');
  });
  it('시간대 누락은 레티놀 추천을 허용하지 않는다', () => {
    expect(
      getStepSpec('serum', 'normal', ['wrinkles'], 'goal', { safetyProfile: safe })
    ).toBeNull();
  });
  it('장벽 단계는 목표 레티놀을 제안하지 않는다', () => {
    expect(
      getStepSpec('serum', 'normal', ['wrinkles'], 'barrier', {
        safetyProfile: safe,
        timeOfDay: 'evening',
      })?.specName
    ).toContain('보습');
  });
  it('모든 가시 스펙은 근거·ID를 가지며 출처 없는 농도가 없다', () => {
    for (const category of [
      'cleanser',
      'toner',
      'serum',
      'ampoule',
      'cream',
      'sunscreen',
    ] as const) {
      for (const concern of ['wrinkles', 'pigmentation', 'dryness', 'sensitivity'] as const) {
        const spec = getStepSpec(category, 'normal', [concern], 'goal', {
          safetyProfile: safe,
          timeOfDay: 'evening',
        });
        expect(spec?.claimId).toBeTruthy();
        expect(spec?.sourceId).toBeTruthy();
        expect(spec?.evidence).not.toBe('unsupported');
        expect(spec?.specReason).not.toContain('%');
      }
    }
  });
  it.each(['Retinol', 'Retinal', 'Retinyl Palmitate', '레티놀', 'Tretinoin'])(
    '오전 제품 동의어 %s 차단',
    (name) => {
      expect(isRecommendationAllowed(name, { safetyProfile: safe, timeOfDay: 'morning' })).toBe(
        false
      );
      expect(isRecommendationAllowed(name, { timeOfDay: 'evening' })).toBe(false);
    }
  );
  it.each(['BHA', 'AHA', 'Salicylic Acid', '비타민 C', '나이아신아마이드'])(
    '미문진 활성 %s 차단',
    (name) => {
      expect(isRecommendationAllowed(name)).toBe(false);
    }
  );
});
