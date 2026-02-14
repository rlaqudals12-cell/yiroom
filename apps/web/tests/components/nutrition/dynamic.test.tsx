/**
 * N-1 dynamic.tsx 컴포넌트 테스트
 *
 * 영양 모듈 Dynamic Import 설정 검증
 * - 8개 dynamic export 존재 확인
 * - SSR 비활성화 확인
 * - loading: () => null 패턴 확인
 */

import { describe, it, expect, vi } from 'vitest';

// next/dynamic 모킹 - 호출 인자를 캡처하여 설정 검증
const dynamicCalls: Array<{
  loader: () => Promise<unknown>;
  options: { ssr?: boolean; loading?: () => null };
}> = [];

vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<unknown>, options: { ssr?: boolean; loading?: () => null }) => {
    dynamicCalls.push({ loader, options });
    // 더미 컴포넌트 반환
    const DummyComponent = () => null;
    DummyComponent.displayName = `DynamicComponent_${dynamicCalls.length}`;
    return DummyComponent;
  },
}));

describe('N-1 영양 모듈 Dynamic Import', () => {
  // dynamic.tsx를 import하면 모든 dynamic() 호출이 실행됨
  beforeAll(async () => {
    dynamicCalls.length = 0;
    await import('@/components/nutrition/dynamic');
  });

  describe('export 확인', () => {
    it('8개의 dynamic 컴포넌트가 export된다', async () => {
      const dynamicModule = await import('@/components/nutrition/dynamic');

      expect(dynamicModule.ManualFoodInputSheetDynamic).toBeDefined();
      expect(dynamicModule.WaterInputSheetDynamic).toBeDefined();
      expect(dynamicModule.FastingTimerDynamic).toBeDefined();
      expect(dynamicModule.SkinInsightCardDynamic).toBeDefined();
      expect(dynamicModule.WorkoutInsightCardDynamic).toBeDefined();
      expect(dynamicModule.BodyInsightCardDynamic).toBeDefined();
      expect(dynamicModule.SupplementRecommendationCardDynamic).toBeDefined();
      expect(dynamicModule.MealSuggestionCardDynamic).toBeDefined();
    });

    it('총 8개의 dynamic() 호출이 발생한다', () => {
      expect(dynamicCalls.length).toBe(8);
    });
  });

  describe('SSR 설정', () => {
    it('모든 dynamic 컴포넌트에 ssr: false가 설정된다', () => {
      for (const call of dynamicCalls) {
        expect(call.options.ssr).toBe(false);
      }
    });
  });

  describe('loading 설정', () => {
    it('모든 dynamic 컴포넌트에 loading이 null을 반환한다', () => {
      for (const call of dynamicCalls) {
        expect(call.options.loading).toBeDefined();
        expect(call.options.loading!()).toBeNull();
      }
    });
  });
});
