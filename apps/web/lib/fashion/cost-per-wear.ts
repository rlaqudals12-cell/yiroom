/**
 * Cost-per-Wear 분석
 * @description 착용 빈도 기반 의류 가치 분석 + 미착용 정리 추천
 */

// ============================================
// 타입
// ============================================

export interface WardrobeItemUsage {
  /** 아이템 ID */
  id: string;
  /** 아이템 이름 */
  name: string;
  /** 구매 가격 (원) */
  priceKrw: number;
  /** 총 착용 횟수 */
  wearCount: number;
  /** 구매일 */
  purchasedAt: Date;
  /** 마지막 착용일 */
  lastWornAt: Date | null;
  /** 카테고리 */
  category: string;
}

export interface CostPerWearResult {
  /** 1회 착용당 비용 (원) */
  costPerWear: number;
  /** 가치 등급 */
  valueGrade: CostPerWearGrade;
  /** 가치 설명 */
  gradeLabel: string;
  /** 보유 기간 (일) */
  ownershipDays: number;
  /** 주당 평균 착용 횟수 */
  wearsPerWeek: number;
}

export type CostPerWearGrade = 'excellent' | 'good' | 'fair' | 'poor' | 'unused';

export interface WardrobeInsight {
  /** 전체 투자 금액 */
  totalInvestment: number;
  /** 평균 CPW */
  averageCpw: number;
  /** 가장 가치 있는 아이템 (낮은 CPW) */
  bestValue: WardrobeItemUsage | null;
  /** 가장 비효율적 아이템 (높은 CPW) */
  worstValue: WardrobeItemUsage | null;
  /** 미착용 아이템 수 */
  unusedCount: number;
  /** 정리 추천 아이템 */
  declutterSuggestions: DeclutterSuggestion[];
}

export interface DeclutterSuggestion {
  /** 아이템 */
  item: WardrobeItemUsage;
  /** 추천 이유 */
  reason: string;
  /** 추천 행동 */
  action: 'sell' | 'donate' | 'recycle';
}

// ============================================
// CPW 계산
// ============================================

/**
 * Cost-per-Wear 계산
 */
export function calculateCostPerWear(
  item: WardrobeItemUsage,
  now: Date = new Date()
): CostPerWearResult {
  const ownershipDays = Math.max(
    1,
    Math.floor((now.getTime() - item.purchasedAt.getTime()) / (1000 * 60 * 60 * 24))
  );

  const costPerWear =
    item.wearCount > 0 ? Math.round(item.priceKrw / item.wearCount) : item.priceKrw;

  const wearsPerWeek =
    item.wearCount > 0 ? Math.round((item.wearCount / ownershipDays) * 7 * 10) / 10 : 0;

  const valueGrade = getValueGrade(costPerWear, item.wearCount);
  const gradeLabel = GRADE_LABELS[valueGrade];

  return {
    costPerWear,
    valueGrade,
    gradeLabel,
    ownershipDays,
    wearsPerWeek,
  };
}

/**
 * CPW 기반 가치 등급 판정
 */
function getValueGrade(cpw: number, wearCount: number): CostPerWearGrade {
  if (wearCount === 0) return 'unused';
  if (cpw <= 1000) return 'excellent'; // 1,000원 이하/회
  if (cpw <= 3000) return 'good'; // 3,000원 이하/회
  if (cpw <= 10000) return 'fair'; // 10,000원 이하/회
  return 'poor'; // 10,000원 초과/회
}

const GRADE_LABELS: Record<CostPerWearGrade, string> = {
  excellent: '최고의 가성비! 잘 입는 옷이에요.',
  good: '괜찮은 투자예요. 더 자주 입어보세요.',
  fair: '가격 대비 착용이 아쉬워요.',
  poor: '착용 빈도를 높이거나 정리를 고려해보세요.',
  unused: '아직 한 번도 입지 않았어요.',
};

// ============================================
// 미착용 정리 추천
// ============================================

/** 미착용 기준일 (90일) */
const UNWORN_THRESHOLD_DAYS = 90;

/** 저활용 기준 (3회 이하) */
const LOW_WEAR_THRESHOLD = 3;

/**
 * 단일 아이템에 대한 정리 추천 판정
 */
function evaluateDeclutter(item: WardrobeItemUsage, now: Date): DeclutterSuggestion | null {
  const daysSinceLastWorn = item.lastWornAt
    ? Math.floor((now.getTime() - item.lastWornAt.getTime()) / (1000 * 60 * 60 * 24))
    : Infinity;

  const ownershipDays = Math.floor(
    (now.getTime() - item.purchasedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // 한 번도 안 입고 90일 이상 보유
  if (item.wearCount === 0 && ownershipDays > UNWORN_THRESHOLD_DAYS) {
    return {
      item,
      reason: `${ownershipDays}일 동안 한 번도 입지 않았어요.`,
      action: item.priceKrw > 50000 ? 'sell' : 'donate',
    };
  }

  // 90일 이상 미착용 + 저활용 (lastWornAt이 있는 경우만)
  if (
    item.lastWornAt &&
    daysSinceLastWorn > UNWORN_THRESHOLD_DAYS &&
    item.wearCount <= LOW_WEAR_THRESHOLD
  ) {
    return {
      item,
      reason: `${daysSinceLastWorn}일 동안 입지 않았고, 총 ${item.wearCount}회만 착용했어요.`,
      action: item.priceKrw > 30000 ? 'sell' : 'donate',
    };
  }

  // 180일 이상 미착용 (활용도 높았더라도, lastWornAt이 있는 경우만)
  if (item.lastWornAt && daysSinceLastWorn > 180) {
    return {
      item,
      reason: `6개월 이상 입지 않았어요. 스타일이 바뀌었을 수 있어요.`,
      action: 'donate',
    };
  }

  return null;
}

/**
 * 정리 추천 아이템 식별
 */
export function getDeclutterSuggestions(
  items: WardrobeItemUsage[],
  now: Date = new Date()
): DeclutterSuggestion[] {
  const suggestions: DeclutterSuggestion[] = [];

  for (const item of items) {
    const suggestion = evaluateDeclutter(item, now);
    if (suggestion) {
      suggestions.push(suggestion);
    }
  }

  return suggestions;
}

// ============================================
// 옷장 인사이트
// ============================================

/**
 * 옷장 전체 인사이트 분석
 */
export function getWardrobeInsight(
  items: WardrobeItemUsage[],
  now: Date = new Date()
): WardrobeInsight {
  if (items.length === 0) {
    return {
      totalInvestment: 0,
      averageCpw: 0,
      bestValue: null,
      worstValue: null,
      unusedCount: 0,
      declutterSuggestions: [],
    };
  }

  const totalInvestment = items.reduce((sum, item) => sum + item.priceKrw, 0);

  // CPW 계산 (착용 1회 이상만)
  const wornItems = items.filter((item) => item.wearCount > 0);
  const cpwList = wornItems.map((item) => ({
    item,
    cpw: calculateCostPerWear(item, now).costPerWear,
  }));

  const averageCpw =
    cpwList.length > 0
      ? Math.round(cpwList.reduce((sum, c) => sum + c.cpw, 0) / cpwList.length)
      : 0;

  // 정렬해서 최고/최저 가치 찾기
  cpwList.sort((a, b) => a.cpw - b.cpw);
  const bestValue = cpwList.length > 0 ? cpwList[0].item : null;
  const worstValue = cpwList.length > 0 ? cpwList[cpwList.length - 1].item : null;

  const unusedCount = items.filter((item) => item.wearCount === 0).length;
  const declutterSuggestions = getDeclutterSuggestions(items, now);

  return {
    totalInvestment,
    averageCpw,
    bestValue,
    worstValue,
    unusedCount,
    declutterSuggestions,
  };
}

/**
 * 카테고리별 CPW 통계
 */
export function getCpwByCategory(
  items: WardrobeItemUsage[],
  now: Date = new Date()
): Record<string, { averageCpw: number; count: number }> {
  const categories: Record<string, { totalCpw: number; count: number }> = {};

  for (const item of items) {
    if (item.wearCount === 0) continue;

    const cpw = calculateCostPerWear(item, now).costPerWear;
    if (!categories[item.category]) {
      categories[item.category] = { totalCpw: 0, count: 0 };
    }
    categories[item.category].totalCpw += cpw;
    categories[item.category].count += 1;
  }

  const result: Record<string, { averageCpw: number; count: number }> = {};
  for (const [cat, data] of Object.entries(categories)) {
    result[cat] = {
      averageCpw: Math.round(data.totalCpw / data.count),
      count: data.count,
    };
  }
  return result;
}
