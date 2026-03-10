/**
 * T2-MOD-4: 관리자 신고 API 라우트 테스트
 * GET/PATCH /api/admin/reports
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

// Mock Supabase Service Role
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ userId: 'admin_1' });

  // 체이닝 설정
  const chain = {
    select: mockSelect,
    update: mockUpdate,
    eq: mockEq,
    order: mockOrder,
    limit: mockLimit,
  };

  mockFrom.mockReturnValue(chain);
  mockSelect.mockReturnValue(chain);
  mockUpdate.mockReturnValue(chain);
  mockEq.mockReturnValue(chain);
  mockOrder.mockReturnValue(chain);
});

describe('GET /api/admin/reports', () => {
  it('should return reports filtered by status', async () => {
    const mockReports = [
      { id: 'report_1', status: 'pending', reason: 'spam' },
      { id: 'report_2', status: 'pending', reason: 'harassment' },
    ];
    mockLimit.mockResolvedValue({ data: mockReports, error: null });

    const { GET } = await import('@/app/api/admin/reports/route');
    const request = new NextRequest('http://localhost/api/admin/reports?status=pending');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toEqual(mockReports);
    expect(mockFrom).toHaveBeenCalledWith('feed_reports');
    expect(mockEq).toHaveBeenCalledWith('status', 'pending');
  });

  it('should default to pending status', async () => {
    mockLimit.mockResolvedValue({ data: [], error: null });

    const { GET } = await import('@/app/api/admin/reports/route');
    const request = new NextRequest('http://localhost/api/admin/reports');
    await GET(request);

    expect(mockEq).toHaveBeenCalledWith('status', 'pending');
  });

  it('should return 400 for invalid status', async () => {
    const { GET } = await import('@/app/api/admin/reports/route');
    const request = new NextRequest('http://localhost/api/admin/reports?status=invalid');
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('should return 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const { GET } = await import('@/app/api/admin/reports/route');
    const request = new NextRequest('http://localhost/api/admin/reports');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });
});

describe('PATCH /api/admin/reports', () => {
  it('should update report status', async () => {
    mockEq.mockResolvedValue({ error: null });

    const { PATCH } = await import('@/app/api/admin/reports/route');
    const request = new NextRequest('http://localhost/api/admin/reports', {
      method: 'PATCH',
      body: JSON.stringify({ reportId: 'report_1', status: 'resolved' }),
    });
    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'resolved',
        reviewed_by: 'admin_1',
      })
    );
  });

  it('should return 400 when reportId missing', async () => {
    const { PATCH } = await import('@/app/api/admin/reports/route');
    const request = new NextRequest('http://localhost/api/admin/reports', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'resolved' }),
    });
    const response = await PATCH(request);

    expect(response.status).toBe(400);
  });

  it('should return 400 for invalid status', async () => {
    const { PATCH } = await import('@/app/api/admin/reports/route');
    const request = new NextRequest('http://localhost/api/admin/reports', {
      method: 'PATCH',
      body: JSON.stringify({ reportId: 'report_1', status: 'invalid' }),
    });
    const response = await PATCH(request);

    expect(response.status).toBe(400);
  });

  it('should return 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const { PATCH } = await import('@/app/api/admin/reports/route');
    const request = new NextRequest('http://localhost/api/admin/reports', {
      method: 'PATCH',
      body: JSON.stringify({ reportId: 'report_1', status: 'resolved' }),
    });
    const response = await PATCH(request);

    expect(response.status).toBe(401);
  });
});
