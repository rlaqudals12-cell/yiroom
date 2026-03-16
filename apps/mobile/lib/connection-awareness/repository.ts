/**
 * ConnectionAwareness Repository
 *
 * @module lib/connection-awareness/repository
 * @description DB 접근 및 상태 전이 로직
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  ConnectionStatus,
  ConnectionAwareness,
  ExposeRequest,
  ExposeResponse,
  ConfirmResponse,
  ConnectionStats,
  ExplanationDepth,
} from './types';

// 상태 전이 조건
const STATUS_TRANSITIONS: Record<ConnectionStatus, { minExposure: number; minConfirmed: number }> =
  {
    exposed: { minExposure: 1, minConfirmed: 0 },
    recognized: { minExposure: 3, minConfirmed: 1 },
    internalized: { minExposure: 5, minConfirmed: 3 },
    independent: { minExposure: 7, minConfirmed: 5 },
  };

// 상태 순서
const STATUS_ORDER: ConnectionStatus[] = ['exposed', 'recognized', 'internalized', 'independent'];

/**
 * 현재 카운트 기반으로 올바른 상태를 계산
 */
function calculateStatus(exposureCount: number, confirmedCount: number): ConnectionStatus {
  let result: ConnectionStatus = 'exposed';
  for (const status of STATUS_ORDER) {
    const req = STATUS_TRANSITIONS[status];
    if (exposureCount >= req.minExposure && confirmedCount >= req.minConfirmed) {
      result = status;
    }
  }
  return result;
}

/**
 * 인사이트 노출 시 호출 — UPSERT + 상태 전이
 */
export async function exposeConnection(
  supabase: SupabaseClient,
  userId: string,
  request: ExposeRequest
): Promise<ExposeResponse> {
  // 기존 레코드 조회
  const { data: existing } = await supabase
    .from('connection_awareness')
    .select('id, exposure_count, confirmed_count, status')
    .eq('clerk_user_id', userId)
    .eq('connection_id', request.connectionId)
    .single();

  if (existing) {
    const newExposure = existing.exposure_count + 1;
    const newStatus = calculateStatus(newExposure, existing.confirmed_count);
    const statusChanged = newStatus !== existing.status;

    const { error } = await supabase
      .from('connection_awareness')
      .update({
        exposure_count: newExposure,
        status: newStatus,
        last_exposed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) throw new Error(`노출 업데이트 실패: ${error.code}`);

    return {
      status: newStatus,
      exposureCount: newExposure,
      statusChanged,
    };
  }

  // 새 레코드 생성
  const { error } = await supabase.from('connection_awareness').insert({
    clerk_user_id: userId,
    connection_id: request.connectionId,
    source_module: request.sourceModule,
    target_domain: request.targetDomain,
    connection_rule: request.connectionRule,
    exposure_count: 1,
    confirmed_count: 0,
    status: 'exposed',
    last_exposed_at: new Date().toISOString(),
  });

  if (error) throw new Error(`연결 생성 실패: ${error.code}`);

  return {
    status: 'exposed',
    exposureCount: 1,
    statusChanged: false,
  };
}

/**
 * 사용자가 인사이트를 확인/수용 시 호출
 */
export async function confirmConnection(
  supabase: SupabaseClient,
  userId: string,
  connectionId: string
): Promise<ConfirmResponse> {
  const { data: existing } = await supabase
    .from('connection_awareness')
    .select('id, exposure_count, confirmed_count, status')
    .eq('clerk_user_id', userId)
    .eq('connection_id', connectionId)
    .single();

  if (!existing) {
    throw new Error('연결을 찾을 수 없습니다');
  }

  const newConfirmed = existing.confirmed_count + 1;
  const newStatus = calculateStatus(existing.exposure_count, newConfirmed);
  const statusChanged = newStatus !== existing.status;

  const { error } = await supabase
    .from('connection_awareness')
    .update({
      confirmed_count: newConfirmed,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id);

  if (error) throw new Error(`확인 업데이트 실패: ${error.code}`);

  return {
    status: newStatus,
    confirmedCount: newConfirmed,
    statusChanged,
  };
}

/**
 * 사용자의 연결 목록 조회
 */
export async function getUserConnections(
  supabase: SupabaseClient,
  userId: string,
  filters?: { status?: ConnectionStatus; sourceModule?: string }
): Promise<ConnectionAwareness[]> {
  let query = supabase
    .from('connection_awareness')
    .select('*')
    .eq('clerk_user_id', userId)
    .order('updated_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.sourceModule) {
    query = query.eq('source_module', filters.sourceModule);
  }

  const { data, error } = await query;

  if (error) throw new Error(`연결 조회 실패: ${error.code}`);

  return (data ?? []).map(mapRowToConnection);
}

/**
 * 내재화 통계
 */
export async function getConnectionStats(
  supabase: SupabaseClient,
  userId: string
): Promise<ConnectionStats> {
  const { data, error } = await supabase
    .from('connection_awareness')
    .select('status')
    .eq('clerk_user_id', userId);

  if (error) throw new Error(`통계 조회 실패: ${error.code}`);

  const rows = data ?? [];
  const total = rows.length;

  const byStatus: Record<ConnectionStatus, number> = {
    exposed: 0,
    recognized: 0,
    internalized: 0,
    independent: 0,
  };

  for (const row of rows) {
    const s = row.status as ConnectionStatus;
    if (s in byStatus) byStatus[s]++;
  }

  const advancedCount = byStatus.internalized + byStatus.independent;

  return {
    totalConnections: total,
    internalizationRate: total > 0 ? advancedCount / total : 0,
    independentCount: byStatus.independent,
    byStatus,
  };
}

/**
 * ConnectionStatus에 따른 설명 깊이
 */
export function getExplanationDepth(status: ConnectionStatus): ExplanationDepth {
  switch (status) {
    case 'exposed':
      return 'full';
    case 'recognized':
      return 'brief';
    case 'internalized':
      return 'minimal';
    case 'independent':
      return 'none';
  }
}

// DB 행 → 인터페이스 매핑
function mapRowToConnection(row: Record<string, unknown>): ConnectionAwareness {
  return {
    id: row.id as string,
    clerkUserId: row.clerk_user_id as string,
    connectionId: row.connection_id as string,
    sourceModule: row.source_module as ConnectionAwareness['sourceModule'],
    targetDomain: row.target_domain as string,
    connectionRule: row.connection_rule as string,
    exposureCount: row.exposure_count as number,
    confirmedCount: row.confirmed_count as number,
    status: row.status as ConnectionStatus,
    lastExposedAt: row.last_exposed_at as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
