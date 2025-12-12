/**
 * N-1 수분 섭취 API 테스트
 * Task 2.10: 수분 섭취 API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock 모듈 설정
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(),
}));

import { GET, POST } from '@/app/api/nutrition/water/route';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

// Mock 요청 헬퍼
function createMockGetRequest(date?: string): Request {
  const url = date
    ? `http://localhost/api/nutrition/water?date=${date}`
    : 'http://localhost/api/nutrition/water';
  return {
    url,
    json: () => Promise.resolve({}),
  } as Request;
}

function createMockPostRequest(body: unknown): Request {
  return {
    url: 'http://localhost/api/nutrition/water',
    json: () => Promise.resolve(body),
  } as Request;
}

// Mock 데이터
const mockWaterRecords = [
  {
    id: 'water-1',
    clerk_user_id: 'user_test123',
    record_date: '2025-12-02',
    record_time: '09:00',
    drink_type: 'water',
    amount_ml: 250,
    hydration_factor: 1.0,
    effective_ml: 250,
    created_at: '2025-12-02T09:00:00Z',
  },
  {
    id: 'water-2',
    clerk_user_id: 'user_test123',
    record_date: '2025-12-02',
    record_time: '11:00',
    drink_type: 'coffee',
    amount_ml: 300,
    hydration_factor: 0.8,
    effective_ml: 240,
    created_at: '2025-12-02T11:00:00Z',
  },
  {
    id: 'water-3',
    clerk_user_id: 'user_test123',
    record_date: '2025-12-02',
    record_time: '14:00',
    drink_type: 'water',
    amount_ml: 500,
    hydration_factor: 1.0,
    effective_ml: 500,
    created_at: '2025-12-02T14:00:00Z',
  },
];

describe('GET /api/nutrition/water', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as Awaited<
      ReturnType<typeof auth>
    >);
    vi.mocked(createServiceRoleClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>
    );
  });

  describe('인증', () => {
    it('인증되지 않은 사용자에게 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<
        ReturnType<typeof auth>
      >);

      const response = await GET(createMockGetRequest());
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('날짜 파라미터', () => {
    it('날짜 파라미터가 없으면 오늘 날짜를 사용한다', async () => {
      mockSupabase.order.mockResolvedValue({ data: [], error: null });

      const response = await GET(createMockGetRequest());
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('유효하지 않은 날짜 형식이면 400을 반환한다', async () => {
      const response = await GET(createMockGetRequest('invalid-date'));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid date format');
    });

    it('YYYY-MM-DD 형식의 날짜를 올바르게 처리한다', async () => {
      mockSupabase.order.mockResolvedValue({ data: [], error: null });

      const response = await GET(createMockGetRequest('2025-12-01'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.date).toBe('2025-12-01');
    });
  });

  describe('데이터 조회', () => {
    it('수분 기록을 올바르게 반환한다', async () => {
      mockSupabase.order.mockResolvedValue({ data: mockWaterRecords, error: null });

      const response = await GET(createMockGetRequest('2025-12-02'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.records).toHaveLength(3);
      expect(data.totalAmountMl).toBe(1050); // 250 + 300 + 500
      expect(data.totalEffectiveMl).toBe(990); // 250 + 240 + 500
      expect(data.recordCount).toBe(3);
    });

    it('음료 타입별 합계를 올바르게 계산한다', async () => {
      mockSupabase.order.mockResolvedValue({ data: mockWaterRecords, error: null });

      const response = await GET(createMockGetRequest('2025-12-02'));
      const data = await response.json();

      expect(data.byDrinkType.water.amountMl).toBe(750); // 250 + 500
      expect(data.byDrinkType.water.effectiveMl).toBe(750);
      expect(data.byDrinkType.coffee.amountMl).toBe(300);
      expect(data.byDrinkType.coffee.effectiveMl).toBe(240);
    });

    it('기록이 없으면 빈 배열을 반환한다', async () => {
      mockSupabase.order.mockResolvedValue({ data: [], error: null });

      const response = await GET(createMockGetRequest('2025-12-02'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.records).toHaveLength(0);
      expect(data.totalAmountMl).toBe(0);
      expect(data.totalEffectiveMl).toBe(0);
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const response = await GET(createMockGetRequest('2025-12-02'));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch water records');
    });
  });
});

describe('POST /api/nutrition/water', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as Awaited<
      ReturnType<typeof auth>
    >);
    vi.mocked(createServiceRoleClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>
    );
  });

  describe('인증', () => {
    it('인증되지 않은 사용자에게 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<
        ReturnType<typeof auth>
      >);

      const response = await POST(
        createMockPostRequest({ drinkType: 'water', amountMl: 250 })
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('입력 검증', () => {
    it('amountMl이 없으면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({ drinkType: 'water' }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid amountMl');
    });

    it('amountMl이 0 이하이면 400을 반환한다', async () => {
      const response = await POST(
        createMockPostRequest({ drinkType: 'water', amountMl: 0 })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid amountMl');
    });

    it('amountMl이 5000을 초과하면 400을 반환한다', async () => {
      const response = await POST(
        createMockPostRequest({ drinkType: 'water', amountMl: 6000 })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('cannot exceed 5000ml');
    });

    it('유효하지 않은 drinkType이면 400을 반환한다', async () => {
      const response = await POST(
        createMockPostRequest({ drinkType: 'invalid', amountMl: 250 })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid drinkType');
    });

    it('유효하지 않은 recordTime 형식이면 400을 반환한다', async () => {
      const response = await POST(
        createMockPostRequest({
          drinkType: 'water',
          amountMl: 250,
          recordTime: 'invalid',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid recordTime format');
    });
  });

  describe('수분 기록 저장', () => {
    it('물 기록을 올바르게 저장한다', async () => {
      const mockRecord = {
        id: 'water-new',
        clerk_user_id: 'user_test123',
        record_date: '2025-12-02',
        record_time: '10:00',
        drink_type: 'water',
        amount_ml: 250,
        hydration_factor: 1.0,
        effective_ml: 250,
        created_at: '2025-12-02T10:00:00Z',
      };
      mockSupabase.single.mockResolvedValue({ data: mockRecord, error: null });

      const response = await POST(
        createMockPostRequest({ drinkType: 'water', amountMl: 250 })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.record.drinkType).toBe('water');
      expect(data.record.amountMl).toBe(250);
      expect(data.record.effectiveMl).toBe(250);
    });

    it('커피 기록 시 수분 흡수율을 올바르게 적용한다', async () => {
      const mockRecord = {
        id: 'water-coffee',
        clerk_user_id: 'user_test123',
        record_date: '2025-12-02',
        record_time: '11:00',
        drink_type: 'coffee',
        amount_ml: 300,
        hydration_factor: 0.8,
        effective_ml: 240, // 300 * 0.8
        created_at: '2025-12-02T11:00:00Z',
      };
      mockSupabase.single.mockResolvedValue({ data: mockRecord, error: null });

      const response = await POST(
        createMockPostRequest({ drinkType: 'coffee', amountMl: 300 })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.record.hydrationFactor).toBe(0.8);
      expect(data.record.effectiveMl).toBe(240);
    });

    it('drinkType이 없으면 water를 기본값으로 사용한다', async () => {
      const mockRecord = {
        id: 'water-default',
        clerk_user_id: 'user_test123',
        record_date: '2025-12-02',
        record_time: '12:00',
        drink_type: 'water',
        amount_ml: 500,
        hydration_factor: 1.0,
        effective_ml: 500,
        created_at: '2025-12-02T12:00:00Z',
      };
      mockSupabase.single.mockResolvedValue({ data: mockRecord, error: null });

      const response = await POST(createMockPostRequest({ amountMl: 500 }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.record.drinkType).toBe('water');
    });

    it('recordTime을 올바르게 처리한다', async () => {
      const mockRecord = {
        id: 'water-time',
        clerk_user_id: 'user_test123',
        record_date: '2025-12-02',
        record_time: '14:30',
        drink_type: 'water',
        amount_ml: 250,
        hydration_factor: 1.0,
        effective_ml: 250,
        created_at: '2025-12-02T14:30:00Z',
      };
      mockSupabase.single.mockResolvedValue({ data: mockRecord, error: null });

      const response = await POST(
        createMockPostRequest({
          drinkType: 'water',
          amountMl: 250,
          recordTime: '14:30',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.record.recordTime).toBe('14:30');
    });

    it('DB 저장 실패 시 500을 반환한다', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const response = await POST(
        createMockPostRequest({ drinkType: 'water', amountMl: 250 })
      );
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to save water record');
    });
  });

  describe('음료별 수분 흡수율', () => {
    const testCases = [
      { drinkType: 'water', factor: 1.0 },
      { drinkType: 'tea', factor: 0.9 },
      { drinkType: 'coffee', factor: 0.8 },
      { drinkType: 'juice', factor: 0.7 },
      { drinkType: 'soda', factor: 0.6 },
      { drinkType: 'other', factor: 0.8 },
    ];

    testCases.forEach(({ drinkType, factor }) => {
      it(`${drinkType}의 수분 흡수율은 ${factor}이다`, async () => {
        const amountMl = 1000;
        const expectedEffective = Math.round(amountMl * factor);

        const mockRecord = {
          id: `water-${drinkType}`,
          clerk_user_id: 'user_test123',
          record_date: '2025-12-02',
          record_time: '10:00',
          drink_type: drinkType,
          amount_ml: amountMl,
          hydration_factor: factor,
          effective_ml: expectedEffective,
          created_at: '2025-12-02T10:00:00Z',
        };
        mockSupabase.single.mockResolvedValue({ data: mockRecord, error: null });

        const response = await POST(
          createMockPostRequest({ drinkType, amountMl })
        );
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.record.hydrationFactor).toBe(factor);
        expect(data.record.effectiveMl).toBe(expectedEffective);
      });
    });
  });
});
