/**
 * 커미션 규칙 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  calculateCommission,
  inferCategory,
  getCommissionRateTable,
  COMMISSION_RATES,
  MIN_COMMISSION_KRW,
  MAX_COMMISSION_KRW,
} from '@/lib/affiliate/commission';

describe('commission', () => {
  // ============================================
  // calculateCommission
  // ============================================
  describe('calculateCommission', () => {
    it('스킨케어 7% 적용', () => {
      const result = calculateCommission(100_000, 'skincare', 'coupang');
      expect(result.ratePercent).toBe(7);
      expect(result.commissionKrw).toBe(7_000);
      expect(result.clamped).toBe(false);
    });

    it('메이크업 7% 적용', () => {
      const result = calculateCommission(50_000, 'makeup', 'coupang');
      expect(result.commissionKrw).toBe(3_500);
    });

    it('운동 장비 3% 적용', () => {
      const result = calculateCommission(200_000, 'equipment', 'coupang');
      expect(result.ratePercent).toBe(3);
      expect(result.commissionKrw).toBe(6_000);
    });

    it('알 수 없는 카테고리 → default 4%', () => {
      const result = calculateCommission(100_000, 'unknown_category', 'coupang');
      expect(result.ratePercent).toBe(4);
      expect(result.category).toBe('unknown_category');
    });

    it('카테고리 정규화 (대소문자, 특수문자)', () => {
      const result = calculateCommission(100_000, 'Skin-Care!', 'coupang');
      expect(result.category).toBe('skincare');
      expect(result.ratePercent).toBe(7);
    });

    it('최소 커미션 클램핑 (쿠팡 100원)', () => {
      // 1,000원 × 3% = 30원 < 100원 → 100원
      const result = calculateCommission(1_000, 'equipment', 'coupang');
      expect(result.commissionKrw).toBe(MIN_COMMISSION_KRW.coupang);
      expect(result.clamped).toBe(true);
    });

    it('최대 커미션 클램핑 (쿠팡 50,000원)', () => {
      // 10,000,000원 × 8% = 800,000원 > 50,000원 → 50,000원
      const result = calculateCommission(10_000_000, 'fragrance', 'coupang');
      expect(result.commissionKrw).toBe(MAX_COMMISSION_KRW.coupang);
      expect(result.clamped).toBe(true);
    });

    it('iherb 최소 커미션 200원', () => {
      const result = calculateCommission(1_000, 'supplement', 'iherb');
      expect(result.commissionKrw).toBe(200);
      expect(result.clamped).toBe(true);
    });

    it('musinsa 최대 커미션 30,000원', () => {
      const result = calculateCommission(5_000_000, 'fragrance', 'musinsa');
      expect(result.commissionKrw).toBe(30_000);
      expect(result.clamped).toBe(true);
    });

    it('매출 0원 시 최소 커미션 미적용', () => {
      const result = calculateCommission(0, 'skincare', 'coupang');
      expect(result.commissionKrw).toBe(0);
      expect(result.clamped).toBe(false);
    });

    it('알 수 없는 파트너 → default 최소/최대 적용', () => {
      const result = calculateCommission(100_000, 'skincare', 'oliveyoung' as 'coupang');
      expect(result.commissionKrw).toBe(7_000);
    });

    it('반올림 처리', () => {
      // 33,333원 × 7% = 2,333.31 → 2,333원
      const result = calculateCommission(33_333, 'skincare', 'coupang');
      expect(result.commissionKrw).toBe(2_333);
    });

    it('향수 8% (최고 커미션율)', () => {
      const result = calculateCommission(100_000, 'fragrance', 'coupang');
      expect(result.ratePercent).toBe(8);
      expect(result.commissionKrw).toBe(8_000);
    });

    it('프로틴 4%', () => {
      const result = calculateCommission(50_000, 'protein', 'iherb');
      expect(result.ratePercent).toBe(4);
      expect(result.commissionKrw).toBe(2_000);
    });
  });

  // ============================================
  // inferCategory
  // ============================================
  describe('inferCategory', () => {
    // 뷰티/스킨케어
    it('세럼 → skincare', () => {
      expect(inferCategory('비타민C 세럼')).toBe('skincare');
    });

    it('선크림 → skincare', () => {
      expect(inferCategory('워터리 선크림 SPF50')).toBe('skincare');
    });

    it('립스틱 → makeup', () => {
      expect(inferCategory('벨벳 립 틴트')).toBe('makeup');
    });

    it('파운데이션 → makeup', () => {
      expect(inferCategory('쿠션 파운데이션')).toBe('makeup');
    });

    it('샴푸 → haircare', () => {
      expect(inferCategory('두피 클렌징 샴푸')).toBe('haircare');
    });

    it('탈모 → haircare', () => {
      expect(inferCategory('탈모 방지 토닉', '닥터포헤어')).toBe('haircare');
    });

    it('향수 → fragrance', () => {
      expect(inferCategory('오드퍼퓸 50ml')).toBe('fragrance');
    });

    it('바디미스트 → fragrance', () => {
      expect(inferCategory('플로럴 바디미스트')).toBe('fragrance');
    });

    // 건강/영양
    it('비타민 → supplement', () => {
      expect(inferCategory('비타민D 1000IU')).toBe('supplement');
    });

    it('유산균 → supplement', () => {
      expect(inferCategory('프로바이오틱스 유산균')).toBe('supplement');
    });

    it('프로틴 → protein', () => {
      expect(inferCategory('웨이 프로틴 초코맛')).toBe('protein');
    });

    it('BCAA → protein', () => {
      expect(inferCategory('BCAA 아미노산')).toBe('protein');
    });

    it('그래놀라 → health_food', () => {
      expect(inferCategory('오트 그래놀라')).toBe('health_food');
    });

    // 패션
    it('티셔츠 → fashion', () => {
      expect(inferCategory('오버핏 티셔츠')).toBe('fashion');
    });

    it('가방 → accessories', () => {
      expect(inferCategory('미니 크로스백 가방')).toBe('accessories');
    });

    it('선글라스 → accessories', () => {
      expect(inferCategory('UV 선글라스')).toBe('accessories');
    });

    // 운동
    it('덤벨 → equipment', () => {
      expect(inferCategory('조절식 덤벨 24kg')).toBe('equipment');
    });

    it('요가매트 → equipment', () => {
      expect(inferCategory('TPE 매트 6mm')).toBe('equipment');
    });

    it('레깅스 → sportswear', () => {
      expect(inferCategory('하이웨스트 레깅스')).toBe('sportswear');
    });

    it('런닝화 → sportswear', () => {
      expect(inferCategory('에어 런닝화', '나이키')).toBe('sportswear');
    });

    // 기본
    it('매칭 안 되면 default', () => {
      expect(inferCategory('아이폰 케이스')).toBe('default');
    });

    it('빈 문자열 → default', () => {
      expect(inferCategory('')).toBe('default');
    });

    it('브랜드에 키워드 포함 시 매칭됨', () => {
      // inferCategory는 productName + brand를 합쳐서 검사
      expect(inferCategory('제품A', '세럼브랜드')).toBe('skincare');
    });

    it('브랜드에 키워드 없으면 default', () => {
      expect(inferCategory('제품A', '브랜드B')).toBe('default');
    });
  });

  // ============================================
  // getCommissionRateTable
  // ============================================
  describe('getCommissionRateTable', () => {
    it('모든 카테고리 반환', () => {
      const table = getCommissionRateTable();
      expect(table.length).toBe(Object.keys(COMMISSION_RATES).length);
    });

    it('카테고리와 커미션율 포함', () => {
      const table = getCommissionRateTable();
      const skincare = table.find((r) => r.category === 'skincare');
      expect(skincare).toBeDefined();
      expect(skincare!.ratePercent).toBe(7);
    });

    it('default 카테고리 포함', () => {
      const table = getCommissionRateTable();
      const def = table.find((r) => r.category === 'default');
      expect(def).toBeDefined();
      expect(def!.ratePercent).toBe(4);
    });
  });

  // ============================================
  // 상수 검증
  // ============================================
  describe('상수 검증', () => {
    it('모든 커미션율이 0보다 큼', () => {
      Object.values(COMMISSION_RATES).forEach((rate) => {
        expect(rate).toBeGreaterThan(0);
      });
    });

    it('최소 커미션이 최대 커미션보다 작음', () => {
      for (const partner of ['coupang', 'iherb', 'musinsa']) {
        expect(MIN_COMMISSION_KRW[partner]).toBeLessThan(MAX_COMMISSION_KRW[partner]);
      }
    });

    it('커미션율 범위 3-8%', () => {
      Object.values(COMMISSION_RATES).forEach((rate) => {
        expect(rate).toBeGreaterThanOrEqual(3);
        expect(rate).toBeLessThanOrEqual(8);
      });
    });
  });
});
