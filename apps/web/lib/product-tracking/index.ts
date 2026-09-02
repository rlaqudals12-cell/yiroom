/**
 * 제품 사용 기록과 분석 경과를 함께 되짚는 모듈
 *
 * 제품 개봉일 전후의 분석 기록을 나란히 보여준다.
 * 두 기록의 동시 발생만 다루며 제품 효과나 인과관계를 판정하지 않는다.
 *
 * @module lib/product-tracking
 * @description 이룸 고유 가치 — 어떤 전문가도, 어떤 앱도 할 수 없는 것
 * @see docs/TODO.md 섹션 7 "제품→결과 추적 루프"
 */

// ============================================
// 타입 정의
// ============================================

/** 추적 중인 제품 */
export interface TrackedProduct {
  id: string;
  productId: string;
  productName: string;
  productBrand: string;
  /** 제품 카테고리 (skincare, supplement, haircare 등) */
  category: 'skincare' | 'supplement' | 'haircare' | 'cosmetic';
  /** 사용 시작일 */
  startDate: string;
  /** 현재 사용 중인지 */
  isActive: boolean;
  /** 사용 중단일 (isActive=false일 때) */
  endDate?: string;
  /** 사용자 메모 */
  notes?: string;
}

/** 분석 점수 스냅샷 */
export interface ScoreSnapshot {
  date: string;
  /** 저장된 분석이 Mock/폴백 결과인지 여부 — 경과 재생에서 출처를 숨기지 않는다. */
  usedFallback?: boolean;
  /** S-1 피부 지표 */
  skin?: {
    hydration?: number;
    oil?: number;
    pores?: number;
    wrinkles?: number;
    elasticity?: number;
    pigmentation?: number;
    trouble?: number;
    sensitivity?: number;
    overallScore?: number;
  };
  /** H-1 헤어 지표 */
  hair?: {
    hydration?: number;
    scalp?: number;
    damage?: number;
    density?: number;
    shine?: number;
    overallScore?: number;
  };
}

/** 제품 효과 분석 결과 */
export interface ProductEffectAnalysis {
  productId: string;
  productName: string;
  /** 사용 기간 (일) */
  durationDays: number;
  /** 점수 변화 */
  changes: {
    metricId: string;
    metricName: string;
    before: number;
    after: number;
    change: number;
    /** 변화 비율 (%) */
    changePercent: number;
    /** 개선/악화/변화없음 */
    trend: 'improved' | 'worsened' | 'stable';
  }[];
  /** 전체 효과 요약 */
  summary: string;
  /** 효과 신뢰도 (사용 기간, 분석 빈도 기반) */
  reliability: 'high' | 'medium' | 'low';
}

/** 제품 개봉일 전후에 실제 저장된 분석 기록 한 쌍. */
export interface ProductProgressReplay {
  product: TrackedProduct;
  beforeSnapshot: ScoreSnapshot;
  afterSnapshot: ScoreSnapshot;
  analysis: ProductEffectAnalysis;
  /** 전후 기록 중 하나라도 예시 결과이면 낮은 신뢰도로 고지한다. */
  includesFallback: boolean;
}

// ============================================
// 효과 분석 로직
// ============================================

/**
 * 제품 효과 분석
 *
 * 제품 사용 시작 시점의 분석 점수 vs 최신 분석 점수를 비교하여
 * 어떤 지표가 얼마나 변했는지 계산
 *
 * @param product - 추적 중인 제품
 * @param startSnapshot - 사용 시작 시점 분석 결과
 * @param currentSnapshot - 현재 분석 결과
 * @returns 효과 분석 결과
 */
export function analyzeProductEffect(
  product: TrackedProduct,
  startSnapshot: ScoreSnapshot,
  currentSnapshot: ScoreSnapshot
): ProductEffectAnalysis {
  const startDate = new Date(product.startDate);
  const currentDate = new Date(currentSnapshot.date);
  const durationDays = Math.max(
    0,
    Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  const changes: ProductEffectAnalysis['changes'] = [];

  // 카테고리에 따라 관련 지표 비교
  if (product.category === 'skincare' || product.category === 'cosmetic') {
    const before = startSnapshot.skin;
    const after = currentSnapshot.skin;
    if (before && after) {
      const metrics = [
        { id: 'hydration', name: '수분도' },
        { id: 'oil', name: '유분도' },
        { id: 'pores', name: '모공' },
        { id: 'wrinkles', name: '주름' },
        { id: 'elasticity', name: '탄력' },
        { id: 'pigmentation', name: '색소침착' },
        { id: 'trouble', name: '트러블' },
        { id: 'sensitivity', name: '민감도' },
        { id: 'overallScore', name: '종합 점수' },
      ];

      for (const metric of metrics) {
        const beforeVal = before[metric.id as keyof typeof before];
        const afterVal = after[metric.id as keyof typeof after];
        if (typeof beforeVal === 'number' && typeof afterVal === 'number') {
          const change = afterVal - beforeVal;
          const changePercent = beforeVal !== 0 ? Math.round((change / beforeVal) * 100) : 0;
          changes.push({
            metricId: metric.id,
            metricName: metric.name,
            before: beforeVal,
            after: afterVal,
            change,
            changePercent,
            trend: Math.abs(change) < 3 ? 'stable' : change > 0 ? 'improved' : 'worsened',
          });
        }
      }
    }
  }

  if (product.category === 'haircare') {
    const before = startSnapshot.hair;
    const after = currentSnapshot.hair;
    if (before && after) {
      const metrics = [
        { id: 'hydration', name: '수분도' },
        { id: 'scalp', name: '두피 건강' },
        { id: 'damage', name: '손상도' },
        { id: 'density', name: '모발 밀도' },
        { id: 'shine', name: '윤기' },
        { id: 'overallScore', name: '종합 점수' },
      ];

      for (const metric of metrics) {
        const beforeVal = before[metric.id as keyof typeof before];
        const afterVal = after[metric.id as keyof typeof after];
        if (typeof beforeVal === 'number' && typeof afterVal === 'number') {
          const change = afterVal - beforeVal;
          const changePercent = beforeVal !== 0 ? Math.round((change / beforeVal) * 100) : 0;
          changes.push({
            metricId: metric.id,
            metricName: metric.name,
            before: beforeVal,
            after: afterVal,
            change,
            changePercent,
            trend: Math.abs(change) < 3 ? 'stable' : change > 0 ? 'improved' : 'worsened',
          });
        }
      }
    }
  }

  // 신뢰도 결정 (사용 기간 기반)
  let reliability: 'high' | 'medium' | 'low';
  if (durationDays >= 28) {
    reliability = 'high'; // 4주 이상
  } else if (durationDays >= 14) {
    reliability = 'medium'; // 2주 이상
  } else {
    reliability = 'low'; // 2주 미만
  }

  // 사용자 대면 요약은 인과를 주장하지 않고 실제로 함께 저장된 기록만 말한다.
  const summary = `${product.productName} 개봉일로부터 ${durationDays}일 뒤 저장 기록까지 피부 지표 ${changes.length}개를 비교했어요. 계속 사용했는지는 확인할 수 없으며, 제품의 효과나 원인을 뜻하지 않아요.`;

  return {
    productId: product.productId,
    productName: product.productName,
    durationDays,
    changes,
    summary,
    reliability,
  };
}

/**
 * 제품 개봉일을 경계로 가장 가까운 이전 기록과 가장 최신 이후 기록을 고른다.
 * 전후 기록이 모두 있을 때만 재생 가능하며, 결과는 인과 추정이 아닌 기록 비교다.
 */
export function buildProductProgressReplay(
  product: TrackedProduct,
  snapshots: ScoreSnapshot[]
): ProductProgressReplay | null {
  const openedAt = new Date(product.startDate).getTime();
  if (!Number.isFinite(openedAt)) return null;

  const ordered = snapshots
    .filter((snapshot) => Number.isFinite(new Date(snapshot.date).getTime()))
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const beforeCandidates = ordered.filter(
    (snapshot) => new Date(snapshot.date).getTime() <= openedAt
  );
  const afterCandidates = ordered.filter(
    (snapshot) => new Date(snapshot.date).getTime() > openedAt
  );

  const beforeSnapshot = beforeCandidates[beforeCandidates.length - 1];
  const afterSnapshot = afterCandidates[afterCandidates.length - 1];
  if (!beforeSnapshot || !afterSnapshot) return null;

  return {
    product,
    beforeSnapshot,
    afterSnapshot,
    analysis: analyzeProductEffect(product, beforeSnapshot, afterSnapshot),
    includesFallback: beforeSnapshot.usedFallback === true || afterSnapshot.usedFallback === true,
  };
}

/**
 * 여러 제품의 기여도 추정 (인과 분석 기초)
 *
 * 같은 기간에 여러 제품을 사용했을 때, 각 제품의 기여도를 추정
 * 단순화된 방법: 제품의 주요 성분과 개선된 지표의 상관관계
 *
 * @param effects - 각 제품의 효과 분석 결과
 * @returns 기여도 순위 (높은 기여도 순)
 */
export function estimateContribution(
  effects: ProductEffectAnalysis[]
): { productName: string; estimatedContribution: number; topMetric: string }[] {
  return effects
    .map((effect) => {
      const improvedCount = effect.changes.filter((c) => c.trend === 'improved').length;
      const totalChange = effect.changes.reduce((sum, c) => sum + Math.max(0, c.change), 0);
      const topChange = effect.changes.sort((a, b) => b.change - a.change)[0];

      return {
        productName: effect.productName,
        // 단순 추정: 개선된 지표 수 × 총 변화량
        estimatedContribution: improvedCount * totalChange,
        topMetric: topChange?.metricName ?? '없음',
      };
    })
    .sort((a, b) => b.estimatedContribution - a.estimatedContribution);
}
