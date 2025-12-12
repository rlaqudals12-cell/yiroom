/**
 * N-1 Task 1.20: 영양 설정 API 라우트 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET, PATCH } from '@/app/api/nutrition/settings/route';

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

describe('Nutrition Settings API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/nutrition/settings', () => {
    const validRequestBody = {
      goal: 'weight_loss',
      bmr: 1500,
      tdee: 2000,
      dailyCalorieTarget: 1500,
      activityLevel: 'moderate',
      mealStyle: 'korean',
      cookingSkill: 'intermediate',
      budget: 'moderate',
      allergies: ['dairy'],
      dislikedFoods: ['간'],
      mealCount: 3,
      proteinTarget: 88,
      carbsTarget: 150,
      fatTarget: 55,
    };

    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const request = new Request('http://localhost/api/nutrition/settings', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 400 when required fields are missing', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const request = new Request('http://localhost/api/nutrition/settings', {
        method: 'POST',
        body: JSON.stringify({ goal: 'weight_loss' }), // Missing bmr, tdee, etc.
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('saves settings successfully', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const mockData = { id: '1', ...validRequestBody };
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);

      const request = new Request('http://localhost/api/nutrition/settings', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockData);
    });

    it('handles database error', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
      };
      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);

      const request = new Request('http://localhost/api/nutrition/settings', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to save nutrition settings');
    });
  });

  describe('GET /api/nutrition/settings', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns settings when user has settings', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const mockSettings = {
        id: '1',
        clerk_user_id: 'user_123',
        goal: 'weight_loss',
        bmr: 1500,
      };
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSettings, error: null }),
      };
      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.hasSettings).toBe(true);
      expect(data.data).toEqual(mockSettings);
    });

    it('returns null when user has no settings', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      };
      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.hasSettings).toBe(false);
      expect(data.data).toBeNull();
    });
  });

  describe('PATCH /api/nutrition/settings (Task 2.16: 간헐적 단식)', () => {
    const validFastingBody = {
      fasting_enabled: true,
      fasting_type: '16:8',
      fasting_start_time: '20:00',
      eating_window_hours: 8,
    };

    it('returns 401 when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const request = new Request('http://localhost/api/nutrition/settings', {
        method: 'PATCH',
        body: JSON.stringify(validFastingBody),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 400 when no fields to update', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const request = new Request('http://localhost/api/nutrition/settings', {
        method: 'PATCH',
        body: JSON.stringify({}),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No fields to update');
    });

    it('updates fasting settings successfully', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const mockUpdatedData = {
        id: '1',
        clerk_user_id: 'user_123',
        ...validFastingBody,
      };
      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedData, error: null }),
      };
      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);

      const request = new Request('http://localhost/api/nutrition/settings', {
        method: 'PATCH',
        body: JSON.stringify(validFastingBody),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.fasting_enabled).toBe(true);
      expect(data.data.fasting_type).toBe('16:8');
    });

    it('returns 404 when user has no settings to update', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);

      const request = new Request('http://localhost/api/nutrition/settings', {
        method: 'PATCH',
        body: JSON.stringify(validFastingBody),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });

    it('handles database error', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
      };
      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);

      const request = new Request('http://localhost/api/nutrition/settings', {
        method: 'PATCH',
        body: JSON.stringify(validFastingBody),
      });

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update nutrition settings');
    });

    it('updates only provided fields', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: 'user_123' } as ReturnType<typeof auth> extends Promise<infer T> ? T : never);

      const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { fasting_enabled: false }, error: null }),
      };
      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);

      const request = new Request('http://localhost/api/nutrition/settings', {
        method: 'PATCH',
        body: JSON.stringify({ fasting_enabled: false }), // 단일 필드만 업데이트
      });

      const response = await PATCH(request);
      await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabase.update).toHaveBeenCalledWith({ fasting_enabled: false });
    });
  });
});
