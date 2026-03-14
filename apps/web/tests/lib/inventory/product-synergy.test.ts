/**
 * 제품 시너지/충돌 탐지 테스트
 */
import { describe, it, expect } from 'vitest';
import {
  extractIngredientKeywords,
  analyzeInteraction,
  analyzeInventoryInteractions,
  inferRoutineStep,
  suggestRoutineOrder,
} from '@/lib/inventory/product-synergy';

describe('product-synergy', () => {
  // ============================================
  // extractIngredientKeywords
  // ============================================
  describe('extractIngredientKeywords', () => {
    it('제품 이름에서 성분 추출', () => {
      const keywords = extractIngredientKeywords('레티놀 세럼');
      expect(keywords).toContain('레티놀');
    });

    it('영문 성분 추출', () => {
      const keywords = extractIngredientKeywords('Retinol Night Cream');
      expect(keywords).toContain('retinol');
    });

    it('태그에서 성분 추출', () => {
      const keywords = extractIngredientKeywords('나이트 크림', ['레티놀', '보습']);
      expect(keywords).toContain('레티놀');
    });

    it('여러 성분 동시 추출', () => {
      const keywords = extractIngredientKeywords('비타민c 히알루론산 세럼');
      expect(keywords).toContain('비타민c');
      expect(keywords).toContain('히알루론산');
    });

    it('성분 없는 제품 → 빈 배열', () => {
      const keywords = extractIngredientKeywords('일반 크림');
      expect(keywords).toHaveLength(0);
    });

    it('대소문자 무시', () => {
      const keywords = extractIngredientKeywords('NIACINAMIDE 토너');
      expect(keywords).toContain('niacinamide');
    });

    it('태그 없으면 이름만 검사', () => {
      const keywords = extractIngredientKeywords('세라마이드 크림');
      expect(keywords).toContain('세라마이드');
    });

    it('복합 영문 성분 (hyaluronic acid)', () => {
      const keywords = extractIngredientKeywords('hyaluronic acid serum');
      expect(keywords).toContain('hyaluronic acid');
    });
  });

  // ============================================
  // analyzeInteraction
  // ============================================
  describe('analyzeInteraction', () => {
    it('레티놀 + AHA → conflict', () => {
      const interactions = analyzeInteraction(['레티놀'], ['aha']);
      expect(interactions).toHaveLength(1);
      expect(interactions[0].type).toBe('conflict');
      expect(interactions[0].ingredientA).toBe('레티놀');
      expect(interactions[0].ingredientB).toBe('aha');
    });

    it('레티놀 + 비타민c → conflict', () => {
      const interactions = analyzeInteraction(['레티놀'], ['비타민c']);
      expect(interactions).toHaveLength(1);
      expect(interactions[0].type).toBe('conflict');
    });

    it('나이아신아마이드 + AHA → conflict', () => {
      const interactions = analyzeInteraction(['niacinamide'], ['aha']);
      expect(interactions).toHaveLength(1);
      expect(interactions[0].type).toBe('conflict');
    });

    it('벤조일퍼옥사이드 + 레티놀 → conflict', () => {
      const interactions = analyzeInteraction(['벤조일퍼옥사이드'], ['레티놀']);
      expect(interactions).toHaveLength(1);
      expect(interactions[0].type).toBe('conflict');
    });

    it('비타민c + 비타민e → synergy', () => {
      const interactions = analyzeInteraction(['비타민c'], ['비타민e']);
      expect(interactions).toHaveLength(1);
      expect(interactions[0].type).toBe('synergy');
    });

    it('히알루론산 + 세라마이드 → synergy', () => {
      const interactions = analyzeInteraction(['히알루론산'], ['세라마이드']);
      expect(interactions).toHaveLength(1);
      expect(interactions[0].type).toBe('synergy');
    });

    it('나이아신아마이드 + 히알루론산 → synergy', () => {
      const interactions = analyzeInteraction(['niacinamide'], ['히알루론산']);
      expect(interactions).toHaveLength(1);
      expect(interactions[0].type).toBe('synergy');
    });

    it('레티놀 + 세라마이드 → synergy', () => {
      const interactions = analyzeInteraction(['retinol'], ['ceramide']);
      expect(interactions).toHaveLength(1);
      expect(interactions[0].type).toBe('synergy');
    });

    it('비타민c + 페룰산 → synergy', () => {
      const interactions = analyzeInteraction(['비타민c'], ['페룰산']);
      expect(interactions).toHaveLength(1);
      expect(interactions[0].type).toBe('synergy');
    });

    it('역방향도 감지 (B→A)', () => {
      const interactions = analyzeInteraction(['aha'], ['레티놀']);
      expect(interactions).toHaveLength(1);
      expect(interactions[0].type).toBe('conflict');
    });

    it('관련 없는 성분 → 빈 배열', () => {
      const interactions = analyzeInteraction(['세라마이드'], ['스쿠알란']);
      // 세라마이드 + 스쿠알란은 시너지/충돌 규칙에 없음 (레티놀+세라마이드는 있지만)
      // 단, 레티놀 시너지 규칙에 세라마이드+스쿠알란 둘 다 있으므로 확인
      // rule: a=['레티놀'], b=['세라마이드', 'squalane'] → 둘 다 b에 속하지만 a가 없으므로 미매칭
      expect(interactions).toHaveLength(0);
    });

    it('빈 성분 배열 → 빈 결과', () => {
      expect(analyzeInteraction([], ['레티놀'])).toHaveLength(0);
      expect(analyzeInteraction(['레티놀'], [])).toHaveLength(0);
    });

    it('충돌과 시너지 동시 발생 가능', () => {
      // 나이아신아마이드: 충돌(+AHA), 시너지(+히알루론산)
      const interactions = analyzeInteraction(['niacinamide'], ['aha', '히알루론산']);
      const types = interactions.map((i) => i.type);
      expect(types).toContain('conflict');
      expect(types).toContain('synergy');
    });

    it('description과 advice 존재', () => {
      const interactions = analyzeInteraction(['레티놀'], ['aha']);
      expect(interactions[0].description).toBeTruthy();
      expect(interactions[0].advice).toBeTruthy();
    });
  });

  // ============================================
  // analyzeInventoryInteractions
  // ============================================
  describe('analyzeInventoryInteractions', () => {
    it('빈 제품 목록 → 빈 결과', () => {
      expect(analyzeInventoryInteractions([])).toHaveLength(0);
    });

    it('성분 없는 제품만 → 빈 결과', () => {
      const products = [{ name: '일반 크림' }, { name: '보습 마스크' }];
      expect(analyzeInventoryInteractions(products)).toHaveLength(0);
    });

    it('2개 제품 간 충돌 감지', () => {
      const products = [{ name: '레티놀 세럼' }, { name: 'AHA 필링 토너' }];
      const results = analyzeInventoryInteractions(products);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].type).toBe('conflict');
      expect(results[0].productA).toBe('레티놀 세럼');
      expect(results[0].productB).toBe('AHA 필링 토너');
    });

    it('2개 제품 간 시너지 감지', () => {
      const products = [{ name: '비타민c 세럼' }, { name: '비타민e 오일' }];
      const results = analyzeInventoryInteractions(products);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].type).toBe('synergy');
    });

    it('3개 제품 조합 분석', () => {
      const products = [
        { name: '레티놀 크림' },
        { name: '비타민c 세럼' },
        { name: '세라마이드 크림' },
      ];
      const results = analyzeInventoryInteractions(products);
      // 레티놀+비타민c: conflict
      // 레티놀+세라마이드: synergy
      // 비타민c+세라마이드: 규칙 없음
      expect(results.length).toBeGreaterThanOrEqual(2);
      const types = results.map((r) => r.type);
      expect(types).toContain('conflict');
      expect(types).toContain('synergy');
    });

    it('태그 기반 성분도 인식', () => {
      const products = [{ name: '나이트 크림', tags: ['레티놀'] }, { name: 'AHA 토너' }];
      const results = analyzeInventoryInteractions(products);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].type).toBe('conflict');
    });

    it('중복 없이 쌍별 분석 (i < j)', () => {
      const products = [{ name: '비타민c 세럼' }, { name: '비타민e 크림' }];
      const results = analyzeInventoryInteractions(products);
      // (A,B)만 검사하고 (B,A)는 건너뛰므로 중복 없음
      expect(results).toHaveLength(1);
    });
  });

  // ============================================
  // inferRoutineStep
  // ============================================
  describe('inferRoutineStep', () => {
    it('클렌저 → cleansing', () => {
      expect(inferRoutineStep('순한 클렌저')).toBe('cleansing');
    });

    it('폼 → cleansing', () => {
      expect(inferRoutineStep('약산성 폼')).toBe('cleansing');
    });

    it('토너 → toner', () => {
      expect(inferRoutineStep('히알루론산 토너')).toBe('toner');
    });

    it('스킨 → toner', () => {
      expect(inferRoutineStep('수분 스킨')).toBe('toner');
    });

    it('에센스 → essence', () => {
      expect(inferRoutineStep('갈락토미세스 에센스')).toBe('essence');
    });

    it('앰플 → essence', () => {
      expect(inferRoutineStep('비타민 앰플')).toBe('essence');
    });

    it('세럼 → serum', () => {
      expect(inferRoutineStep('레티놀 세럼')).toBe('serum');
    });

    it('크림 → cream', () => {
      expect(inferRoutineStep('수분크림')).toBe('cream');
    });

    it('로션 → cream', () => {
      expect(inferRoutineStep('바디로션')).toBe('cream');
    });

    it('선크림 → sunscreen', () => {
      expect(inferRoutineStep('워터리 선크림')).toBe('sunscreen');
    });

    it('SPF → sunscreen', () => {
      expect(inferRoutineStep('데일리 SPF 50')).toBe('sunscreen');
    });

    it('매칭 안 되면 null', () => {
      expect(inferRoutineStep('아이폰 케이스')).toBeNull();
    });
  });

  // ============================================
  // suggestRoutineOrder
  // ============================================
  describe('suggestRoutineOrder', () => {
    it('빈 배열 → 빈 결과', () => {
      expect(suggestRoutineOrder([])).toHaveLength(0);
    });

    it('올바른 순서 정렬', () => {
      const products = [
        { name: '수분크림' }, // cream (4)
        { name: '순한 클렌저' }, // cleansing (0)
        { name: '비타민 세럼' }, // serum (3)
        { name: '히알루론산 토너' }, // toner (1)
        { name: '워터리 선크림 SPF50' }, // sunscreen (5)
      ];
      const order = suggestRoutineOrder(products);

      expect(order).toHaveLength(5);
      expect(order[0].step).toBe('cleansing');
      expect(order[1].step).toBe('toner');
      expect(order[2].step).toBe('serum');
      expect(order[3].step).toBe('cream');
      expect(order[4].step).toBe('sunscreen');
    });

    it('매칭 안 되는 제품은 제외', () => {
      const products = [{ name: '레티놀 세럼' }, { name: '아이폰 케이스' }, { name: '수분 토너' }];
      const order = suggestRoutineOrder(products);
      expect(order).toHaveLength(2);
      expect(order[0].step).toBe('toner');
      expect(order[1].step).toBe('serum');
    });

    it('각 항목에 reason 포함', () => {
      const products = [{ name: '순한 클렌저' }];
      const order = suggestRoutineOrder(products);
      expect(order[0].reason).toBeTruthy();
      expect(order[0].productName).toBe('순한 클렌저');
    });

    it('동일 단계 제품 여러 개 허용', () => {
      const products = [{ name: '비타민c 세럼' }, { name: '레티놀 세럼' }];
      const order = suggestRoutineOrder(products);
      expect(order).toHaveLength(2);
      expect(order[0].step).toBe('serum');
      expect(order[1].step).toBe('serum');
    });
  });
});
