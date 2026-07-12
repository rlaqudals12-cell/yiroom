/**
 * Makeup Composer 순수 함수 테스트
 *
 * @see lib/analysis/integrated/internal/makeup-composer.ts
 * @see docs/specs/SDD-INTEGRATED-ANALYSIS.md §6 ATOM 5
 *
 * @note internal import는 테스트 예외로 허용 (BOUNDARIES.md 참조)
 */

import { describe, it, expect } from 'vitest';
import { composeMakeupData } from '@/lib/analysis/integrated/internal/makeup-composer';
import type { PersonalColorAxisData, SkinAxisData } from '@/lib/analysis/integrated';

// ============================================
// Fixtures
// ============================================

const pcWarm: PersonalColorAxisData = {
  season: 'spring',
  tone: 'light-spring',
  undertone: 'warm',
  confidence: 88,
  palette: ['#F9A8D4', '#FBCFE8', '#F472B6', '#EC4899', '#DB2777', '#BE185D'],
};

const pcCool: PersonalColorAxisData = {
  season: 'summer',
  tone: 'true-summer',
  undertone: 'cool',
  confidence: 85,
  palette: ['#A5B4FC', '#C4B5FD', '#818CF8', '#6366F1'],
};

const skinDryHigh: SkinAxisData = {
  skinType: 'dry',
  overallScore: 85,
};

const skinOilyLow: SkinAxisData = {
  skinType: 'oily',
  overallScore: 45,
};

const skinCombinationMid: SkinAxisData = {
  skinType: 'combination',
  overallScore: 65,
};

// ============================================
// Tests
// ============================================

describe('composeMakeupData — 순수 조합 로직', () => {
  describe('베이스 추천 도출 (소비자 눈높이 한국어 — 원시 영문 노출 금지)', () => {
    it('건성 피부 + 높은 점수 → 듀이 + 라이트 커버', () => {
      const result = composeMakeupData(pcWarm, skinDryHigh);
      expect(result.baseRecommendation).toContain('건성');
      expect(result.baseRecommendation).toContain('듀이');
      expect(result.baseRecommendation).toContain('라이트');
      // 원시 영문값(dewy/light) 노출 금지
      expect(result.baseRecommendation).not.toMatch(/dewy|light/i);
    });

    it('지성 피부 + 낮은 점수 → 매트 + 풀 커버', () => {
      const result = composeMakeupData(pcCool, skinOilyLow);
      expect(result.baseRecommendation).toContain('지성');
      expect(result.baseRecommendation).toContain('매트');
      expect(result.baseRecommendation).toContain('풀');
      expect(result.baseRecommendation).not.toMatch(/matte|full/i);
    });

    it('복합성 피부 + 중간 점수 → 세미매트 + 미디엄', () => {
      const result = composeMakeupData(pcWarm, skinCombinationMid);
      expect(result.baseRecommendation).toContain('복합성');
      expect(result.baseRecommendation).toContain('세미매트');
      expect(result.baseRecommendation).toContain('미디엄');
      // 원시 영문값(combination/semi-matte/medium) 노출 금지
      expect(result.baseRecommendation).not.toMatch(/combination|semi-matte|medium/i);
    });
  });

  describe('립/아이섀도 팔레트 도출', () => {
    it('립 팔레트는 PC palette 앞 4개까지', () => {
      const result = composeMakeupData(pcWarm, skinDryHigh);
      expect(result.lipPalette).toBeDefined();
      expect(result.lipPalette!.length).toBeLessThanOrEqual(4);
      expect(result.lipPalette![0]).toBe('#F9A8D4');
    });

    it('아이섀도 팔레트는 PC palette 중간 이후', () => {
      const result = composeMakeupData(pcWarm, skinDryHigh);
      expect(result.eyeshadowPalette).toBeDefined();
      expect(result.eyeshadowPalette!.length).toBeGreaterThan(0);
    });

    it('palette가 비어있으면 빈 배열 반환', () => {
      const pcEmpty: PersonalColorAxisData = {
        ...pcWarm,
        palette: [],
      };
      const result = composeMakeupData(pcEmpty, skinDryHigh);
      expect(result.lipPalette).toEqual([]);
      expect(result.eyeshadowPalette).toEqual([]);
    });
  });

  describe('튜토리얼 스텝 생성', () => {
    it('3단계 튜토리얼이 항상 포함', () => {
      const result = composeMakeupData(pcWarm, skinDryHigh);
      expect(result.tutorialSteps).toHaveLength(3);
      expect(result.tutorialSteps![0]).toMatch(/^1\./);
      expect(result.tutorialSteps![1]).toMatch(/^2\./);
      expect(result.tutorialSteps![2]).toMatch(/^3\./);
    });

    it('튜토리얼에 실제 팔레트 색상 참조', () => {
      const result = composeMakeupData(pcWarm, skinDryHigh);
      expect(result.tutorialSteps![1]).toContain('#F9A8D4');
    });
  });

  describe('undertone 무관한 공통 구조', () => {
    it('warm/cool 모두 동일한 구조 반환', () => {
      const warmResult = composeMakeupData(pcWarm, skinDryHigh);
      const coolResult = composeMakeupData(pcCool, skinDryHigh);

      expect(Object.keys(warmResult).sort()).toEqual(Object.keys(coolResult).sort());
    });
  });
});
