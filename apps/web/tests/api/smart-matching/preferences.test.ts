/**
 * 사용자 설정 API 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT } from '@/app/api/smart-matching/preferences/route';
import { NextRequest } from 'next/server';
import type { UserPreferences } from '@/types/smart-matching';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-user-id' }),
}));

vi.mock('@/lib/smart-matching', () => ({
  getPreferences: vi.fn(),
  upsertPreferences: vi.fn(),
}));

import { getPreferences, upsertPreferences } from '@/lib/smart-matching';

describe('GET /api/smart-matching/preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('사용자 설정을 조회한다', async () => {
    vi.mocked(getPreferences).mockResolvedValue({
      clerkUserId: 'test-user-id',
      budget: { clothing: { max: 100000 } },
      favoriteBrands: ['Nike', 'Adidas'],
      blockedBrands: [],
      preferredPlatforms: ['coupang'],
      prioritizeFreeDelivery: true,
      prioritizeFastDelivery: false,
      prioritizePoints: false,
      showAlternatives: true,
      showPriceComparison: true,
      notifyPriceDrop: true,
      notifyRestock: true,
      notificationEmail: true,
      notificationPush: true,
      notificationFrequency: 'daily',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.favoriteBrands).toContain('Nike');
    expect(data.prioritizeFreeDelivery).toBe(true);
  });

  it('설정이 없으면 기본값을 반환한다', async () => {
    vi.mocked(getPreferences).mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.prioritizeFreeDelivery).toBe(true);
    expect(data.notificationFrequency).toBe('daily');
    expect(data.favoriteBrands).toEqual([]);
  });
});

describe('PUT /api/smart-matching/preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('사용자 설정을 업데이트한다', async () => {
    const updatedPreferences: UserPreferences = {
      clerkUserId: 'test-user-id',
      budget: { clothing: { max: 200000 } },
      favoriteBrands: ['Nike'],
      blockedBrands: ['Test'],
      preferredPlatforms: ['coupang', 'naver'],
      prioritizeFreeDelivery: true,
      prioritizeFastDelivery: true,
      prioritizePoints: false,
      showAlternatives: true,
      showPriceComparison: true,
      notifyPriceDrop: true,
      notifyRestock: false,
      notificationEmail: true,
      notificationPush: false,
      notificationFrequency: 'weekly',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(upsertPreferences).mockResolvedValue(updatedPreferences);

    const request = new NextRequest('http://localhost/api/smart-matching/preferences', {
      method: 'PUT',
      body: JSON.stringify({
        budget: { clothing: { max: 200000 } },
        favoriteBrands: ['Nike'],
        blockedBrands: ['Test'],
        prioritizeFastDelivery: true,
        notifyRestock: false,
        notificationPush: false,
        notificationFrequency: 'weekly',
      }),
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.budget.clothing.max).toBe(200000);
    expect(data.notificationFrequency).toBe('weekly');
  });

  it('저장 실패 시 500 에러를 반환한다', async () => {
    vi.mocked(upsertPreferences).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/smart-matching/preferences', {
      method: 'PUT',
      body: JSON.stringify({
        favoriteBrands: ['Nike'],
      }),
    });

    const response = await PUT(request);

    expect(response.status).toBe(500);
  });
});
