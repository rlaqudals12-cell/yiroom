/**
 * lib/audit 모듈 테스트
 *
 * 감사 로그 이벤트 추적
 */

import {
  logAuditEvent,
  logUserLogin,
  logUserLogout,
  logAnalysisCreate,
  logAnalysisDelete,
  logConsentGrant,
  logConsentRevoke,
  logUserDataAccess,
  type AuditEvent,
  type AuditEventType,
  type PerformerType,
} from '../../../lib/audit';

// __DEV__ 환경에서 console.log 호출 확인
const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

afterEach(() => {
  consoleSpy.mockClear();
});

afterAll(() => {
  consoleSpy.mockRestore();
});

describe('logAuditEvent', () => {
  it('이벤트를 콘솔에 기록해야 한다', () => {
    const event: AuditEvent = {
      type: 'user.login',
      userId: 'user_123',
      action: 'login',
      resource: 'auth',
    };
    logAuditEvent(event);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain('[Audit]');
    expect(consoleSpy.mock.calls[0][0]).toContain('user.login');
  });

  it('details가 포함된 이벤트도 기록해야 한다', () => {
    const event: AuditEvent = {
      type: 'analysis.create',
      userId: 'user_123',
      action: 'create:skin',
      resource: 'skin_assessments',
      details: { confidence: 0.85 },
    };
    logAuditEvent(event);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });

  it('performerType 기본값은 user', () => {
    const event: AuditEvent = {
      type: 'user.login',
      userId: 'user_123',
      action: 'login',
      resource: 'auth',
    };
    logAuditEvent(event);
    expect(consoleSpy.mock.calls[0][0]).toContain('user:user_123');
  });

  it('커스텀 performerType 사용', () => {
    const event: AuditEvent = {
      type: 'IMAGE_ANONYMIZATION',
      userId: 'system',
      action: 'anonymize',
      resource: 'images',
      performerType: 'system',
    };
    logAuditEvent(event);
    expect(consoleSpy.mock.calls[0][0]).toContain('system:system');
  });
});

describe('logUserLogin', () => {
  it('로그인 이벤트 기록', () => {
    logUserLogin('user_abc');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain('user.login');
  });
});

describe('logUserLogout', () => {
  it('로그아웃 이벤트 기록', () => {
    logUserLogout('user_abc');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain('user.logout');
  });
});

describe('logAnalysisCreate', () => {
  it('분석 생성 이벤트 기록', () => {
    logAnalysisCreate('user_abc', 'skin', 'record_123');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain('analysis.create');
    expect(consoleSpy.mock.calls[0][0]).toContain('create:skin');
  });
});

describe('logAnalysisDelete', () => {
  it('분석 삭제 이벤트 기록', () => {
    logAnalysisDelete('user_abc', 'skin');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain('analysis.delete');
  });
});

describe('logConsentGrant', () => {
  it('동의 부여 이벤트 기록', () => {
    logConsentGrant('user_abc', 'image_storage', { version: 'v1.0' });
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain('consent.grant');
  });
});

describe('logConsentRevoke', () => {
  it('동의 철회 이벤트 기록', () => {
    logConsentRevoke('user_abc', 'image_storage');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain('consent.revoke');
  });
});

describe('logUserDataAccess', () => {
  it('민감 데이터 접근 이벤트 기록', () => {
    logUserDataAccess('admin_1', 'user_abc', 'personal_color_assessments', 'read');
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain('user.data_access');
  });
});

describe('타입 export', () => {
  it('AuditEventType 타입이 유효해야 한다', () => {
    const eventType: AuditEventType = 'user.login';
    expect(eventType).toBe('user.login');
  });

  it('PerformerType 타입이 유효해야 한다', () => {
    const performer: PerformerType = 'system';
    expect(performer).toBe('system');
  });
});
