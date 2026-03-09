/**
 * S-1 피부 Identity Label 생성 테스트
 *
 * skinType + 주요 고민(dominant concern) 조합 라벨 검증
 */
import { describe, it, expect } from 'vitest';

import {
  generateSkinIdentityLabel,
  generateSkinIdentityLabelFromMetrics,
} from '@/lib/analysis/skin-v2/identity-label';

// ─── generateSkinIdentityLabel ───────────────────────────────────────────────

describe('generateSkinIdentityLabel', () => {
  describe('기본 수식어 (모든 점수 >= 70)', () => {
    const highScores = { hydration: 80, elasticity: 85, clarity: 78, tone: 82 };

    it('건성 → "수분 부족 건성 타입"', () => {
      expect(generateSkinIdentityLabel('dry', highScores)).toBe('수분 부족 건성 타입');
    });

    it('지성 → "유분 활발 지성 타입"', () => {
      expect(generateSkinIdentityLabel('oily', highScores)).toBe('유분 활발 지성 타입');
    });

    it('복합성 → "밸런스 복합성 타입"', () => {
      expect(generateSkinIdentityLabel('combination', highScores)).toBe('밸런스 복합성 타입');
    });

    it('정상 → "균형 잡힌 정상 타입"', () => {
      expect(generateSkinIdentityLabel('normal', highScores)).toBe('균형 잡힌 정상 타입');
    });

    it('민감성 → "고민감 민감성 타입"', () => {
      expect(generateSkinIdentityLabel('sensitive', highScores)).toBe('고민감 민감성 타입');
    });
  });

  describe('고민 수식어 (최저 점수 영역 < 70)', () => {
    it('수분이 가장 낮으면 "수분 부족" 수식어', () => {
      const scores = { hydration: 40, elasticity: 80, clarity: 75, tone: 85 };
      expect(generateSkinIdentityLabel('oily', scores)).toBe('수분 부족 지성 타입');
    });

    it('탄력이 가장 낮으면 "탄력 케어" 수식어', () => {
      const scores = { hydration: 80, elasticity: 35, clarity: 75, tone: 85 };
      expect(generateSkinIdentityLabel('normal', scores)).toBe('탄력 케어 정상 타입');
    });

    it('투명도가 가장 낮으면 "투명 맑은" 수식어', () => {
      const scores = { hydration: 80, elasticity: 75, clarity: 30, tone: 85 };
      expect(generateSkinIdentityLabel('combination', scores)).toBe('투명 맑은 복합성 타입');
    });

    it('톤이 가장 낮으면 "톤 케어" 수식어', () => {
      const scores = { hydration: 80, elasticity: 75, clarity: 85, tone: 25 };
      expect(generateSkinIdentityLabel('sensitive', scores)).toBe('톤 케어 민감성 타입');
    });

    it('여러 영역이 70 미만이면 가장 낮은 영역의 수식어 사용', () => {
      // elasticity(50) < hydration(60) 이므로 탄력 케어
      const scores = { hydration: 60, elasticity: 50, clarity: 72, tone: 80 };
      expect(generateSkinIdentityLabel('dry', scores)).toBe('탄력 케어 건성 타입');
    });
  });

  describe('엣지 케이스', () => {
    it('모든 점수가 정확히 70이면 기본 수식어 사용', () => {
      const scores = { hydration: 70, elasticity: 70, clarity: 70, tone: 70 };
      expect(generateSkinIdentityLabel('normal', scores)).toBe('균형 잡힌 정상 타입');
    });

    it('하나만 69이면 해당 영역 고민 수식어 사용', () => {
      const scores = { hydration: 70, elasticity: 69, clarity: 70, tone: 70 };
      expect(generateSkinIdentityLabel('oily', scores)).toBe('탄력 케어 지성 타입');
    });

    it('점수가 0이어도 정상 동작', () => {
      const scores = { hydration: 0, elasticity: 50, clarity: 60, tone: 70 };
      expect(generateSkinIdentityLabel('dry', scores)).toBe('수분 부족 건성 타입');
    });
  });
});

// ─── generateSkinIdentityLabelFromMetrics ────────────────────────────────────

describe('generateSkinIdentityLabelFromMetrics', () => {
  describe('V1 메트릭 배열 변환', () => {
    it('메트릭 배열로부터 라벨을 생성한다', () => {
      const metrics = [
        { id: 'hydration', value: 42 },
        { id: 'elasticity', value: 65 },
        { id: 'pigmentation', value: 80 },
        { id: 'tone', value: 75 },
      ];
      // hydration(42)이 가장 낮으므로 수분 부족
      expect(generateSkinIdentityLabelFromMetrics('oily', metrics)).toBe('수분 부족 지성 타입');
    });

    it('동일 고민 키에 매핑되는 메트릭은 낮은 값 우선', () => {
      // moisture와 hydration 모두 hydration 키에 매핑
      const metrics = [
        { id: 'hydration', value: 80 },
        { id: 'moisture', value: 55 },
        { id: 'elasticity', value: 90 },
      ];
      // moisture(55)가 hydration에 반영 → 55 < 70 → 수분 부족
      expect(generateSkinIdentityLabelFromMetrics('normal', metrics)).toBe('수분 부족 정상 타입');
    });

    it('매핑되지 않는 메트릭 ID는 무시한다', () => {
      const metrics = [
        { id: 'unknown_metric', value: 10 },
        { id: 'hydration', value: 80 },
      ];
      // unknown_metric은 무시, 나머지 기본값 75 → 모두 >= 70 → 기본 수식어
      expect(generateSkinIdentityLabelFromMetrics('combination', metrics)).toBe(
        '밸런스 복합성 타입'
      );
    });

    it('빈 메트릭 배열이면 기본값(75)으로 기본 수식어', () => {
      expect(generateSkinIdentityLabelFromMetrics('sensitive', [])).toBe('고민감 민감성 타입');
    });

    it('spots는 clarity에, wrinkles는 elasticity에 매핑된다', () => {
      const metrics = [
        { id: 'spots', value: 30 },
        { id: 'wrinkles', value: 85 },
      ];
      // spots(30) → clarity, wrinkles(85) → elasticity
      // clarity(30) < 70 → 투명 맑은
      expect(generateSkinIdentityLabelFromMetrics('dry', metrics)).toBe('투명 맑은 건성 타입');
    });

    it('brightness는 tone에 매핑된다', () => {
      const metrics = [
        { id: 'brightness', value: 40 },
        { id: 'hydration', value: 80 },
        { id: 'elasticity', value: 80 },
      ];
      // brightness(40) → tone(40) < 70 → 톤 케어
      expect(generateSkinIdentityLabelFromMetrics('oily', metrics)).toBe('톤 케어 지성 타입');
    });
  });
});
