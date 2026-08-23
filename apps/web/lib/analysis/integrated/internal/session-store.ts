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
import { CLIENT_REQUEST_ID_KEY } from '../types';
import type { AxisCode, IntegratedSessionRow, PersonaProfile, SessionStatus } from '../types';

/** 세션 생성 입력 */
export interface CreateSessionInput {
  /** 외부에서 사전 생성한 세션 ID (Storage 업로드 경로에 사용). 없으면 DB가 자동 생성. */
  id?: string;
  clerkUserId: string;
  faceImageUrl: string | null;
  bodyImageUrl: string | null;
  questionnaire: Record<string, unknown>;
  /**
   * 클라이언트 요청 상관 ID (선택) — questionnaire JSONB의 예약 키로 함께 저장한다.
   * 이탈 복구 배너가 "이번 요청의 세션"을 시각이 아니라 정확한 일치로 찾는 근거.
   */
  clientRequestId?: string;
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

export type ImageStorageFailureCode =
  | 'upload_failed'
  | 'upload_deadline'
  | 'consent_revoked'
  | 'pointer_attach_failed'
  | 'cleanup_failed';

export interface AttachSessionImagePointersInput {
  sessionId: string;
  faceImageUrl: string | null;
  bodyImageUrl: string | null;
}

export interface RecordSessionImageStorageFailureInput {
  sessionId: string;
  questionnaire: Record<string, unknown>;
  failure: ImageStorageFailureCode;
  failedAt?: string;
}

export interface RecordSessionImageCleanupPendingInput extends RecordSessionImageStorageFailureInput {
  faceImageUrl: string | null;
  bodyImageUrl: string | null;
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
    // 상관 ID는 예약 키로 함께 저장 (전용 컬럼 없음 — types.ts CLIENT_REQUEST_ID_KEY 주석 참조)
    questionnaire: input.clientRequestId
      ? { ...input.questionnaire, [CLIENT_REQUEST_ID_KEY]: input.clientRequestId }
      : input.questionnaire,
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

/** 업로드와 포인터 부착 사이 철회 경합을 닫는 마지막 전역 생체 동의 확인. */
export async function assertBiometricConsentForImageAttach(clerkUserId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('user_agreements')
    .select('biometric_agreed')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  if (error || data?.biometric_agreed !== true) {
    throw new Error('[SessionStore] biometric consent is not active before image attach');
  }
}

/**
 * 업로드가 모두 성공한 뒤에만 pending 세션에 원본 포인터를 부착한다.
 * 이 단계 전까지 세션은 null 포인터라 늦은 업로드가 DB에 고아 참조를 만들 수 없다.
 */
export async function attachSessionImagePointers(
  input: AttachSessionImagePointersInput
): Promise<IntegratedSessionRow> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('integrated_analysis_sessions')
    .update({
      face_image_url: input.faceImageUrl,
      body_image_url: input.bodyImageUrl,
      image_cleanup_pending: false,
    })
    .eq('id', input.sessionId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `[SessionStore] attachSessionImagePointers failed: ${error?.message ?? 'no data'}`
    );
  }
  return data as IntegratedSessionRow;
}

/** attach 응답이 불확실할 때 커밋됐을 수 있는 포인터를 멱등하게 비운다. */
export async function clearSessionImagePointers(sessionId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('integrated_analysis_sessions')
    .update({ face_image_url: null, body_image_url: null, image_cleanup_pending: false })
    .eq('id', sessionId);

  if (error) {
    throw new Error(`[SessionStore] clearSessionImagePointers failed: ${error.message}`);
  }
}

/**
 * 선택 저장 실패는 민감 데이터·오류 원문 없이 questionnaire의 감사용 예약 키에 남긴다.
 * 원래 문진 객체를 함께 전달해 clientRequestId 등 기존 키를 보존한다.
 */
export async function recordSessionImageStorageFailure(
  input: RecordSessionImageStorageFailureInput
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('integrated_analysis_sessions')
    .update({
      questionnaire: {
        ...input.questionnaire,
        _imageStorageFailure: input.failure,
        _imageStorageFailureAt: input.failedAt ?? new Date().toISOString(),
      },
    })
    .eq('id', input.sessionId);

  if (error) {
    throw new Error(`[SessionStore] record image storage failure failed: ${error.message}`);
  }
}

/**
 * Storage rollback 실패 후보를 failed session이 소유하게 해 일일 cleanup이 즉시 재시도한다.
 * 경로와 cleanup_pending 표식을 한 UPDATE에 기록해 로그에만 남는 고아를 만들지 않는다.
 */
export async function recordSessionImageCleanupPending(
  input: RecordSessionImageCleanupPendingInput
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from('integrated_analysis_sessions')
    .update({
      face_image_url: input.faceImageUrl,
      body_image_url: input.bodyImageUrl,
      image_cleanup_pending: true,
      questionnaire: {
        ...input.questionnaire,
        _imageStorageFailure: 'cleanup_failed',
        _imageStorageFailureAt: input.failedAt ?? new Date().toISOString(),
        _imageStorageCleanupPending: true,
      },
    })
    .eq('id', input.sessionId);

  if (error) {
    throw new Error(`[SessionStore] record cleanup pending failed: ${error.message}`);
  }
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
 * 동일 사용자·클라이언트 요청 ID로 이미 만들어진 세션을 찾는다.
 *
 * 재전송은 새 분석을 만들지 않고 기존 세션을 돌려줘야 한다. service-role 조회이므로
 * 사용자 필터와 JSONB 상관 키를 모두 직접 강제한다. 조회 장애는 null로 삼키지 않는다 —
 * 중복 분석을 시작하는 것보다 요청을 실패시키는 편이 안전하다.
 */
export async function findSessionByClientRequestId(
  clerkUserId: string,
  clientRequestId: string
): Promise<IntegratedSessionRow | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('integrated_analysis_sessions')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .eq(`questionnaire->>${CLIENT_REQUEST_ID_KEY}`, clientRequestId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`[SessionStore] idempotency lookup failed: ${error.message}`);
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
