/**
 * 제품 번들 추천 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  findSynergyGaps,
  findRoutineGaps,
  findConflicts,
  analyzeBundleOpportunities,
} from '@/lib/products/services/bundle-recommend';

describe('bundle-recommend', () => {
  // ============================================
  // findSynergyGaps
  // ============================================
  describe('findSynergyGaps', () => {
    it('비타민C만 있으면 비타민E 추천', () => {
      const products = [{ name: '비타민c 세럼' }];
      const gaps = findSynergyGaps(products);
      expect(gaps.length).toBeGreaterThan(0);
      expect(gaps[0].type).toBe('synergy');
      expect(gaps[0].suggestedProductName).toContain('비타민E');
    });

    it('히알루론산만 있으면 세라마이드 추천', () => {
      const products = [{ name: '히알루론산 토너' }];
      const gaps = findSynergyGaps(products);
      const ceramideRec = gaps.find((g) => g.suggestedProductName.includes('세라마이드'));
      expect(ceramideRec).toBeDefined();
    });

    it('레티놀만 있으면 세라마이드 보습제 추천', () => {
      const products = [{ name: '레티놀 세럼' }];
      const gaps = findSynergyGaps(products);
      const rec = gaps.find((g) => g.suggestedProductName.includes('세라마이드'));
      expect(rec).toBeDefined();
      expect(rec!.reason).toContain('자극');
    });

    it('비타민C + 비타민E 모두 보유 → 추천 없음', () => {
      const products = [{ name: '비타민c 세럼' }, { name: '비타민e 오일' }];
      const gaps = findSynergyGaps(products);
      const vitERec = gaps.find((g) => g.suggestedProductName.includes('비타민E'));
      expect(vitERec).toBeUndefined();
    });

    it('성분 없는 제품만 → 빈 결과', () => {
      const products = [{ name: '일반 크림' }, { name: '보습 마스크' }];
      expect(findSynergyGaps(products)).toHaveLength(0);
    });

    it('빈 배열 → 빈 결과', () => {
      expect(findSynergyGaps([])).toHaveLength(0);
    });

    it('중복 추천 방지', () => {
      // 나이아신아마이드 (한글) + niacinamide (영문) 둘 다 있어도 히알루론산 1번만 추천
      const products = [{ name: '나이아신아마이드 세럼' }, { name: 'niacinamide 토너' }];
      const gaps = findSynergyGaps(products);
      const haRecs = gaps.filter((g) => g.suggestedProductName.includes('히알루론산'));
      expect(haRecs).toHaveLength(1);
    });

    it('태그 기반 성분도 인식', () => {
      const products = [{ name: '나이트 크림', tags: ['레티놀'] }];
      const gaps = findSynergyGaps(products);
      expect(gaps.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // findRoutineGaps
  // ============================================
  describe('findRoutineGaps', () => {
    it('아무 제품 없으면 6단계 모두 빠짐', () => {
      expect(findRoutineGaps([])).toHaveLength(6);
    });

    it('클렌저+토너만 있으면 4단계 빠짐', () => {
      const products = [{ name: '순한 클렌저' }, { name: '수분 토너' }];
      const gaps = findRoutineGaps(products);
      expect(gaps).toHaveLength(4);
      expect(gaps).toContain('essence');
      expect(gaps).toContain('serum');
      expect(gaps).toContain('cream');
      expect(gaps).toContain('sunscreen');
    });

    it('전체 루틴 보유 → 빈 배열', () => {
      const products = [
        { name: '순한 클렌저' },
        { name: '수분 토너' },
        { name: '영양 에센스' },
        { name: '비타민 세럼' },
        { name: '보습 크림' },
        { name: '선크림 SPF50' },
      ];
      expect(findRoutineGaps(products)).toHaveLength(0);
    });

    it('스킨케어 아닌 제품은 무시', () => {
      const products = [{ name: '아이폰 케이스' }, { name: '비타민 세럼' }];
      const gaps = findRoutineGaps(products);
      expect(gaps).toHaveLength(5); // serum만 커버
    });
  });

  // ============================================
  // findConflicts
  // ============================================
  describe('findConflicts', () => {
    it('레티놀 + AHA → 충돌 감지', () => {
      const products = [{ name: '레티놀 세럼' }, { name: 'AHA 필링 토너' }];
      const conflicts = findConflicts(products);
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].productA).toBe('레티놀 세럼');
      expect(conflicts[0].productB).toBe('AHA 필링 토너');
      expect(conflicts[0].description).toBeTruthy();
      expect(conflicts[0].advice).toBeTruthy();
    });

    it('시너지 관계만 → 충돌 없음', () => {
      const products = [{ name: '비타민c 세럼' }, { name: '비타민e 오일' }];
      expect(findConflicts(products)).toHaveLength(0);
    });

    it('성분 없는 제품 → 충돌 없음', () => {
      const products = [{ name: '일반 크림' }, { name: '보습 마스크' }];
      expect(findConflicts(products)).toHaveLength(0);
    });

    it('빈 배열 → 빈 결과', () => {
      expect(findConflicts([])).toHaveLength(0);
    });

    it('여러 충돌 동시 감지', () => {
      const products = [{ name: '레티놀 크림' }, { name: 'AHA 토너' }, { name: '비타민c 세럼' }];
      const conflicts = findConflicts(products);
      // 레티놀+AHA, 레티놀+비타민c
      expect(conflicts.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ============================================
  // analyzeBundleOpportunities
  // ============================================
  describe('analyzeBundleOpportunities', () => {
    it('빈 제품 → 루틴 갭만 존재', () => {
      const result = analyzeBundleOpportunities([]);
      expect(result.missingSteps).toHaveLength(6);
      expect(result.conflicts).toHaveLength(0);
      // 루틴 갭 추천이 recommendations에 포함
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations[0].type).toBe('routine_gap');
    });

    it('충돌+시너지+갭 통합 분석', () => {
      const products = [{ name: '레티놀 세럼' }, { name: 'AHA 필링 토너' }];
      const result = analyzeBundleOpportunities(products);

      // 충돌: 레티놀+AHA
      expect(result.conflicts.length).toBeGreaterThan(0);

      // 시너지 추천: 레티놀 → 세라마이드 보습제
      const synergyRecs = result.recommendations.filter((r) => r.type === 'synergy');
      expect(synergyRecs.length).toBeGreaterThan(0);

      // 루틴 갭: 클렌저, 에센스, 크림, 선크림 빠짐
      expect(result.missingSteps.length).toBeGreaterThan(0);
    });

    it('완전한 루틴 + 시너지 파트너 보유 → 최소 결과', () => {
      const products = [
        { name: '순한 클렌저' },
        { name: '히알루론산 토너' },
        { name: '나이아신아마이드 에센스' },
        { name: '비타민c 세럼' },
        { name: '세라마이드 크림' },
        { name: '선크림 SPF50' },
        { name: '비타민e 오일' },
      ];
      const result = analyzeBundleOpportunities(products);

      // 루틴 갭 없음
      expect(result.missingSteps).toHaveLength(0);
      // 충돌 없음
      expect(result.conflicts).toHaveLength(0);
    });

    it('recommendations에 시너지+루틴갭 모두 포함', () => {
      const products = [{ name: '비타민c 세럼' }];
      const result = analyzeBundleOpportunities(products);

      const types = result.recommendations.map((r) => r.type);
      expect(types).toContain('synergy');
      expect(types).toContain('routine_gap');
    });
  });
});
