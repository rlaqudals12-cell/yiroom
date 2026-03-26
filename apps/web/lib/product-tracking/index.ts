/**
 * 제품→결과 추적 모듈
 *
 * "이 크림 3주 사용 → 수분도 +14%"
 * 사용자가 구매한 제품의 효과를 피부/모발 분석 점수 변화로 추적
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
  /** S-1 피부 지표 */
  skin?: {
    hydration?: number;
    oil?: number;
    pores?: number;
    wrinkles?: number;
    elasticity?: number;
    pigmentation?: number;
    trouble?: number;
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
  const durationDays = Math.floor(
    (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
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

  // 요약 생성
  const improved = changes.filter((c) => c.trend === 'improved');
  const worsened = changes.filter((c) => c.trend === 'worsened');

  let summary: string;
  if (improved.length > 0 && worsened.length === 0) {
    const topImproved = improved.sort((a, b) => b.change - a.change)[0];
    summary = `${product.productName} 사용 ${durationDays}일 — ${topImproved.metricName} ${topImproved.change > 0 ? '+' : ''}${topImproved.change}점 개선`;
  } else if (worsened.length > 0 && improved.length === 0) {
    summary = `${product.productName} 사용 ${durationDays}일 — 일부 지표 하락, 제품 변경 검토 권장`;
  } else if (improved.length > 0 && worsened.length > 0) {
    summary = `${product.productName} 사용 ${durationDays}일 — ${improved.length}개 지표 개선, ${worsened.length}개 지표 하락`;
  } else {
    summary = `${product.productName} 사용 ${durationDays}일 — 유의미한 변화 없음 (더 사용 후 재평가)`;
  }

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
