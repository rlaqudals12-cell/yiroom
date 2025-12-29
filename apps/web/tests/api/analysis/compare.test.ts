/**
 * 분석 비교 API 테스트
 * GET /api/analysis/compare
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/analysis/compare/route';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock Supabase - 체이닝 지원
const mockSingle = vi.fn();
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: mockSingle,
};

vi.mock('@/lib/supabase/server', () => ({
  createClerkSupabaseClient: () => mockSupabase,
}));

import { auth } from '@clerk/nextjs/server';

// 헬퍼 함수
function createRequest(url: string): Request {
  return new Request(url);
}

describe('Analysis Compare API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user-123' } as never);
  });

  describe('GET /api/analysis/compare', () => {
    it('비인증 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValueOnce({ userId: null } as never);

      const request = createRequest(
        'http://localhost/api/analysis/compare?type=skin&from=uuid1&to=uuid2'
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('type 파라미터 누락 시 400을 반환한다', async () => {
      const request = createRequest(
        'http://localhost/api/analysis/compare?from=uuid1&to=uuid2'
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid type');
    });

    it('from 파라미터 누락 시 400을 반환한다', async () => {
      const request = createRequest(
        'http://localhost/api/analysis/compare?type=skin&to=uuid2'
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Missing from or to');
    });

    it('to 파라미터 누락 시 400을 반환한다', async () => {
      const request = createRequest(
        'http://localhost/api/analysis/compare?type=skin&from=uuid1'
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('존재하지 않는 from ID는 404를 반환한다', async () => {
      mockSingle.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      const request = createRequest(
        'http://localhost/api/analysis/compare?type=skin&from=invalid-uuid&to=uuid2'
      );
      const response = await GET(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('From analysis not found');
    });

    it('존재하지 않는 to ID는 404를 반환한다', async () => {
      const fromData = {
        id: 'uuid1',
        created_at: '2025-01-01T10:00:00Z',
        overall_score: 72,
        skin_type: 'dry',
        hydration: 65,
        oil_level: 45,
        pores: 55,
        pigmentation: 40,
        wrinkles: 30,
        sensitivity: 42,
      };

      mockSingle
        .mockResolvedValueOnce({ data: fromData, error: null })
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      const request = createRequest(
        'http://localhost/api/analysis/compare?type=skin&from=uuid1&to=invalid-uuid'
      );
      const response = await GET(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('To analysis not found');
    });

    it('피부 분석 비교 결과를 반환한다', async () => {
      const fromData = {
        id: 'uuid1',
        created_at: '2025-01-01T10:00:00Z',
        image_url: 'https://example.com/before.jpg',
        overall_score: 72,
        skin_type: 'combination',
        hydration: 65,
        oil_level: 55,
        pores: 55,
        pigmentation: 42,
        wrinkles: 32,
        sensitivity: 48,
      };

      const toData = {
        id: 'uuid2',
        created_at: '2025-01-15T10:00:00Z',
        image_url: 'https://example.com/after.jpg',
        overall_score: 80,
        skin_type: 'combination',
        hydration: 75,
        oil_level: 48,
        pores: 60,
        pigmentation: 38,
        wrinkles: 28,
        sensitivity: 42,
      };

      mockSingle
        .mockResolvedValueOnce({ data: fromData, error: null })
        .mockResolvedValueOnce({ data: toData, error: null });

      const request = createRequest(
        'http://localhost/api/analysis/compare?type=skin&from=uuid1&to=uuid2'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.before.id).toBe('uuid1');
      expect(data.after.id).toBe('uuid2');
      expect(data.changes.overall).toBe(8); // 80 - 72
      expect(data.changes.period).toBe('2주'); // 14일
      expect(data.changes.details.hydration).toBe(10); // 75 - 65
      expect(data.insights.length).toBeGreaterThan(0);
    });

    it('체형 분석 비교 결과를 반환한다', async () => {
      const fromData = {
        id: 'body-1',
        created_at: '2025-01-01T10:00:00Z',
        image_url: 'https://example.com/body-before.jpg',
        body_type: 'S',
        height: 170,
        weight: 68,
        shoulder: 70,
        waist: 65,
        hip: 68,
        ratio: 0.78,
      };

      const toData = {
        id: 'body-2',
        created_at: '2025-02-01T10:00:00Z',
        image_url: 'https://example.com/body-after.jpg',
        body_type: 'S',
        height: 170,
        weight: 65,
        shoulder: 75,
        waist: 72,
        hip: 74,
        ratio: 0.82,
      };

      mockSingle
        .mockResolvedValueOnce({ data: fromData, error: null })
        .mockResolvedValueOnce({ data: toData, error: null });

      const request = createRequest(
        'http://localhost/api/analysis/compare?type=body&from=body-1&to=body-2'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.before.type).toBe('body');
      expect(data.after.type).toBe('body');
      expect(data.changes.period).toBe('1개월'); // 31일
      expect(data.changes.details.shoulder).toBe(5); // 75 - 70
    });

    it('퍼스널 컬러 비교는 지원하지 않는다', async () => {
      const request = createRequest(
        'http://localhost/api/analysis/compare?type=personal-color&from=pc1&to=pc2'
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('not supported');
    });

    it('개선 인사이트가 생성된다', async () => {
      const fromData = {
        id: 'uuid1',
        created_at: '2025-01-01T10:00:00Z',
        overall_score: 60,
        skin_type: 'dry',
        hydration: 50,
        oil_level: 60,
        pores: 50,
        pigmentation: 50,
        wrinkles: 50,
        sensitivity: 50,
      };

      const toData = {
        id: 'uuid2',
        created_at: '2025-01-15T10:00:00Z',
        overall_score: 75,
        skin_type: 'normal',
        hydration: 70, // +20 개선
        oil_level: 50,
        pores: 60,
        pigmentation: 45,
        wrinkles: 45,
        sensitivity: 45,
      };

      mockSingle
        .mockResolvedValueOnce({ data: fromData, error: null })
        .mockResolvedValueOnce({ data: toData, error: null });

      const request = createRequest(
        'http://localhost/api/analysis/compare?type=skin&from=uuid1&to=uuid2'
      );
      const response = await GET(request);

      const data = await response.json();

      // 15점 개선 → "크게 개선되었어요" 인사이트
      expect(data.insights.some((i: string) => i.includes('개선'))).toBe(true);
      // 수분 20점 향상 → 수분 관련 인사이트
      expect(data.insights.some((i: string) => i.includes('수분'))).toBe(true);
    });

    it('기간 계산이 정확하다', async () => {
      const fromData = {
        id: 'uuid1',
        created_at: '2025-01-01T10:00:00Z',
        overall_score: 70,
        skin_type: 'dry',
        hydration: 60,
        oil_level: 50,
        pores: 55,
        pigmentation: 45,
        wrinkles: 35,
        sensitivity: 40,
      };

      // 3일 후
      const toData3Days = {
        id: 'uuid2',
        created_at: '2025-01-04T10:00:00Z',
        overall_score: 72,
        skin_type: 'dry',
        hydration: 62,
        oil_level: 48,
        pores: 56,
        pigmentation: 44,
        wrinkles: 34,
        sensitivity: 39,
      };

      mockSingle
        .mockResolvedValueOnce({ data: fromData, error: null })
        .mockResolvedValueOnce({ data: toData3Days, error: null });

      const request = createRequest(
        'http://localhost/api/analysis/compare?type=skin&from=uuid1&to=uuid2'
      );
      const response = await GET(request);

      const data = await response.json();
      expect(data.changes.period).toBe('3일');
    });
  });
});
