/**
 * 감사 로그(Audit Log) 시스템
 * @description 관리자 행동, 데이터 삭제, 권한 변경 등 중요 이벤트 추적
 * @version 1.0
 * @date 2026-01-11
 *
 * 현재: 콘솔 기반 로깅
 * 추후: DB 저장 확장 가능 (audit_logs 테이블)
 */

import { createLogger } from '@/lib/utils/logger';

// 감사 로그 전용 로거
const auditLogger = createLogger('Audit', { enableInProduction: true });

/**
 * 감사 이벤트 타입
 */
export type AuditEventType =
  | 'ADMIN_ACTION' // 관리자 작업 (가격 업데이트, 제품 관리 등)
  | 'DATA_DELETE' // 데이터 삭제
  | 'PERMISSION_CHANGE' // 권한 변경
  | 'SENSITIVE_ACCESS'; // 민감 데이터 접근

/**
 * 감사 로그 이벤트
 */
export interface AuditEvent {
  /** 이벤트 타입 */
  type: AuditEventType;
  /** 사용자 ID (Clerk User ID 또는 'system') */
  userId: string;
  /** 수행한 작업 (예: 'price-update', 'delete-user') */
  action: string;
  /** 대상 리소스 (예: 'cosmetic_products', 'user:user_123') */
  resource: string;
  /** 추가 세부 정보 */
  details?: Record<string, unknown>;
  /** IP 주소 (옵션) */
  ip?: string;
  /** 타임스탬프 (자동 생성) */
  timestamp?: string;
}

/**
 * 감사 이벤트 로깅
 * @description 중요 이벤트를 추적하고 기록
 *
 * @example
 * ```typescript
 * // 관리자 가격 업데이트
 * logAuditEvent({
 *   type: 'ADMIN_ACTION',
 *   userId: 'admin_123',
 *   action: 'price-update',
 *   resource: 'cosmetic_products',
 *   details: { productType: 'cosmetic', limit: 50 },
 *   ip: '192.168.1.1'
 * });
 *
 * // 데이터 삭제
 * logAuditEvent({
 *   type: 'DATA_DELETE',
 *   userId: 'user_456',
 *   action: 'delete-account',
 *   resource: 'user:user_456'
 * });
 * ```
 */
export function logAuditEvent(event: AuditEvent): void {
  const timestamp = event.timestamp || new Date().toISOString();

  const logEntry = {
    timestamp,
    type: event.type,
    userId: event.userId,
    action: event.action,
    resource: event.resource,
    ...(event.details && { details: event.details }),
    ...(event.ip && { ip: event.ip }),
  };

  // 콘솔 로깅 (프로덕션에서도 출력)
  auditLogger.info(`[${event.type}] ${event.action}`, logEntry);

  // TODO: DB 저장 확장
  // await saveToAuditTable(logEntry);
}

/**
 * 관리자 작업 로깅 헬퍼
 */
export function logAdminAction(
  userId: string,
  action: string,
  resource: string,
  details?: Record<string, unknown>,
  ip?: string
): void {
  logAuditEvent({
    type: 'ADMIN_ACTION',
    userId,
    action,
    resource,
    details,
    ip,
  });
}

/**
 * 데이터 삭제 로깅 헬퍼
 */
export function logDataDelete(
  userId: string,
  action: string,
  resource: string,
  details?: Record<string, unknown>,
  ip?: string
): void {
  logAuditEvent({
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
export function logPermissionChange(
  userId: string,
  action: string,
  resource: string,
  details?: Record<string, unknown>,
  ip?: string
): void {
  logAuditEvent({
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
export function logSensitiveAccess(
  userId: string,
  action: string,
  resource: string,
  details?: Record<string, unknown>,
  ip?: string
): void {
  logAuditEvent({
    type: 'SENSITIVE_ACCESS',
    userId,
    action,
    resource,
    details,
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
