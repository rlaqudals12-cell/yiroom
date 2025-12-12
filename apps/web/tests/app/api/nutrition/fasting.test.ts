/**
 * N-1 Task 2.18: 간헐적 단식 API 테스트
 *
 * 엔드포인트: /api/nutrition/fasting
 * - GET: 활성 단식 세션 및 히스토리 조회
 * - POST: 새 단식 세션 시작
 * - PATCH: 단식 세션 완료/업데이트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PATCH } from '@/app/api/nutrition/fasting/route';

// Clerk auth mock
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Supabase mock
vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

describe('Fasting API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========================================
  // GET: 단식 기록 조회
  // ========================================
  describe('GET /api/nutrition/fasting', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        userId: null,
      } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const request = new Request('http://localhost/api/nutrition/fasting');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns active fasting session', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        userId: 'user_123',
      } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const mockActiveSession = {
        id: 'fasting_1',
        clerk_user_id: 'user_123',
        start_time: '2025-12-02T20:00:00Z',
        end_time: null,
        target_hours: 16,
        actual_hours: null,
        is_completed: false,
        notes: null,
        created_at: '2025-12-02T20:00:00Z',
      };

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockActiveSession, error: null }),
      };
      vi.mocked(createServiceRoleClient).mockReturnValue(
        mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>
      );

      const request = new Request('http://localhost/api/nutrition/fasting');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.activeSession).toEqual(mockActiveSession);
    });

    it('returns history when requested', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        userId: 'user_123',
      } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const mockHistory = [
        {
          id: 'fasting_2',
          clerk_user_id: 'user_123',
          start_time: '2025-12-01T20:00:00Z',
          end_time: '2025-12-02T12:00:00Z',
          target_hours: 16,
          actual_hours: 16.0,
          is_completed: true,
          notes: null,
          created_at: '2025-12-01T20:00:00Z',
        },
      ];

      // 첫 번째 쿼리: active session (없음)
      const mockSingleQuery = vi.fn().mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // 두 번째 쿼리: history
      const mockSelectQuery = vi.fn()
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          single: mockSingleQuery
        })
        .mockReturnValueOnce({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: mockHistory, error: null }),
        });

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: mockSelectQuery,
      };
      vi.mocked(createServiceRoleClient).mockReturnValue(
        mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>
      );

      const request = new Request(
        'http://localhost/api/nutrition/fasting?includeHistory=true&historyLimit=10'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.history).toBeDefined();
    });
  });

  // ========================================
  // POST: 단식 세션 시작
  // ========================================
  describe('POST /api/nutrition/fasting', () => {
    const validRequestBody = {
      targetHours: 16,
      notes: '16:8 단식 시작',
    };

    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        userId: null,
      } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const request = new Request('http://localhost/api/nutrition/fasting', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 400 when targetHours is missing', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        userId: 'user_123',
      } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const request = new Request('http://localhost/api/nutrition/fasting', {
        method: 'POST',
        body: JSON.stringify({ notes: 'test' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('targetHours is required');
    });

    it('returns 400 when targetHours is invalid', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        userId: 'user_123',
      } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const request = new Request('http://localhost/api/nutrition/fasting', {
        method: 'POST',
        body: JSON.stringify({ targetHours: 30 }), // 최대 24시간
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('targetHours');
    });

    it('returns 409 when active session already exists', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        userId: 'user_123',
      } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: 'existing_session' },
          error: null,
        }),
      };
      vi.mocked(createServiceRoleClient).mockReturnValue(
        mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>
      );

      const request = new Request('http://localhost/api/nutrition/fasting', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('Active fasting session already exists');
    });

    it('creates new fasting session successfully', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        userId: 'user_123',
      } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const mockNewSession = {
        id: 'fasting_new',
        clerk_user_id: 'user_123',
        start_time: '2025-12-02T20:00:00Z',
        end_time: null,
        target_hours: 16,
        actual_hours: null,
        is_completed: false,
        notes: '16:8 단식 시작',
        created_at: '2025-12-02T20:00:00Z',
      };

      // 첫 번째: 활성 세션 체크 (없음)
      const mockCheckQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };

      // 두 번째: insert
      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockNewSession, error: null }),
      };

      let callCount = 0;
      const mockSupabase = {
        from: vi.fn().mockImplementation(() => {
          callCount++;
          return callCount === 1 ? mockCheckQuery : mockInsertQuery;
        }),
      };
      vi.mocked(createServiceRoleClient).mockReturnValue(
        mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>
      );

      const request = new Request('http://localhost/api/nutrition/fasting', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockNewSession);
    });
  });

  // ========================================
  // PATCH: 단식 세션 완료/업데이트
  // ========================================
  describe('PATCH /api/nutrition/fasting', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        userId: null,
      } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const request = new Request('http://localhost/api/nutrition/fasting', {
        method: 'PATCH',
        body: JSON.stringify({ id: 'fasting_1', isCompleted: true }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 400 when id is missing', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        userId: 'user_123',
      } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const request = new Request('http://localhost/api/nutrition/fasting', {
        method: 'PATCH',
        body: JSON.stringify({ isCompleted: true }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('id is required');
    });

    it('completes fasting session with actual hours', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        userId: 'user_123',
      } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const mockUpdatedSession = {
        id: 'fasting_1',
        clerk_user_id: 'user_123',
        start_time: '2025-12-02T20:00:00Z',
        end_time: '2025-12-03T12:00:00Z',
        target_hours: 16,
        actual_hours: 16.0,
        is_completed: true,
        notes: null,
        created_at: '2025-12-02T20:00:00Z',
      };

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedSession, error: null }),
      };
      vi.mocked(createServiceRoleClient).mockReturnValue(
        mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>
      );

      const request = new Request('http://localhost/api/nutrition/fasting', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'fasting_1',
          isCompleted: true,
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.is_completed).toBe(true);
      expect(data.data.actual_hours).toBe(16.0);
    });

    it('updates notes on fasting session', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        userId: 'user_123',
      } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const mockUpdatedSession = {
        id: 'fasting_1',
        clerk_user_id: 'user_123',
        start_time: '2025-12-02T20:00:00Z',
        end_time: null,
        target_hours: 16,
        actual_hours: null,
        is_completed: false,
        notes: '조금 힘들지만 괜찮아!',
        created_at: '2025-12-02T20:00:00Z',
      };

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedSession, error: null }),
      };
      vi.mocked(createServiceRoleClient).mockReturnValue(
        mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>
      );

      const request = new Request('http://localhost/api/nutrition/fasting', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'fasting_1',
          notes: '조금 힘들지만 괜찮아!',
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.notes).toBe('조금 힘들지만 괜찮아!');
    });

    it('returns 404 when fasting session not found', async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        userId: 'user_123',
      } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      };
      vi.mocked(createServiceRoleClient).mockReturnValue(
        mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>
      );

      const request = new Request('http://localhost/api/nutrition/fasting', {
        method: 'PATCH',
        body: JSON.stringify({
          id: 'non_existent',
          isCompleted: true,
        }),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });
  });
});
