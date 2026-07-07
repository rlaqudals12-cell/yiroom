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
import { generateRoutine, applyConditionalModifications, getHydrationLabel } from '@/lib/skincare';
import type { TodaySkinCondition } from '@/lib/skincare';
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
// body 2 = 자세 교정·스트레칭 ("근력 플랜"은 행동이 아니라 계획이라 제외)
const DAILY_MAX_ITEMS: Record<string, number> = { fashion: 1, hair: 2, body: 2 };
const DAILY_MAX_ITEMS_DEFAULT = 3;

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
  // 캐시 확인 — (userId, date) 기준
  const today = new Date().toISOString().split('T')[0];
  const cached = await getCachedDailyCapsule(userId, today);
  if (cached) return cached;

  // Step 1: BeautyProfile 로드
  const profile = await getBeautyProfile(userId);
  if (!profile) {
    return createEmptyDailyCapsule(userId, today);
  }

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
  dailyItems.push(...buildSkinRoutineItems(profile));

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

  // Step 6: Assemble + 저장
  const daily = await saveDailyCapsule({
    userId,
    date: today,
    items: filteredItems,
    totalCcs: ccsResult.score,
    estimatedMinutes,
  });

  return daily;
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

interface SaveInput {
  userId: string;
  date: string;
  items: DailyItem[];
  totalCcs: number;
  estimatedMinutes: number;
}

/**
 * Daily Capsule DB 저장
 */
async function saveDailyCapsule(input: SaveInput): Promise<DailyCapsule> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('daily_capsules')
    .insert({
      clerk_user_id: input.userId,
      date: input.date,
      items: input.items,
      total_ccs: input.totalCcs,
      estimated_minutes: input.estimatedMinutes,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !data) {
    // UNIQUE 제약 위반 시 기존 데이터 반환
    if (error?.code === '23505') {
      const cached = await getCachedDailyCapsule(input.userId, input.date);
      if (cached) return cached;
    }
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
function buildSkinRoutineItems(profile: {
  skin?: {
    type?: string;
    concerns?: string[];
    scores?: Record<string, number>;
    recommendedIngredients?: string[];
  };
}): DailyItem[] {
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
  const condition = deriveSkinCondition(profile.skin.scores ?? {});

  const items: DailyItem[] = [];
  for (const timeOfDay of ['morning', 'evening'] as const) {
    const { routine, personalizationNote } = generateRoutine({
      skinType,
      // concerns는 SkinConcernId 계약 — 프로필 문자열이 계약과 다를 수 있어 미전달(팁만 줄어듦)
      concerns: [],
      timeOfDay,
      includeOptional: false, // 데일리 체크리스트는 필수 스텝만 (선택 스텝은 결과 페이지 영역)
    });

    // 지표 기반 조정 — 수분/유분/민감도에 따라 스텝 반복·강조·생략 (예: "토너 (2회)")
    const { adjustedRoutine } = applyConditionalModifications(routine, condition, skinType);

    // 개인화 근거를 그룹 첫 아이템에 부여 → 상세 페이지 모듈 헤더 아래 노출
    const conditionSuffix =
      condition.hydration === 'normal'
        ? ''
        : ` · 최근 분석 기준 ${getHydrationLabel(condition.hydration)} 상태를 반영했어요`;
    const groupNote = `${personalizationNote}${conditionSuffix}`;

    // 솔루션: 정본 루틴의 사용 팁("어떻게") + 보습 스텝엔 내 추천 성분("어떤 것으로")
    const ingredients = profile.skin.recommendedIngredients ?? [];

    adjustedRoutine.forEach((step, index) => {
      const tip = step.tips?.[0];
      const ingredientHint =
        (step.category === 'cream' || step.category === 'serum' || step.category === 'toner') &&
        ingredients.length > 0
          ? `${ingredients.slice(0, 2).join('·')} 성분 권장`
          : undefined;
      const solution = [tip, ingredientHint].filter(Boolean).join(' · ') || undefined;

      items.push({
        id: `skin-${timeOfDay}-${step.order}-${step.category}`,
        moduleCode: 'S',
        name: step.name,
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

/**
 * 아이템 실행 솔루션 조립 — 내 분석 데이터 → "무엇으로/어떤 색으로" 한 줄
 *
 * 새 콘텐츠 생성 없이 저장된 진단만 배선:
 * - 메이크업 base = 파운데이션 진단(foundation_recommendation)
 * - 메이크업 lip/cheek = 베스트컬러 이름(best_colors.name)
 * - 코디 = 베스트컬러 톤 + 체형 스타일 추천(style_recommendations.tops/bottoms)
 * 데이터가 없으면 undefined — 없는 솔루션을 지어내지 않는다 (정직성).
 * hair/body 아이템은 현재 대응 데이터가 부실해 미조립 (hair_analyses 확충 시 추가).
 */
function buildItemSolution(
  domainId: string,
  category: string | undefined,
  profile: {
    personalColor?: { season?: string; paletteNames?: string[] };
    skin?: { foundation?: string };
    body?: { styleTips?: { tops?: string[]; bottoms?: string[]; avoid?: string[] } };
  }
): string | undefined {
  const names = profile.personalColor?.paletteNames ?? [];

  if (domainId === 'makeup') {
    switch (category) {
      case 'base':
        return profile.skin?.foundation ? `파운데이션: ${profile.skin.foundation}` : undefined;
      case 'lip': {
        // 립은 의류 팔레트(best_colors)가 아니라 시즌별 립 정본에서 —
        // "세레니티 블루 립" 같은 오적용 방지 (2026-07-07). 제품 예시까지 제공.
        const season = (profile.personalColor?.season ?? '').toLowerCase() as SeasonType;
        const lip = LIPSTICK_RECOMMENDATIONS[season]?.[0];
        if (!lip) return undefined;
        const example = lip.oliveyoungAlt || lip.brandExample;
        return example ? `${lip.colorName} (예: ${example})` : lip.colorName;
      }
      // cheek: 시즌별 블러셔 정본 데이터가 없어 미조립 — 지어내지 않음
      default:
        return undefined;
    }
  }

  if (domainId === 'fashion') {
    const top = profile.body?.styleTips?.tops?.[0];
    const bottom = profile.body?.styleTips?.bottoms?.[0];
    const tone = names[0] ? `${names[0]} 톤 · ` : '';
    if (top && bottom) return `${tone}${top} + ${bottom}`;
    if (names.length >= 2) return `${names[0]}·${names[1]} 톤 조합 추천`;
    return undefined;
  }

  return undefined;
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
 * - 아침: 스킨케어 준비(보습·자외선차단)·메이크업·코디, 헤어 스타일링
 * - 저녁: 스킨케어 세정/집중(클렌징·토너·세럼·아이크림), 헤어 케어(샴푸·컨디셔너)
 * - 언제든: 체형 루틴(자세·스트레칭)
 */
function resolveTimeOfDay(domainId: string, category?: string): DailyItem['timeOfDay'] {
  switch (domainId) {
    // skin은 buildSkinRoutineItems에서 timeOfDay를 명시적으로 부여 (이 함수 미경유)
    case 'makeup':
    case 'fashion':
      return 'morning';
    case 'hair':
      return category === 'styling' ? 'morning' : 'evening';
    default:
      // body 등 시간대 무관 루틴
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
    body: '체형 밸런스를 위한 루틴이에요',
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
