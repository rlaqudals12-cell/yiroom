/**
 * 계절별 제품 매칭 보정 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  getKoreaSeason,
  calculateSeasonalBoost,
  isSeasonalCategory,
  getSeasonalTip,
} from '@/lib/products/services/seasonal-boost';

describe('seasonal-boost', () => {
  // ============================================
  // getKoreaSeason
  // ============================================
  describe('getKoreaSeason', () => {
    it('3월 → spring', () => {
      expect(getKoreaSeason(new Date('2026-03-15'))).toBe('spring');
    });

    it('5월 → spring', () => {
      expect(getKoreaSeason(new Date('2026-05-01'))).toBe('spring');
    });

    it('6월 → summer', () => {
      expect(getKoreaSeason(new Date('2026-06-15'))).toBe('summer');
    });

    it('8월 → summer', () => {
      expect(getKoreaSeason(new Date('2026-08-31'))).toBe('summer');
    });

    it('9월 → autumn', () => {
      expect(getKoreaSeason(new Date('2026-09-01'))).toBe('autumn');
    });

    it('11월 → autumn', () => {
      expect(getKoreaSeason(new Date('2026-11-30'))).toBe('autumn');
    });

    it('12월 → winter', () => {
      expect(getKoreaSeason(new Date('2026-12-25'))).toBe('winter');
    });

    it('1월 → winter', () => {
      expect(getKoreaSeason(new Date('2026-01-15'))).toBe('winter');
    });

    it('2월 → winter', () => {
      expect(getKoreaSeason(new Date('2026-02-28'))).toBe('winter');
    });
  });

  // ============================================
  // calculateSeasonalBoost
  // ============================================
  describe('calculateSeasonalBoost', () => {
    const SUMMER = new Date('2026-07-15');
    const WINTER = new Date('2026-01-15');
    const SPRING = new Date('2026-04-15');

    it('여름에 선크림 → 보너스', () => {
      const result = calculateSeasonalBoost('워터프루프 선크림 SPF50', [], SUMMER);
      expect(result.bonus).toBeGreaterThan(0);
      expect(result.season).toBe('summer');
      expect(result.reason).toContain('여름');
    });

    it('겨울에 보습 크림 → 보너스', () => {
      const result = calculateSeasonalBoost('세라마이드 보습 크림', [], WINTER);
      expect(result.bonus).toBeGreaterThan(0);
      expect(result.reason).toContain('겨울');
    });

    it('봄에 진정 토너 → 보너스', () => {
      const result = calculateSeasonalBoost('시카 진정 토너', [], SPRING);
      expect(result.bonus).toBeGreaterThan(0);
      expect(result.reason).toContain('봄');
    });

    it('여름에 리치 오일 → 감점', () => {
      const result = calculateSeasonalBoost('리치 페이스 오일', [], SUMMER);
      expect(result.bonus).toBeLessThan(0);
      expect(result.reason).toContain('비추천');
    });

    it('겨울에 쿨링 젤 → 감점', () => {
      const result = calculateSeasonalBoost('쿨링 젤 크림', [], WINTER);
      // '크림'은 겨울 긍정 키워드, '쿨링'은 부정 → 감점 상쇄
      expect(result.bonus).toBeLessThanOrEqual(10);
    });

    it('관련 없는 제품 → 보너스 0', () => {
      const result = calculateSeasonalBoost('일반 제품', [], SUMMER);
      expect(result.bonus).toBe(0);
      expect(result.reason).toBeNull();
    });

    it('매칭 키워드 많을수록 높은 보너스 (최대 15)', () => {
      // 여름 키워드 여러 개 포함
      const result = calculateSeasonalBoost('자외선 차단 워터프루프 선크림 SPF50', [], SUMMER);
      expect(result.bonus).toBeLessThanOrEqual(15);
      expect(result.bonus).toBeGreaterThanOrEqual(10);
    });

    it('태그도 검사', () => {
      const result = calculateSeasonalBoost('데일리 크림', ['보습', '수분'], WINTER);
      expect(result.bonus).toBeGreaterThan(0);
    });

    it('긍정+부정 혼합 시 감점 적용', () => {
      // 여름: '자외선'(+), '오일'(-)
      const positive = calculateSeasonalBoost('자외선 차단 세럼', [], SUMMER);
      const mixed = calculateSeasonalBoost('자외선 차단 오일', [], SUMMER);
      expect(mixed.bonus).toBeLessThan(positive.bonus);
    });
  });

  // ============================================
  // isSeasonalCategory
  // ============================================
  describe('isSeasonalCategory', () => {
    it('여름에 skincare는 추천', () => {
      expect(isSeasonalCategory('skincare', new Date('2026-07-15'))).toBe(true);
    });

    it('여름에 supplement는 추천', () => {
      expect(isSeasonalCategory('supplement', new Date('2026-07-15'))).toBe(true);
    });

    it('봄에 equipment는 비추천', () => {
      expect(isSeasonalCategory('equipment', new Date('2026-04-15'))).toBe(false);
    });
  });

  // ============================================
  // getSeasonalTip
  // ============================================
  describe('getSeasonalTip', () => {
    it('봄 팁 포함 "자외선" 또는 "미세먼지"', () => {
      const tip = getSeasonalTip(new Date('2026-04-15'));
      expect(tip.length).toBeGreaterThan(0);
    });

    it('여름 팁 포함 "자외선"', () => {
      const tip = getSeasonalTip(new Date('2026-07-15'));
      expect(tip).toContain('자외선');
    });

    it('가을 팁 포함 "보습"', () => {
      const tip = getSeasonalTip(new Date('2026-10-15'));
      expect(tip).toContain('보습');
    });

    it('겨울 팁 포함 "보습"', () => {
      const tip = getSeasonalTip(new Date('2026-01-15'));
      expect(tip).toContain('보습');
    });
  });
});
