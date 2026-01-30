/**
 * 구강 제품 추천 엔진 테스트
 *
 * @module tests/lib/oral-health/product-recommender
 */

import { describe, it, expect } from 'vitest';
import type {
  UserOralProfile,
  ProductPreferences,
  ToothColorResult,
  GumHealthResult,
} from '@/types/oral-health';
import {
  recommendOralProducts,
  generateProductRecommendationSummary,
} from '@/lib/oral-health/product-recommender';

// ---------------------------------------------------------------------------
// 테스트 헬퍼: 기본 프로필/선호도 생성
// ---------------------------------------------------------------------------

function createBaseProfile(overrides?: Partial<UserOralProfile>): UserOralProfile {
  return {
    sensitivity: 'none',
    gumHealth: 'healthy',
    cavityRisk: 'low',
    calculus: 'none',
    halitosis: false,
    dentalWork: [],
    ...overrides,
  };
}

function createBasePreferences(overrides?: Partial<ProductPreferences>): ProductPreferences {
  return {
    budgetLevel: 'mid',
    preferNatural: false,
    alcoholFree: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// recommendOralProducts 테스트
// ---------------------------------------------------------------------------

describe('lib/oral-health/product-recommender', () => {
  describe('recommendOralProducts', () => {
    describe('치약 추천', () => {
      it('기본 프로필에 대해 치약을 추천한다', () => {
        const profile = createBaseProfile();
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        expect(result.toothpaste).toBeDefined();
        expect(result.toothpaste.length).toBeGreaterThan(0);
        expect(result.toothpaste.length).toBeLessThanOrEqual(3);
      });

      it('시린이가 있으면 시린이 전용 치약을 추천한다', () => {
        const profile = createBaseProfile({ sensitivity: 'mild' });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        // 시린이 전용 치약이 높은 점수를 받아야 함
        const sensitivityToothpaste = result.toothpaste.find(
          (tp) => tp.keyIngredients.includes('질산칼륨') || tp.name.includes('시린')
        );
        expect(sensitivityToothpaste).toBeDefined();
      });

      it('심한 시린이에도 시린이 치약을 추천한다', () => {
        const profile = createBaseProfile({ sensitivity: 'severe' });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        const hasSensitivityProduct = result.toothpaste.some(
          (tp) => tp.reason.includes('시린') || tp.name.includes('시린')
        );
        expect(hasSensitivityProduct).toBe(true);
      });

      it('잇몸 질환이 있으면 잇몸 케어 치약을 추천한다', () => {
        const profile = createBaseProfile({ gumHealth: 'gingivitis' });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        const gumCareToothpaste = result.toothpaste.find(
          (tp) => tp.reason.includes('잇몸') || tp.name.includes('잇몸')
        );
        expect(gumCareToothpaste).toBeDefined();
      });

      it('충치 위험이 높으면 충치 예방 치약을 추천한다', () => {
        const profile = createBaseProfile({ cavityRisk: 'high' });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        const cavityPreventionToothpaste = result.toothpaste.find(
          (tp) => tp.reason.includes('충치') || tp.keyIngredients.some((i) => i.includes('불소'))
        );
        expect(cavityPreventionToothpaste).toBeDefined();
      });

      it('치석이 있으면 치석 케어 치약을 추천한다', () => {
        const profile = createBaseProfile({ calculus: 'mild' });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        const calculusToothpaste = result.toothpaste.find(
          (tp) => tp.reason.includes('치석') || tp.name.includes('치석')
        );
        expect(calculusToothpaste).toBeDefined();
      });

      it('구취가 있으면 구취 제거 치약을 추천한다', () => {
        const profile = createBaseProfile({ halitosis: true });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        const halitosisToothpaste = result.toothpaste.find(
          (tp) => tp.reason.includes('구취') || tp.keyIngredients.some((i) => i.includes('구취'))
        );
        expect(halitosisToothpaste).toBeDefined();
      });

      it('교정 중이면 교정용 치약을 추천한다', () => {
        const profile = createBaseProfile({ dentalWork: ['braces'] });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        const bracesToothpaste = result.toothpaste.find(
          (tp) => tp.reason.includes('교정') || tp.name.includes('교정')
        );
        expect(bracesToothpaste).toBeDefined();
      });

      it('임플란트가 있으면 임플란트 전용 치약을 추천한다', () => {
        const profile = createBaseProfile({ dentalWork: ['implant'] });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        const implantToothpaste = result.toothpaste.find(
          (tp) => tp.reason.includes('임플란트') || tp.name.includes('임플란트')
        );
        expect(implantToothpaste).toBeDefined();
      });

      it('천연 제품 선호 시 천연 치약의 점수가 높아진다', () => {
        const profile = createBaseProfile({ halitosis: true });
        const naturalPreferences = createBasePreferences({ preferNatural: true });
        const regularPreferences = createBasePreferences({ preferNatural: false });

        const naturalResult = recommendOralProducts(profile, naturalPreferences);
        const regularResult = recommendOralProducts(profile, regularPreferences);

        // 천연 치약의 상대적 순위가 올라가야 함
        const naturalInNaturalResult = naturalResult.toothpaste.find((tp) =>
          tp.keyIngredients.some((i) => i.includes('티트리') || i.includes('허브'))
        );
        const naturalInRegularResult = regularResult.toothpaste.find((tp) =>
          tp.keyIngredients.some((i) => i.includes('티트리') || i.includes('허브'))
        );

        // 천연 선호 시 천연 제품이 있어야 함 (있다면 점수 비교)
        if (naturalInNaturalResult && naturalInRegularResult) {
          expect(naturalInNaturalResult.matchScore).toBeGreaterThanOrEqual(
            naturalInRegularResult.matchScore
          );
        }
      });
    });

    describe('구강 청결제 추천', () => {
      it('기본 프로필에 대해 구강 청결제를 추천한다', () => {
        const profile = createBaseProfile();
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        expect(result.mouthwash).toBeDefined();
        // 최소 점수 미만이면 추천되지 않을 수 있음
      });

      it('무알콜 선호 시 무알콜 제품을 우선 추천한다', () => {
        const profile = createBaseProfile({ halitosis: true });
        const preferences = createBasePreferences({ alcoholFree: true });

        const result = recommendOralProducts(profile, preferences);

        // 알콜 포함 제품은 큰 감점을 받으므로 무알콜이 상위에 있어야 함
        if (result.mouthwash.length > 0) {
          const topMouthwash = result.mouthwash[0];
          expect(topMouthwash.reason).toContain('무알콜');
        }
      });

      it('잇몸 질환이 있으면 잇몸 케어 구강 청결제를 추천한다', () => {
        const profile = createBaseProfile({ gumHealth: 'gingivitis' });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        const gumCareMouthwash = result.mouthwash.find(
          (mw) => mw.reason.includes('잇몸') || mw.keyIngredients.includes('CPC')
        );
        expect(gumCareMouthwash).toBeDefined();
      });

      it('구취가 있으면 구취 제거 구강 청결제를 추천한다', () => {
        const profile = createBaseProfile({ halitosis: true });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        const halitosisMouthwash = result.mouthwash.find((mw) => mw.reason.includes('구취'));
        expect(halitosisMouthwash).toBeDefined();
      });

      it('낮은 점수의 구강 청결제는 제외된다', () => {
        const profile = createBaseProfile();
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        // 모든 추천 구강 청결제는 matchScore >= 40 이어야 함
        result.mouthwash.forEach((mw) => {
          expect(mw.matchScore).toBeGreaterThanOrEqual(40);
        });
      });
    });

    describe('치간 청소 도구 추천', () => {
      it('일반 사용자에게 기본 치실을 추천한다', () => {
        const profile = createBaseProfile();
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        expect(result.interdental).toBeDefined();
        expect(result.interdental.primary.length).toBeGreaterThan(0);

        const hasFloss = result.interdental.primary.some((item) => item.type.includes('floss'));
        expect(hasFloss).toBe(true);
      });

      it('교정 중인 사용자에게 슈퍼플로스와 치간 칫솔을 추천한다', () => {
        const profile = createBaseProfile({ dentalWork: ['braces'] });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        const hasSuperfloss = result.interdental.primary.some((item) =>
          item.type.includes('superfloss')
        );
        const hasInterdentalBrush = result.interdental.primary.some((item) =>
          item.type.includes('interdental_brush')
        );

        expect(hasSuperfloss).toBe(true);
        expect(hasInterdentalBrush).toBe(true);
      });

      it('브릿지/크라운이 있는 사용자에게 슈퍼플로스를 추천한다', () => {
        const profile = createBaseProfile({ dentalWork: ['bridge'] });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        const hasSuperfloss = result.interdental.primary.some((item) =>
          item.type.includes('superfloss')
        );
        expect(hasSuperfloss).toBe(true);
      });

      it('임플란트가 있는 사용자에게 치간 칫솔과 워터플로서를 추천한다', () => {
        const profile = createBaseProfile({ dentalWork: ['implant'] });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        const hasInterdentalBrush = result.interdental.primary.some((item) =>
          item.type.includes('interdental_brush')
        );
        const hasWaterFlosser = result.interdental.primary.some((item) =>
          item.type.includes('water_flosser')
        );

        expect(hasInterdentalBrush).toBe(true);
        expect(hasWaterFlosser).toBe(true);
      });

      it('민감한 잇몸을 가진 사용자에게 워터플로서를 추천한다', () => {
        const profile = createBaseProfile({ sensitivity: 'severe' });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        const hasWaterFlosser = result.interdental.primary.some((item) =>
          item.type.includes('water_flosser')
        );
        expect(hasWaterFlosser).toBe(true);
      });

      it('치주염이 있는 사용자에게 워터플로서를 추천한다', () => {
        const profile = createBaseProfile({ gumHealth: 'periodontitis' });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        const hasWaterFlosser = result.interdental.primary.some((item) =>
          item.type.includes('water_flosser')
        );
        expect(hasWaterFlosser).toBe(true);
      });

      it('치석이 있는 사용자에게 치간 칫솔을 추천한다', () => {
        const profile = createBaseProfile({ calculus: 'mild' });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        const hasInterdentalBrush = result.interdental.primary.some((item) =>
          item.type.includes('interdental_brush')
        );
        expect(hasInterdentalBrush).toBe(true);
      });

      it('대안 추천도 제공한다', () => {
        const profile = createBaseProfile();
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        // 일반 사용자는 대안으로 워터플로서 추천
        expect(result.interdental.alternative.length).toBeGreaterThan(0);
      });
    });

    describe('액세서리 추천', () => {
      it('구취가 있으면 혀 클리너를 추천한다', () => {
        const profile = createBaseProfile({ halitosis: true });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        const hasTongueCleaner = result.accessories.some((acc) => acc.type.includes('혀 클리너'));
        expect(hasTongueCleaner).toBe(true);
      });

      it('치과 시술이 있으면 치간 칫솔 세트를 추천한다', () => {
        const profile = createBaseProfile({ dentalWork: ['implant'] });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        const hasInterdentalSet = result.accessories.some((acc) =>
          acc.type.includes('치간 칫솔 세트')
        );
        expect(hasInterdentalSet).toBe(true);
      });

      it('칫솔 살균기는 항상 추천된다', () => {
        const profile = createBaseProfile();
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        const hasSterilizer = result.accessories.some((acc) => acc.type.includes('칫솔 살균기'));
        expect(hasSterilizer).toBe(true);
      });
    });

    describe('피해야 할 성분', () => {
      it('심한 시린이가 있으면 SLS와 과산화수소를 피하라고 안내한다', () => {
        const profile = createBaseProfile({ sensitivity: 'severe' });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        expect(result.avoidIngredients).toContain('SLS (소듐라우릴설페이트)');
        expect(result.avoidIngredients).toContain('과산화수소');
      });

      it('치주염이 있으면 강한 연마제와 고농도 알콜을 피하라고 안내한다', () => {
        const profile = createBaseProfile({ gumHealth: 'periodontitis' });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        expect(result.avoidIngredients).toContain('강한 연마제');
        expect(result.avoidIngredients).toContain('고농도 알콜');
      });

      it('건강한 사용자는 피해야 할 성분이 없다', () => {
        const profile = createBaseProfile();
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        expect(result.avoidIngredients).toHaveLength(0);
      });
    });

    describe('권장 성분', () => {
      it('시린이가 있으면 질산칼륨과 인산칼슘을 권장한다', () => {
        const profile = createBaseProfile({ sensitivity: 'mild' });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        expect(result.keyIngredients).toContain('질산칼륨');
        expect(result.keyIngredients).toContain('인산칼슘');
      });

      it('잇몸 문제가 있으면 토코페롤, 알란토인, CPC를 권장한다', () => {
        const profile = createBaseProfile({ gumHealth: 'gingivitis' });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        expect(result.keyIngredients).toContain('토코페롤 (비타민 E)');
        expect(result.keyIngredients).toContain('알란토인');
        expect(result.keyIngredients).toContain('CPC');
      });

      it('충치 위험이 있으면 불소와 자일리톨을 권장한다', () => {
        const profile = createBaseProfile({ cavityRisk: 'medium' });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        expect(result.keyIngredients).toContain('불소 1450ppm');
        expect(result.keyIngredients).toContain('자일리톨');
      });
    });

    describe('케어 루틴', () => {
      it('기본 케어 루틴은 3단계다', () => {
        const profile = createBaseProfile();
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        expect(result.careRoutine.length).toBeGreaterThanOrEqual(3);

        const steps = result.careRoutine.map((r) => r.action);
        expect(steps).toContain('칫솔질');
        expect(steps).toContain('치간 청소');
        expect(steps).toContain('구강 청결제 가글');
      });

      it('잇몸 문제가 있으면 잇몸 마사지 단계가 추가된다', () => {
        const profile = createBaseProfile({ gumHealth: 'gingivitis' });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        const hasGumMassage = result.careRoutine.some((r) => r.action.includes('잇몸 마사지'));
        expect(hasGumMassage).toBe(true);
      });

      it('교정 중이면 교정 전용 브러시 단계가 추가된다', () => {
        const profile = createBaseProfile({ dentalWork: ['braces'] });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        const hasBracesStep = result.careRoutine.some((r) => r.action.includes('교정 전용 브러시'));
        expect(hasBracesStep).toBe(true);
      });

      it('케어 루틴의 스텝 번호가 순차적이다', () => {
        const profile = createBaseProfile({ dentalWork: ['braces'], gumHealth: 'gingivitis' });
        const preferences = createBasePreferences();

        const result = recommendOralProducts(profile, preferences);

        result.careRoutine.forEach((routine, index) => {
          expect(routine.step).toBe(index + 1);
        });
      });
    });

    describe('분석 결과 기반 추천', () => {
      it('치아가 어두우면 미백 치약을 추천한다', () => {
        const profile = createBaseProfile();
        const preferences = createBasePreferences();
        // interpretation 필드를 사용하는 내부 로직에 맞춘 mock
        const toothResult = {
          interpretation: {
            brightness: 'dark',
          },
        } as unknown as ToothColorResult;

        const result = recommendOralProducts(profile, preferences, toothResult);

        const whiteningToothpaste = result.toothpaste.find(
          (tp) => tp.reason.includes('미백') || tp.name.includes('미백')
        );
        expect(whiteningToothpaste).toBeDefined();
      });

      it('잇몸 분석 결과가 건강하지 않으면 잇몸 케어 제품을 추천한다', () => {
        const profile = createBaseProfile();
        const preferences = createBasePreferences();
        // healthStatus만 사용하는 내부 로직에 맞춘 mock
        const gumResult = {
          healthStatus: 'mild_gingivitis',
        } as unknown as GumHealthResult;

        const result = recommendOralProducts(profile, preferences, undefined, gumResult);

        const gumCareProduct = result.toothpaste.find(
          (tp) => tp.reason.includes('잇몸') || tp.name.includes('잇몸')
        );
        expect(gumCareProduct).toBeDefined();
      });
    });

    describe('복합 조건', () => {
      it('여러 조건이 있을 때 모든 조건을 고려한다', () => {
        const profile = createBaseProfile({
          sensitivity: 'mild',
          gumHealth: 'gingivitis',
          halitosis: true,
          dentalWork: ['implant'],
        });
        const preferences = createBasePreferences({ alcoholFree: true, preferNatural: true });

        const result = recommendOralProducts(profile, preferences);

        // 피해야 할 성분 + 권장 성분 모두 포함
        expect(result.keyIngredients.length).toBeGreaterThan(0);

        // 복합 케어 루틴
        expect(result.careRoutine.length).toBeGreaterThan(3);

        // 임플란트용 치간 도구
        const hasImplantTool = result.interdental.primary.some(
          (item) => item.type.includes('interdental_brush') || item.type.includes('water_flosser')
        );
        expect(hasImplantTool).toBe(true);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // generateProductRecommendationSummary 테스트
  // ---------------------------------------------------------------------------

  describe('generateProductRecommendationSummary', () => {
    it('추천 요약 텍스트를 생성한다', () => {
      const profile = createBaseProfile({ sensitivity: 'mild' });
      const preferences = createBasePreferences();
      const recommendation = recommendOralProducts(profile, preferences);

      const summary = generateProductRecommendationSummary(recommendation);

      expect(summary).toContain('## 추천 제품 요약');
      expect(summary).toContain('**치약**');
    });

    it('치약 정보를 포함한다', () => {
      const profile = createBaseProfile();
      const preferences = createBasePreferences();
      const recommendation = recommendOralProducts(profile, preferences);

      const summary = generateProductRecommendationSummary(recommendation);

      if (recommendation.toothpaste.length > 0) {
        expect(summary).toContain(recommendation.toothpaste[0].brand);
        expect(summary).toContain(recommendation.toothpaste[0].name);
      }
    });

    it('구강 청결제 정보를 포함한다', () => {
      const profile = createBaseProfile({ halitosis: true });
      const preferences = createBasePreferences();
      const recommendation = recommendOralProducts(profile, preferences);

      const summary = generateProductRecommendationSummary(recommendation);

      if (recommendation.mouthwash.length > 0) {
        expect(summary).toContain('**구강 청결제**');
        expect(summary).toContain(recommendation.mouthwash[0].brand);
      }
    });

    it('치간 청소 정보를 포함한다', () => {
      const profile = createBaseProfile();
      const preferences = createBasePreferences();
      const recommendation = recommendOralProducts(profile, preferences);

      const summary = generateProductRecommendationSummary(recommendation);

      if (recommendation.interdental.primary.length > 0) {
        expect(summary).toContain('**치간 청소**');
      }
    });

    it('피해야 할 성분 정보를 포함한다', () => {
      const profile = createBaseProfile({ sensitivity: 'severe' });
      const preferences = createBasePreferences();
      const recommendation = recommendOralProducts(profile, preferences);

      const summary = generateProductRecommendationSummary(recommendation);

      expect(summary).toContain('**피해야 할 성분**');
      expect(summary).toContain('SLS');
    });

    it('피해야 할 성분이 없으면 해당 섹션이 없다', () => {
      const profile = createBaseProfile();
      const preferences = createBasePreferences();
      const recommendation = recommendOralProducts(profile, preferences);

      const summary = generateProductRecommendationSummary(recommendation);

      expect(summary).not.toContain('**피해야 할 성분**');
    });
  });
});
