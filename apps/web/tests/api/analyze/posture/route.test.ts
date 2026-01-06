import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/gemini', () => ({
  analyzePosture: vi.fn(),
}));

vi.mock('@/lib/mock/posture-analysis', () => ({
  generateMockPostureAnalysis: vi.fn(),
  POSTURE_TYPES: {
    ideal: { label: '이상적인 자세', description: '균형 잡힌 자세' },
    forward_head: { label: '거북목', description: '목이 앞으로 나온 자세' },
  },
}));

vi.mock('@/lib/gamification', () => ({
  awardAnalysisBadge: vi.fn(),
  addXp: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { analyzePosture } from '@/lib/gemini';
import { generateMockPostureAnalysis } from '@/lib/mock/posture-analysis';
import { awardAnalysisBadge, addXp } from '@/lib/gamification';

const { POST, GET } = await import('@/app/api/analyze/posture/route');

describe('POST /api/analyze/posture', () => {
  // 모든 체인 메서드를 영속적으로 유지
  const mockUpload = vi.fn();
  const mockSelectSingle = vi.fn();
  const mockInsertSingle = vi.fn();

  const mockLimit = vi.fn(() => ({ single: mockSelectSingle }));
  const mockOrder = vi.fn(() => ({ limit: mockLimit }));
  const mockEq = vi.fn(() => ({ order: mockOrder }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));
  const mockInsertSelect = vi.fn(() => ({ single: mockInsertSingle }));
  const mockInsert = vi.fn(() => ({ select: mockInsertSelect }));

  const mockSupabase = {
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
      })),
    },
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any);
    // 기본값 재설정
    mockUpload.mockResolvedValue({ data: { path: 'test/path.jpg' }, error: null });
    mockSelectSingle.mockResolvedValue({ data: null, error: null }); // body_analyses 조회 기본값
    mockInsertSingle.mockResolvedValue({ data: { id: 'analysis-1' }, error: null });
  });

  describe('인증', () => {
    it('미인증 시 401 에러', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const req = new Request('http://localhost/api/analyze/posture', {
        method: 'POST',
        body: JSON.stringify({ frontImageBase64: 'data:image/jpeg;base64,abc' }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('인증된 사용자 - 처리 진행', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as any);
      vi.mocked(generateMockPostureAnalysis).mockReturnValue({
        postureType: 'ideal',
        postureTypeLabel: '이상적인 자세',
        postureTypeDescription: '균형 잡힌 자세',
        overallScore: 85,
        confidence: 90,
        frontAnalysis: {
          shoulderSymmetry: { name: '어깨 대칭', value: 50, status: 'good', description: '균형' },
          pelvisSymmetry: { name: '골반 대칭', value: 50, status: 'good', description: '균형' },
          kneeAlignment: { name: '무릎 정렬', value: 50, status: 'good', description: '정상' },
          footAngle: { name: '발 각도', value: 50, status: 'good', description: '정상' },
        },
        sideAnalysis: {
          headForwardAngle: {
            name: '목 전방 경사',
            value: 50,
            status: 'good',
            description: '정상',
          },
          thoracicKyphosis: { name: '등 굽음', value: 50, status: 'good', description: '정상' },
          lumbarLordosis: { name: '허리 만곡', value: 50, status: 'good', description: '정상' },
          pelvicTilt: { name: '골반 기울기', value: 50, status: 'good', description: '정상' },
        },
        concerns: [],
        stretchingRecommendations: [],
        insight: '좋은 자세입니다',
        analyzedAt: new Date(),
      } as any);

      const req = new Request('http://localhost/api/analyze/posture', {
        method: 'POST',
        body: JSON.stringify({ frontImageBase64: 'data:image/jpeg;base64,abc', useMock: true }),
      });

      const response = await POST(req);
      expect(response.status).toBe(200);
    });
  });

  describe('필수 파라미터 검증', () => {
    it('정면 이미지 없으면 400 에러', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as any);

      const req = new Request('http://localhost/api/analyze/posture', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Front image is required');
    });

    it('정면 이미지만 있어도 정상 처리', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as any);
      vi.mocked(generateMockPostureAnalysis).mockReturnValue({
        postureType: 'ideal',
        overallScore: 85,
        confidence: 90,
      } as any);

      const req = new Request('http://localhost/api/analyze/posture', {
        method: 'POST',
        body: JSON.stringify({ frontImageBase64: 'data:image/jpeg;base64,abc', useMock: true }),
      });

      const response = await POST(req);
      expect(response.status).toBe(200);
    });
  });

  describe('Mock 모드', () => {
    it('useMock=true 시 Mock 사용', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as any);
      vi.mocked(generateMockPostureAnalysis).mockReturnValue({
        postureType: 'ideal',
        overallScore: 85,
      } as any);

      const req = new Request('http://localhost/api/analyze/posture', {
        method: 'POST',
        body: JSON.stringify({
          frontImageBase64: 'data:image/jpeg;base64,abc',
          useMock: true,
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(data.usedMock).toBe(true);
      expect(analyzePosture).not.toHaveBeenCalled();
    });
  });

  describe('AI 분석 실패 시 Fallback', () => {
    it('Gemini 에러 시 Mock으로 폴백', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as any);
      vi.mocked(analyzePosture).mockRejectedValue(new Error('Gemini API error'));
      vi.mocked(generateMockPostureAnalysis).mockReturnValue({
        postureType: 'ideal',
        overallScore: 85,
      } as any);

      const req = new Request('http://localhost/api/analyze/posture', {
        method: 'POST',
        body: JSON.stringify({ frontImageBase64: 'data:image/jpeg;base64,abc' }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.usedMock).toBe(true);
    });
  });

  describe('체형 연동', () => {
    it('bodyType 파라미터 전달', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as any);
      vi.mocked(generateMockPostureAnalysis).mockReturnValue({
        postureType: 'ideal',
        overallScore: 85,
      } as any);

      const req = new Request('http://localhost/api/analyze/posture', {
        method: 'POST',
        body: JSON.stringify({
          frontImageBase64: 'data:image/jpeg;base64,abc',
          bodyType: 'S',
          useMock: true,
        }),
      });

      await POST(req);

      expect(generateMockPostureAnalysis).toHaveBeenCalledWith('S');
    });

    it('bodyType 없으면 C-1 조회', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as any);
      vi.mocked(generateMockPostureAnalysis).mockReturnValue({
        postureType: 'ideal',
        overallScore: 85,
      } as any);

      mockSupabase
        .from()
        .select()
        .eq()
        .order()
        .limit()
        .single.mockResolvedValue({
          data: { body_type: 'W' },
          error: null,
        });

      const req = new Request('http://localhost/api/analyze/posture', {
        method: 'POST',
        body: JSON.stringify({
          frontImageBase64: 'data:image/jpeg;base64,abc',
          useMock: true,
        }),
      });

      const response = await POST(req);
      const data = await response.json();

      expect(data.bodyType).toBe('W');
    });
  });

  describe('게이미피케이션 연동', () => {
    it('분석 완료 시 XP 추가', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as any);
      vi.mocked(generateMockPostureAnalysis).mockReturnValue({
        postureType: 'ideal',
        overallScore: 85,
      } as any);

      vi.mocked(addXp).mockResolvedValue(null);

      const req = new Request('http://localhost/api/analyze/posture', {
        method: 'POST',
        body: JSON.stringify({
          frontImageBase64: 'data:image/jpeg;base64,abc',
          useMock: true,
        }),
      });

      await POST(req);

      expect(addXp).toHaveBeenCalledWith(mockSupabase, 'user-1', 10);
    });

    it('배지 시스템 연동', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as any);
      vi.mocked(generateMockPostureAnalysis).mockReturnValue({
        postureType: 'ideal',
        overallScore: 85,
      } as any);

      vi.mocked(awardAnalysisBadge).mockResolvedValue(null);

      const req = new Request('http://localhost/api/analyze/posture', {
        method: 'POST',
        body: JSON.stringify({
          frontImageBase64: 'data:image/jpeg;base64,abc',
          useMock: true,
        }),
      });

      await POST(req);

      expect(awardAnalysisBadge).toHaveBeenCalledWith(mockSupabase, 'user-1', 'body');
    });
  });
});

describe('GET /api/analyze/posture', () => {
  // 체인 메서드를 영속적으로 유지
  const mockLimit = vi.fn();
  const mockOrder = vi.fn(() => ({ limit: mockLimit }));
  const mockEq = vi.fn(() => ({ order: mockOrder }));
  const mockSelect = vi.fn(() => ({ eq: mockEq }));

  const mockSupabase = {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as any);
    mockLimit.mockResolvedValue({ data: [], error: null });
  });

  describe('인증', () => {
    it('미인증 시 401 에러', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('정상 조회', () => {
    it('분석 결과 목록 반환', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as any);

      const mockData = [
        { id: '1', posture_type: 'ideal', overall_score: 85 },
        { id: '2', posture_type: 'forward_head', overall_score: 65 },
      ];

      mockLimit.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockData);
      expect(data.count).toBe(2);
    });

    it('결과 없을 때 빈 배열', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as any);

      mockLimit.mockResolvedValue({
        data: [],
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
      expect(data.count).toBe(0);
    });

    it('최신순 정렬 10개 제한', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'user-1' } as any);

      mockLimit.mockResolvedValue({
        data: [],
        error: null,
      });

      await GET();

      expect(mockOrder).toHaveBeenCalledWith('created_at', {
        ascending: false,
      });
      expect(mockLimit).toHaveBeenCalledWith(10);
    });
  });
});
