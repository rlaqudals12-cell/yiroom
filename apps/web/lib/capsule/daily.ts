/**
 * Daily Capsule — 6단계 파이프라인
 *
 * "원버튼 데일리" — 사용자가 버튼 하나로 오늘의 루틴 생성
 * @see docs/adr/ADR-073-one-button-daily.md
 */

import type {
  DailyCapsule,
  DailyCapsuleStatus,
  DailyItem,
  DailyContext,
  ModuleCode,
} from '@/types/capsule';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  generateRoutine,
  applyConditionalModifications,
  getHydrationLabel,
  deriveConcernsFromScores,
  deriveCarePhase,
  getEveningCycle,
  detectOwnedActives,
  mergeGoalsIntoConcerns,
} from '@/lib/skincare';
import type { TodaySkinCondition, EveningCycle, ActiveCategory, SkinGoalId } from '@/lib/skincare';
import { getShelfItems } from '@/lib/scan/product-shelf';
import type { SkinTypeId } from '@/lib/mock/skin-analysis';
import { LIPSTICK_RECOMMENDATIONS, type SeasonType } from '@/lib/mock/personal-color';
import { getBeautyProfile } from './profile';
import { attachSolutionProducts } from './solution-products';
import { collectContext } from './context';
import { getAllDomains } from './registry';
import { ensureCapsuleDomains } from './domains';
import { calculateCCS } from './scoring';
import type { DomainItemGroup } from './scoring';
import { getCrossDomainRules } from './capsule-repository';

// 데일리 루틴 제외 도메인 (2026-07-06 사용자 관점 정리)
// - personal-color: identity 축("변하지 않아요") — 매일 반복할 행동이 없음
// - skin: 캡슐 엔진(제품 추상화)이 아니라 정본 루틴 엔진(lib/skincare generateRoutine)에서
//   파생 — buildSkinRoutineItems(). 행동(루틴 스텝)을 SkinProduct에 밀어 넣으면
//   카테고리 dedup(minimize) 때문에 "세안 없는 아침" 같은 왜곡이 생겼음.
const DAILY_EXCLUDED_DOMAINS: ReadonlySet<string> = new Set(['personal-color', 'skin']);

// 도메인별 데일리 아이템 수 — 실제 루틴 모양에 맞춤
// fashion 1 = 코디는 원자적 행동 1개 / hair 2 = 샴푸·컨디셔너 (매일 트리트먼트는 과함)
// body 2 = 실루엣 점검·전신 밸런스 체크 (ADR-098: 자세교정/스트레칭류 off-thesis 제거,
// 스타일링 행동으로 교체 — lib/capsule/domains/body.ts CATEGORY_NAMES 참조)
const DAILY_MAX_ITEMS: Record<string, number> = { fashion: 1, hair: 2, body: 2 };
const DAILY_MAX_ITEMS_DEFAULT = 3;

// 캡슐 엔진 버전 — 루틴 조립 로직/스펙명이 바뀌면 이 값을 올려 옛 캐시를 무효화한다.
// 배포 후 사용자가 어제 캐시된 옛 루틴(스펙명 없는 등)을 계속 보는 문제를 막는다.
// 저장 위치: 별도 컬럼이 없으므로 items JSONB의 각 아이템에 engineVersion으로 실어 보낸다
// (마이그레이션 금지 — DailyItem에 optional 필드로 캐스팅, 렌더링엔 영향 없음).
export const CAPSULE_ENGINE_VERSION = 'v2-2026-07-10';

/** items JSONB에 엔진 버전을 실어 나르기 위한 캐스팅 타입 (별도 컬럼 없이 캐시 무효화) */
type VersionedItem = DailyItem & { engineVersion?: string };

/**
 * 캐시된 캡슐이 현재 엔진 버전과 다른가(=스테일).
 * - 아이템이 없으면 무효화 대상 아님(빈 캡슐 재생성 루프 방지) → false
 * - 첫 아이템의 engineVersion이 현재 버전과 다르면 스테일 → true
 * (옛 캐시는 engineVersion이 없어 undefined ≠ 현재버전 → 재생성)
 */
export function isCapsuleStale(capsule: DailyCapsule): boolean {
  if (capsule.items.length === 0) return false;
  const version = (capsule.items[0] as VersionedItem).engineVersion;
  return version !== CAPSULE_ENGINE_VERSION;
}

/** 저장 직전 각 아이템에 현재 엔진 버전을 스탬프 */
function stampEngineVersion(items: DailyItem[]): void {
  for (const item of items) {
    (item as VersionedItem).engineVersion = CAPSULE_ENGINE_VERSION;
  }
}

/**
 * 신선한 캐시면 그대로 반환, 스테일(옛 엔진 버전)이면 삭제하고 null(재생성 신호).
 * (skinEveningFocus는 비영속 파생 필드 — 생성일 응답에만 부착, 캐시 read엔 없을 수 있음)
 */
async function resolveFreshCache(userId: string, date: string): Promise<DailyCapsule | null> {
  const cached = await getCachedDailyCapsule(userId, date);
  if (!cached) return null;
  if (!isCapsuleStale(cached)) return cached;
  // 스테일 → 삭제 후 재생성 (사용자가 옛 루틴을 계속 보는 문제 해소)
  await deleteStaleCapsule(userId, date);
  return null;
}

// 도메인 → 모듈코드 매핑
const DOMAIN_TO_MODULE: Record<string, ModuleCode> = {
  skin: 'S',
  fashion: 'Fashion',
  nutrition: 'N',
  workout: 'W',
  hair: 'H',
  makeup: 'M',
  'personal-color': 'PC',
  oral: 'OH',
  body: 'C',
};

// =============================================================================
// 공개 API
// =============================================================================

/**
 * Daily Capsule 생성 또는 캐시 반환
 *
 * 6단계 파이프라인:
 * 1. BeautyProfile 로드
 * 2. 컨텍스트 수집 (요일, 계절, 최근 사용)
 * 3. 각 활성 도메인 curate()
 * 4. CCS 검증 (< threshold 아이템 교체)
 * 5. Safety 필터링 (BLOCK 제외)
 * 6. Assemble → daily_capsules 저장
 */
export async function generateDailyCapsule(userId: string): Promise<DailyCapsule> {
  // 캐시 확인 — (userId, date) 기준. 신선하면 즉시 반환, 스테일이면 삭제 후 재생성.
  const today = new Date().toISOString().split('T')[0];
  const fresh = await resolveFreshCache(userId, today);
  if (fresh) return fresh;

  // Step 1: BeautyProfile 로드
  const profile = await getBeautyProfile(userId);
  if (!profile) {
    return createEmptyDailyCapsule(userId, today);
  }

  // 오늘 저녁 주기 파생 (스킨 루틴·응답에 반영). 단계 계획은 buildSkinRoutineItems가 파생.
  const eveningFocus = await computeEveningFocus(profile, userId);

  // Step 2: 컨텍스트 수집
  const context = await collectContext(userId);

  // Step 3: 각 도메인 curate
  // ADR-098: 시각 정체성 5축(PC/S/C/H/M)+Fashion만 — W/N(숨김)/OH(제거) 제외.
  ensureCapsuleDomains();
  const domains = getAllDomains();
  const domainGroups: DomainItemGroup[] = [];
  const dailyItems: DailyItem[] = [];

  // 피부 루틴 = 정본 루틴 엔진(lib/skincare)에서 파생 — 아침/저녁 필수 스텝 + 피부타입 개인화.
  // 먼저 push해야 아침 그룹에서 스킨케어 → 메이크업 → 코디 순서가 됨 (정렬은 timeOfDay만 봄).
  dailyItems.push(...buildSkinRoutineItems(profile, { eveningFocus }));

  for (const engine of domains) {
    // 제외 사유는 DAILY_EXCLUDED_DOMAINS 정의 주석 참조 (PC = 행동 없음, skin = 루틴 엔진 파생)
    if (DAILY_EXCLUDED_DOMAINS.has(engine.domainId)) continue;

    const items = await engine.curate(profile, {
      maxItems: Math.min(
        DAILY_MAX_ITEMS[engine.domainId] ?? DAILY_MAX_ITEMS_DEFAULT,
        engine.getOptimalN(profile)
      ),
      excludeRecentlyUsed: true,
    });

    if (items.length === 0) continue;

    // 개인화 적용
    const personalized = engine.personalize(items, profile);
    // 미니멀리즘 적용
    const minimized = engine.minimize(personalized);

    const moduleCode = DOMAIN_TO_MODULE[engine.domainId] ?? 'S';

    // DailyItem으로 변환
    for (const item of minimized) {
      const typedItem = item as { id?: string; name?: string; category?: string };
      const solution = buildItemSolution(engine.domainId, typedItem.category, profile);
      dailyItems.push({
        id: typedItem.id ?? `daily-${engine.domainId}-${dailyItems.length}`,
        moduleCode,
        name: typedItem.name ?? `${engine.domainName} 아이템`,
        reason: generateReason(engine.domainId, context, typedItem.category),
        compatibilityScore: 0, // Step 4에서 업데이트
        isChecked: false,
        timeOfDay: resolveTimeOfDay(engine.domainId, typedItem.category),
        ...(typedItem.category ? { category: typedItem.category } : {}),
        ...(solution ? { solution } : {}),
      });
    }

    // CCS 계산용 그룹
    domainGroups.push({
      domainId: engine.domainId,
      items: minimized.map((item) => ({
        id: `daily-${engine.domainId}`,
        capsuleId: 'daily',
        item,
        profileFitScore: 70, // 기본값
        usageCount: 0,
        lastUsed: null,
        addedAt: new Date().toISOString(),
      })),
    });
  }

  // Step 4: CCS 검증
  const rules = await getCrossDomainRules();
  const ccsResult = calculateCCS(domainGroups, profile, rules);

  // CCS 점수를 각 아이템에 반영
  for (const item of dailyItems) {
    item.compatibilityScore = ccsResult.score;
  }

  // 시간대 정렬: 아침 → 저녁 → 언제든 (사용자 멘탈 모델 = "아침 루틴부터")
  // 홈 위젯이 상위 5개만 보여주므로 아침 아이템이 먼저 오게 한다.
  const TIME_ORDER: Record<string, number> = { morning: 0, evening: 1, anytime: 2 };
  dailyItems.sort(
    (a, b) =>
      (TIME_ORDER[a.timeOfDay ?? 'anytime'] ?? 2) - (TIME_ORDER[b.timeOfDay ?? 'anytime'] ?? 2)
  );

  // Step 5: Safety 필터링 (BLOCK 아이템 제거)
  const filteredItems = await applySafetyFilter(userId, dailyItems);

  // Step 5.5: 솔루션 → 실제 제품 연결 (Phase 3 실물 연결)
  // "이 토너를 바르세요"가 되도록 아이템별 최고 매칭 제품 부착.
  // 실패해도 캡슐 생성은 계속 — 제품 없는 솔루션 텍스트로 동작 (기존과 동일).
  try {
    await attachSolutionProducts(filteredItems, profile);
  } catch (e) {
    console.error('[Daily] 솔루션 제품 부착 실패 (캡슐은 계속):', e);
  }

  // 예상 소요 시간 계산 (도메인당 기본 5분)
  const estimatedMinutes = calculateEstimatedMinutes(filteredItems);

  // 엔진 버전 스탬프 — items JSONB에 실어 저장(캐시 무효화용, 별도 컬럼 없음)
  stampEngineVersion(filteredItems);

  // Step 6: Assemble + 저장
  const daily = await saveDailyCapsule({
    userId,
    date: today,
    items: filteredItems,
    totalCcs: ccsResult.score,
    estimatedMinutes,
  });

  // 파생 필드 부착 (비영속 — DB 컬럼 없음). undefined면 optional 필드로 남음.
  daily.skinEveningFocus = eveningFocus;

  return daily;
}

/**
 * 저녁 그룹 노트에 붙일 사이클링 안내 문구 — 저녁 + 주기 정보 있을 때만.
 * 회복의 날엔 강한 활성 쉬어가기 안내(진정 팁). 그 외엔 오늘 주기 라벨만.
 */
function buildCycleSuffix(
  timeOfDay: 'morning' | 'evening',
  eveningFocus: EveningCycle | undefined
): string {
  if (timeOfDay !== 'evening' || !eveningFocus) return '';
  const restNote =
    eveningFocus.focus === 'recovery'
      ? ' — 진정·보습에 집중하고 강한 활성(레티노이드·산)은 쉬어가요'
      : '';
  return ` · 오늘 저녁은 ${eveningFocus.label}${restNote}`;
}

/**
 * 보유 제품에서 활성 성분 카테고리 탐지 (사이클링 입력).
 * shelf 조회는 v1 배선(getShelfItems, owned) 재사용. 실패 시 빈 세트 폴백.
 */
async function loadOwnedActives(userId: string): Promise<Set<ActiveCategory>> {
  try {
    const supabase = createServiceRoleClient();
    const { items } = await getShelfItems(supabase, userId, { status: 'owned', limit: 200 });
    return detectOwnedActives(items);
  } catch (e) {
    console.error('[Daily] 보유 활성 성분 조회 실패 (빈 세트 폴백):', e);
    return new Set();
  }
}

/**
 * 오늘 저녁 스킨 사이클링 주기 파생.
 * 피부 분석이 없으면 undefined (지어내지 않음). 민감 정보 없으면 100(비민감) 취급.
 */
async function computeEveningFocus(
  profile: { skin?: { type?: string; scores?: Record<string, number>; userGoals?: SkinGoalId[] } },
  userId: string
): Promise<EveningCycle | undefined> {
  if (!profile.skin?.type) return undefined;
  const scores = profile.skin.scores ?? {};
  const carePhase = deriveCarePhase(scores, profile.skin.userGoals ?? []);
  const owned = await loadOwnedActives(userId);
  const sensitivity = typeof scores.sensitivity === 'number' ? scores.sensitivity : 100;
  return getEveningCycle(new Date(), owned, sensitivity, carePhase);
}

/**
 * Daily Capsule 아이템 완료 체크
 */
export async function checkDailyItem(
  dailyCapsuleId: string,
  itemId: string,
  isChecked: boolean
): Promise<DailyCapsule | null> {
  const supabase = createServiceRoleClient();

  // 현재 Daily Capsule 조회
  const { data: row, error } = await supabase
    .from('daily_capsules')
    .select('*')
    .eq('id', dailyCapsuleId)
    .single();

  if (error || !row) {
    console.error('[Daily] 캡슐 조회 실패:', error);
    return null;
  }

  // 아이템 업데이트
  const items = (row.items as DailyItem[]).map((item) =>
    item.id === itemId ? { ...item, isChecked } : item
  );

  // 모든 아이템 완료 시 status 업데이트
  const allChecked = items.every((item) => item.isChecked);
  const newStatus: DailyCapsuleStatus = allChecked ? 'completed' : 'in_progress';

  const { data: updated, error: updateError } = await supabase
    .from('daily_capsules')
    .update({
      items,
      status: newStatus,
      completed_at: allChecked ? new Date().toISOString() : null,
    })
    .eq('id', dailyCapsuleId)
    .select()
    .single();

  if (updateError || !updated) {
    console.error('[Daily] 아이템 체크 업데이트 실패:', updateError);
    return null;
  }

  return mapRowToDailyCapsule(updated);
}

/**
 * 오늘의 Daily Capsule 조회 (캐시)
 */
export async function getTodayDailyCapsule(userId: string): Promise<DailyCapsule | null> {
  const today = new Date().toISOString().split('T')[0];
  return getCachedDailyCapsule(userId, today);
}

/**
 * 운동/영양 기록 시 해당 도메인 캡슐 아이템 자동 완료
 *
 * @param userId - Clerk user ID
 * @param domainModuleCode - 도메인 모듈 코드 ('W' | 'N')
 * @description 루틴 기록 API에서 호출하여 캡슐 상태를 동기화
 */
export async function syncRoutineToCapsule(
  userId: string,
  domainModuleCode: 'W' | 'N'
): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const capsule = await getCachedDailyCapsule(userId, today);
    if (!capsule || capsule.id === 'empty') return;

    // 해당 도메인의 미완료 아이템 찾기
    const uncheckedItems = capsule.items.filter(
      (item) => item.moduleCode === domainModuleCode && !item.isChecked
    );

    if (uncheckedItems.length === 0) return;

    // 첫 번째 미완료 아이템을 완료 처리
    await checkDailyItem(capsule.id, uncheckedItems[0].id, true);
  } catch (error) {
    // 캡슐 동기화 실패는 기록 저장에 영향을 주지 않음
    console.error('[Daily] 루틴-캡슐 동기화 실패:', error);
  }
}

// =============================================================================
// 내부 유틸
// =============================================================================

/**
 * (userId, date) 캐시 조회
 */
async function getCachedDailyCapsule(userId: string, date: string): Promise<DailyCapsule | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('daily_capsules')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('date', date)
    .maybeSingle();

  if (error) {
    console.error('[Daily] 캐시 조회 실패:', error);
    return null;
  }

  if (!data) return null;

  return mapRowToDailyCapsule(data);
}

/**
 * 스테일(옛 엔진 버전) 캐시 삭제 — 재생성 전 호출.
 * UNIQUE(userId, date) 제약 때문에 지우지 않으면 saveDailyCapsule이 23505로 옛 행을 반환한다.
 */
async function deleteStaleCapsule(userId: string, date: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('daily_capsules')
    .delete()
    .eq('clerk_user_id', userId)
    .eq('date', date);
  if (error) {
    console.error('[Daily] 스테일 캡슐 삭제 실패 (재생성 계속):', error);
  }
}

interface SaveInput {
  userId: string;
  date: string;
  items: DailyItem[];
  totalCcs: number;
  estimatedMinutes: number;
}

/**
 * Daily Capsule DB 저장
 *
 * upsert(onConflict: clerk_user_id,date)로 저장한다. 예전 insert + 23505 폴백은
 * 스테일 삭제(deleteStaleCapsule)가 실패한 경우 옛 행을 그대로 반환해, 사용자가
 * 갱신된 엔진 루틴을 못 보고 스테일 캡슐을 무한 반환받던 버그가 있었다.
 * upsert는 충돌 시 옛 행을 새 items로 덮어써 이 문제를 원천 차단한다.
 */
async function saveDailyCapsule(input: SaveInput): Promise<DailyCapsule> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('daily_capsules')
    .upsert(
      {
        clerk_user_id: input.userId,
        date: input.date,
        items: input.items,
        total_ccs: input.totalCcs,
        estimated_minutes: input.estimatedMinutes,
        status: 'pending',
      },
      { onConflict: 'clerk_user_id,date' }
    )
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Daily Capsule 저장 실패: ${error?.message}`);
  }

  return mapRowToDailyCapsule(data);
}

/**
 * Safety 필터링 — BLOCK 아이템 제거
 */
async function applySafetyFilter(userId: string, items: DailyItem[]): Promise<DailyItem[]> {
  // Safety 모듈 동적 로드 (순환 참조 방지)
  try {
    const { getSafetyProfile, checkProductSafety } = await import('@/lib/safety');
    const safetyProfile = await getSafetyProfile(userId);
    if (!safetyProfile || !safetyProfile.consentGiven) return items;

    return items.filter((item) => {
      const report = checkProductSafety({
        productId: item.id,
        ingredients: [], // Daily 아이템은 성분 정보 없음 (간접 참조)
        profile: safetyProfile,
      });
      // DANGER 등급이거나 BLOCK 액션 경고가 있으면 제외
      const hasBlockAlert = report.alerts.some((a) => a.action === 'BLOCK');
      return report.grade !== 'DANGER' && !hasBlockAlert;
    });
  } catch {
    // Safety 모듈 없으면 필터링 건너뜀
    return items;
  }
}

/**
 * 피부 데일리 아이템 — 정본 루틴 엔진(lib/skincare generateRoutine) 파생
 *
 * 왜 캡슐 엔진을 안 쓰나: 루틴 스텝은 "행동"인데 SkinProduct는 "제품" 추상화라
 * minimize의 카테고리 dedup이 아침·저녁의 같은 카테고리 스텝(클렌저·토너)을 잘못 제거함.
 * generateRoutine은 피부타입별 단계 가감 + 스텝별 purpose(이유)까지 제공하는 단일 소스.
 */
function buildSkinRoutineItems(
  profile: {
    skin?: {
      type?: string;
      concerns?: string[];
      scores?: Record<string, number>;
      recommendedIngredients?: string[];
      userGoals?: SkinGoalId[];
    };
  },
  opts?: { eveningFocus?: EveningCycle }
): DailyItem[] {
  // 피부 분석이 없는 사용자는 피부 루틴 없음 (다른 축은 정상 생성)
  if (!profile.skin?.type) return [];

  const VALID_SKIN_TYPES: readonly SkinTypeId[] = [
    'dry',
    'oily',
    'combination',
    'normal',
    'sensitive',
  ];
  const skinType: SkinTypeId = (VALID_SKIN_TYPES as readonly string[]).includes(profile.skin.type)
    ? (profile.skin.type as SkinTypeId)
    : 'normal';

  // 최근 분석 지표 → 오늘 상태 추정 (conditional-routine 입력).
  // 정직성: 실시간이 아니라 "최근 분석 기준"임 — groupNote 문구에 명시.
  const scores = profile.skin.scores ?? {};
  const condition = deriveSkinCondition(scores);
  // 목표 반영: 지표에서 고민을 정본 함수로 파생해 개인화(성분 팁)에 반영 (ADR-117 — 루틴 페이지와 단일화)
  const derivedConcerns = deriveConcernsFromScores(scores);
  const userGoals = profile.skin.userGoals ?? [];
  const carePhase = deriveCarePhase(scores, userGoals);
  const isBarrier = carePhase.phase === 'barrier';
  // 장벽 회복 단계에선 목표 활성을 유보(파생 concern만) — 문구로 안내. 목표 단계에선 목표 우선 병합.
  const concerns = isBarrier ? derivedConcerns : mergeGoalsIntoConcerns(derivedConcerns, userGoals);

  const items: DailyItem[] = [];
  for (const timeOfDay of ['morning', 'evening'] as const) {
    const { routine, personalizationNote } = generateRoutine({
      skinType,
      concerns,
      timeOfDay,
      includeOptional: false, // 데일리 체크리스트는 필수 스텝만 (선택 스텝은 결과 페이지 영역)
      carePhase: carePhase.phase, // U2: 장벽 단계면 세럼·크림 스펙을 진정·보습으로
    });

    // 지표 기반 조정 — 수분/유분/민감도에 따라 스텝 반복·강조·생략 (예: "토너 (2회)")
    const { adjustedRoutine } = applyConditionalModifications(routine, condition, skinType);

    // 개인화 근거를 그룹 첫 아이템에 부여 → 상세 페이지 모듈 헤더 아래 노출
    const conditionSuffix =
      condition.hydration === 'normal'
        ? ''
        : ` · 최근 분석 기준 ${getHydrationLabel(condition.hydration)} 상태를 반영했어요`;
    // 장벽 회복 단계: 목표 케어 유보 안내 (아침 그룹에 1회). 저녁: 오늘 사이클링 주기 표시.
    const phaseSuffix = isBarrier && timeOfDay === 'morning' ? ` · ${carePhase.message}` : '';
    const cycleSuffix = buildCycleSuffix(timeOfDay, opts?.eveningFocus);
    const groupNote = `${personalizationNote}${conditionSuffix}${phaseSuffix}${cycleSuffix}`;

    // 솔루션: 정본 루틴의 사용 팁("어떻게") + 보습 스텝엔 내 추천 성분("어떤 것으로")
    const ingredients = profile.skin.recommendedIngredients ?? [];

    adjustedRoutine.forEach((step, index) => {
      // 초보자용 하우투: 팁 2개까지 노출 (제형 선택 + 바르는 방법이 함께 담기도록)
      const tip = step.tips?.slice(0, 2).filter(Boolean).join(' · ') || undefined;
      const ingredientHint =
        (step.category === 'cream' || step.category === 'serum' || step.category === 'toner') &&
        ingredients.length > 0
          ? `${ingredients.slice(0, 2).join('·')} 성분 권장`
          : undefined;
      const solution = [tip, ingredientHint].filter(Boolean).join(' · ') || undefined;

      items.push({
        id: `skin-${timeOfDay}-${step.order}-${step.category}`,
        moduleCode: 'S',
        // U2: 상태 기반 성분 스펙명이 있으면 우선("약산성 클렌저"), 없으면 일반 명칭
        name: step.specName ?? step.name,
        reason: step.purpose,
        compatibilityScore: 0,
        isChecked: false,
        timeOfDay,
        category: step.category,
        ...(index === 0 ? { groupNote } : {}),
        ...(solution ? { solution } : {}),
      });
    });
  }
  return items;
}

// =============================================================================
// 스텝 하우투 (초보자용 "어떻게") — 2026-07-08 사용자 피드백: 항목을 눌러도 방법이 없음.
// 개인 진단을 지어내는 게 아니라 일반 방법 지식이라 정직성 원칙과 충돌하지 않는다.
// 개인 데이터 기반 부분(파운데이션 호수·립 컬러)은 여전히 데이터 없으면 생략.
// =============================================================================

const MAKEUP_HOWTO: Record<string, string> = {
  base: '얼굴 중앙(볼·이마)부터 바깥쪽으로 얇게 펴 바르기',
  lip: '입술 안쪽부터 바깥으로 톡톡 두드려 펴 바르면 자연스러운 그라데이션',
  eye: '밝은 색을 눈두덩 전체에 펴고, 진한 색은 눈꼬리 쪽 1/3에만 얇게',
  cheek: '웃을 때 볼록 올라오는 볼 위치에 원을 그리듯 소량씩 겹쳐 바르기',
  brow: '눈썹 앞머리는 비우고 꼬리 쪽만 결 방향대로 채우기',
  setting: '얼굴에서 20cm 이상 띄우고 고루 분사해 지속력 높이기',
};

const HAIR_HOWTO: Record<string, string> = {
  shampoo: '미지근한 물로 충분히 적신 뒤, 손에서 거품 내 두피를 손끝으로 마사지 (손톱 사용 금지)',
  conditioner: '두피는 피하고 모발 중간부터 끝에만 바른 뒤 2-3분 후 헹구기',
  treatment: '샴푸 후 물기를 가볍게 짜고 모발 끝 위주로 바른 뒤 5-10분 후 헹구기',
  'scalp-care': '샴푸 전 두피에 나눠 바르고 손끝으로 원을 그리며 부드럽게 마사지',
  styling: '드라이는 뿌리부터 말리고, 마지막에 찬바람으로 모양 고정',
  'hair-oil': '타월 드라이 후 반쯤 마른 상태에서 모발 끝에 1-2방울만 가볍게',
};

// ADR-098: body 축은 "이해와 표현" — 스타일링 행동의 실행 방법만 안내 (자세교정/운동 지도 아님)
const BODY_HOWTO: Record<string, string> = {
  'posture-correction': '상의 어깨선이 어깨 끝과 맞는지, 허리 라인이 사는 핏인지 거울로 확인',
  'stretching-routine': '전신 거울 앞에서 상·하의 길이 비율과 색 조합이 어색하지 않은지 1분 체크',
  'strength-plan': '내 체형 강점을 드러내는 아이템 하나를 오늘 코디에 넣어보기',
  'body-alignment': '상의는 짧게, 하의는 길게 — 전체 비율이 3:7에 가까운지 확인',
  'lifestyle-habit': '오늘 잘 어울린 조합을 사진으로 남겨 나만의 코디 기록 만들기',
};

/** buildItemSolution이 참조하는 프로필 조각 */
interface SolutionProfile {
  personalColor?: { season?: string; paletteNames?: string[] };
  skin?: { foundation?: string };
  body?: { styleTips?: { tops?: string[]; bottoms?: string[]; avoid?: string[] } };
}

/** 메이크업: "무엇으로(내 진단 컬러)" + "어떻게(하우투)" */
function buildMakeupSolution(
  category: string | undefined,
  profile: SolutionProfile
): string | undefined {
  const howto = category ? MAKEUP_HOWTO[category] : undefined;

  if (category === 'base') {
    const foundation = profile.skin?.foundation
      ? `파운데이션: ${profile.skin.foundation}`
      : undefined;
    return [foundation, howto].filter(Boolean).join(' · ') || undefined;
  }

  if (category === 'lip') {
    // 립은 의류 팔레트(best_colors)가 아니라 시즌별 립 정본에서 —
    // "세레니티 블루 립" 같은 오적용 방지 (2026-07-07). 제품 예시까지 제공.
    const season = (profile.personalColor?.season ?? '').toLowerCase() as SeasonType;
    const lip = LIPSTICK_RECOMMENDATIONS[season]?.[0];
    let color: string | undefined;
    if (lip) {
      const example = lip.oliveyoungAlt || lip.brandExample;
      color = example ? `${lip.colorName} (예: ${example})` : lip.colorName;
    }
    return [color, howto].filter(Boolean).join(' · ') || undefined;
  }

  // cheek 등: 시즌별 정본 컬러 데이터가 없어 색은 미조립(지어내지 않음), 방법만 안내
  return howto;
}

/** 체형: 스타일링 행동 하우투 + "피하면 좋은 핏"(내 데이터) 배선 */
function buildBodySolution(
  category: string | undefined,
  profile: SolutionProfile
): string | undefined {
  const howto = category ? BODY_HOWTO[category] : undefined;
  const avoid = profile.body?.styleTips?.avoid?.[0];
  if (category === 'posture-correction' && howto && avoid) {
    return `${howto} · 피하면 좋은 핏: ${avoid}`;
  }
  return howto;
}

/** 코디: 베스트컬러 톤 + 체형 스타일 추천 — 데이터 없으면 생략 */
function buildFashionSolution(profile: SolutionProfile): string | undefined {
  const names = profile.personalColor?.paletteNames ?? [];
  const top = profile.body?.styleTips?.tops?.[0];
  const bottom = profile.body?.styleTips?.bottoms?.[0];
  const tone = names[0] ? `${names[0]} 톤 · ` : '';
  if (top && bottom) return `${tone}${top} + ${bottom}`;
  if (names.length >= 2) return `${names[0]}·${names[1]} 톤 조합 추천`;
  return undefined;
}

/**
 * 아이템 실행 솔루션 조립 — "무엇으로(내 진단)" + "어떻게(하우투)" 한 줄
 *
 * 저장된 진단 배선 + 일반 하우투:
 * - 메이크업 base = 파운데이션 진단(foundation_recommendation) + 바르는 방법
 * - 메이크업 lip = 시즌별 립 정본 컬러 + 바르는 방법
 * - 코디 = 베스트컬러 톤 + 체형 스타일 추천(style_recommendations.tops/bottoms)
 * - 헤어/체형 = 카테고리별 실행 방법 (HAIR_HOWTO/BODY_HOWTO)
 * 개인 데이터가 없는 부분은 생략 — 없는 진단을 지어내지 않는다 (정직성).
 */
function buildItemSolution(
  domainId: string,
  category: string | undefined,
  profile: SolutionProfile
): string | undefined {
  switch (domainId) {
    case 'makeup':
      return buildMakeupSolution(category, profile);
    case 'hair':
      return category ? HAIR_HOWTO[category] : undefined;
    case 'body':
      return buildBodySolution(category, profile);
    case 'fashion':
      return buildFashionSolution(profile);
    default:
      return undefined;
  }
}

/**
 * 피부 지표(0-100) → 오늘 상태 추정
 * 유분 과다가 수분 부족보다 우선 판정 (지성 케어가 더 즉각적 조정을 요구).
 */
function deriveSkinCondition(scores: Record<string, number>): TodaySkinCondition {
  const hydration = scores.hydration;
  const oil = scores.oil_level;
  const sensitivity = scores.sensitivity;

  let level: TodaySkinCondition['hydration'] = 'normal';
  if (typeof oil === 'number' && oil >= 75) level = 'very_oily';
  else if (typeof oil === 'number' && oil >= 60) level = 'oily';
  else if (typeof hydration === 'number' && hydration <= 30) level = 'very_dry';
  else if (typeof hydration === 'number' && hydration <= 45) level = 'dry';

  const sensitivityLevel: TodaySkinCondition['sensitivityLevel'] =
    typeof sensitivity === 'number' && sensitivity >= 70
      ? 'moderate'
      : typeof sensitivity === 'number' && sensitivity >= 40
        ? 'mild'
        : 'none';

  return { hydration: level, concerns: [], sensitivityLevel };
}

/**
 * 도메인/카테고리 → 실행 시간대 매핑
 *
 * 사용자 멘탈 모델은 "오늘 할 일 N개"가 아니라 "아침 루틴 / 저녁 루틴".
 * - 아침: 스킨케어 준비(보습·자외선차단)·메이크업·코디, 체형 실루엣 점검, 헤어 스타일링
 * - 저녁: 스킨케어 세정/집중(클렌징·토너·세럼·아이크림), 헤어 케어(샴푸·컨디셔너)
 * (body는 "옷 입기 전 점검" 행동이라 아침 — '언제든' 섹션의 방치 항목이던 문제 해소)
 */
function resolveTimeOfDay(domainId: string, category?: string): DailyItem['timeOfDay'] {
  switch (domainId) {
    // skin은 buildSkinRoutineItems에서 timeOfDay를 명시적으로 부여 (이 함수 미경유)
    case 'makeup':
    case 'fashion':
    case 'body':
      return 'morning';
    case 'hair':
      return category === 'styling' ? 'morning' : 'evening';
    default:
      // 시간대 무관 루틴
      return 'anytime';
  }
}

/**
 * 아이템별 추천 이유 생성 — 카테고리 이유 우선, 없으면 도메인 이유
 * (클렌징에 "자외선 차단이 중요한 계절이에요"가 붙던 어긋남 방지)
 */
function generateReason(domainId: string, context: DailyContext, category?: string): string {
  // skin 이유는 루틴 엔진 step.purpose가 담당 (buildSkinRoutineItems) — 여기선 나머지 도메인만
  const categoryReasons: Record<string, string> = {
    shampoo: '두피 타입에 맞춘 세정이 모발 건강의 기본이에요',
    conditioner: '모발 끝 손상을 막아줘요',
    // body — ADR-098: 스타일링 행동 (자세교정/운동류 문구 금지)
    'posture-correction': '체형 분석 결과를 오늘 옷차림에 적용하는 습관이에요',
    'stretching-routine': '입은 모습을 객관적으로 보면 코디 감각이 늘어요',
  };
  if (category && categoryReasons[category]) return categoryReasons[category];

  return generateDomainReason(domainId, context);
}

/** 도메인 단위 이유 (시즌/고정) */
function generateDomainReason(domainId: string, context: DailyContext): string {
  const seasonReasons: Record<string, Record<string, string>> = {
    skin: {
      spring: '환절기 피부 보호가 필요해요',
      summer: '자외선 차단이 중요한 계절이에요',
      autumn: '건조한 가을 보습에 집중해요',
      winter: '겨울 보습 강화가 필요해요',
    },
    fashion: {
      spring: '봄 시즌에 어울리는 아이템이에요',
      summer: '시원한 여름 코디를 추천해요',
      autumn: '가을 레이어링에 좋은 아이템이에요',
      winter: '따뜻한 겨울 스타일링이에요',
    },
    nutrition: {
      spring: '봄 제철 영양소를 보충해요',
      summer: '수분과 전해질 보충이 중요해요',
      autumn: '면역력 강화 영양소를 챙겨요',
      winter: '겨울철 비타민D를 보충해요',
    },
  };

  // 시즌 무관 도메인 — 분석 결과 연결이 드러나는 고정 이유
  const staticReasons: Record<string, string> = {
    'personal-color': '내 시즌 팔레트 기준이에요',
    makeup: '퍼스널컬러에 어울리는 톤이에요',
    hair: '얼굴형·모발 타입에 맞춘 케어예요',
    body: '체형 분석 결과를 스타일링에 활용해요',
  };

  return (
    seasonReasons[domainId]?.[context.season] ??
    staticReasons[domainId] ??
    '오늘의 루틴에 추천드려요'
  );
}

/**
 * 예상 소요 시간 계산
 *
 * 왜 모듈당 1회 합산인가: 스킨케어 3스텝은 "10분짜리 루틴 하나"지
 * 30분이 아니다. 아이템×모듈시간 합산은 25개 아이템에서 "약 200분"이라는
 * 비현실적 추정을 만들었음 (2026-07-04). 고유 모듈 시간만 1회씩 더한다.
 */
function calculateEstimatedMinutes(items: DailyItem[]): number {
  const minutesPerModule: Record<string, number> = {
    S: 10, // 스킨케어 (루틴 전체)
    Fashion: 5, // 패션 코디
    N: 5, // 영양
    W: 30, // 운동
    H: 5, // 헤어
    M: 10, // 메이크업 (루틴 전체)
    PC: 0, // 퍼스널컬러 (정보 제공)
    OH: 5, // 구강건강
    C: 0, // 체형 (정보 제공)
  };

  const uniqueModules = new Set(items.map((item) => item.moduleCode));
  return Array.from(uniqueModules).reduce(
    (total, moduleCode) => total + (minutesPerModule[moduleCode] ?? 5),
    0
  );
}

/**
 * 빈 Daily Capsule 생성 (프로필 없는 사용자)
 */
function createEmptyDailyCapsule(userId: string, date: string): DailyCapsule {
  return {
    id: 'empty',
    userId,
    date,
    items: [],
    totalCcs: 0,
    estimatedMinutes: 0,
    status: 'pending',
    completedAt: null,
    createdAt: new Date().toISOString(),
  };
}

interface DailyCapsuleRow {
  id: string;
  clerk_user_id: string;
  date: string;
  items: unknown;
  total_ccs: number;
  estimated_minutes: number;
  status: string;
  completed_at: string | null;
  created_at: string;
}

/**
 * DB Row → DailyCapsule 변환
 */
function mapRowToDailyCapsule(row: DailyCapsuleRow): DailyCapsule {
  return {
    id: row.id,
    userId: row.clerk_user_id,
    date: row.date,
    items: (row.items ?? []) as DailyItem[],
    totalCcs: row.total_ccs ?? 0,
    estimatedMinutes: row.estimated_minutes ?? 0,
    status: row.status as DailyCapsuleStatus,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}
