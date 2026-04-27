/**
 * 통합 분석 세션 Store (CRUD)
 *
 * @module lib/analysis/integrated/internal/session-store
 * @description integrated_analysis_sessions 테이블 접근 계층 (service_role)
 * @see docs/specs/SDD-INTEGRATED-ANALYSIS.md §4
 *
 * @internal — 외부 import 금지 (오케스트레이터 전용)
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type { AxisCode, IntegratedSessionRow, PersonaProfile, SessionStatus } from '../types';

/** 세션 생성 입력 */
export interface CreateSessionInput {
  /** 외부에서 사전 생성한 세션 ID (Storage 업로드 경로에 사용). 없으면 DB가 자동 생성. */
  id?: string;
  clerkUserId: string;
  faceImageUrl: string | null;
  bodyImageUrl: string | null;
  questionnaire: Record<string, unknown>;
}

/** 세션 종료 입력 */
export interface FinalizeSessionInput {
  sessionId: string;
  status: Exclude<SessionStatus, 'pending'>;
  axesCompleted: AxisCode[];
  axesFailed: AxisCode[];
  usedFallback: AxisCode[];
  /** ADR-104 나 프로필 (선택, null이면 컬럼 NULL) */
  persona?: PersonaProfile | null;
}

/**
 * 세션 생성.
 * 초기 상태 'pending'으로 시작.
 */
export async function createSession(input: CreateSessionInput): Promise<IntegratedSessionRow> {
  const supabase = createServiceRoleClient();

  // 왜: id가 주어지면 명시, 없으면 DB default(gen_random_uuid())에 위임
  const insertPayload: Record<string, unknown> = {
    clerk_user_id: input.clerkUserId,
    face_image_url: input.faceImageUrl,
    body_image_url: input.bodyImageUrl,
    questionnaire: input.questionnaire,
    status: 'pending',
    axes_completed: [],
    axes_failed: [],
    used_fallback: [],
  };
  if (input.id) insertPayload.id = input.id;

  const { data, error } = await supabase
    .from('integrated_analysis_sessions')
    .insert(insertPayload)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`[SessionStore] createSession failed: ${error?.message ?? 'no data'}`);
  }

  return data as IntegratedSessionRow;
}

/**
 * 세션 종료 상태 업데이트.
 * Orchestrator가 5축 실행 완료 후 호출.
 */
export async function finalizeSession(input: FinalizeSessionInput): Promise<IntegratedSessionRow> {
  const supabase = createServiceRoleClient();

  const updatePayload: Record<string, unknown> = {
    status: input.status,
    axes_completed: input.axesCompleted,
    axes_failed: input.axesFailed,
    used_fallback: input.usedFallback,
    completed_at: new Date().toISOString(),
  };
  // 왜: persona 키가 명시적으로 전달된 경우만 업데이트 (undefined는 "미변경", null은 "명시적 null 저장")
  if (input.persona !== undefined) {
    updatePayload.persona = input.persona;
  }

  const { data, error } = await supabase
    .from('integrated_analysis_sessions')
    .update(updatePayload)
    .eq('id', input.sessionId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`[SessionStore] finalizeSession failed: ${error?.message ?? 'no data'}`);
  }

  return data as IntegratedSessionRow;
}

/**
 * 세션 단일 조회 (본인 소유만).
 * RLS가 적용되지 않은 service_role 클라이언트이므로 clerk_user_id 검증 직접 수행.
 */
export async function getSession(
  sessionId: string,
  clerkUserId: string
): Promise<IntegratedSessionRow | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from('integrated_analysis_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  if (error) {
    // 왜: maybeSingle에서 not found는 data=null로 오지만, 그 외 에러는 throw
    throw new Error(`[SessionStore] getSession failed: ${error.message}`);
  }

  return (data as IntegratedSessionRow | null) ?? null;
}

/**
 * 세션을 실패 상태로 기록 (복구 불가능한 서버 오류 시).
 */
export async function markSessionFailed(sessionId: string, axesFailed: AxisCode[]): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase
    .from('integrated_analysis_sessions')
    .update({
      status: 'failed',
      axes_failed: axesFailed,
      completed_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    // 왜: 실패 상태 기록 실패는 로깅만 하고 원본 에러를 전파 (이중 에러 방지)
    console.error('[SessionStore] markSessionFailed error:', error.message);
  }
}
