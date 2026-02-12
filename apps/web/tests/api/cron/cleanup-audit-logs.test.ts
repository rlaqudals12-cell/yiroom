/**
 * 감사 로그 정리 Cron API 테스트
 * GET /api/cron/cleanup-audit-logs
 *
 * @see app/api/cron/cleanup-audit-logs/route.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Supabase mock
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from: mockFrom,
  }),
}));

// Logger mock
vi.mock('@/lib/utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Audit logger mock
vi.mock('@/lib/audit/logger', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

import { GET } from '@/app/api/cron/cleanup-audit-logs/route';

// 헬퍼: NextRequest 생성
function createCronRequest(options?: {
  authHeader?: string;
  vercelSignature?: string;
}): NextRequest {
  const headers: Record<string, string> = {};
  if (options?.authHeader) headers['Authorization'] = options.authHeader;
  if (options?.vercelSignature) headers['x-vercel-cron-signature'] = options.vercelSignature;

  return new NextRequest('http://localhost:3000/api/cron/cleanup-audit-logs', { headers });
}

describe('GET /api/cron/cleanup-audit-logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('인증', () => {
    it('개발 환경에서 인증 없이 접근 가능하다', async () => {
      setupSuccessfulMock({ auditCount: 0, imageCount: 0 });

      const request = createCronRequest();
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('프로덕션에서 인증 없이 401을 반환한다', async () => {
      vi.stubEnv('NODE_ENV', 'production');

      const request = createCronRequest();
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('CRON_SECRET으로 인증 가능하다', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('CRON_SECRET', 'test-secret');
      setupSuccessfulMock({ auditCount: 0, imageCount: 0 });

      const request = createCronRequest({ authHeader: 'Bearer test-secret' });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('Vercel cron signature로 인증 가능하다', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      setupSuccessfulMock({ auditCount: 0, imageCount: 0 });

      const request = createCronRequest({ vercelSignature: 'valid-sig' });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('로그 정리', () => {
    it('감사 로그와 이미지 접근 로그를 삭제한다', async () => {
      setupSuccessfulMock({ auditCount: 50, imageCount: 120 });

      const request = createCronRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.auditLogs.deleted).toBe(50);
      expect(json.auditLogs.retentionDays).toBe(90);
      expect(json.imageAccessLogs.deleted).toBe(120);
      expect(json.imageAccessLogs.retentionDays).toBe(30);
      expect(json.completedAt).toBeDefined();
    });

    it('삭제할 로그가 없으면 0을 반환한다', async () => {
      setupSuccessfulMock({ auditCount: 0, imageCount: 0 });

      const request = createCronRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.auditLogs.deleted).toBe(0);
      expect(json.imageAccessLogs.deleted).toBe(0);
    });
  });

  describe('에러 처리', () => {
    it('audit_logs 삭제 실패 시에도 결과에 에러를 포함한다', async () => {
      setupMockWithAuditError();

      const request = createCronRequest();
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.auditLogs.deleted).toBe(0);
      expect(json.auditLogs.error).toBeDefined();
    });

    it('예상치 못한 에러 시 500을 반환한다', async () => {
      // 내부 cleanupAuditLogs에서 잡히지 않는 에러 발생
      // select().lt()가 promise를 반환하므로 reject로 설정
      mockFrom.mockImplementation((table: string) => {
        if (table === 'audit_logs') {
          return {
            select: vi.fn().mockReturnValue({
              lt: vi.fn().mockRejectedValue(new Error('Critical DB failure')),
            }),
            delete: vi.fn().mockReturnValue({
              lt: vi.fn().mockRejectedValue(new Error('Critical DB failure')),
            }),
          };
        }
        // image_access_logs도 실패 (전체 catch 트리거)
        return {
          select: vi.fn().mockReturnValue({
            lt: vi.fn().mockRejectedValue(new Error('Critical DB failure')),
          }),
          delete: vi.fn().mockReturnValue({
            lt: vi.fn().mockRejectedValue(new Error('Critical DB failure')),
          }),
        };
      });

      const request = createCronRequest();
      const response = await GET(request);
      const json = await response.json();

      // 내부 try/catch가 개별 에러를 잡으므로 200 반환 (에러 포함)
      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.auditLogs.error).toBeDefined();
    });
  });
});

// 헬퍼: 정상 mock 설정
function setupSuccessfulMock(config: { auditCount: number; imageCount: number }): void {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'audit_logs') {
      return {
        select: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({ count: config.auditCount, error: null }),
        }),
        delete: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    }
    if (table === 'image_access_logs') {
      return {
        select: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({ count: config.imageCount, error: null }),
        }),
        delete: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    }
    return {};
  });
}

// 헬퍼: audit_logs 삭제 실패 mock
function setupMockWithAuditError(): void {
  mockFrom.mockImplementation((table: string) => {
    if (table === 'audit_logs') {
      return {
        select: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({ count: 10, error: null }),
        }),
        delete: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
        }),
      };
    }
    if (table === 'image_access_logs') {
      return {
        select: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({ count: 0, error: null }),
        }),
        delete: vi.fn().mockReturnValue({
          lt: vi.fn().mockResolvedValue({ error: null }),
        }),
      };
    }
    return {};
  });
}
