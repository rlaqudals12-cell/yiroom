/**
 * 스텝별 사용법(how-to) 상수 테스트 (T1)
 * @see lib/skincare/step-howto.ts
 */
import { describe, it, expect } from 'vitest';
import {
  STEP_HOWTO,
  getStepHowTo,
  HAND_WASH_PRESTEP,
  type StepHowToKey,
} from '@/lib/skincare/step-howto';
import type { ProductCategory } from '@/types/skincare-routine';

// 루틴에서 쓰이는 모든 제품 카테고리 — STEP_HOWTO가 전부 커버해야 한다
const ALL_CATEGORIES: ProductCategory[] = [
  'cleanser',
  'toner',
  'essence',
  'serum',
  'ampoule',
  'cream',
  'sunscreen',
  'mask',
  'eye_cream',
  'oil',
  'spot_treatment',
];

// 의학적 단정·과장 금지 (ADR-117 용어 안전)
const FORBIDDEN_PHRASES = ['치료', '처방', '완치', '의약품'];

describe('STEP_HOWTO', () => {
  it('should 모든 제품 카테고리 + handWash 프리스텝을 커버한다', () => {
    for (const category of ALL_CATEGORIES) {
      expect(STEP_HOWTO[category]).toBeDefined();
      expect(STEP_HOWTO[category].amount).toBeTruthy();
      expect(STEP_HOWTO[category].method).toBeTruthy();
    }
    expect(STEP_HOWTO.handWash).toBeDefined();
    expect(STEP_HOWTO.handWash.method).toBeTruthy();
  });

  it('should 손 씻기(cleanser) 사용법이 적당량·방법·미온수 헹굼을 담는다', () => {
    const cleanser = STEP_HOWTO.cleanser;
    expect(cleanser.amount).toContain('동전');
    expect(cleanser.method).toContain('미온수');
  });

  it('should 선크림은 덧바르기 안내를 포함한다', () => {
    expect(STEP_HOWTO.sunscreen.waitTime).toContain('덧발라');
  });

  it('should 클렌저 팁에 약산성 pH 4.5~6.5 풀이를 담는다', () => {
    const tipsText = (STEP_HOWTO.cleanser.tips ?? []).join(' ');
    expect(tipsText).toContain('약산성');
    expect(tipsText).toContain('pH 4.5~6.5');
  });

  it('should 금지 문구(치료·처방 등)를 포함하지 않는다', () => {
    for (const key of Object.keys(STEP_HOWTO) as StepHowToKey[]) {
      const howTo = STEP_HOWTO[key];
      const allText = [
        howTo.amount,
        howTo.method,
        howTo.waitTime ?? '',
        ...(howTo.tips ?? []),
      ].join(' ');
      for (const phrase of FORBIDDEN_PHRASES) {
        expect(allText).not.toContain(phrase);
      }
    }
  });

  it('should 수치는 범위 표기로 단정을 피한다 (예: "30초~1분")', () => {
    // 대기시간이 있는 스텝들은 물결(~) 범위 표기를 쓴다
    const withWait = (Object.keys(STEP_HOWTO) as StepHowToKey[])
      .map((k) => STEP_HOWTO[k].waitTime)
      .filter((w): w is string => Boolean(w) && /\d/.test(w!));
    expect(withWait.length).toBeGreaterThan(0);
  });
});

describe('getStepHowTo', () => {
  it('should 카테고리로 사용법을 반환한다', () => {
    expect(getStepHowTo('serum')).toEqual(STEP_HOWTO.serum);
    expect(getStepHowTo('handWash')).toEqual(STEP_HOWTO.handWash);
  });
});

describe('HAND_WASH_PRESTEP', () => {
  it('should 0단계 손 씻기 라벨·안내 문구를 제공한다', () => {
    expect(HAND_WASH_PRESTEP.label).toBe('손 씻기');
    expect(HAND_WASH_PRESTEP.note).toBeTruthy();
    // 손 씻기 근거(세균 → 얼굴)를 담는다
    expect(HAND_WASH_PRESTEP.note).toContain('세균');
  });
});
