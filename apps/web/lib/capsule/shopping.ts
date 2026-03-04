/**
 * 쇼핑 컴패니언 — 갭 분석 + 추천
 *
 * 캡슐 대비 부족한 카테고리를 식별하고 보완 방향을 제시.
 * @see docs/adr/ADR-075-shopping-companion.md
 */

import type { BeautyProfile, ModuleCode } from './types';
import { ALL_MODULE_CODES, MODULE_LABELS } from './types';
import { getDomain } from './registry';

// =============================================================================
// 타입 정의
// =============================================================================

/** 갭 아이템 */
export interface GapItem {
  /** 도메인 등록소 ID (예: 'skin', 'fashion') */
  domainId: string;
  /** ModuleCode (예: 'S', 'Fashion') */
  moduleCode: ModuleCode;
  domainName: string;
  /** 부족 유형: missing(미생성), under(아이템 부족), low-score(저호환도) */
  gapType: 'missing' | 'under' | 'low-score';
  currentCount: number;
  optimalCount: number;
  reason: string;
  /** 재활용 가능 여부 (인벤토리에서 가져올 수 있는지) */
  canReuse: boolean;
}

/** 갭 분석 결과 */
export interface GapAnalysisResult {
  gaps: GapItem[];
  /** 전체 완성도 (0-100) */
  overallCompleteness: number;
  completeDomains: number;
  totalDomains: number;
}

/** 도메인별 캡슐 상태 (분석 입력용) */
export interface DomainCapsuleStatus {
  /** 도메인 등록소 ID (예: 'skin', 'fashion') */
  domainId: string;
  domainName: string;
  itemCount: number;
  optimalN: number;
  ccs: number;
}

// =============================================================================
// ModuleCode → domainId 매핑 (엔진 등록소는 lowercase ID 사용)
// =============================================================================

const MODULE_TO_DOMAIN: Record<ModuleCode, string> = {
  PC: 'personal-color',
  S: 'skin',
  C: 'body',
  W: 'workout',
  N: 'nutrition',
  H: 'hair',
  M: 'makeup',
  OH: 'oral',
  Fashion: 'fashion',
};

// =============================================================================
// 공개 API
// =============================================================================

/**
 * 갭 분석 — 캡슐 대비 부족한 영역 식별
 *
 * 1. 미생성 도메인 (BeautyProfile에 데이터 없음)
 * 2. 아이템 부족 (현재 < 최적 N)
 * 3. 저호환도 (CCS < 70)
 */
export function analyzeGap(
  profile: BeautyProfile,
  capsuleStatuses: DomainCapsuleStatus[]
): GapAnalysisResult {
  const gaps: GapItem[] = [];
  // statusMap은 domainId (lowercase) 키 기반
  const statusMap = new Map(capsuleStatuses.map((s) => [s.domainId, s]));

  const completedSet = new Set(profile.completedModules);

  let completeDomains = 0;
  const totalDomains = ALL_MODULE_CODES.length;

  for (const moduleCode of ALL_MODULE_CODES) {
    const domainId = MODULE_TO_DOMAIN[moduleCode];
    const domainName = MODULE_LABELS[moduleCode];
    const status = statusMap.get(domainId);

    // 1. 미생성 도메인 (분석 미완료)
    if (!completedSet.has(moduleCode)) {
      gaps.push({
        domainId,
        moduleCode,
        domainName,
        gapType: 'missing',
        currentCount: 0,
        optimalCount: status?.optimalN ?? 3,
        reason: `${domainName} 분석을 완료하면 맞춤 추천을 받을 수 있어요`,
        canReuse: false,
      });
      continue;
    }

    if (!status) {
      // 분석은 완료했지만 캡슐 미생성
      const engine = getDomain(domainId);
      const optimalN = engine?.getOptimalN(profile) ?? 3;
      gaps.push({
        domainId,
        moduleCode,
        domainName,
        gapType: 'under',
        currentCount: 0,
        optimalCount: optimalN,
        reason: `${domainName} 캡슐을 생성하면 더 나은 조합을 만들 수 있어요`,
        canReuse: moduleCode === 'Fashion',
      });
      continue;
    }

    // 2. 아이템 부족
    if (status.itemCount < status.optimalN) {
      gaps.push({
        domainId,
        moduleCode,
        domainName,
        gapType: 'under',
        currentCount: status.itemCount,
        optimalCount: status.optimalN,
        reason: `${domainName}에 ${status.optimalN - status.itemCount}개 아이템이 더 필요해요`,
        canReuse: moduleCode === 'Fashion',
      });
      continue;
    }

    // 3. 저호환도
    if (status.ccs < 70) {
      gaps.push({
        domainId,
        moduleCode,
        domainName,
        gapType: 'low-score',
        currentCount: status.itemCount,
        optimalCount: status.optimalN,
        reason: `${domainName} 호환도가 낮아요 (${status.ccs}점). 아이템 교체를 추천해요`,
        canReuse: moduleCode === 'Fashion',
      });
      continue;
    }

    completeDomains++;
  }

  const overallCompleteness =
    totalDomains > 0 ? Math.round((completeDomains / totalDomains) * 100) : 0;

  // 우선순위 정렬: missing → under → low-score
  const priority: Record<GapItem['gapType'], number> = {
    missing: 0,
    under: 1,
    'low-score': 2,
  };
  gaps.sort((a, b) => priority[a.gapType] - priority[b.gapType]);

  return {
    gaps,
    overallCompleteness,
    completeDomains,
    totalDomains,
  };
}
