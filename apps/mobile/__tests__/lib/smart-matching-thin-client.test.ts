/**
 * Smart Matching thin-client 회귀 테스트
 *
 * 웹 코드를 모바일로 복제하며 들어온 public Supabase singleton은 Clerk JWT를 싣지 못한다.
 * 각 사용자 데이터 모듈이 웹 API와 Bearer 인증을 쓰고, 그 singleton으로 되돌아가지 않음을
 * 함께 고정한다.
 */

import fs from 'node:fs';
import path from 'node:path';

import { findByBarcode } from '../../lib/smart-matching/barcodes';
import { getFeedbackList } from '../../lib/smart-matching/feedback';
import { getMeasurements } from '../../lib/smart-matching/measurements';
import {
  createNotification,
  deleteNotification,
  getNotifications,
} from '../../lib/smart-matching/notifications';
import { getPreferences } from '../../lib/smart-matching/preferences';
import { getPriceWatches } from '../../lib/smart-matching/price-watches';
import { getSizeHistory } from '../../lib/smart-matching/size-history';

const mockQuery = {
  select: jest.fn(),
  eq: jest.fn(),
  order: jest.fn(),
  limit: jest.fn(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
  then: (resolve: (value: { data: null; error: null; count: number }) => unknown): unknown =>
    resolve({ data: null, error: null, count: 0 }),
};

mockQuery.select.mockReturnValue(mockQuery);
mockQuery.eq.mockReturnValue(mockQuery);
mockQuery.order.mockReturnValue(mockQuery);
mockQuery.limit.mockReturnValue(mockQuery);

const mockFrom = jest.fn(() => mockQuery);

jest.mock('../../lib/supabase/client', () => ({
  supabase: { from: mockFrom },
}));

const mockFetch = jest.fn();

function jsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

describe('Smart Matching 사용자 데이터는 인증 웹 API를 경유한다', () => {
  const originalApiUrl = process.env.EXPO_PUBLIC_YIROOM_API_URL;

  beforeAll(() => {
    process.env.EXPO_PUBLIC_YIROOM_API_URL = 'https://api.example.com';
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterAll(() => {
    if (originalApiUrl === undefined) {
      delete process.env.EXPO_PUBLIC_YIROOM_API_URL;
    } else {
      process.env.EXPO_PUBLIC_YIROOM_API_URL = originalApiUrl;
    }
  });

  beforeEach(() => {
    mockFetch.mockReset();
    mockFrom.mockClear();
  });

  it.each([
    {
      name: 'barcodes',
      path: '/api/smart-matching/barcodes',
      payload: { found: true, data: { id: 'barcode-1', barcode: '8801234567890' } },
      call: () => findByBarcode('8801234567890', 'clerk-token'),
    },
    {
      name: 'feedback',
      path: '/api/smart-matching/feedback',
      payload: [],
      call: () => getFeedbackList('user-1', undefined, 'clerk-token'),
    },
    {
      name: 'notifications',
      path: '/api/smart-matching/notifications',
      payload: { notifications: [], unreadCount: 0 },
      call: () => getNotifications('user-1', undefined, 'clerk-token'),
    },
    {
      name: 'measurements',
      path: '/api/smart-matching/measurements',
      payload: {
        clerkUserId: 'user-1',
        preferredFit: 'regular',
        createdAt: '2026-08-18T00:00:00.000Z',
        updatedAt: '2026-08-18T00:00:00.000Z',
      },
      call: () => getMeasurements('user-1', 'clerk-token'),
    },
    {
      name: 'preferences',
      path: '/api/smart-matching/preferences',
      payload: {
        clerkUserId: 'user-1',
        budget: {},
        favoriteBrands: [],
        blockedBrands: [],
        preferredPlatforms: [],
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
        createdAt: '2026-08-18T00:00:00.000Z',
        updatedAt: '2026-08-18T00:00:00.000Z',
      },
      call: () => getPreferences('user-1', 'clerk-token'),
    },
    {
      name: 'price-watches',
      path: '/api/smart-matching/price-watches',
      payload: [],
      call: () => getPriceWatches('user-1', 'clerk-token'),
    },
    {
      name: 'size-history',
      path: '/api/smart-matching/size-history',
      payload: [],
      call: () => getSizeHistory('user-1', 'clerk-token'),
    },
  ])('$name 모듈', async ({ path: apiPath, payload, call }) => {
    mockFetch.mockResolvedValueOnce(jsonResponse(payload));

    await call();

    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.example.com${apiPath}`,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer clerk-token' }),
      })
    );
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('API가 있는 7모듈에는 public Supabase singleton import가 남지 않는다', () => {
    const moduleDir = path.resolve(__dirname, '../../lib/smart-matching');
    const moduleNames = [
      'barcodes.ts',
      'feedback.ts',
      'notifications.ts',
      'measurements.ts',
      'preferences.ts',
      'price-watches.ts',
      'size-history.ts',
    ];
    const forbiddenImport = ['/lib/supabase/', 'client'].join('');

    const offenders = moduleNames.filter((name) =>
      fs.readFileSync(path.join(moduleDir, name), 'utf8').includes(forbiddenImport)
    );

    expect(offenders).toEqual([]);
  });

  it('레거시 사이즈 추천 계산기도 인증 토큰을 하위 API helper에 전달한다', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../lib/smart-matching/size-recommend.ts'),
      'utf8'
    );

    expect(source).toContain('getSizeHistoryByBrand(clerkUserId, brandId, clerkToken)');
    expect(source).toContain('getPerfectFitHistory(clerkUserId, category, clerkToken)');
    expect(source.match(/getMeasurements\(clerkUserId, clerkToken\)/g)).toHaveLength(3);
  });

  it('RLS 정책이 없는 알림 생성·삭제는 실패하는 API를 호출하지 않고 명시적으로 중단한다', async () => {
    await expect(
      createNotification(
        {
          clerkUserId: 'user-1',
          notificationType: 'price_drop',
          title: '가격 알림',
          message: '가격이 내려갔어요.',
        },
        'clerk-token'
      )
    ).rejects.toMatchObject({ status: 501, code: 'API_NOT_AVAILABLE' });
    await expect(deleteNotification('notification-1', 'clerk-token')).rejects.toMatchObject({
      status: 501,
      code: 'API_NOT_AVAILABLE',
    });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
