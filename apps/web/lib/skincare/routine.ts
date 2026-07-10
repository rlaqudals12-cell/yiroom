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
import type { ShelfItem } from '@/lib/scan/product-shelf';
import {
  MORNING_ROUTINE_STEPS,
  EVENING_ROUTINE_STEPS,
  SKIN_TYPE_MODIFIERS,
  SKIN_CONCERN_TIPS,
  calculateEstimatedTime,
  formatDuration,
} from '@/lib/mock/skincare-routine';
import { getRoutineProductsByCategory } from './routine-products';
import { detectProductCategory } from './shelf-routine-sync';
import { getStepSpec } from './step-spec';

// ================================================
// 루틴 생성 함수
// ================================================

/**
 * 피부 타입과 고민을 기반으로 개인화된 루틴 생성
 */
export function generateRoutine(input: RoutineGenerationInput): RoutineGenerationResult {
  // includeOptional 기본값 = false — 체크리스트 표면(/beauty 케어 탭·캡슐 데일리)이 같은
  // "필수 스텝" 루틴을 보도록 정합화 (2026-07-08 사용자 피드백: 두 화면 루틴이 서로 달랐음).
  // 선택 스텝까지 보여주는 심화 페이지(analysis/skin/routine)는 명시적으로 true를 전달한다.
  const { skinType, concerns, timeOfDay, includeOptional = false, carePhase } = input;

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

  // 5.5 상태 기반 성분 스펙 부착 (U2) — 일반 명칭을 구체화.
  // 더블클렌징 1단계 "오일 클렌저"는 스펙(약산성) 대상이 아니라 원 명칭 유지.
  adjustedSteps = adjustedSteps.map((step) => {
    if (step.category === 'cleanser' && step.name.includes('오일')) return step;
    const spec = getStepSpec(step.category, skinType, concerns, carePhase);
    return spec ? { ...step, specName: spec.specName, specReason: spec.specReason } : step;
  });

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

// ================================================
// 제품 연동 함수
// ================================================

/**
 * 스텝 카테고리 정규화 — 앰플은 세럼과 같은 슬롯으로 취급 (감지 카테고리 정합)
 */
function normalizeRoutineCategory(category: ProductCategory): ProductCategory {
  return category === 'ampoule' ? 'serum' : category;
}

/**
 * 보유 제품(owned)을 감지 카테고리별로 그룹핑.
 * detectProductCategory가 unknown이면 제외 — 지어내지 않는다 (ADR-117).
 */
function groupShelfByCategory(shelfItems: ShelfItem[]): Map<ProductCategory, ShelfItem[]> {
  const map = new Map<ProductCategory, ShelfItem[]>();
  for (const item of shelfItems) {
    if (item.status !== 'owned') continue;
    const detected = detectProductCategory(item);
    if (!detected) continue;
    const key = normalizeRoutineCategory(detected);
    const list = map.get(key);
    if (list) list.push(item);
    else map.set(key, [item]);
  }
  return map;
}

/**
 * 루틴 단계에 제품 연결 — shelf-우선 (ADR-117)
 *
 * 1) 내 제품함(shelfItems) 보유 제품이 스텝 카테고리와 맞으면 `ownedProduct` 세팅
 *    (스텝 순서대로 중복 없이, 결정론적)
 * 2) 그 위에 어필리에이트 추천을 채운다 — 보유가 없는(빈) 스텝의 recommendedProducts가
 *    결손 채움 = 구매 연결이 된다. shelfItems 미전달 시 기존과 동일하게 추천만 채운다.
 */
export async function enrichRoutineWithProducts(
  steps: RoutineStep[],
  skinType: SkinTypeId,
  concerns: SkinConcernId[],
  shelfItems?: ShelfItem[]
): Promise<RoutineStep[]> {
  // 1. shelf-우선 배치 (동기·결정론) — 스텝 인덱스별 보유 제품 매핑
  const ownedByStep = new Map<number, { shelfItemId: string; name: string; brand?: string }>();
  if (shelfItems?.length) {
    const shelfByCategory = groupShelfByCategory(shelfItems);
    const usedShelf = new Set<string>();
    steps.forEach((step, index) => {
      const candidates = shelfByCategory.get(normalizeRoutineCategory(step.category));
      const pick = candidates?.find((c) => !usedShelf.has(c.id));
      if (pick) {
        usedShelf.add(pick.id);
        ownedByStep.set(index, {
          shelfItemId: pick.id,
          name: pick.productName,
          ...(pick.productBrand ? { brand: pick.productBrand } : {}),
        });
      }
    });
  }

  // 2. 각 단계에 실제 제품 추천 가져오기 (빈 슬롯 = 구매 연결).
  //    정본 = cosmetic_products(카테고리 컬럼으로 직접 조회). affiliate_products가 비어 있어
  //    루틴 추천이 전멸하던 문제를 해소 — 스텝 카테고리별로 실제품·이미지를 붙인다.
  const enrichedSteps = await Promise.all(
    steps.map(async (step, index) => {
      const owned = ownedByStep.get(index);
      try {
        const products = await getRoutineProductsByCategory(
          step.category,
          skinType,
          concerns,
          3 // 각 스텝당 최대 3개
        );
        return {
          ...step,
          recommendedProducts: products,
          ...(owned ? { ownedProduct: owned } : {}),
        };
      } catch (error) {
        console.error(`[Skincare] Error fetching products for ${step.category}:`, error);
        return owned ? { ...step, ownedProduct: owned } : step;
      }
    })
  );

  return enrichedSteps;
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
