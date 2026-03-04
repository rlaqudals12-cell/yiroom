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
import { getBeautyProfile } from './profile';
import { collectContext } from './context';
import { getAllDomains } from './registry';
import { calculateCCS } from './scoring';
import type { DomainItemGroup } from './scoring';
import { getCrossDomainRules } from './capsule-repository';

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
  const domains = getAllDomains();
  const domainGroups: DomainItemGroup[] = [];
  const dailyItems: DailyItem[] = [];

  for (const engine of domains) {
    const items = await engine.curate(profile, {
      maxItems: Math.min(3, engine.getOptimalN(profile)),
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
      const typedItem = item as { id?: string; name?: string };
      dailyItems.push({
        id: typedItem.id ?? `daily-${engine.domainId}-${dailyItems.length}`,
        moduleCode,
        name: typedItem.name ?? `${engine.domainName} 아이템`,
        reason: generateReason(engine.domainId, context),
        compatibilityScore: 0, // Step 4에서 업데이트
        isChecked: false,
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

  // Step 5: Safety 필터링 (BLOCK 아이템 제거)
  const filteredItems = await applySafetyFilter(userId, dailyItems);

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
 * 아이템별 추천 이유 생성
 */
function generateReason(domainId: string, context: DailyContext): string {
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

  return seasonReasons[domainId]?.[context.season] ?? '오늘의 루틴에 추천드려요';
}

/**
 * 예상 소요 시간 계산
 */
function calculateEstimatedMinutes(items: DailyItem[]): number {
  const minutesPerModule: Record<string, number> = {
    S: 10, // 스킨케어
    Fashion: 5, // 패션 코디
    N: 5, // 영양
    W: 30, // 운동
    H: 5, // 헤어
    M: 10, // 메이크업
    PC: 0, // 퍼스널컬러 (정보 제공)
    OH: 5, // 구강건강
    C: 0, // 체형 (정보 제공)
  };

  return items.reduce((total, item) => total + (minutesPerModule[item.moduleCode] ?? 5), 0);
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
