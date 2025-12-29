/**
 * 운동기구 추천 API 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/smart-matching/equipment-recommend/route';
import { NextRequest } from 'next/server';

// Clerk auth 모킹
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: 'test-user-id' })),
}));

describe('POST /api/smart-matching/equipment-recommend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('equipment type', () => {
    it('운동기구 추천을 반환한다', async () => {
      const request = new NextRequest('http://localhost/api/smart-matching/equipment-recommend', {
        method: 'POST',
        body: JSON.stringify({
          type: 'equipment',
          goal: 'weight_loss',
          fitnessLevel: 'beginner',
          homeGym: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.recommendation).toBeDefined();
      expect(data.recommendation.workoutGoal).toBe('weight_loss');
      expect(data.recommendation.recommendations).toBeDefined();
    });

    it('필수 필드 누락 시 400 에러를 반환한다', async () => {
      const request = new NextRequest('http://localhost/api/smart-matching/equipment-recommend', {
        method: 'POST',
        body: JSON.stringify({
          type: 'equipment',
          goal: 'weight_loss',
          // fitnessLevel 누락
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('필수 필드');
    });

    it('유효하지 않은 목표에 400 에러를 반환한다', async () => {
      const request = new NextRequest('http://localhost/api/smart-matching/equipment-recommend', {
        method: 'POST',
        body: JSON.stringify({
          type: 'equipment',
          goal: 'invalid_goal',
          fitnessLevel: 'beginner',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('유효하지 않은 목표');
    });

    it('유효하지 않은 수준에 400 에러를 반환한다', async () => {
      const request = new NextRequest('http://localhost/api/smart-matching/equipment-recommend', {
        method: 'POST',
        body: JSON.stringify({
          type: 'equipment',
          goal: 'muscle_gain',
          fitnessLevel: 'expert', // 유효하지 않음
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('유효하지 않은 수준');
    });

    it('homeGym이 false일 때도 동작한다', async () => {
      const request = new NextRequest('http://localhost/api/smart-matching/equipment-recommend', {
        method: 'POST',
        body: JSON.stringify({
          type: 'equipment',
          goal: 'endurance',
          fitnessLevel: 'intermediate',
          homeGym: false,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recommendation.homeGym).toBe(false);
    });
  });

  describe('home_gym type', () => {
    it('홈짐 구성을 반환한다', async () => {
      const request = new NextRequest('http://localhost/api/smart-matching/equipment-recommend', {
        method: 'POST',
        body: JSON.stringify({
          type: 'home_gym',
          budget: 'intermediate',
          spaceSize: 'medium',
          goals: ['weight_loss', 'health'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.setup).toBeDefined();
      expect(data.setup.budget).toBe('intermediate');
      expect(data.setup.essentialSet).toBeDefined();
    });

    it('필수 필드 누락 시 400 에러를 반환한다', async () => {
      const request = new NextRequest('http://localhost/api/smart-matching/equipment-recommend', {
        method: 'POST',
        body: JSON.stringify({
          type: 'home_gym',
          budget: 'basic',
          // spaceSize, goals 누락
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('필수 필드');
    });

    it('빈 goals 배열에 400 에러를 반환한다', async () => {
      const request = new NextRequest('http://localhost/api/smart-matching/equipment-recommend', {
        method: 'POST',
        body: JSON.stringify({
          type: 'home_gym',
          budget: 'basic',
          spaceSize: 'small',
          goals: [],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });

    it('유효하지 않은 예산에 400 에러를 반환한다', async () => {
      const request = new NextRequest('http://localhost/api/smart-matching/equipment-recommend', {
        method: 'POST',
        body: JSON.stringify({
          type: 'home_gym',
          budget: 'super_expensive',
          spaceSize: 'large',
          goals: ['muscle_gain'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('유효하지 않은 예산');
    });

    it('유효하지 않은 공간 크기에 400 에러를 반환한다', async () => {
      const request = new NextRequest('http://localhost/api/smart-matching/equipment-recommend', {
        method: 'POST',
        body: JSON.stringify({
          type: 'home_gym',
          budget: 'advanced',
          spaceSize: 'huge',
          goals: ['flexibility'],
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('유효하지 않은 공간');
    });
  });

  describe('general', () => {
    it('유효하지 않은 type에 400 에러를 반환한다', async () => {
      const request = new NextRequest('http://localhost/api/smart-matching/equipment-recommend', {
        method: 'POST',
        body: JSON.stringify({
          type: 'invalid_type',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('type');
    });

    it('인증되지 않은 사용자에게 401 에러를 반환한다', async () => {
      const { auth } = await import('@clerk/nextjs/server');
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const request = new NextRequest('http://localhost/api/smart-matching/equipment-recommend', {
        method: 'POST',
        body: JSON.stringify({
          type: 'equipment',
          goal: 'health',
          fitnessLevel: 'beginner',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('인증');
    });
  });
});
