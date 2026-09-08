import { describe, it, expect } from 'vitest';
import {
  STEP_HOWTO,
  HOWTO_SOURCE_AUDIT,
  getApprovedSkincareClaims,
  getStepHowTo,
  HAND_WASH_PRESTEP,
} from '@/lib/skincare/step-howto';
import ko from '@/messages/ko.json';
import en from '@/messages/en.json';
import ja from '@/messages/ja.json';
import zh from '@/messages/zh.json';

describe('승인 사용법 근거 계약', () => {
  it('D3 원판정 50개와 unsupported 21개를 보존한다', () => {
    expect(HOWTO_SOURCE_AUDIT).toHaveLength(50);
    expect(HOWTO_SOURCE_AUDIT.filter((c) => c.evidence === 'unsupported')).toHaveLength(21);
    expect(HOWTO_SOURCE_AUDIT.filter((c) => c.evidence === 'hygiene')).toHaveLength(5);
  });
  it.each(Object.keys(STEP_HOWTO))('%s 가시 문장에 unsupported가 없다', (key) => {
    const how = getStepHowTo(key as keyof typeof STEP_HOWTO)!;
    const claims = [
      how.claims.amount,
      how.claims.method,
      how.claims.waitTime,
      ...how.claims.tips,
    ].filter(Boolean);
    expect(claims.length).toBeGreaterThan(1);
    for (const claim of claims) {
      expect(claim?.evidence).not.toBe('unsupported');
      expect(claim?.sourceId).toBeTruthy();
      expect(claim?.scope).toBeTruthy();
    }
  });
  it('수치가 있는 승인 문장은 AAD 선크림/CDC 손씻기 출처에만 있다', () => {
    const numeric = getApprovedSkincareClaims().filter((c) => /[0-9]/.test(c.text));
    expect(numeric.map((c) => c.id).sort()).toEqual(['handTime', 'sunBefore', 'sunRepeat']);
    expect(numeric.every((c) => ['A2', 'C1'].includes(c.sourceId))).toBe(true);
  });
  it('선크림은 약15분/야외2시간/땀·수영 조건을 유지한다', () => {
    expect(STEP_HOWTO.sunscreen.method).toContain('15분');
    expect(STEP_HOWTO.sunscreen.waitTime).toMatch(/야외.*2시간.*땀.*수영/);
    expect(STEP_HOWTO.sunscreen.amount).toContain('충분');
  });
  it('4언어 모든 승인 ID가 존재하고 수치의 강도가 같다', () => {
    for (const messages of [ko, en, ja, zh]) {
      const texts = messages.skincareClaims as Record<string, string>;
      for (const claim of getApprovedSkincareClaims()) expect(texts[claim.id]).toBeTruthy();
      expect(texts.sunBefore.match(/[0-9]+/g)).toEqual(['15']);
      expect(texts.sunRepeat.match(/[0-9]+/g)).toEqual(['2']);
      expect(texts.handTime.match(/[0-9]+/g)).toEqual(['20']);
    }
  });
  it('위생 프리스텝은 효능 주장을 하지 않는다', () => {
    expect(HAND_WASH_PRESTEP.label).toBe('손 씻기');
    expect(HAND_WASH_PRESTEP.note).toContain('위생');
  });
});
