/**
 * M-1 + S-1 피부타입 고려 메이크업 인사이트 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  getMakeupSkinInsight,
  convertSkinToMakeupSummary,
  SKIN_MAKEUP_ADJUSTMENTS,
  BASE_RECOMMENDATIONS,
  type SkinSummaryForMakeup,
} from '@/lib/analysis/makeupSkinInsight';

describe('getMakeupSkinInsight', () => {
  describe('피부 분석 없음', () => {
    it('null 입력 시 hasAnalysis가 false다', () => {
      const result = getMakeupSkinInsight(null);

      expect(result.hasAnalysis).toBe(false);
      expect(result.adjustments).toHaveLength(0);
      expect(result.baseRecommendation).toBeNull();
    });

    it('null 입력 시 안내 메시지를 반환한다', () => {
      const result = getMakeupSkinInsight(null);

      expect(result.summaryMessage).toContain('S-1 피부 분석');
    });
  });

  describe('피부 분석 있음 - 정상 상태', () => {
    const normalSkin: SkinSummaryForMakeup = {
      hydration: 'good',
      oil: 'good',
      pores: 'good',
      wrinkles: 'good',
      trouble: 'good',
      pigmentation: 'good',
    };

    it('모든 지표가 좋으면 조정 추천이 없다', () => {
      const result = getMakeupSkinInsight(normalSkin);

      expect(result.hasAnalysis).toBe(true);
      expect(result.adjustments).toHaveLength(0);
    });

    it('모든 지표가 좋으면 긍정적 메시지를 반환한다', () => {
      const result = getMakeupSkinInsight(normalSkin);

      expect(result.summaryMessage).toContain('좋아요');
    });

    it('중성 피부로 추론하여 베이스 추천을 반환한다', () => {
      const result = getMakeupSkinInsight(normalSkin);

      expect(result.baseRecommendation).not.toBeNull();
      expect(result.baseRecommendation?.skinType).toBe('중성');
      expect(result.baseRecommendation?.finishType).toBe('satin');
    });
  });

  describe('피부 분석 있음 - 경고 상태', () => {
    it('수분 부족 시 보습형 베이스를 추천한다', () => {
      const skin: SkinSummaryForMakeup = {
        hydration: 'warning',
        oil: 'good',
        pores: 'good',
        wrinkles: 'good',
        trouble: 'good',
        pigmentation: 'good',
      };

      const result = getMakeupSkinInsight(skin);

      const baseAdj = result.adjustments.find(
        (a) => a.relatedSkinMetric === 'hydration' && a.category === 'base'
      );
      expect(baseAdj).toBeDefined();
      expect(baseAdj?.recommendedTypes).toContain('수분 쿠션');
      expect(baseAdj?.avoidTypes).toContain('매트 파운데이션');
    });

    it('수분 부족 시 보습 프라이머도 추천한다', () => {
      const skin: SkinSummaryForMakeup = {
        hydration: 'warning',
        oil: 'good',
        pores: 'good',
        wrinkles: 'good',
        trouble: 'good',
        pigmentation: 'good',
      };

      const result = getMakeupSkinInsight(skin);

      const primerAdj = result.adjustments.find(
        (a) => a.relatedSkinMetric === 'hydration' && a.category === 'primer'
      );
      expect(primerAdj).toBeDefined();
      expect(primerAdj?.recommendedTypes).toContain('하이드레이팅 프라이머');
    });

    it('유분 과다 시 매트형 베이스를 추천한다', () => {
      const skin: SkinSummaryForMakeup = {
        hydration: 'good',
        oil: 'warning',
        pores: 'good',
        wrinkles: 'good',
        trouble: 'good',
        pigmentation: 'good',
      };

      const result = getMakeupSkinInsight(skin);

      const baseAdj = result.adjustments.find(
        (a) => a.relatedSkinMetric === 'oil' && a.category === 'base'
      );
      expect(baseAdj).toBeDefined();
      expect(baseAdj?.recommendedTypes).toContain('매트 파운데이션');
    });

    it('트러블 시 고커버 컨실러를 추천한다', () => {
      const skin: SkinSummaryForMakeup = {
        hydration: 'good',
        oil: 'good',
        pores: 'good',
        wrinkles: 'good',
        trouble: 'warning',
        pigmentation: 'good',
      };

      const result = getMakeupSkinInsight(skin);

      const concealerAdj = result.adjustments.find(
        (a) => a.relatedSkinMetric === 'trouble' && a.category === 'concealer'
      );
      expect(concealerAdj).toBeDefined();
      expect(concealerAdj?.recommendedTypes).toContain('풀커버 컨실러');
    });

    it('모공 경고 시 포어 미니마이징 프라이머를 추천한다', () => {
      const skin: SkinSummaryForMakeup = {
        hydration: 'good',
        oil: 'good',
        pores: 'warning',
        wrinkles: 'good',
        trouble: 'good',
        pigmentation: 'good',
      };

      const result = getMakeupSkinInsight(skin);

      const poreAdj = result.adjustments.find((a) => a.relatedSkinMetric === 'pores');
      expect(poreAdj).toBeDefined();
      expect(poreAdj?.recommendedTypes).toContain('포어 미니마이징 프라이머');
    });

    it('색소침착 경고 시 컬러 코렉팅을 추천한다', () => {
      const skin: SkinSummaryForMakeup = {
        hydration: 'good',
        oil: 'good',
        pores: 'good',
        wrinkles: 'good',
        trouble: 'good',
        pigmentation: 'warning',
      };

      const result = getMakeupSkinInsight(skin);

      const pigAdj = result.adjustments.find((a) => a.relatedSkinMetric === 'pigmentation');
      expect(pigAdj).toBeDefined();
      expect(pigAdj?.recommendedTypes).toContain('피치 컬러 코렉터');
    });
  });

  describe('베이스 추천 (피부 타입 추론)', () => {
    it('수분 부족 시 건성으로 추론하여 듀이 마감을 추천한다', () => {
      const skin: SkinSummaryForMakeup = {
        hydration: 'warning',
        oil: 'good',
        pores: 'good',
        wrinkles: 'good',
        trouble: 'good',
        pigmentation: 'good',
      };

      const result = getMakeupSkinInsight(skin);

      expect(result.baseRecommendation?.skinType).toBe('건성');
      expect(result.baseRecommendation?.finishType).toBe('dewy');
    });

    it('유분 과다 시 지성으로 추론하여 매트 마감을 추천한다', () => {
      const skin: SkinSummaryForMakeup = {
        hydration: 'good',
        oil: 'warning',
        pores: 'good',
        wrinkles: 'good',
        trouble: 'good',
        pigmentation: 'good',
      };

      const result = getMakeupSkinInsight(skin);

      expect(result.baseRecommendation?.skinType).toBe('지성');
      expect(result.baseRecommendation?.finishType).toBe('matte');
    });

    it('트러블 시 민감성으로 추론하여 새틴 마감을 추천한다', () => {
      const skin: SkinSummaryForMakeup = {
        hydration: 'good',
        oil: 'good',
        pores: 'good',
        wrinkles: 'good',
        trouble: 'warning',
        pigmentation: 'good',
      };

      const result = getMakeupSkinInsight(skin);

      expect(result.baseRecommendation?.skinType).toBe('민감성');
      expect(result.baseRecommendation?.finishType).toBe('satin');
      expect(result.baseRecommendation?.avoidIngredients).toContain('향료');
    });

    it('수분 부족 + 유분 과다 시 복합성으로 추론한다', () => {
      const skin: SkinSummaryForMakeup = {
        hydration: 'warning',
        oil: 'warning',
        pores: 'good',
        wrinkles: 'good',
        trouble: 'good',
        pigmentation: 'good',
      };

      const result = getMakeupSkinInsight(skin);

      expect(result.baseRecommendation?.skinType).toBe('복합성');
      expect(result.baseRecommendation?.finishType).toBe('semi-matte');
    });

    it('트러블이 수분/유분보다 우선한다 (민감성)', () => {
      const skin: SkinSummaryForMakeup = {
        hydration: 'warning',
        oil: 'warning',
        pores: 'good',
        wrinkles: 'good',
        trouble: 'warning',
        pigmentation: 'good',
      };

      const result = getMakeupSkinInsight(skin);

      // trouble이 먼저 체크되므로 sensitive
      expect(result.baseRecommendation?.skinType).toBe('민감성');
    });
  });

  describe('우선순위 정렬', () => {
    it('high 우선순위가 medium보다 먼저 정렬된다', () => {
      const skin: SkinSummaryForMakeup = {
        hydration: 'warning', // high 조정들
        oil: 'good',
        pores: 'warning', // medium 조정
        wrinkles: 'good',
        trouble: 'good',
        pigmentation: 'good',
      };

      const result = getMakeupSkinInsight(skin);

      expect(result.adjustments[0].priority).toBe('high');
    });

    it('정렬 순서가 high > medium > low다', () => {
      const skin: SkinSummaryForMakeup = {
        hydration: 'warning',
        oil: 'good',
        pores: 'warning',
        wrinkles: 'warning',
        trouble: 'good',
        pigmentation: 'warning',
      };

      const result = getMakeupSkinInsight(skin);

      const priorities = result.adjustments.map((a) => a.priority);
      const order = { high: 0, medium: 1, low: 2 };
      for (let i = 1; i < priorities.length; i++) {
        expect(order[priorities[i]]).toBeGreaterThanOrEqual(order[priorities[i - 1]]);
      }
    });
  });

  describe('최대 개수 제한', () => {
    it('조정 추천은 최대 4개까지만 반환한다', () => {
      const allWarning: SkinSummaryForMakeup = {
        hydration: 'warning',
        oil: 'warning',
        pores: 'warning',
        wrinkles: 'warning',
        trouble: 'warning',
        pigmentation: 'warning',
      };

      const result = getMakeupSkinInsight(allWarning);

      expect(result.adjustments.length).toBeLessThanOrEqual(4);
    });
  });

  describe('요약 메시지', () => {
    it('경고 3개 이상이면 종합 가이드 메시지를 반환한다', () => {
      const skin: SkinSummaryForMakeup = {
        hydration: 'warning',
        oil: 'warning',
        pores: 'warning',
        wrinkles: 'good',
        trouble: 'good',
        pigmentation: 'good',
      };

      const result = getMakeupSkinInsight(skin);

      expect(result.summaryMessage).toContain('가이드');
    });

    it('경고 1~2개이면 맞춤 팁 메시지를 반환한다', () => {
      const skin: SkinSummaryForMakeup = {
        hydration: 'warning',
        oil: 'good',
        pores: 'good',
        wrinkles: 'good',
        trouble: 'good',
        pigmentation: 'good',
      };

      const result = getMakeupSkinInsight(skin);

      expect(result.summaryMessage).toContain('팁');
    });

    it('경고 0개이면 긍정 메시지를 반환한다', () => {
      const skin: SkinSummaryForMakeup = {
        hydration: 'good',
        oil: 'good',
        pores: 'good',
        wrinkles: 'good',
        trouble: 'good',
        pigmentation: 'good',
      };

      const result = getMakeupSkinInsight(skin);

      expect(result.summaryMessage).toContain('좋아요');
    });

    it('요약 메시지에 피부 타입이 포함된다', () => {
      const skin: SkinSummaryForMakeup = {
        hydration: 'warning',
        oil: 'good',
        pores: 'good',
        wrinkles: 'good',
        trouble: 'good',
        pigmentation: 'good',
      };

      const result = getMakeupSkinInsight(skin);

      expect(result.summaryMessage).toContain('건성');
    });
  });
});

describe('convertSkinToMakeupSummary', () => {
  it('metrics 배열을 SkinSummaryForMakeup으로 변환한다', () => {
    const metrics = [
      { id: 'hydration', status: 'warning' as const },
      { id: 'oil', status: 'good' as const },
      { id: 'pores', status: 'normal' as const },
      { id: 'wrinkles', status: 'good' as const },
      { id: 'trouble', status: 'warning' as const },
      { id: 'pigmentation', status: 'normal' as const },
    ];

    const summary = convertSkinToMakeupSummary(metrics);

    expect(summary.hydration).toBe('warning');
    expect(summary.oil).toBe('good');
    expect(summary.pores).toBe('normal');
    expect(summary.wrinkles).toBe('good');
    expect(summary.trouble).toBe('warning');
    expect(summary.pigmentation).toBe('normal');
  });

  it('누락된 지표는 normal로 설정한다', () => {
    const metrics = [{ id: 'hydration', status: 'warning' as const }];

    const summary = convertSkinToMakeupSummary(metrics);

    expect(summary.hydration).toBe('warning');
    expect(summary.oil).toBe('normal');
    expect(summary.pores).toBe('normal');
    expect(summary.trouble).toBe('normal');
  });

  it('빈 배열이면 모두 normal이다', () => {
    const summary = convertSkinToMakeupSummary([]);

    expect(summary.hydration).toBe('normal');
    expect(summary.oil).toBe('normal');
    expect(summary.pores).toBe('normal');
    expect(summary.wrinkles).toBe('normal');
    expect(summary.trouble).toBe('normal');
    expect(summary.pigmentation).toBe('normal');
  });
});

describe('SKIN_MAKEUP_ADJUSTMENTS', () => {
  it('주요 피부 지표에 대한 조정이 정의되어 있다', () => {
    const keys = ['hydration', 'oil', 'trouble', 'wrinkles', 'pores', 'pigmentation'];
    keys.forEach((key) => {
      expect(SKIN_MAKEUP_ADJUSTMENTS[key]).toBeDefined();
    });
  });

  it('hydration warning에 보습형 베이스가 포함되어 있다', () => {
    const recs = SKIN_MAKEUP_ADJUSTMENTS.hydration.warning;
    expect(recs).not.toBeNull();
    const baseRec = recs!.find((r) => r.category === 'base');
    expect(baseRec).toBeDefined();
    expect(baseRec?.recommendedTypes).toContain('수분 쿠션');
  });

  it('oil warning에 매트 파운데이션이 포함되어 있다', () => {
    const recs = SKIN_MAKEUP_ADJUSTMENTS.oil.warning;
    expect(recs).not.toBeNull();
    const baseRec = recs!.find((r) => r.category === 'base');
    expect(baseRec).toBeDefined();
    expect(baseRec?.recommendedTypes).toContain('매트 파운데이션');
  });

  it('trouble warning에 컨실러와 저자극 베이스가 포함되어 있다', () => {
    const recs = SKIN_MAKEUP_ADJUSTMENTS.trouble.warning;
    expect(recs).not.toBeNull();
    expect(recs!.length).toBe(2);
    const categories = recs!.map((r) => r.category);
    expect(categories).toContain('concealer');
    expect(categories).toContain('base');
  });
});

describe('BASE_RECOMMENDATIONS', () => {
  it('5가지 피부 타입 모두 정의되어 있다', () => {
    expect(BASE_RECOMMENDATIONS.dry).toBeDefined();
    expect(BASE_RECOMMENDATIONS.oily).toBeDefined();
    expect(BASE_RECOMMENDATIONS.sensitive).toBeDefined();
    expect(BASE_RECOMMENDATIONS.combination).toBeDefined();
    expect(BASE_RECOMMENDATIONS.normal).toBeDefined();
  });

  it('건성 피부는 듀이 마감을 추천한다', () => {
    expect(BASE_RECOMMENDATIONS.dry.finishType).toBe('dewy');
    expect(BASE_RECOMMENDATIONS.dry.keyIngredients).toContain('히알루론산');
  });

  it('지성 피부는 매트 마감을 추천한다', () => {
    expect(BASE_RECOMMENDATIONS.oily.finishType).toBe('matte');
    expect(BASE_RECOMMENDATIONS.oily.avoidIngredients).toContain('미네랄 오일');
  });

  it('민감성 피부는 향료를 피하도록 안내한다', () => {
    expect(BASE_RECOMMENDATIONS.sensitive.avoidIngredients).toContain('향료');
    expect(BASE_RECOMMENDATIONS.sensitive.keyIngredients).toContain('시카');
  });

  it('모든 타입에 메시지가 있다', () => {
    const types = ['dry', 'oily', 'sensitive', 'combination', 'normal'];
    types.forEach((type) => {
      expect(BASE_RECOMMENDATIONS[type].message).toBeTruthy();
    });
  });
});
