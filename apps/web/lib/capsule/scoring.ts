/**
 * CCS (Capsule Compatibility Score) 3-Layer 스코어링
 *
 * @see docs/adr/ADR-071-cross-module-scoring.md
 *
 * CCS = (L1 × 0.40) + (L2 × 0.25) + (L3 × 0.35)
 *   L1: 동일 도메인 내 아이템 쌍 호환성
 *   L2: 서로 다른 도메인 간 크로스 규칙
 *   L3: 각 아이템의 BeautyProfile 적합도
 */

import type {
  BeautyProfile,
  CapsuleItem,
  CCSGrade,
  CompatibilityScore,
  CrossDomainRule,
} from './types';
import { CCS_WEIGHTS, CCS_THRESHOLD, getCCSGrade } from './types';
import { getDomain } from './registry';

// =============================================================================
// 공개 API
// =============================================================================

/** CCS 계산 결과 */
export interface CCSResult {
  score: number;
  grade: CCSGrade;
  meetsThreshold: boolean;
  layers: {
    l1: number;
    l2: number;
    l3: number;
  };
}

/**
 * CCS 계산 — 3-Layer 통합 점수
 *
 * @param items 평가 대상 아이템들 (도메인별 그룹)
 * @param profile 사용자 BeautyProfile
 * @param crossDomainRules 크로스 도메인 규칙 (DB에서 로드)
 * @returns CCS 계산 결과
 */
export function calculateCCS(
  items: DomainItemGroup[],
  profile: BeautyProfile,
  crossDomainRules: CrossDomainRule[]
): CCSResult {
  const l1 = intraDomainScore(items);
  const l2 = crossDomainScore(items, crossDomainRules);
  const l3 = profileFitScore(items, profile);

  const score = Math.round(
    l1 * CCS_WEIGHTS.L1_INTRA_DOMAIN +
      l2 * CCS_WEIGHTS.L2_CROSS_DOMAIN +
      l3 * CCS_WEIGHTS.L3_PROFILE_FIT
  );

  // 0-100 범위 클램핑
  const clampedScore = Math.max(0, Math.min(100, score));

  return {
    score: clampedScore,
    grade: getCCSGrade(clampedScore),
    meetsThreshold: clampedScore >= CCS_THRESHOLD,
    layers: { l1, l2, l3 },
  };
}

// =============================================================================
// 도메인별 아이템 그룹
// =============================================================================

/** 도메인별 아이템 묶음 */
export interface DomainItemGroup {
  domainId: string;
  items: CapsuleItem<unknown>[];
}

// =============================================================================
// L1: 도메인 내 호환성 (Intra-Domain)
// =============================================================================

/**
 * L1 — 동일 도메인 내 아이템 쌍 호환성 평균
 *
 * 각 도메인 엔진의 getPairwiseScore()를 호출하여
 * 모든 (n choose 2) 쌍의 평균 계산
 */
export function intraDomainScore(groups: DomainItemGroup[]): number {
  if (groups.length === 0) return 100;

  let totalScore = 0;
  let totalPairs = 0;

  for (const group of groups) {
    const { domainId, items } = group;
    if (items.length < 2) {
      // 아이템 1개 이하면 충돌 없음 → 100
      totalScore += 100;
      totalPairs += 1;
      continue;
    }

    const engine = getDomain(domainId);
    if (!engine) {
      // 등록 안 된 도메인 → 기본 80점
      totalScore += 80;
      totalPairs += 1;
      continue;
    }

    let pairScore = 0;
    let pairCount = 0;

    // 모든 쌍 조합 (n choose 2)
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        pairScore += engine.getPairwiseScore(items[i].item, items[j].item);
        pairCount++;
      }
    }

    if (pairCount > 0) {
      totalScore += pairScore / pairCount;
      totalPairs++;
    }
  }

  return totalPairs > 0 ? Math.round(totalScore / totalPairs) : 100;
}

// =============================================================================
// L2: 크로스 도메인 호환성 (Cross-Domain)
// =============================================================================

/**
 * L2 — 서로 다른 도메인 간 크로스 규칙 적용
 *
 * cross_domain_rules 테이블의 시너지/충돌 규칙을 평가
 * 규칙 없는 도메인 쌍: 기본 50점 (neutral)
 */
export function crossDomainScore(groups: DomainItemGroup[], rules: CrossDomainRule[]): number {
  if (groups.length < 2) return 100;

  let totalScore = 0;
  let pairCount = 0;

  // 모든 도메인 쌍 조합
  for (let i = 0; i < groups.length; i++) {
    for (let j = i + 1; j < groups.length; j++) {
      const d1 = groups[i].domainId;
      const d2 = groups[j].domainId;

      // 규칙 찾기 (양방향)
      const rule = findCrossDomainRule(d1, d2, rules);

      if (rule) {
        totalScore += rule.factor;
      } else {
        // 규칙 없으면 neutral 50
        totalScore += 50;
      }
      pairCount++;
    }
  }

  return pairCount > 0 ? Math.round(totalScore / pairCount) : 100;
}

/**
 * 크로스 도메인 규칙 조회 (양방향)
 */
function findCrossDomainRule(
  d1: string,
  d2: string,
  rules: CrossDomainRule[]
): CrossDomainRule | undefined {
  return rules.find(
    (r) => (r.domain1 === d1 && r.domain2 === d2) || (r.domain1 === d2 && r.domain2 === d1)
  );
}

// =============================================================================
// L3: 프로필 적합도 (Profile Fit)
// =============================================================================

/**
 * L3 — 각 아이템의 profileFitScore 평균
 *
 * CapsuleItem.profileFitScore를 각 도메인 엔진이 계산
 */
export function profileFitScore(groups: DomainItemGroup[], _profile: BeautyProfile): number {
  const allItems = groups.flatMap((g) => g.items);

  if (allItems.length === 0) return 100;

  const total = allItems.reduce((sum, item) => sum + item.profileFitScore, 0);

  return Math.round(total / allItems.length);
}

// =============================================================================
// 유틸리티
// =============================================================================

/**
 * CCS 임계값 미달 아이템 식별
 *
 * @param items 아이템 목록
 * @param threshold 임계값 (기본 CCS_THRESHOLD)
 * @returns 대체 필요한 아이템 인덱스
 */
export function findLowScoreItems(
  items: CapsuleItem<unknown>[],
  threshold: number = CCS_THRESHOLD
): number[] {
  return items
    .map((item, index) => ({ index, score: item.profileFitScore }))
    .filter((entry) => entry.score < threshold)
    .sort((a, b) => a.score - b.score)
    .map((entry) => entry.index);
}

/**
 * 단일 도메인 호환성 점수 계산 (CompatibilityScore 형태)
 *
 * @param domainId 도메인 ID
 * @param items 아이템들
 * @param profile 사용자 프로필
 * @param rules 크로스 도메인 규칙
 * @returns CompatibilityScore
 */
export function calculateDomainCompatibility(
  domainId: string,
  items: CapsuleItem<unknown>[],
  profile: BeautyProfile,
  rules: CrossDomainRule[]
): CompatibilityScore {
  const group: DomainItemGroup = { domainId, items };

  const l1 = intraDomainScore([group]);
  const l2 = crossDomainScore([group], rules);
  const l3 = profileFitScore([group], profile);

  const overall = Math.round(
    l1 * CCS_WEIGHTS.L1_INTRA_DOMAIN +
      l2 * CCS_WEIGHTS.L2_CROSS_DOMAIN +
      l3 * CCS_WEIGHTS.L3_PROFILE_FIT
  );

  return {
    overall: Math.max(0, Math.min(100, overall)),
    layer1: l1,
    layer2: l2,
    layer3: l3,
  };
}
