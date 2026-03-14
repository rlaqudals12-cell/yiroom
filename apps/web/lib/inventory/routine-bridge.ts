/**
 * 인벤토리 ↔ 스킨케어 루틴 연동 브릿지
 * @description 사용자 보유 제품 기반으로 루틴에 매칭 + 누락 제품 감지
 */

import type { RoutineStep as SynergyRoutineStep, RoutineOrderSuggestion } from './product-synergy';
import { inferRoutineStep, suggestRoutineOrder } from './product-synergy';

// ============================================
// 타입
// ============================================

/** 인벤토리 제품 (간소화) */
export interface InventoryProduct {
  id: string;
  name: string;
  tags?: string[];
  /** 잔여량 (0-100%) */
  remainingPercent?: number;
}

/** 루틴 단계별 매칭 결과 */
export interface RoutineStepMatch {
  step: SynergyRoutineStep;
  stepLabel: string;
  /** 보유 제품 중 해당 단계에 매칭되는 것 */
  matchedProducts: InventoryProduct[];
  /** 매칭 제품이 없으면 true */
  isMissing: boolean;
}

/** 루틴-인벤토리 연동 결과 */
export interface RoutineInventoryResult {
  /** 도포 순서 추천 (보유 제품 기반) */
  orderedSteps: RoutineOrderSuggestion[];
  /** 단계별 매칭 현황 */
  stepMatches: RoutineStepMatch[];
  /** 누락된 루틴 단계 */
  missingSteps: SynergyRoutineStep[];
  /** 보유율 (매칭된 단계 / 전체 필수 단계) */
  coveragePercent: number;
  /** 잔여량 부족 제품 (20% 미만) */
  lowStockProducts: InventoryProduct[];
}

// ============================================
// 상수
// ============================================

/** 필수 루틴 단계 (아침) */
const MORNING_REQUIRED: SynergyRoutineStep[] = [
  'cleansing',
  'toner',
  'serum',
  'cream',
  'sunscreen',
];

/** 필수 루틴 단계 (저녁) */
const EVENING_REQUIRED: SynergyRoutineStep[] = ['cleansing', 'toner', 'essence', 'serum', 'cream'];

const STEP_LABELS: Record<SynergyRoutineStep, string> = {
  cleansing: '클렌징',
  toner: '토너',
  essence: '에센스',
  serum: '세럼',
  cream: '크림',
  sunscreen: '선크림',
};

/** 재구매 필요 기준 (잔여량 %) */
const LOW_STOCK_THRESHOLD = 20;

// ============================================
// 핵심 함수
// ============================================

/**
 * 인벤토리 제품을 루틴 단계에 매칭
 */
export function matchProductsToRoutine(
  products: InventoryProduct[],
  timeOfDay: 'morning' | 'evening' = 'morning'
): RoutineInventoryResult {
  const requiredSteps = timeOfDay === 'morning' ? MORNING_REQUIRED : EVENING_REQUIRED;

  // 제품 → 루틴 단계 매핑
  const productsByStep = new Map<SynergyRoutineStep, InventoryProduct[]>();
  for (const step of requiredSteps) {
    productsByStep.set(step, []);
  }

  for (const product of products) {
    const step = inferRoutineStep(product.name);
    if (step && productsByStep.has(step)) {
      productsByStep.get(step)!.push(product);
    }
  }

  // 단계별 매칭 결과
  const stepMatches: RoutineStepMatch[] = requiredSteps.map((step) => ({
    step,
    stepLabel: STEP_LABELS[step],
    matchedProducts: productsByStep.get(step) ?? [],
    isMissing: (productsByStep.get(step) ?? []).length === 0,
  }));

  // 누락 단계
  const missingSteps = stepMatches.filter((m) => m.isMissing).map((m) => m.step);

  // 보유율
  const matchedCount = stepMatches.filter((m) => !m.isMissing).length;
  const coveragePercent = Math.round((matchedCount / requiredSteps.length) * 100);

  // 잔여량 부족 제품
  const lowStockProducts = products.filter(
    (p) => p.remainingPercent !== undefined && p.remainingPercent < LOW_STOCK_THRESHOLD
  );

  // 도포 순서 추천 (보유 제품만)
  const orderedSteps = suggestRoutineOrder(products);

  return {
    orderedSteps,
    stepMatches,
    missingSteps,
    coveragePercent,
    lowStockProducts,
  };
}

/**
 * 누락 단계에 대한 구매 추천 메시지 생성
 */
export function getMissingStepMessages(missingSteps: SynergyRoutineStep[]): string[] {
  return missingSteps.map((step) => `${STEP_LABELS[step]}이(가) 없어요. 추가하면 루틴이 완성돼요!`);
}

/**
 * 잔여량 부족 제품 알림 메시지 생성
 */
export function getLowStockMessages(lowStockProducts: InventoryProduct[]): string[] {
  return lowStockProducts.map(
    (p) => `${p.name}의 잔여량이 ${p.remainingPercent ?? 0}%에요. 재구매를 고려해보세요.`
  );
}

/**
 * 루틴 완성도 요약 메시지
 */
export function getRoutineCoverageSummary(
  coveragePercent: number,
  timeOfDay: 'morning' | 'evening'
): string {
  const label = timeOfDay === 'morning' ? '아침' : '저녁';

  if (coveragePercent === 100) {
    return `${label} 루틴이 완벽해요! 모든 단계에 제품이 있어요.`;
  }
  if (coveragePercent >= 80) {
    return `${label} 루틴이 거의 완성이에요! 한두 가지만 추가하면 돼요.`;
  }
  if (coveragePercent >= 50) {
    return `${label} 루틴의 절반이 채워졌어요. 기본 단계를 먼저 채워보세요.`;
  }
  return `${label} 루틴을 시작해보세요! 기본 제품부터 등록해볼까요?`;
}
