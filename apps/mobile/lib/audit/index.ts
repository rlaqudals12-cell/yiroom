/**
 * 감사 로그(Audit Log) 모듈
 *
 * 로그인, 분석, 동의 등 중요 이벤트 추적
 * 모바일 환경 적응: IP/User-Agent 미수집, 콘솔 로깅 중심
 *
 * @module lib/audit
 */

// ---- 타입 ----

export type AuditEventType =
  | 'user.login'
  | 'user.logout'
  | 'user.data_access'
  | 'analysis.create'
  | 'analysis.delete'
  | 'consent.grant'
  | 'consent.revoke'
  | 'IMAGE_ANONYMIZATION'
  | 'COMPLETE_DATA_PURGE';

export type PerformerType = 'user' | 'admin' | 'system';

export interface AuditEvent {
  /** 이벤트 타입 */
  type: AuditEventType;
  /** 사용자 ID (Clerk User ID 또는 'system') */
  userId: string;
  /** 수행한 작업 */
  action: string;
  /** 대상 리소스 */
  resource: string;
  /** 추가 세부 정보 */
  details?: Record<string, unknown>;
  /** 대상 사용자 ID */
  targetUserId?: string;
  /** 대상 테이블 */
  targetTable?: string;
  /** 대상 레코드 ID */
  targetRecordId?: string;
  /** 수행자 타입 */
  performerType?: PerformerType;
}

// ---- 핵심 함수 ----

/**
 * 감사 이벤트 로깅
 *
 * 콘솔에 기록하고, 향후 DB 저장 확장 가능
 */
export function logAuditEvent(event: AuditEvent): void {
  const timestamp = new Date().toISOString();
  const performer = event.performerType ?? 'user';

  if (__DEV__) {
    console.log(
      `[Audit] ${timestamp} | ${event.type} | ${performer}:${event.userId} | ${event.action} → ${event.resource}`,
      event.details ? JSON.stringify(event.details) : ''
    );
  }
}

// ---- 헬퍼 함수 ----

/** 로그인 이벤트 */
export function logUserLogin(userId: string): void {
  logAuditEvent({
    type: 'user.login',
    userId,
    action: 'login',
    resource: 'auth',
  });
}

/** 로그아웃 이벤트 */
export function logUserLogout(userId: string): void {
  logAuditEvent({
    type: 'user.logout',
    userId,
    action: 'logout',
    resource: 'auth',
  });
}

/** 분석 생성 이벤트 */
export function logAnalysisCreate(
  userId: string,
  analysisType: string,
  recordId?: string
): void {
  logAuditEvent({
    type: 'analysis.create',
    userId,
    action: `create:${analysisType}`,
    resource: `${analysisType}_assessments`,
    targetRecordId: recordId,
  });
}

/** 분석 삭제 이벤트 */
export function logAnalysisDelete(
  userId: string,
  analysisType: string,
  recordId?: string
): void {
  logAuditEvent({
    type: 'analysis.delete',
    userId,
    action: `delete:${analysisType}`,
    resource: `${analysisType}_assessments`,
    targetRecordId: recordId,
  });
}

/** 동의 부여 이벤트 */
export function logConsentGrant(
  userId: string,
  consentType: string,
  details?: Record<string, unknown>
): void {
  logAuditEvent({
    type: 'consent.grant',
    userId,
    action: `grant:${consentType}`,
    resource: 'consent',
    details,
  });
}

/** 동의 철회 이벤트 */
export function logConsentRevoke(
  userId: string,
  consentType: string,
  details?: Record<string, unknown>
): void {
  logAuditEvent({
    type: 'consent.revoke',
    userId,
    action: `revoke:${consentType}`,
    resource: 'consent',
    details,
  });
}

/** 민감 데이터 접근 이벤트 */
export function logUserDataAccess(
  userId: string,
  targetUserId: string,
  resource: string,
  accessType: string,
  details?: Record<string, unknown>
): void {
  logAuditEvent({
    type: 'user.data_access',
    userId,
    action: `access:${accessType}`,
    resource,
    targetUserId,
    details,
  });
}
