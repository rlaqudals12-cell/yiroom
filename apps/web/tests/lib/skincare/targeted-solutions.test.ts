/**
 * 맞춤 솔루션 시스템 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  recommendSolutions,
  recommendAcnePatchType,
  checkSolutionCompatibility,
  TARGETED_SOLUTIONS,
} from '@/lib/skincare/targeted-solutions';

describe('targeted-solutions', () => {
  describe('recommendSolutions', () => {
    it('여드름 고민에 여드름 패치와 스팟 트리트먼트를 추천해야 함', () => {
      const result = recommendSolutions(['acne']);

      expect(result.solutions).toBeDefined();
      const types = result.solutions.map((s) => s.type);
      expect(types).toContain('acne_patch');
      expect(types).toContain('spot_treatment');
    });

    it('주름 고민에 집중 세럼을 추천해야 함', () => {
      const result = recommendSolutions(['wrinkles']);

      const types = result.solutions.map((s) => s.type);
      expect(types).toContain('intensive_serum');
    });

    it('홍조 고민에 진정 젤/미스트를 추천해야 함', () => {
      const result = recommendSolutions(['redness']);

      const types = result.solutions.map((s) => s.type);
      expect(types).toContain('soothing_gel');
      expect(types).toContain('calming_mist');
    });

    it('첫 번째 고민 기반 우선순위 솔루션이 설정되어야 함', () => {
      const result = recommendSolutions(['acne', 'redness']);

      expect(result.prioritySolution).toBeDefined();
      // 첫 번째 고민인 acne 기반
      expect(result.prioritySolution?.type).toBe('acne_patch');
    });

    it('고민이 없으면 우선순위 솔루션이 null이어야 함', () => {
      const result = recommendSolutions([]);

      expect(result.prioritySolution).toBeNull();
    });

    it('개인화 노트가 생성되어야 함', () => {
      const result = recommendSolutions(['acne']);

      expect(result.personalizationNote).toBeDefined();
      expect(result.personalizationNote.length).toBeGreaterThan(0);
      expect(result.personalizationNote).toContain('여드름');
    });

    it('고민이 없으면 기본 노트가 반환되어야 함', () => {
      const result = recommendSolutions([]);

      expect(result.personalizationNote).toContain('기본 루틴');
    });
  });

  describe('recommendAcnePatchType', () => {
    it('열린 여드름 + 농이 있으면 하이드로콜로이드 패치를 추천해야 함', () => {
      const result = recommendAcnePatchType({
        isOpen: true,
        hasHead: true,
        isDeep: false,
      });

      expect(result.recommended).toBe(true);
      expect(result.reason).toContain('하이드로콜로이드');
    });

    it('깊은 낭포성 여드름에는 패치 효과가 제한적임을 안내해야 함', () => {
      const result = recommendAcnePatchType({
        isOpen: false,
        hasHead: false,
        isDeep: true,
      });

      expect(result.recommended).toBe(false);
      expect(result.reason).toContain('제한적');
      expect(result.alternative).toBeDefined();
      expect(result.alternative).toContain('피부과');
    });

    it('닫힌 여드름에는 마이크로니들 패치를 권장해야 함', () => {
      const result = recommendAcnePatchType({
        isOpen: false,
        hasHead: false,
        isDeep: false,
      });

      expect(result.recommended).toBe(true);
      expect(result.reason).toContain('마이크로니들');
    });
  });

  describe('checkSolutionCompatibility', () => {
    it('레티놀 사용 중 스팟 트리트먼트 주의를 알려야 함', () => {
      const result = checkSolutionCompatibility(['spot_treatment'], {
        hasRetinol: true,
        hasAcid: false,
      });

      expect(result.compatible).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('레티놀');
    });

    it('산 성분 사용 중 집중 세럼 주의를 알려야 함', () => {
      const result = checkSolutionCompatibility(['intensive_serum'], {
        hasRetinol: false,
        hasAcid: true,
      });

      expect(result.compatible).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('산 성분');
    });

    it('충돌 없으면 compatible이 true여야 함', () => {
      const result = checkSolutionCompatibility(['soothing_gel'], {
        hasRetinol: false,
        hasAcid: false,
      });

      expect(result.compatible).toBe(true);
      expect(result.warnings.length).toBe(0);
    });
  });

  describe('TARGETED_SOLUTIONS', () => {
    it('모든 솔루션 타입이 정의되어 있어야 함', () => {
      const expectedTypes = [
        'acne_patch',
        'spot_treatment',
        'soothing_gel',
        'intensive_serum',
        'eye_patch',
        'lip_treatment',
        'calming_mist',
      ];

      expectedTypes.forEach((type) => {
        expect(TARGETED_SOLUTIONS[type as keyof typeof TARGETED_SOLUTIONS]).toBeDefined();
      });
    });

    it('여드름 패치에 임상시험 결과 정보가 있어야 함', () => {
      const acnePatch = TARGETED_SOLUTIONS.acne_patch;

      expect(acnePatch.effectiveness).toContain('임상시험');
    });

    it('각 솔루션에 제한사항 정보가 있어야 함', () => {
      const acnePatch = TARGETED_SOLUTIONS.acne_patch;

      expect(acnePatch.limitations).toBeDefined();
      expect(acnePatch.limitations.length).toBeGreaterThan(0);
      // 낭포성 여드름 제한 언급
      expect(acnePatch.limitations.some((l) => l.includes('낭포성'))).toBe(true);
    });
  });
});
