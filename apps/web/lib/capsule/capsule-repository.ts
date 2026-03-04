/**
 * 캡슐 저장소 — Capsule + CapsuleItem CRUD
 *
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 * @see supabase/migrations/20260304_capsule_foundation.sql
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type { Capsule, CapsuleItem, CapsuleStatus } from './types';
import type { CrossDomainRuleType } from '@/types/capsule';

// Supabase 행 타입 (DB 컬럼 snake_case)
interface CapsuleItemRow {
  id: string;
  capsule_id: string;
  item: unknown;
  profile_fit_score: number | null;
  usage_count: number | null;
  last_used: string | null;
  added_at: string;
}

interface CrossDomainRuleRow {
  id: string;
  domain1: string;
  domain2: string;
  rule_name: string;
  factor: number;
  rule_type: string;
  description: string | null;
}

// =============================================================================
// Capsule CRUD
// =============================================================================

/**
 * 사용자의 도메인별 활성 캡슐 조회
 * 없으면 null 반환 (생성은 curate 시점에)
 */
export async function getCapsule<T>(userId: string, domainId: string): Promise<Capsule<T> | null> {
  const supabase = createServiceRoleClient();

  const { data: capsuleRow, error } = await supabase
    .from('capsules')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('domain_id', domainId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error(`[Capsule] getCapsule 실패 (${domainId}):`, error);
    return null;
  }

  if (!capsuleRow) return null;

  // 캡슐 아이템 조회
  const { data: itemRows, error: itemsError } = await supabase
    .from('capsule_items')
    .select('*')
    .eq('capsule_id', capsuleRow.id)
    .order('added_at', { ascending: true });

  if (itemsError) {
    console.error(`[Capsule] getItems 실패 (${capsuleRow.id}):`, itemsError);
  }

  const items: CapsuleItem<T>[] = (itemRows ?? []).map(mapRowToItem<T>);

  return {
    id: capsuleRow.id,
    userId: capsuleRow.clerk_user_id,
    domainId: capsuleRow.domain_id,
    items,
    ccs: capsuleRow.ccs ?? 0,
    status: capsuleRow.status as CapsuleStatus,
    createdAt: capsuleRow.created_at,
    updatedAt: capsuleRow.updated_at,
    lastRotation: capsuleRow.last_rotation ?? capsuleRow.created_at,
  };
}

/**
 * 새 캡슐 생성 (도메인별 1개)
 * 기존 활성 캡슐이 있으면 archived 처리 후 생성
 */
export async function createCapsule<T>(
  userId: string,
  domainId: string,
  items: T[],
  ccs: number
): Promise<Capsule<T>> {
  const supabase = createServiceRoleClient();

  // 기존 활성 캡슐 archived 처리
  await supabase
    .from('capsules')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('clerk_user_id', userId)
    .eq('domain_id', domainId)
    .eq('status', 'active');

  // 새 캡슐 생성
  const { data: capsuleRow, error } = await supabase
    .from('capsules')
    .insert({
      clerk_user_id: userId,
      domain_id: domainId,
      ccs: Math.max(0, Math.min(100, ccs)),
      status: 'active',
    })
    .select()
    .single();

  if (error || !capsuleRow) {
    throw new Error(`캡슐 생성 실패 (${domainId}): ${error?.message}`);
  }

  // 아이템 삽입
  const capsuleItems = await insertItems<T>(supabase, capsuleRow.id, items);

  return {
    id: capsuleRow.id,
    userId: capsuleRow.clerk_user_id,
    domainId: capsuleRow.domain_id,
    items: capsuleItems,
    ccs: capsuleRow.ccs ?? 0,
    status: 'active',
    createdAt: capsuleRow.created_at,
    updatedAt: capsuleRow.updated_at,
    lastRotation: capsuleRow.last_rotation ?? capsuleRow.created_at,
  };
}

/**
 * 캡슐에 아이템 추가
 */
export async function addItemToCapsule<T>(
  capsuleId: string,
  item: T,
  profileFitScore: number = 0
): Promise<CapsuleItem<T>> {
  const supabase = createServiceRoleClient();

  const { data: row, error } = await supabase
    .from('capsule_items')
    .insert({
      capsule_id: capsuleId,
      item: item as unknown,
      profile_fit_score: Math.max(0, Math.min(100, profileFitScore)),
    })
    .select()
    .single();

  if (error || !row) {
    throw new Error(`아이템 추가 실패: ${error?.message}`);
  }

  // 캡슐 updated_at 갱신
  await supabase
    .from('capsules')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', capsuleId);

  return mapRowToItem<T>(row);
}

/**
 * 캡슐에서 아이템 제거
 */
export async function removeItemFromCapsule(capsuleId: string, itemId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('capsule_items')
    .delete()
    .eq('id', itemId)
    .eq('capsule_id', capsuleId);

  if (error) {
    throw new Error(`아이템 삭제 실패: ${error?.message}`);
  }

  // 캡슐 updated_at 갱신
  await supabase
    .from('capsules')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', capsuleId);
}

/**
 * 캡슐 CCS 점수 업데이트
 */
export async function updateCapsuleCCS(capsuleId: string, ccs: number): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('capsules')
    .update({
      ccs: Math.max(0, Math.min(100, ccs)),
      updated_at: new Date().toISOString(),
    })
    .eq('id', capsuleId);

  if (error) {
    console.error(`[Capsule] CCS 업데이트 실패 (${capsuleId}):`, error);
  }
}

/**
 * 캡슐 로테이션 타임스탬프 갱신
 */
export async function updateCapsuleRotation(capsuleId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  const now = new Date().toISOString();
  const { error } = await supabase
    .from('capsules')
    .update({
      last_rotation: now,
      updated_at: now,
    })
    .eq('id', capsuleId);

  if (error) {
    console.error(`[Capsule] 로테이션 타임스탬프 갱신 실패:`, error);
  }
}

/**
 * 크로스 도메인 규칙 전체 조회 (캐싱용)
 */
export async function getCrossDomainRules(): Promise<import('./types').CrossDomainRule[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.from('cross_domain_rules').select('*');

  if (error) {
    console.error('[Capsule] 크로스 도메인 규칙 조회 실패:', error);
    return [];
  }

  return (data ?? []).map((row: CrossDomainRuleRow) => ({
    id: row.id,
    domain1: row.domain1,
    domain2: row.domain2,
    ruleName: row.rule_name,
    factor: row.factor,
    ruleType: row.rule_type as CrossDomainRuleType,
    description: row.description,
  }));
}

// =============================================================================
// 내부 유틸
// =============================================================================

async function insertItems<T>(
  supabase: ReturnType<typeof createServiceRoleClient>,
  capsuleId: string,
  items: T[]
): Promise<CapsuleItem<T>[]> {
  if (items.length === 0) return [];

  const rows = items.map((item) => ({
    capsule_id: capsuleId,
    item: item as unknown,
    profile_fit_score: 0,
  }));

  const { data, error } = await supabase.from('capsule_items').insert(rows).select();

  if (error) {
    console.error(`[Capsule] 아이템 일괄 삽입 실패:`, error);
    return [];
  }

  return (data ?? []).map((row: CapsuleItemRow) => mapRowToItem<T>(row));
}

function mapRowToItem<T>(row: CapsuleItemRow): CapsuleItem<T> {
  return {
    id: row.id,
    capsuleId: row.capsule_id,
    item: row.item as T,
    profileFitScore: row.profile_fit_score ?? 0,
    usageCount: row.usage_count ?? 0,
    lastUsed: row.last_used ?? null,
    addedAt: row.added_at,
  };
}
