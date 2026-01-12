/**
 * 신체 측정 API 테스트
 * L-1-2: 키/몸무게 필수 게이트
 * L-1-3: 체지방률 입력
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Clerk auth 모킹
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

// Supabase service-role 클라이언트 모킹
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();
const mockUpsert = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from: mockFrom,
  }),
}));

// 모킹 후 라우트 동적 import
const { GET, POST } = await import('@/app/api/user/measurements/route');

describe('/api/user/measurements', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 기본 체인 설정
    mockFrom.mockReturnValue({
      select: mockSelect,
      upsert: mockUpsert,
      update: mockUpdate,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockReturnValue({
      maybeSingle: mockMaybeSingle,
      single: mockSingle,
    });
    mockUpsert.mockReturnValue({
      select: () => ({
        single: mockSingle,
      }),
    });
    mockUpdate.mockReturnValue({
      eq: () => ({
        select: () => ({
          single: mockSingle,
        }),
      }),
    });
  });

  describe('GET /api/user/measurements', () => {
    it('미인증 사용자는 401을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('측정 정보가 없으면 hasMeasurements: false를 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });
      mockMaybeSingle.mockResolvedValue({ data: null, error: null });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasMeasurements).toBe(false);
      expect(data.measurements).toBeNull();
    });

    it('키만 있고 몸무게가 없으면 hasMeasurements: false를 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });
      mockMaybeSingle.mockResolvedValue({
        data: {
          height: 175,
          weight: null,
        },
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasMeasurements).toBe(false);
    });

    it('키와 몸무게가 모두 있으면 hasMeasurements: true를 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });
      mockMaybeSingle.mockResolvedValue({
        data: {
          height: 175,
          weight: 70,
          body_type: 'mesomorph',
          chest: null,
          waist: null,
          hip: null,
          shoulder: null,
          preferred_fit: 'regular',
        },
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasMeasurements).toBe(true);
      expect(data.measurements.height).toBe(175);
      expect(data.measurements.weight).toBe(70);
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });
      mockMaybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'DB Error' },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch measurements');
    });
  });

  describe('POST /api/user/measurements', () => {
    it('미인증 사용자는 401을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest('http://localhost/api/user/measurements', {
        method: 'POST',
        body: JSON.stringify({
          height: 175,
          weight: 70,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('키가 100cm 미만이면 400을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });

      const request = new NextRequest('http://localhost/api/user/measurements', {
        method: 'POST',
        body: JSON.stringify({
          height: 99,
          weight: 70,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('키는 100~250cm 범위여야 합니다');
    });

    it('키가 250cm 초과이면 400을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });

      const request = new NextRequest('http://localhost/api/user/measurements', {
        method: 'POST',
        body: JSON.stringify({
          height: 251,
          weight: 70,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('키는 100~250cm 범위여야 합니다');
    });

    it('몸무게가 20kg 미만이면 400을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });

      const request = new NextRequest('http://localhost/api/user/measurements', {
        method: 'POST',
        body: JSON.stringify({
          height: 175,
          weight: 19,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('몸무게는 20~200kg 범위여야 합니다');
    });

    it('몸무게가 200kg 초과이면 400을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });

      const request = new NextRequest('http://localhost/api/user/measurements', {
        method: 'POST',
        body: JSON.stringify({
          height: 175,
          weight: 201,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('몸무게는 20~200kg 범위여야 합니다');
    });

    it('체지방률이 3% 미만이면 400을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });

      const request = new NextRequest('http://localhost/api/user/measurements', {
        method: 'POST',
        body: JSON.stringify({
          height: 175,
          weight: 70,
          bodyFat: 2,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('체지방률은 3~60% 범위여야 합니다');
    });

    it('체지방률이 60% 초과이면 400을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });

      const request = new NextRequest('http://localhost/api/user/measurements', {
        method: 'POST',
        body: JSON.stringify({
          height: 175,
          weight: 70,
          bodyFat: 61,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('체지방률은 3~60% 범위여야 합니다');
    });

    it('유효한 키/몸무게 저장 시 201을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });
      mockSingle.mockResolvedValue({
        data: {
          clerk_user_id: 'user_test',
          height: 175,
          weight: 70,
        },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/user/measurements', {
        method: 'POST',
        body: JSON.stringify({
          height: 175,
          weight: 70,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.measurements.height).toBe(175);
      expect(data.measurements.weight).toBe(70);
    });

    it('체지방률 포함 저장 시 201을 반환한다 (L-1-3)', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });
      mockSingle.mockResolvedValue({
        data: {
          clerk_user_id: 'user_test',
          height: 175,
          weight: 70,
          body_fat_percentage: 18,
        },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/user/measurements', {
        method: 'POST',
        body: JSON.stringify({
          height: 175,
          weight: 70,
          bodyFat: 18,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('체지방률이 null이면 저장에 포함하지 않는다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });
      mockSingle.mockResolvedValue({
        data: {
          clerk_user_id: 'user_test',
          height: 175,
          weight: 70,
        },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/user/measurements', {
        method: 'POST',
        body: JSON.stringify({
          height: 175,
          weight: 70,
          bodyFat: null,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockAuth.mockResolvedValue({ userId: 'user_test' });
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'DB Error' },
      });

      const request = new NextRequest('http://localhost/api/user/measurements', {
        method: 'POST',
        body: JSON.stringify({
          height: 175,
          weight: 70,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to save measurements');
    });
  });
});
