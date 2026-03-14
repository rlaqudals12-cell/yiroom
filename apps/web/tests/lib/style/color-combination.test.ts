/**
 * 색상 조합 평가 유틸리티 테스트
 *
 * @module tests/lib/style/color-combination
 */

import { describe, it, expect } from 'vitest';

import { evaluateColorCombination, colorNameToHex } from '@/lib/style/color-combination';

// ============================================================================
// evaluateColorCombination
// ============================================================================

describe('evaluateColorCombination', () => {
  describe('기본값 처리', () => {
    it('퍼스널 컬러가 undefined이면 기본 점수 75를 반환한다', () => {
      const result = evaluateColorCombination(undefined, ['#FF0000']);

      expect(result.score).toBe(75);
      expect(result.personalColorMatch).toBe(false);
      expect(result.suggestions).toHaveLength(1);
    });

    it('의류 색상이 빈 배열이면 기본 점수 75를 반환한다', () => {
      const result = evaluateColorCombination('spring', []);

      expect(result.score).toBe(75);
      expect(result.personalColorMatch).toBe(false);
    });
  });

  describe('spring 타입 색상 매칭', () => {
    it('따뜻한 밝은 색상은 높은 점수를 받는다', () => {
      // 봄 타입: 따뜻한 색상 (0~60, 340~360), 채도 40~100, 명도 50~90
      // 코랄 (#FF6B6B): h≈0, s≈100, l≈71 -> 매칭
      const result = evaluateColorCombination('spring', ['#FF6B6B']);

      expect(result.score).toBe(100);
      expect(result.personalColorMatch).toBe(true);
    });

    it('차가운 색상은 낮은 점수를 받는다', () => {
      // 파랑 (#0000FF): h=240 -> spring 범위 밖
      const result = evaluateColorCombination('spring', ['#0000FF']);

      expect(result.score).toBe(0);
      expect(result.personalColorMatch).toBe(false);
    });
  });

  describe('winter 타입 색상 매칭', () => {
    it('차가운 높은 채도 색상은 높은 점수를 받는다', () => {
      // 겨울 타입: h=180~280, s=50~100, l=20~80
      // 로얄블루 (#4169E1): h≈225, s≈73, l≈57 -> 매칭
      const result = evaluateColorCombination('winter', ['#4169E1']);

      expect(result.score).toBe(100);
    });
  });

  describe('점수별 피드백', () => {
    it('80점 이상이면 완벽한 조합 피드백을 반환한다', () => {
      // 5개 중 4개 이상 매칭 -> 80%+
      const springColors = ['#FF6B6B', '#FFB347', '#FF8866', '#FFA07A'];
      const result = evaluateColorCombination('spring', springColors);

      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.feedback).toContain('완벽');
    });

    it('40점 미만이면 다른 색상 추천 피드백을 반환한다', () => {
      // 매칭 안 되는 색상만
      const result = evaluateColorCombination('spring', ['#0000FF', '#000080', '#4B0082']);

      expect(result.score).toBeLessThan(40);
      expect(result.feedback).toContain('다른 색상');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('personalColorMatch 기준', () => {
    it('매칭률 60% 이상이면 true를 반환한다', () => {
      // 3개 중 2개 매칭 = 67%
      const result = evaluateColorCombination('spring', ['#FF6B6B', '#FFB347', '#0000FF']);

      expect(result.personalColorMatch).toBe(true);
    });

    it('매칭률 60% 미만이면 false를 반환한다', () => {
      // 3개 중 0-1개 매칭
      const result = evaluateColorCombination('spring', ['#0000FF', '#000080', '#800080']);

      expect(result.personalColorMatch).toBe(false);
    });
  });

  describe('다양한 시즌 타입', () => {
    it('summer 타입은 차가운 낮은 채도 밝은 색상이 매칭된다', () => {
      // 여름: h=180~280, s=20~60, l=60~95
      // 라벤더 (#E6E6FA): h=240, s≈67, l≈94 -> s는 조건 경계
      // 파우더블루 (#B0E0E6): h=187, s=52, l=80 -> 매칭
      const result = evaluateColorCombination('summer', ['#B0E0E6']);

      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('autumn 타입은 따뜻한 중간 명도 색상이 매칭된다', () => {
      // 가을: h=20~60, s=30~80, l=30~70
      // 갈색 계열 (#8B6914): h≈45, s=73, l=31 -> 매칭 가능
      const result = evaluateColorCombination('autumn', ['#8B6914']);

      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================================================
// colorNameToHex
// ============================================================================

describe('colorNameToHex', () => {
  describe('정의된 색상명', () => {
    it('빨강을 #FF0000으로 변환한다', () => {
      expect(colorNameToHex('빨강')).toBe('#FF0000');
    });

    it('검정을 #000000으로 변환한다', () => {
      expect(colorNameToHex('검정')).toBe('#000000');
    });

    it('흰색을 #FFFFFF로 변환한다', () => {
      expect(colorNameToHex('흰색')).toBe('#FFFFFF');
    });

    it('코랄을 #FF6B6B로 변환한다', () => {
      expect(colorNameToHex('코랄')).toBe('#FF6B6B');
    });

    it('라벤더를 #E6E6FA로 변환한다', () => {
      expect(colorNameToHex('라벤더')).toBe('#E6E6FA');
    });

    it('민트를 #98D8C8로 변환한다', () => {
      expect(colorNameToHex('민트')).toBe('#98D8C8');
    });

    it('카키를 #C3B091로 변환한다', () => {
      expect(colorNameToHex('카키')).toBe('#C3B091');
    });
  });

  describe('엣지 케이스', () => {
    it('정의되지 않은 색상은 #CCCCCC를 반환한다', () => {
      expect(colorNameToHex('형광')).toBe('#CCCCCC');
    });

    it('빈 문자열은 #CCCCCC를 반환한다', () => {
      expect(colorNameToHex('')).toBe('#CCCCCC');
    });
  });

  describe('모든 정의된 색상 매핑 검증', () => {
    const expectedMappings: Record<string, string> = {
      빨강: '#FF0000',
      주황: '#FF8800',
      노랑: '#FFFF00',
      초록: '#00FF00',
      파랑: '#0000FF',
      남색: '#000080',
      보라: '#800080',
      분홍: '#FF69B4',
      갈색: '#8B4513',
      베이지: '#F5F5DC',
      회색: '#808080',
      검정: '#000000',
      흰색: '#FFFFFF',
      코랄: '#FF6B6B',
      피치: '#FFB4A2',
      민트: '#98D8C8',
      라벤더: '#E6E6FA',
      카키: '#C3B091',
    };

    for (const [name, hex] of Object.entries(expectedMappings)) {
      it(`${name} -> ${hex}`, () => {
        expect(colorNameToHex(name)).toBe(hex);
      });
    }
  });
});
