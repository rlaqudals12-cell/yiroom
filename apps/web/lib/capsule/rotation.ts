/**
 * 로테이션 엔진 — C4 원칙
 *
 * 도메인별 로테이션 주기 판정 + 실행 + 이력 기록
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */

import type {
  BeautyProfile,
  Capsule,
  CapsuleItem,
  RotationReason,
  RotationRecord,
} from '@/types/capsule';
import { getDomain } from './registry';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { updateCapsuleRotation } from './capsule-repository';

// =============================================================================
// 공개 API
// =============================================================================

/**
 * 모든 활성 캡슐에 대해 로테이션 필요 여부 판정
 * @returns 로테이션이 필요한 도메인 ID 목록
 */
export function findDomainsNeedingRotation(capsules: Capsule<unknown>[]): string[] {
  const needsRotation: string[] = [];

  for (const capsule of capsules) {
    const engine = getDomain(capsule.domainId);
    if (!engine) continue;

    if (engine.shouldRotate(capsule)) {
      needsRotation.push(capsule.domainId);
    }
  }

  return needsRotation;
}

/**
 * 단일 캡슐 로테이션 실행
 *
 * 1. 엔진의 rotate()로 새 아이템 생성
 * 2. 기존 캡슐에서 사용빈도 낮은 아이템 제거
 * 3. 새 아이템 추가
 * 4. 로테이션 이력 기록
 */
export async function rotateCapsule(
  capsule: Capsule<unknown>,
  profile: BeautyProfile,
  reason: RotationReason = 'time-based',
  triggerCondition: string | null = null
): Promise<RotationResult> {
  const engine = getDomain(capsule.domainId);
  if (!engine) {
    throw new Error(`도메인 엔진 미등록: ${capsule.domainId}`);
  }

  // 호환성 점수 (before)
  const itemValues = capsule.items.map((i) => i.item);
  const compatBefore = engine.checkCompatibility(itemValues);

  // 엔진의 rotate()로 새 아이템 생성
  const newItems = await engine.rotate(capsule, profile);
  const rotateCount = newItems.length;

  // 사용빈도 낮은 아이템부터 제거 대상 선정
  const sortedByUsage = [...capsule.items].sort(
    (a, b) => (a.usageCount ?? 0) - (b.usageCount ?? 0)
  );
  const itemsToRemove = sortedByUsage.slice(0, Math.min(rotateCount, sortedByUsage.length));

  // DB 반영
  const supabase = createServiceRoleClient();

  // 제거
  if (itemsToRemove.length > 0) {
    const removeIds = itemsToRemove.map((i) => i.id);
    await supabase.from('capsule_items').delete().in('id', removeIds);
  }

  // 추가
  const addedItems: CapsuleItem<unknown>[] = [];
  if (newItems.length > 0) {
    const rows = newItems.map((item) => ({
      capsule_id: capsule.id,
      item: item as unknown,
      profile_fit_score: 0,
    }));

    const { data } = await supabase.from('capsule_items').insert(rows).select();

    if (data) {
      for (const row of data) {
        addedItems.push({
          id: row.id,
          capsuleId: row.capsule_id,
          item: row.item,
          profileFitScore: row.profile_fit_score ?? 0,
          usageCount: 0,
          lastUsed: null,
          addedAt: row.added_at,
        });
      }
    }
  }

  // 호환성 점수 (after)
  const remainingItems = capsule.items
    .filter((i) => !itemsToRemove.some((r) => r.id === i.id))
    .map((i) => i.item);
  const allNewValues = [...remainingItems, ...newItems];
  const compatAfter = engine.checkCompatibility(allNewValues);

  // 로테이션 타임스탬프 갱신
  await updateCapsuleRotation(capsule.id);

  // 이력 기록
  const record = await recordRotation({
    capsuleId: capsule.id,
    userId: capsule.userId,
    itemsRemoved: itemsToRemove.map((i) => i.item),
    itemsAdded: newItems,
    reason,
    triggerCondition,
    compatibilityBefore: compatBefore.overall,
    compatibilityAfter: compatAfter.overall,
  });

  return {
    record,
    removedCount: itemsToRemove.length,
    addedCount: addedItems.length,
    compatibilityBefore: compatBefore.overall,
    compatibilityAfter: compatAfter.overall,
  };
}

// =============================================================================
// 로테이션 이력
// =============================================================================

interface RecordInput {
  capsuleId: string;
  userId: string;
  itemsRemoved: unknown[];
  itemsAdded: unknown[];
  reason: RotationReason;
  triggerCondition: string | null;
  compatibilityBefore: number;
  compatibilityAfter: number;
}

/**
 * 로테이션 이력 DB 저장
 */
async function recordRotation(input: RecordInput): Promise<RotationRecord> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('rotation_history')
    .insert({
      capsule_id: input.capsuleId,
      clerk_user_id: input.userId,
      items_removed: input.itemsRemoved,
      items_added: input.itemsAdded,
      reason: input.reason,
      trigger_condition: input.triggerCondition,
      compatibility_before: input.compatibilityBefore,
      compatibility_after: input.compatibilityAfter,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('[Rotation] 이력 기록 실패:', error);
    // 이력 기록 실패는 non-blocking
    return {
      id: 'record-failed',
      capsuleId: input.capsuleId,
      userId: input.userId,
      itemsRemoved: input.itemsRemoved,
      itemsAdded: input.itemsAdded,
      reason: input.reason,
      triggerCondition: input.triggerCondition,
      compatibilityBefore: input.compatibilityBefore,
      compatibilityAfter: input.compatibilityAfter,
      createdAt: new Date().toISOString(),
    };
  }

  return {
    id: data.id,
    capsuleId: data.capsule_id,
    userId: data.clerk_user_id,
    itemsRemoved: data.items_removed as unknown[],
    itemsAdded: data.items_added as unknown[],
    reason: data.reason as RotationReason,
    triggerCondition: data.trigger_condition,
    compatibilityBefore: data.compatibility_before,
    compatibilityAfter: data.compatibility_after,
    createdAt: data.created_at,
  };
}

// =============================================================================
// 타입
// =============================================================================

export interface RotationResult {
  record: RotationRecord;
  removedCount: number;
  addedCount: number;
  compatibilityBefore: number;
  compatibilityAfter: number;
}
