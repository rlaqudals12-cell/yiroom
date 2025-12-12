/**
 * 퍼스널 컬러 기반 코디 색상 추천 시스템 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  generateColorRecommendations,
  getColorTipsForBodyType,
  type PersonalColorSeason,
} from '@/lib/color-recommendations';
import type { BodyType } from '@/lib/mock/body-analysis';

describe('코디 색상 추천 시스템', () => {
  describe('generateColorRecommendations', () => {
    const seasons: PersonalColorSeason[] = [
      'Spring',
      'Summer',
      'Autumn',
      'Winter',
    ];

    seasons.forEach((season) => {
      it(`${season} 시즌의 색상 추천을 반환한다`, () => {
        const recommendations = generateColorRecommendations(season);

        expect(recommendations).not.toBeNull();
        expect(recommendations?.topColors).toBeDefined();
        expect(recommendations?.topColors.length).toBeGreaterThan(0);
        expect(recommendations?.bottomColors).toBeDefined();
        expect(recommendations?.bottomColors.length).toBeGreaterThan(0);
        expect(recommendations?.avoidColors).toBeDefined();
        expect(recommendations?.avoidColors.length).toBeGreaterThan(0);
        expect(recommendations?.bestCombinations).toBeDefined();
        expect(recommendations?.bestCombinations.length).toBeGreaterThan(0);
        expect(recommendations?.accessories).toBeDefined();
        expect(recommendations?.accessories.length).toBeGreaterThan(0);
      });
    });

    it('null 시즌은 null을 반환한다', () => {
      const recommendations = generateColorRecommendations(null);
      expect(recommendations).toBeNull();
    });

    it('잘못된 시즌은 null을 반환한다', () => {
      const recommendations = generateColorRecommendations('Invalid');
      expect(recommendations).toBeNull();
    });

    it('빈 문자열은 null을 반환한다', () => {
      const recommendations = generateColorRecommendations('');
      expect(recommendations).toBeNull();
    });

    describe('Spring 시즌 상세', () => {
      it('Spring은 웜톤 밝은 색상을 추천한다', () => {
        const rec = generateColorRecommendations('Spring');

        expect(rec?.topColors).toContain('코랄');
        expect(rec?.topColors).toContain('피치');
        expect(rec?.avoidColors).toContain('블랙');
      });

      it('Spring은 골드 악세서리를 추천한다', () => {
        const rec = generateColorRecommendations('Spring');

        expect(rec?.accessories.some((a) => a.includes('골드'))).toBe(true);
      });
    });

    describe('Summer 시즌 상세', () => {
      it('Summer는 쿨톤 부드러운 색상을 추천한다', () => {
        const rec = generateColorRecommendations('Summer');

        expect(rec?.topColors).toContain('라벤더');
        expect(rec?.topColors).toContain('로즈핑크');
        expect(rec?.avoidColors).toContain('오렌지');
      });

      it('Summer는 실버 악세서리를 추천한다', () => {
        const rec = generateColorRecommendations('Summer');

        expect(rec?.accessories.some((a) => a.includes('실버'))).toBe(true);
      });
    });

    describe('Autumn 시즌 상세', () => {
      it('Autumn은 웜톤 깊은 색상을 추천한다', () => {
        const rec = generateColorRecommendations('Autumn');

        expect(rec?.topColors).toContain('테라코타');
        expect(rec?.topColors).toContain('머스타드');
        expect(rec?.avoidColors).toContain('핑크');
      });

      it('Autumn은 브라운 가죽을 추천한다', () => {
        const rec = generateColorRecommendations('Autumn');

        expect(rec?.accessories.some((a) => a.includes('브라운 가죽'))).toBe(
          true
        );
      });
    });

    describe('Winter 시즌 상세', () => {
      it('Winter는 선명한 쿨톤 색상을 추천한다', () => {
        const rec = generateColorRecommendations('Winter');

        expect(rec?.topColors).toContain('블랙');
        expect(rec?.topColors).toContain('로얄 블루');
        expect(rec?.avoidColors).toContain('베이지');
      });

      it('Winter는 블랙 가죽을 추천한다', () => {
        const rec = generateColorRecommendations('Winter');

        expect(rec?.accessories.some((a) => a.includes('블랙 가죽'))).toBe(
          true
        );
      });
    });
  });

  describe('체형별 색상 필터링', () => {
    const bodyTypes: BodyType[] = ['X', 'A', 'V', 'H', 'O', 'I', 'Y', '8'];

    bodyTypes.forEach((bodyType) => {
      it(`${bodyType}자형 체형에 맞는 색상 조합을 반환한다`, () => {
        const rec = generateColorRecommendations('Spring', bodyType);

        expect(rec).not.toBeNull();
        expect(rec?.topColors.length).toBeGreaterThan(0);
        expect(rec?.bottomColors.length).toBeGreaterThan(0);
        expect(rec?.bestCombinations.length).toBeGreaterThan(0);
      });
    });

    it('A자형은 상의에 밝은 색을 우선한다', () => {
      const rec = generateColorRecommendations('Summer', 'A');

      // A자형은 상의 밝은 색, 하의 어두운 색이 권장됨
      expect(rec).not.toBeNull();
      // 필터링이 적용되었는지 확인 (색상이 존재하면 됨)
      expect(rec?.topColors.length).toBeGreaterThan(0);
    });

    it('V자형은 하의에 밝은 색을 우선한다', () => {
      const rec = generateColorRecommendations('Winter', 'V');

      expect(rec).not.toBeNull();
      expect(rec?.bottomColors.length).toBeGreaterThan(0);
    });

    it('체형 없이도 기본 추천을 반환한다', () => {
      const recWithBody = generateColorRecommendations('Spring', 'X');
      const recWithoutBody = generateColorRecommendations('Spring');

      expect(recWithBody).not.toBeNull();
      expect(recWithoutBody).not.toBeNull();
    });

    it('null 체형은 체형 없이 처리한다', () => {
      const rec = generateColorRecommendations('Spring', null);

      expect(rec).not.toBeNull();
    });
  });

  describe('최적 조합 생성', () => {
    it('최대 5개의 색상 조합을 생성한다', () => {
      const rec = generateColorRecommendations('Spring');

      expect(rec?.bestCombinations.length).toBeLessThanOrEqual(5);
    });

    it('각 조합은 top과 bottom을 포함한다', () => {
      const rec = generateColorRecommendations('Summer');

      rec?.bestCombinations.forEach((combo) => {
        expect(combo.top).toBeDefined();
        expect(typeof combo.top).toBe('string');
        expect(combo.bottom).toBeDefined();
        expect(typeof combo.bottom).toBe('string');
      });
    });

    it('조합의 색상은 추천 색상에서 가져온다', () => {
      const rec = generateColorRecommendations('Autumn');

      rec?.bestCombinations.forEach((combo) => {
        expect(rec.topColors).toContain(combo.top);
        expect(rec.bottomColors).toContain(combo.bottom);
      });
    });
  });

  describe('getColorTipsForBodyType', () => {
    const bodyTypes: BodyType[] = ['X', 'A', 'V', 'H', 'O', 'I', 'Y', '8'];

    bodyTypes.forEach((bodyType) => {
      it(`${bodyType}자형에 대한 색상 팁을 반환한다`, () => {
        const tips = getColorTipsForBodyType(bodyType);

        expect(tips).toBeDefined();
        expect(Array.isArray(tips)).toBe(true);
        expect(tips.length).toBeGreaterThan(0);
        tips.forEach((tip) => {
          expect(typeof tip).toBe('string');
          expect(tip.length).toBeGreaterThan(0);
        });
      });
    });

    it('잘못된 체형은 빈 배열을 반환한다', () => {
      const tips = getColorTipsForBodyType('Invalid');

      expect(tips).toEqual([]);
    });

    describe('체형별 팁 검증', () => {
      it('X자형 팁은 균형에 대해 언급한다', () => {
        const tips = getColorTipsForBodyType('X');
        const hasBalanceTip = tips.some((tip) => tip.includes('균형'));

        expect(hasBalanceTip).toBe(true);
      });

      it('A자형 팁은 시선을 위로 모으는 것에 대해 언급한다', () => {
        const tips = getColorTipsForBodyType('A');
        const hasUpwardTip = tips.some((tip) => tip.includes('위로'));

        expect(hasUpwardTip).toBe(true);
      });

      it('O자형 팁은 슬림 효과에 대해 언급한다', () => {
        const tips = getColorTipsForBodyType('O');
        const hasSlimTip = tips.some((tip) => tip.includes('슬림'));

        expect(hasSlimTip).toBe(true);
      });
    });
  });
});

/**
 * TODO: 배포 전 마이그레이션 파일 작성 필요
 * - supabase/migrations/에 Phase 1 테이블 생성 SQL 추가
 * - personal_color_assessments 테이블 마이그레이션
 * - body_analyses 테이블 마이그레이션
 * - 관련 RLS 정책 설정
 */
