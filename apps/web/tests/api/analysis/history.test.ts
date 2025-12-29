/**
 * 분석 이력 API 테스트
 * GET /api/analysis/history
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/analysis/history/route';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock Supabase - 체이닝 지원
const mockLimit = vi.fn();
const mockGte = vi.fn();
const mockSupabase = {
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: mockLimit,
  gte: mockGte,
};

// 체이닝 설정
mockSupabase.from.mockReturnValue(mockSupabase);
mockSupabase.select.mockReturnValue(mockSupabase);
mockSupabase.eq.mockReturnValue(mockSupabase);
mockSupabase.order.mockReturnValue(mockSupabase);
mockGte.mockReturnValue(mockSupabase);

// 쿼리 결과를 설정하는 함수
function setupQueryResult(data: unknown[] | null, error: unknown = null) {
  // limit이 마지막에 호출되므로 limit에서 결과 반환
  mockLimit.mockResolvedValueOnce({ data, error });
}

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => mockSupabase,
}));

import { auth } from '@clerk/nextjs/server';

// 헬퍼 함수
function createRequest(url: string): Request {
  return new Request(url);
}

describe('Analysis History API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);
  });

  describe('GET /api/analysis/history', () => {
    it('비인증 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = createRequest('http://localhost/api/analysis/history?type=skin');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('type 파라미터 누락 시 400을 반환한다', async () => {
      const request = createRequest('http://localhost/api/analysis/history');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid type');
    });

    it('잘못된 type 파라미터는 400을 반환한다', async () => {
      const request = createRequest('http://localhost/api/analysis/history?type=invalid');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('피부 분석 이력을 조회한다', async () => {
      const mockSkinData = [
        {
          id: 'skin-1',
          created_at: '2025-01-15T10:00:00Z',
          image_url: 'https://example.com/image1.jpg',
          overall_score: 78,
          skin_type: 'combination',
          hydration: 70,
          oil_level: 50,
          pores: 60,
          pigmentation: 40,
          wrinkles: 30,
          sensitivity: 45,
        },
        {
          id: 'skin-2',
          created_at: '2025-01-01T10:00:00Z',
          image_url: 'https://example.com/image2.jpg',
          overall_score: 72,
          skin_type: 'combination',
          hydration: 65,
          oil_level: 55,
          pores: 55,
          pigmentation: 42,
          wrinkles: 32,
          sensitivity: 48,
        },
      ];

      setupQueryResult(mockSkinData);

      const request = createRequest('http://localhost/api/analysis/history?type=skin');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.analyses).toHaveLength(2);
      expect(data.analyses[0].type).toBe('skin');
      expect(data.analyses[0].overallScore).toBe(78);
      expect(data.trend).toBe('improving'); // 78 - 72 = 6 > 2
    });

    it('체형 분석 이력을 조회한다', async () => {
      const mockBodyData = [
        {
          id: 'body-1',
          created_at: '2025-01-15T10:00:00Z',
          image_url: 'https://example.com/body1.jpg',
          body_type: 'S',
          height: 170,
          weight: 65,
          shoulder: 75,
          waist: 70,
          hip: 72,
          ratio: 0.8,
        },
      ];

      setupQueryResult(mockBodyData);

      const request = createRequest('http://localhost/api/analysis/history?type=body');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.analyses).toHaveLength(1);
      expect(data.analyses[0].type).toBe('body');
      expect(data.analyses[0].details.bodyType).toBe('S');
    });

    it('퍼스널 컬러 분석 이력을 조회한다', async () => {
      const mockPCData = [
        {
          id: 'pc-1',
          created_at: '2025-01-15T10:00:00Z',
          face_image_url: 'https://example.com/face1.jpg',
          season: 'Spring',
          undertone: 'Warm',
          confidence: 85,
        },
      ];

      setupQueryResult(mockPCData);

      const request = createRequest('http://localhost/api/analysis/history?type=personal-color');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.analyses).toHaveLength(1);
      expect(data.analyses[0].type).toBe('personal-color');
      expect(data.analyses[0].details.season).toBe('Spring');
    });

    it('limit 파라미터가 적용된다', async () => {
      setupQueryResult([]);

      const request = createRequest('http://localhost/api/analysis/history?type=skin&limit=5');
      await GET(request);

      expect(mockSupabase.limit).toHaveBeenCalledWith(5);
    });

    it('limit은 최대 50으로 제한된다', async () => {
      setupQueryResult([]);

      const request = createRequest('http://localhost/api/analysis/history?type=skin&limit=100');
      await GET(request);

      expect(mockSupabase.limit).toHaveBeenCalledWith(50);
    });

    it('period 파라미터가 적용된다', async () => {
      setupQueryResult([]);

      const request = createRequest('http://localhost/api/analysis/history?type=skin&period=1m');
      await GET(request);

      // gte가 호출되어야 함 (30일 전 날짜)
      expect(mockSupabase.gte).toHaveBeenCalled();
    });

    it('트렌드가 declining으로 계산된다', async () => {
      const mockData = [
        { id: '1', created_at: '2025-01-15', overall_score: 70, skin_type: 'dry', hydration: 0, oil_level: 0, pores: 0, pigmentation: 0, wrinkles: 0, sensitivity: 0 },
        { id: '2', created_at: '2025-01-01', overall_score: 78, skin_type: 'dry', hydration: 0, oil_level: 0, pores: 0, pigmentation: 0, wrinkles: 0, sensitivity: 0 },
      ];

      setupQueryResult(mockData);

      const request = createRequest('http://localhost/api/analysis/history?type=skin');
      const response = await GET(request);

      const data = await response.json();
      expect(data.trend).toBe('declining'); // 70 - 78 = -8 < -2
    });

    it('트렌드가 stable로 계산된다', async () => {
      const mockData = [
        { id: '1', created_at: '2025-01-15', overall_score: 75, skin_type: 'dry', hydration: 0, oil_level: 0, pores: 0, pigmentation: 0, wrinkles: 0, sensitivity: 0 },
        { id: '2', created_at: '2025-01-01', overall_score: 74, skin_type: 'dry', hydration: 0, oil_level: 0, pores: 0, pigmentation: 0, wrinkles: 0, sensitivity: 0 },
      ];

      setupQueryResult(mockData);

      const request = createRequest('http://localhost/api/analysis/history?type=skin');
      const response = await GET(request);

      const data = await response.json();
      expect(data.trend).toBe('stable'); // 75 - 74 = 1, -2 <= 1 <= 2
    });

    it('빈 결과를 처리한다', async () => {
      setupQueryResult([]);

      const request = createRequest('http://localhost/api/analysis/history?type=skin');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.analyses).toHaveLength(0);
      expect(data.trend).toBe('stable');
      expect(data.totalCount).toBe(0);
    });
  });
});
