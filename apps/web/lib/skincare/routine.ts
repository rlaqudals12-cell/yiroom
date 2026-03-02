/**
 * 스킨케어 루틴 생성 로직
 * @description 피부 타입 및 고민을 기반으로 개인화된 스킨케어 루틴 생성
 * @version 1.0
 * @date 2026-01-10
 */

import type {
  RoutineStep,
  RoutineGenerationInput,
  RoutineGenerationResult,
  ProductCategory,
  TimeOfDay,
} from '@/types/skincare-routine';
import type { SkinTypeId, SkinConcernId } from '@/lib/mock/skin-analysis';
import {
  MORNING_ROUTINE_STEPS,
  EVENING_ROUTINE_STEPS,
  SKIN_TYPE_MODIFIERS,
  SKIN_CONCERN_TIPS,
  calculateEstimatedTime,
  formatDuration,
} from '@/lib/mock/skincare-routine';
import { getRecommendedProductsBySkin } from '@/lib/affiliate/products';

// ================================================
// 루틴 생성 함수
// ================================================

/**
 * 피부 타입과 고민을 기반으로 개인화된 루틴 생성
 */
export function generateRoutine(input: RoutineGenerationInput): RoutineGenerationResult {
  const { skinType, concerns, timeOfDay, includeOptional = true } = input;

  // 기본 템플릿 선택
  const baseSteps =
    timeOfDay === 'morning' ? [...MORNING_ROUTINE_STEPS] : [...EVENING_ROUTINE_STEPS];

  // 피부 타입별 수정자 적용
  const modifier = SKIN_TYPE_MODIFIERS[skinType];

  // 1. 필요한 카테고리 추가
  let adjustedSteps = baseSteps;

  if (modifier.addCategories.length > 0) {
    modifier.addCategories.forEach((category) => {
      // 이미 존재하지 않는 경우에만 추가
      if (!adjustedSteps.find((step) => step.category === category)) {
        const newStep = createStepForCategory(category, timeOfDay);
        if (newStep) {
          adjustedSteps.push(newStep);
        }
      }
    });
  }

  // 2. 제외할 카테고리 제거
  if (modifier.removeCategories.length > 0) {
    adjustedSteps = adjustedSteps.filter(
      (step) => !modifier.removeCategories.includes(step.category)
    );
  }

  // 3. 팁 조정
  adjustedSteps = adjustedSteps.map((step) => {
    const categoryTips = modifier.adjustTips[step.category];
    if (categoryTips && categoryTips.length > 0) {
      return {
        ...step,
        tips: [...categoryTips, ...step.tips.slice(0, 1)], // 커스텀 팁 우선
      };
    }
    return step;
  });

  // 4. 선택적 단계 필터링
  if (!includeOptional) {
    adjustedSteps = adjustedSteps.filter((step) => !step.isOptional);
  }

  // 5. 순서 재정렬
  adjustedSteps = adjustedSteps
    .sort((a, b) => getCategoryOrder(a.category) - getCategoryOrder(b.category))
    .map((step, index) => ({ ...step, order: index + 1 }));

  // 6. 소요 시간 계산
  const estimatedTime = calculateEstimatedTime(adjustedSteps);

  // 7. 개인화 노트 생성
  const personalizationNote = generatePersonalizationNote(skinType, concerns, modifier.warnings);

  return {
    routine: adjustedSteps,
    estimatedTime: Math.round(estimatedTime),
    personalizationNote,
  };
}

/**
 * 카테고리별 새 단계 생성
 */
function createStepForCategory(
  category: ProductCategory,
  timeOfDay: TimeOfDay
): RoutineStep | null {
  switch (category) {
    case 'oil':
      return {
        order: 0, // 나중에 재정렬됨
        category: 'oil',
        name: '페이스 오일',
        purpose: '수분 잠금 및 영양 공급',
        duration: '30초',
        tips: ['크림 후 마지막 단계로', '소량씩 손에 덜어 체온으로 데우기'],
        isOptional: true,
      };
    case 'mask':
      return timeOfDay === 'evening'
        ? {
            order: 0,
            category: 'mask',
            name: '마스크팩',
            purpose: '집중 영양 및 수분 공급',
            duration: '15분',
            tips: ['토너 후 사용', '주 2-3회 권장', '15-20분 후 제거'],
            isOptional: true,
          }
        : null;
    default:
      return null;
  }
}

/**
 * 카테고리 순서 정의 (스킨케어 순서대로)
 */
function getCategoryOrder(category: ProductCategory): number {
  const order: Record<ProductCategory, number> = {
    cleanser: 1,
    toner: 2,
    essence: 3,
    serum: 4,
    ampoule: 5,
    mask: 6,
    eye_cream: 7,
    cream: 8,
    oil: 9,
    sunscreen: 10, // 아침 마지막
    spot_treatment: 11, // 저녁 마지막
  };
  return order[category] ?? 99;
}

/**
 * 개인화 노트 생성
 */
function generatePersonalizationNote(
  skinType: SkinTypeId,
  concerns: SkinConcernId[],
  warnings: string[]
): string {
  const skinTypeLabels: Record<SkinTypeId, string> = {
    dry: '건성',
    oily: '지성',
    combination: '복합성',
    normal: '중성',
    sensitive: '민감성',
  };

  let note = `${skinTypeLabels[skinType]} 피부에 맞춘 루틴이에요.`;

  // 고민별 추가 노트
  if (concerns.length > 0) {
    const concernNotes = concerns
      .map((concern) => {
        const tips = SKIN_CONCERN_TIPS[concern];
        if (tips && tips.ingredients.length > 0) {
          return `${tips.ingredients[0]} 성분`;
        }
        return null;
      })
      .filter(Boolean);

    if (concernNotes.length > 0) {
      note += ` ${concernNotes.join(', ')}이 도움이 될 거예요.`;
    }
  }

  // 주의사항 추가
  if (warnings.length > 0) {
    note += ` 주의: ${warnings[0]}`;
  }

  return note;
}

// 제품이 키워드 목록 중 하나와 매칭되는지 확인
function productMatchesKeywords(
  product: { name?: string; category?: string; keywords?: string[] },
  keywords: string[]
): boolean {
  return keywords.some(
    (keyword) =>
      product.name?.toLowerCase().includes(keyword) ||
      product.category?.toLowerCase().includes(keyword) ||
      product.keywords?.some((k) => k.toLowerCase().includes(keyword))
  );
}

// ================================================
// 제품 연동 함수
// ================================================

/**
 * 루틴 단계에 어필리에이트 제품 추천 연동
 */
export async function enrichRoutineWithProducts(
  steps: RoutineStep[],
  skinType: SkinTypeId,
  concerns: SkinConcernId[]
): Promise<RoutineStep[]> {
  // 각 단계에 대해 제품 추천 가져오기
  const enrichedSteps = await Promise.all(
    steps.map(async (step) => {
      try {
        const products = await getRecommendedProductsBySkin(
          skinType,
          concerns,
          3 // 각 카테고리당 최대 3개
        );

        // 카테고리에 맞는 제품만 필터링 (키워드 기반)
        const categoryKeywords = getCategoryKeywords(step.category);
        const matchedProducts = products.filter((product) =>
          productMatchesKeywords(product, categoryKeywords)
        );

        return {
          ...step,
          recommendedProducts: matchedProducts.slice(0, 3),
        };
      } catch (error) {
        console.error(`[Skincare] Error fetching products for ${step.category}:`, error);
        return step;
      }
    })
  );

  return enrichedSteps;
}

/**
 * 카테고리별 검색 키워드
 */
function getCategoryKeywords(category: ProductCategory): string[] {
  const keywords: Record<ProductCategory, string[]> = {
    cleanser: ['cleanser', '클렌저', 'wash', '폼', 'foam', '젤'],
    toner: ['toner', '토너', '화장수', 'lotion', 'skin'],
    essence: ['essence', '에센스'],
    serum: ['serum', '세럼', 'ampoule', '앰플'],
    ampoule: ['ampoule', '앰플', 'concentrate'],
    cream: ['cream', '크림', 'moisturizer', '보습'],
    sunscreen: ['sunscreen', '선크림', 'spf', 'uv', 'sun'],
    mask: ['mask', '마스크', 'sheet', 'pack'],
    eye_cream: ['eye', '아이', '눈가'],
    oil: ['oil', '오일', 'facial oil'],
    spot_treatment: ['spot', 'acne', 'blemish', '트러블'],
  };
  return keywords[category] ?? [];
}

// ================================================
// 유틸리티 함수 (re-export)
// ================================================

export { calculateEstimatedTime, formatDuration };

// ================================================
// 피부 타입 라벨 함수
// ================================================

/**
 * 피부 타입 ID를 한글 라벨로 변환
 */
export function getSkinTypeLabel(skinType: SkinTypeId): string {
  const labels: Record<SkinTypeId, string> = {
    dry: '건성',
    oily: '지성',
    combination: '복합성',
    normal: '중성',
    sensitive: '민감성',
  };
  return labels[skinType];
}

/**
 * 시간대 라벨
 */
export function getTimeOfDayLabel(timeOfDay: TimeOfDay): string {
  return timeOfDay === 'morning' ? '아침' : '저녁';
}

/**
 * 시간대 아이콘
 */
export function getTimeOfDayEmoji(timeOfDay: TimeOfDay): string {
  return timeOfDay === 'morning' ? '🌅' : '🌙';
}
