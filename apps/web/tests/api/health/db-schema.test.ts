/**
 * DB 스키마 헬스체크 API 테스트
 *
 * 보안: 미인증 호출은 전체 상태만 받고 내부 테이블·컬럼·마이그레이션명은 가린다.
 * 인증(CRON_SECRET/관리자) 시에만 상세를 반환한다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// service-role 클라이언트 모킹: 필수 테이블이 전부 누락된 것처럼 응답
vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from: (table: string) => {
      if (table === 'information_schema.tables') {
        return {
          select: () => ({
            eq: () => ({
              // data: [] → 존재 테이블 없음 → REQUIRED_TABLES 전부 누락으로 계산
              in: () => Promise.resolve({ data: [], error: null }),
            }),
          }),
        };
      }
      return { select: () => ({ limit: () => Promise.resolve({ error: null }) }) };
    },
  }),
}));

vi.mock('@/lib/admin/auth', () => ({ isAdmin: vi.fn() }));

import { GET } from '@/app/api/health/db-schema/route';
import { isAdmin } from '@/lib/admin/auth';
import { NextRequest } from 'next/server';

describe('GET /api/health/db-schema', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
  });

  it('미인증 호출은 상태만 주고 스키마 상세를 가린다', async () => {
    vi.mocked(isAdmin).mockResolvedValue(false);

    const req = new NextRequest('http://localhost/api/health/db-schema');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    // 전체 상태(error)는 노출하되(집계용) 상세 이름 목록은 가린다
    expect(data.status).toBe('error');
    expect(data.missingTables).toEqual([]);
    expect(data.missingColumns).toEqual([]);
    expect(data.message).toContain('인증');
  });

  it('관리자는 상세(테이블 목록)를 받는다', async () => {
    vi.mocked(isAdmin).mockResolvedValue(true);

    const req = new NextRequest('http://localhost/api/health/db-schema');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.missingTables.length).toBeGreaterThan(0);
    expect(data.message).toContain('테이블 누락');
  });

  it('CRON_SECRET Bearer 토큰으로도 상세를 받는다', async () => {
    process.env.CRON_SECRET = 'cron-secret';
    vi.mocked(isAdmin).mockResolvedValue(false);

    const req = new NextRequest('http://localhost/api/health/db-schema', {
      headers: { authorization: 'Bearer cron-secret' },
    });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.missingTables.length).toBeGreaterThan(0);
  });

  it('잘못된 Bearer 토큰은 미인증으로 취급한다', async () => {
    process.env.CRON_SECRET = 'cron-secret';
    vi.mocked(isAdmin).mockResolvedValue(false);

    const req = new NextRequest('http://localhost/api/health/db-schema', {
      headers: { authorization: 'Bearer wrong' },
    });
    const res = await GET(req);
    const data = await res.json();

    expect(data.missingTables).toEqual([]);
    expect(data.message).toContain('인증');
  });
});
