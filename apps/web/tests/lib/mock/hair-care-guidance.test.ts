/**
 * H-1 헤어 케어 가이드 보완 테스트 (W2 창업자 피드백)
 * - 두피 타입별 주의 성분
 * - 두피 고민 안내 (진단 아님, 전문의 상담 권유)
 */

import { describe, it, expect } from 'vitest';
import {
  getCautionIngredients,
  getScalpConcernNotice,
  type ScalpTypeId,
  type HairConcernId,
} from '@/lib/mock/hair-analysis';

describe('getCautionIngredients (주의 성분)', () => {
  const scalps: ScalpTypeId[] = ['dry', 'normal', 'oily', 'sensitive'];

  it('모든 두피 타입에 대해 비어있지 않은 주의 성분을 반환한다', () => {
    for (const scalp of scalps) {
      const cautions = getCautionIngredients(scalp);
      expect(cautions.length).toBeGreaterThan(0);
    }
  });

  it('민감성 두피는 설페이트·향료 주의를 포함한다', () => {
    const cautions = getCautionIngredients('sensitive').join(' ');
    expect(cautions).toContain('설페이트');
    expect(cautions).toContain('향료');
  });

  it('지성 두피는 무거운 오일 주의를 포함한다', () => {
    expect(getCautionIngredients('oily').join(' ')).toContain('오일');
  });

  it('두피 타입 미상이면 공통 주의 성분을 반환한다', () => {
    const cautions = getCautionIngredients(undefined);
    expect(cautions.length).toBeGreaterThan(0);
  });
});

describe('getScalpConcernNotice (두피 고민 안내)', () => {
  it('탈모 고민이 있으면 전문의 상담 안내를 반환한다', () => {
    const notice = getScalpConcernNotice(['hairloss']);
    expect(notice).not.toBeNull();
    expect(notice).toContain('전문의');
  });

  it('비듬 고민이 있으면 전문의 상담 안내를 반환한다', () => {
    const notice = getScalpConcernNotice(['dandruff']);
    expect(notice).not.toBeNull();
  });

  it('진단 표현이 아닌 "의심"·"상담 권유" 형태여야 한다', () => {
    const notice = getScalpConcernNotice(['hairloss']) ?? '';
    // 진단·처방·치료 단정 표현 금지
    expect(notice).not.toMatch(/진단합니다|처방|치료해/);
    expect(notice).toMatch(/의심|상담을 권/);
  });

  it('의료 상담이 필요 없는 고민만 있으면 null을 반환한다', () => {
    const concerns: HairConcernId[] = ['frizz', 'split-ends', 'lack-volume'];
    expect(getScalpConcernNotice(concerns)).toBeNull();
  });

  it('고민이 없으면 null을 반환한다', () => {
    expect(getScalpConcernNotice([])).toBeNull();
  });
});
