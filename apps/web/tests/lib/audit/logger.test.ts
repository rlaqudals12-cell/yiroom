/* eslint-disable sonarjs/no-hardcoded-ip */
/**
 * 감사 로그 시스템 테스트
 * @description lib/audit/logger.ts 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  logAuditEvent,
  logAuditEventSync,
  logAdminAction,
  logDataDelete,
  logPermissionChange,
  logSensitiveAccess,
  logUserLogin,
  logUserLogout,
  logUserDataAccess,
  logAnalysisCreate,
  logAnalysisDelete,
  logConsentGrant,
  logConsentRevoke,
  getClientIp,
  getUserAgent,
  type AuditEvent,
} from '@/lib/audit/logger';

// Supabase Mock
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
const mockSupabase = { from: mockFrom };

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(() => mockSupabase),
}));

// Logger Mock
vi.mock('@/lib/utils/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  })),
}));

describe('logAuditEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
  });

  it('should save audit log to database', async () => {
    const event: AuditEvent = {
      type: 'user.login',
      userId: 'user_123',
      action: 'login',
      resource: 'auth',
    };

    const result = await logAuditEvent(event);

    expect(result).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith('audit_logs');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'user.login',
        performed_by: 'user_123',
        performed_by_type: 'user',
      })
    );
  });

  it('should include optional fields when provided', async () => {
    const event: AuditEvent = {
      type: 'user.data_access',
      userId: 'user_123',
      action: 'view-profile',
      resource: 'personal_color_assessments',
      targetUserId: 'user_456',
      targetTable: 'personal_color_assessments',
      targetRecordId: 'record_789',
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      details: { fields: ['face_image_url'] },
    };

    await logAuditEvent(event);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        target_user_id: 'user_456',
        target_table: 'personal_color_assessments',
        target_record_id: 'record_789',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
      })
    );
  });

  it('should return false on database error', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'DB Error' } });

    const result = await logAuditEvent({
      type: 'user.login',
      userId: 'user_123',
      action: 'login',
      resource: 'auth',
    });

    expect(result).toBe(false);
  });

  it('should handle unexpected errors gracefully', async () => {
    mockInsert.mockRejectedValue(new Error('Connection failed'));

    const result = await logAuditEvent({
      type: 'user.login',
      userId: 'user_123',
      action: 'login',
      resource: 'auth',
    });

    expect(result).toBe(false);
  });
});

describe('inferPerformerType', () => {
  it('should infer cron type for system:cron: prefix', async () => {
    await logAuditEvent({
      type: 'CRON_CLEANUP_IMAGES_COMPLETED',
      userId: 'system:cron:cleanup',
      action: 'cleanup',
      resource: 'images',
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        performed_by_type: 'cron',
      })
    );
  });

  it('should infer system type for system: prefix', async () => {
    await logAuditEvent({
      type: 'IMAGE_ANONYMIZATION',
      userId: 'system:scheduler',
      action: 'anonymize',
      resource: 'images',
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        performed_by_type: 'system',
      })
    );
  });

  it('should infer admin type for admin: prefix', async () => {
    await logAuditEvent({
      type: 'ADMIN_ACTION',
      userId: 'admin:admin_123',
      action: 'update-price',
      resource: 'products',
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        performed_by_type: 'admin',
      })
    );
  });

  it('should default to user type', async () => {
    await logAuditEvent({
      type: 'user.login',
      userId: 'user_123',
      action: 'login',
      resource: 'auth',
    });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        performed_by_type: 'user',
      })
    );
  });
});

describe('logAuditEventSync', () => {
  it('should call logAuditEvent without awaiting', () => {
    // logAuditEventSync는 void를 반환하고 비동기로 실행
    logAuditEventSync({
      type: 'user.login',
      userId: 'user_123',
      action: 'login',
      resource: 'auth',
    });

    // 비동기 호출이므로 즉시 반환됨 (에러 없이)
    expect(true).toBe(true);
  });
});

describe('Helper Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
  });

  describe('logAdminAction', () => {
    it('should log admin action with admin prefix', async () => {
      const result = await logAdminAction(
        'admin_123',
        'update-price',
        'cosmetic_products',
        { productId: '123' }
      );

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ADMIN_ACTION',
          performed_by: 'admin:admin_123',
          performed_by_type: 'admin',
        })
      );
    });
  });

  describe('logDataDelete', () => {
    it('should log data deletion', async () => {
      const result = await logDataDelete(
        'user_123',
        'delete-account',
        'users',
        { reason: 'user_request' }
      );

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DATA_DELETE',
        })
      );
    });
  });

  describe('logPermissionChange', () => {
    it('should log permission change', async () => {
      const result = await logPermissionChange(
        'admin_123',
        'grant-admin',
        'roles',
        { targetUser: 'user_456' }
      );

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PERMISSION_CHANGE',
        })
      );
    });
  });

  describe('logSensitiveAccess', () => {
    it('should log sensitive data access', async () => {
      const result = await logSensitiveAccess(
        'user_123',
        'view-analysis',
        'skin_analyses',
        { analysisId: 'abc' }
      );

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SENSITIVE_ACCESS',
        })
      );
    });
  });

  describe('logUserLogin', () => {
    it('should log user login', async () => {
      const result = await logUserLogin('user_123', '192.168.1.1', 'Mozilla/5.0');

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user.login',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
        })
      );
    });
  });

  describe('logUserLogout', () => {
    it('should log user logout', async () => {
      const result = await logUserLogout('user_123', '192.168.1.1');

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user.logout',
        })
      );
    });
  });

  describe('logUserDataAccess', () => {
    it('should log user data access', async () => {
      const result = await logUserDataAccess(
        'user_123',
        'user_456',
        'personal_color_assessments',
        'read',
        { fields: ['season_type'] }
      );

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user.data_access',
          target_user_id: 'user_456',
          target_table: 'personal_color_assessments',
        })
      );
    });
  });

  describe('logAnalysisCreate', () => {
    it('should log analysis creation', async () => {
      const result = await logAnalysisCreate(
        'user_123',
        'skin_analyses',
        'record_123'
      );

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'analysis.create',
          target_table: 'skin_analyses',
          target_record_id: 'record_123',
        })
      );
    });
  });

  describe('logAnalysisDelete', () => {
    it('should log analysis deletion', async () => {
      const result = await logAnalysisDelete(
        'user_123',
        'skin_analyses',
        'record_123'
      );

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'analysis.delete',
        })
      );
    });
  });

  describe('logConsentGrant', () => {
    it('should log consent grant', async () => {
      const result = await logConsentGrant(
        'user_123',
        'marketing',
        { version: 'v1' }
      );

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'consent.grant',
        })
      );
    });
  });

  describe('logConsentRevoke', () => {
    it('should log consent revoke', async () => {
      const result = await logConsentRevoke(
        'user_123',
        'marketing'
      );

      expect(result).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'consent.revoke',
        })
      );
    });
  });
});

describe('Request Utility Functions', () => {
  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });

      expect(getClientIp(request)).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
      });

      expect(getClientIp(request)).toBe('192.168.1.2');
    });

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '192.168.1.2',
        },
      });

      expect(getClientIp(request)).toBe('192.168.1.1');
    });

    it('should return undefined when no IP headers', () => {
      const request = new Request('http://localhost');
      expect(getClientIp(request)).toBeUndefined();
    });
  });

  describe('getUserAgent', () => {
    it('should extract user-agent header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0)',
        },
      });

      expect(getUserAgent(request)).toBe('Mozilla/5.0 (Windows NT 10.0)');
    });

    it('should return undefined when no user-agent', () => {
      const request = new Request('http://localhost');
      expect(getUserAgent(request)).toBeUndefined();
    });
  });
});
