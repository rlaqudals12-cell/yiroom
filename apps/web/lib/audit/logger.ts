/**
 * 감사 로그(Audit Log) 시스템
 * @description 관리자 행동, 데이터 삭제, 권한 변경 등 중요 이벤트 추적
 * @version 2.0
 * @date 2026-01-16
 *
 * 변경 이력:
 * - v1.0 (2026-01-11): 콘솔 기반 로깅
 * - v2.0 (2026-01-16): DB 저장 기능 추가 (audit_logs 테이블)
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { createLogger } from '@/lib/utils/logger';

// 감사 로그 전용 로거 (콘솔 출력용)
const auditLogger = createLogger('Audit', { enableInProduction: true });

/**
 * 감사 이벤트 타입 (DB action 컬럼과 매핑)
 */
export type AuditEventType =
  // 기존 타입 (v1.0)
  | 'ADMIN_ACTION' // 관리자 작업 (가격 업데이트, 제품 관리 등)
  | 'DATA_DELETE' // 데이터 삭제
  | 'PERMISSION_CHANGE' // 권한 변경
  | 'SENSITIVE_ACCESS' // 민감 데이터 접근
  // v2.0 추가: 세분화된 이벤트 타입
  | 'user.login' // 로그인
  | 'user.logout' // 로그아웃
  | 'user.data_access' // 민감 데이터 조회
  | 'analysis.create' // 분석 생성
  | 'analysis.delete' // 분석 삭제
  | 'consent.grant' // 동의 부여
  | 'consent.revoke' // 동의 철회
  // 시스템 이벤트
  | 'IMAGE_ANONYMIZATION' // 이미지 익명화
  | 'COMPLETE_DATA_PURGE' // 완전 삭제
  | 'CRON_CLEANUP_IMAGES_COMPLETED'; // Cron 완료

/**
 * 수행자 타입 (DB performed_by_type 컬럼)
 */
export type PerformerType = 'user' | 'admin' | 'system' | 'cron';

/**
 * 감사 로그 이벤트
 */
export interface AuditEvent {
  /** 이벤트 타입 (action) */
  type: AuditEventType;
  /** 사용자 ID (Clerk User ID 또는 'system') - performed_by */
  userId: string;
  /** 수행한 작업 (예: 'price-update', 'delete-user') */
  action: string;
  /** 대상 리소스 (예: 'cosmetic_products', 'user:user_123') */
  resource: string;
  /** 추가 세부 정보 - details JSONB */
  details?: Record<string, unknown>;
  /** IP 주소 (옵션) - ip_address */
  ip?: string;
  /** 타임스탬프 (자동 생성) */
  timestamp?: string;
  /** 대상 사용자 ID (옵션) - target_user_id */
  targetUserId?: string;
  /** 대상 테이블 (옵션) - target_table */
  targetTable?: string;
  /** 대상 레코드 ID (옵션) - target_record_id */
  targetRecordId?: string;
  /** 수행자 타입 */
  performerType?: PerformerType;
  /** User-Agent (옵션) */
  userAgent?: string;
}

/**
 * DB 저장용 audit_logs 레코드 타입
 */
interface AuditLogRecord {
  action: string;
  details: Record<string, unknown>;
  target_user_id?: string;
  target_table?: string;
  target_record_id?: string;
  performed_by: string;
  performed_by_type: PerformerType;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

/**
 * 수행자 타입 자동 판별
 */
function inferPerformerType(userId: string): PerformerType {
  if (userId.startsWith('system:cron:')) return 'cron';
  if (userId.startsWith('system:')) return 'system';
  if (userId.startsWith('admin:')) return 'admin';
  return 'user';
}

/**
 * 감사 로그 DB 저장
 * RLS 우회를 위해 service role 클라이언트 사용
 */
async function saveToDatabase(record: AuditLogRecord): Promise<boolean> {
  try {
    const supabase = createServiceRoleClient();

    const { error } = await supabase.from('audit_logs').insert(record);

    if (error) {
      auditLogger.error('Failed to save audit log to DB:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    // DB 저장 실패해도 애플리케이션은 계속 동작
    auditLogger.error(
      'Unexpected error saving audit log:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return false;
  }
}

/**
 * 감사 이벤트 로깅
 * @description 중요 이벤트를 콘솔에 기록하고 DB에 저장
 */
export async function logAuditEvent(event: AuditEvent): Promise<boolean> {
  const timestamp = event.timestamp || new Date().toISOString();
  const performerType = event.performerType || inferPerformerType(event.userId);

  // 콘솔 로깅 (프로덕션에서도 출력)
  const consoleEntry = {
    timestamp,
    type: event.type,
    userId: event.userId,
    action: event.action,
    resource: event.resource,
    ...(event.details && { details: event.details }),
    ...(event.ip && { ip: event.ip }),
  };

  auditLogger.info(`[${event.type}] ${event.action}`, consoleEntry);

  // DB 저장
  const dbRecord: AuditLogRecord = {
    action: event.type,
    details: {
      legacy_action: event.action,
      resource: event.resource,
      ...event.details,
    },
    performed_by: event.userId,
    performed_by_type: performerType,
    created_at: timestamp,
    ...(event.targetUserId && { target_user_id: event.targetUserId }),
    ...(event.targetTable && { target_table: event.targetTable }),
    ...(event.targetRecordId && { target_record_id: event.targetRecordId }),
    ...(event.ip && { ip_address: event.ip }),
    ...(event.userAgent && { user_agent: event.userAgent }),
  };

  return saveToDatabase(dbRecord);
}

/**
 * 감사 이벤트 로깅 (동기 버전 - 하위 호환성)
 * @deprecated logAuditEvent 사용 권장 (Promise 반환)
 */
export function logAuditEventSync(event: AuditEvent): void {
  // 비동기로 실행하되 결과를 기다리지 않음
  void logAuditEvent(event);
}

/**
 * 관리자 작업 로깅 헬퍼
 */
export async function logAdminAction(
  userId: string,
  action: string,
  resource: string,
  details?: Record<string, unknown>,
  ip?: string
): Promise<boolean> {
  return logAuditEvent({
    type: 'ADMIN_ACTION',
    userId: `admin:${userId}`,
    action,
    resource,
    details,
    ip,
    performerType: 'admin',
  });
}

/**
 * 데이터 삭제 로깅 헬퍼
 */
export async function logDataDelete(
  userId: string,
  action: string,
  resource: string,
  details?: Record<string, unknown>,
  ip?: string
): Promise<boolean> {
  return logAuditEvent({
    type: 'DATA_DELETE',
    userId,
    action,
    resource,
    details,
    ip,
  });
}

/**
 * 권한 변경 로깅 헬퍼
 */
export async function logPermissionChange(
  userId: string,
  action: string,
  resource: string,
  details?: Record<string, unknown>,
  ip?: string
): Promise<boolean> {
  return logAuditEvent({
    type: 'PERMISSION_CHANGE',
    userId,
    action,
    resource,
    details,
    ip,
  });
}

/**
 * 민감 데이터 접근 로깅 헬퍼
 */
export async function logSensitiveAccess(
  userId: string,
  action: string,
  resource: string,
  details?: Record<string, unknown>,
  ip?: string
): Promise<boolean> {
  return logAuditEvent({
    type: 'SENSITIVE_ACCESS',
    userId,
    action,
    resource,
    details,
    ip,
  });
}

/**
 * 사용자 로그인 로깅 헬퍼
 */
export async function logUserLogin(
  userId: string,
  ip?: string,
  userAgent?: string
): Promise<boolean> {
  return logAuditEvent({
    type: 'user.login',
    userId,
    action: 'login',
    resource: 'auth',
    ip,
    userAgent,
  });
}

/**
 * 사용자 로그아웃 로깅 헬퍼
 */
export async function logUserLogout(
  userId: string,
  ip?: string
): Promise<boolean> {
  return logAuditEvent({
    type: 'user.logout',
    userId,
    action: 'logout',
    resource: 'auth',
    ip,
  });
}

/**
 * 사용자 데이터 접근 로깅 헬퍼
 */
export async function logUserDataAccess(
  userId: string,
  targetUserId: string,
  resource: string,
  accessType: 'read' | 'write',
  details?: Record<string, unknown>,
  ip?: string
): Promise<boolean> {
  return logAuditEvent({
    type: 'user.data_access',
    userId,
    action: `data_access:${accessType}`,
    resource,
    targetUserId,
    targetTable: resource,
    details: { accessType, ...details },
    ip,
  });
}

/**
 * 분석 생성 로깅 헬퍼
 */
export async function logAnalysisCreate(
  userId: string,
  analysisType: string,
  recordId: string,
  ip?: string
): Promise<boolean> {
  return logAuditEvent({
    type: 'analysis.create',
    userId,
    action: `create:${analysisType}`,
    resource: analysisType,
    targetTable: analysisType,
    targetRecordId: recordId,
    ip,
  });
}

/**
 * 분석 삭제 로깅 헬퍼
 */
export async function logAnalysisDelete(
  userId: string,
  analysisType: string,
  recordId: string,
  ip?: string
): Promise<boolean> {
  return logAuditEvent({
    type: 'analysis.delete',
    userId,
    action: `delete:${analysisType}`,
    resource: analysisType,
    targetTable: analysisType,
    targetRecordId: recordId,
    ip,
  });
}

/**
 * 동의 부여 로깅 헬퍼
 */
export async function logConsentGrant(
  userId: string,
  consentType: string,
  details?: Record<string, unknown>,
  ip?: string
): Promise<boolean> {
  return logAuditEvent({
    type: 'consent.grant',
    userId,
    action: `grant:${consentType}`,
    resource: 'consent',
    details: { consentType, ...details },
    ip,
  });
}

/**
 * 동의 철회 로깅 헬퍼
 */
export async function logConsentRevoke(
  userId: string,
  consentType: string,
  details?: Record<string, unknown>,
  ip?: string
): Promise<boolean> {
  return logAuditEvent({
    type: 'consent.revoke',
    userId,
    action: `revoke:${consentType}`,
    resource: 'consent',
    details: { consentType, ...details },
    ip,
  });
}

/**
 * Request에서 IP 주소 추출
 */
export function getClientIp(request: Request): string | undefined {
  // Vercel/Cloudflare 헤더 우선
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return undefined;
}

/**
 * Request에서 User-Agent 추출
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}
