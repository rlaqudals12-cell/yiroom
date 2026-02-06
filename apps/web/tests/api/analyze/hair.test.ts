/**
 * H-1 헤어 분석 v1 API 테스트
 * @description POST/GET /api/analyze/hair 테스트
 * @see docs/specs/SDD-HAIR-ANALYSIS.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock 모듈 설정
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/gemini', () => ({
  analyzeHair: vi.fn(),
}));

vi.mock('@/lib/mock/hair-analysis', () => ({
  generateMockHairAnalysisResult: vi.fn(),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  applyRateLimit: vi.fn(),
}));

vi.mock('@/lib/gamification', () => ({
  addXp: vi.fn(),
}));

vi.mock('@/lib/alerts', () => ({
  createScalpHealthNutritionAlert: vi.fn(),
  createHairLossPreventionAlert: vi.fn(),
  createHairShineBoostAlert: vi.fn(),
}));

// import는 mock 선언 이후
import { GET, POST } from '@/app/api/analyze/hair/route';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { analyzeHair } from '@/lib/gemini';
import { generateMockHairAnalysisResult } from '@/lib/mock/hair-analysis';
import { applyRateLimit } from '@/lib/security/rate-limit';
import { addXp } from '@/lib/gamification';
import {
  createScalpHealthNutritionAlert,
  createHairLossPreventionAlert,
  createHairShineBoostAlert,
} from '@/lib/alerts';
import { NextRequest } from 'next/server';

// Mock 요청 헬퍼 (NextRequest 호환)
function createMockPostRequest(body: unknown): NextRequest {
  const url = 'http://localhost/api/analyze/hair';
  const req = new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return req;
}

// Mock 헤어 분석 결과
const mockHairAnalysisResult = {
  hairType: 'straight' as const,
  hairTypeLabel: '직모',
  hairThickness: 'medium' as const,
  hairThicknessLabel: '보통 모발',
  scalpType: 'normal' as const,
  scalpTypeLabel: '정상 두피',
  overallScore: 75,
  metrics: [
    {
      id: 'hydration',
      label: '수분',
      value: 70,
      barColor: '#3b82f6',
      status: 'normal' as const,
      description: '수분 상태',
    },
    {
      id: 'scalp',
      label: '두피 건강',
      value: 80,
      barColor: '#10b981',
      status: 'good' as const,
      description: '두피 건강 상태',
    },
    {
      id: 'damage',
      label: '손상도',
      value: 20,
      barColor: '#f59e0b',
      status: 'good' as const,
      description: '손상도 상태',
    },
    {
      id: 'density',
      label: '밀도',
      value: 75,
      barColor: '#8b5cf6',
      status: 'normal' as const,
      description: '밀도 상태',
    },
    {
      id: 'elasticity',
      label: '탄력',
      value: 70,
      barColor: '#ec4899',
      status: 'normal' as const,
      description: '탄력 상태',
    },
    {
      id: 'shine',
      label: '윤기',
      value: 65,
      barColor: '#f97316',
      status: 'normal' as const,
      description: '윤기 상태',
    },
  ],
  concerns: ['dry-scalp', 'frizz'] as const,
  insight:
    '전반적으로 건강한 모발 상태입니다. 약간의 건조함과 부스스함이 관찰되어 보습 케어가 필요합니다.',
  recommendedIngredients: ['히알루론산', '세라마이드', '아르간오일'],
  recommendedProducts: [
    { name: '모이스처 샴푸', category: '샴푸', ingredients: ['히알루론산'], reason: '수분 공급' },
    {
      name: '헤어 세럼',
      category: '트리트먼트',
      ingredients: ['아르간오일'],
      reason: '윤기 및 영양 공급',
    },
  ],
  careTips: [
    '주 2-3회 딥 컨디셔닝을 통해 수분을 공급하세요.',
    '열 스타일링 전 반드시 히트 프로텍터를 사용하세요.',
    '두피 마사지를 통해 혈액순환을 개선하세요.',
  ],
  analyzedAt: new Date('2026-01-29T10:00:00Z'),
  analysisReliability: {
    overallReliability: 'high',
    factors: {
      imageQuality: 90,
      visibleArea: 85,
      lightingCondition: 80,
    },
  },
};

// Mock Gemini 응답
const mockGeminiResponse = {
  hairType: 'straight',
  hairTypeLabel: '직모',
  hairThickness: 'medium',
  hairThicknessLabel: '보통 모발',
  scalpType: 'normal',
  scalpTypeLabel: '정상 두피',
  overallScore: 75,
  metrics: mockHairAnalysisResult.metrics,
  concerns: ['dry-scalp', 'frizz'],
  insight:
    '전반적으로 건강한 모발 상태입니다. 약간의 건조함과 부스스함이 관찰되어 보습 케어가 필요합니다.',
  recommendedIngredients: ['히알루론산', '세라마이드', '아르간오일'],
  recommendedProducts: mockHairAnalysisResult.recommendedProducts,
  careTips: mockHairAnalysisResult.careTips,
  analysisReliability: mockHairAnalysisResult.analysisReliability,
};

// Mock DB 결과
const mockDbResult = {
  id: 'hair-123',
  clerk_user_id: 'user_test123',
  image_url: 'user_test123/1234567890_hair.jpg',
  hair_type: 'normal',
  hair_thickness: 'medium',
  scalp_type: 'normal',
  hydration: 70,
  scalp_health: 80,
  damage_level: 20,
  density: 75,
  elasticity: 70,
  shine: 65,
  overall_score: 75,
  concerns: ['dryness', 'frizz'],
  recommendations: {
    insight: mockHairAnalysisResult.insight,
    ingredients: mockHairAnalysisResult.recommendedIngredients,
    products: mockHairAnalysisResult.recommendedProducts,
    careTips: mockHairAnalysisResult.careTips,
    analysisReliability: mockHairAnalysisResult.analysisReliability,
  },
  created_at: '2026-01-29T10:00:00Z',
};

describe('POST /api/analyze/hair', () => {
  const mockSupabase = {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // 기본 mock 설정
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as Awaited<
      ReturnType<typeof auth>
    >);
    vi.mocked(createServiceRoleClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>
    );
    vi.mocked(applyRateLimit).mockReturnValue({ success: true, headers: {} });
    vi.mocked(generateMockHairAnalysisResult).mockReturnValue(
      mockHairAnalysisResult as unknown as ReturnType<typeof generateMockHairAnalysisResult>
    );
    vi.mocked(analyzeHair).mockResolvedValue(
      mockGeminiResponse as unknown as Awaited<ReturnType<typeof analyzeHair>>
    );
    vi.mocked(addXp).mockResolvedValue(null);
    vi.mocked(createScalpHealthNutritionAlert).mockReturnValue({
      type: 'scalp_health_nutrition',
      priority: 'high',
      title: '두피 건강 알림',
      message: '두피 건강 개선을 위한 영양소를 추천합니다.',
      targetModules: ['nutrition'],
    } as unknown as ReturnType<typeof createScalpHealthNutritionAlert>);
    vi.mocked(createHairLossPreventionAlert).mockReturnValue({
      type: 'hair_loss_prevention',
      priority: 'medium',
      title: '탈모 예방 알림',
      message: '탈모 예방을 위한 권장사항입니다.',
      targetModules: ['nutrition'],
    } as unknown as ReturnType<typeof createHairLossPreventionAlert>);
    vi.mocked(createHairShineBoostAlert).mockReturnValue({
      type: 'hair_shine_boost',
      priority: 'medium',
      title: '모발 윤기 알림',
      message: '모발 윤기 개선을 위한 권장사항입니다.',
      targetModules: ['nutrition'],
    } as unknown as ReturnType<typeof createHairShineBoostAlert>);

    // Default supabase mock
    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'hair_analyses') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockDbResult, error: null }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    // Storage mock
    mockSupabase.storage.from = vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({
        data: { path: 'user_test123/1234567890_hair.jpg' },
        error: null,
      }),
    });
  });

  describe('인증', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const response = await POST(
        createMockPostRequest({ imageBase64: 'data:image/jpeg;base64,/9j/test' })
      );
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBeDefined();
    });
  });

  describe('입력 검증', () => {
    it('이미지가 없으면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({}));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('이미지가 필요합니다.');
    });
  });

  describe('Mock 분석', () => {
    it('useMock=true이면 Mock 분석을 사용한다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedMock).toBe(true);
      expect(generateMockHairAnalysisResult).toHaveBeenCalled();
      expect(analyzeHair).not.toHaveBeenCalled();
    });
  });

  describe('Gemini 분석', () => {
    it('Gemini 분석 성공 시 결과를 반환한다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedMock).toBe(false);
      expect(analyzeHair).toHaveBeenCalledWith('data:image/jpeg;base64,/9j/test');
      expect(json.result.hairType).toBe('straight');
    });

    it('Gemini 분석 실패 시 Mock으로 폴백한다', async () => {
      vi.mocked(analyzeHair).mockRejectedValue(new Error('Gemini timeout'));

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedMock).toBe(true);
      expect(generateMockHairAnalysisResult).toHaveBeenCalled();
    });
  });

  describe('DB 저장', () => {
    it('분석 결과가 DB에 저장된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.data.id).toBe('hair-123');
      expect(json.data.hair_type).toBe('normal');
    });

    it('DB 저장 실패 시 dbError를 반환한다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'hair_analyses') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Database insert error' },
                }),
              }),
            }),
          };
        }
        return mockSupabase.from(table);
      });

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('분석 결과 저장에 실패했습니다.');
    });
  });

  describe('응답 형식', () => {
    it('성공 응답에 필수 필드가 포함된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(json).toHaveProperty('success', true);
      expect(json).toHaveProperty('data');
      expect(json).toHaveProperty('result');
      expect(json).toHaveProperty('usedMock');
      expect(json).toHaveProperty('gamification');
      expect(json).toHaveProperty('alerts');
      expect(json.result).toHaveProperty('hairType');
      expect(json.result).toHaveProperty('hairTypeLabel');
      expect(json.result).toHaveProperty('scalpType');
      expect(json.result).toHaveProperty('overallScore');
      expect(json.result).toHaveProperty('metrics');
      expect(json.result).toHaveProperty('concerns');
      expect(json.result).toHaveProperty('careTips');
      expect(json.gamification).toHaveProperty('badgeResults');
      expect(json.gamification).toHaveProperty('xpAwarded', 10);
    });
  });

  describe('게이미피케이션 연동', () => {
    it('분석 완료 시 XP를 추가한다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(addXp).toHaveBeenCalledWith(mockSupabase, 'user_test123', 10);
      expect(json.gamification.xpAwarded).toBe(10);
    });
  });

  describe('크로스 모듈 알림', () => {
    it('두피 건강 점수가 70 미만이면 영양 알림을 생성한다', async () => {
      // 두피 건강 점수를 65로 설정
      const customResult = {
        ...mockHairAnalysisResult,
        metrics: mockHairAnalysisResult.metrics.map((m) =>
          m.id === 'scalp' ? { ...m, value: 65 } : m
        ),
      };
      vi.mocked(generateMockHairAnalysisResult).mockReturnValue(
        customResult as unknown as ReturnType<typeof generateMockHairAnalysisResult>
      );

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(createScalpHealthNutritionAlert).toHaveBeenCalledWith(
        65,
        mockHairAnalysisResult.recommendedIngredients
      );
      expect(json.alerts).toContainEqual(
        expect.objectContaining({ type: 'scalp_health_nutrition' })
      );
    });

    it('밀도 점수가 70 미만이면 탈모 예방 알림을 생성한다', async () => {
      // 밀도 점수를 50으로 설정 (50 < 60이므로 'medium')
      const customResult = {
        ...mockHairAnalysisResult,
        metrics: mockHairAnalysisResult.metrics.map((m) =>
          m.id === 'density' ? { ...m, value: 50 } : m
        ),
      };
      vi.mocked(generateMockHairAnalysisResult).mockReturnValue(
        customResult as unknown as ReturnType<typeof generateMockHairAnalysisResult>
      );

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(createHairLossPreventionAlert).toHaveBeenCalledWith(50, 'medium');
      expect(json.alerts).toContainEqual(expect.objectContaining({ type: 'hair_loss_prevention' }));
    });

    it('손상도가 40 초과이면 윤기 알림을 생성한다', async () => {
      // 손상도를 50으로 설정
      const customResult = {
        ...mockHairAnalysisResult,
        metrics: mockHairAnalysisResult.metrics.map((m) =>
          m.id === 'damage' ? { ...m, value: 50 } : m
        ),
      };
      vi.mocked(generateMockHairAnalysisResult).mockReturnValue(
        customResult as unknown as ReturnType<typeof generateMockHairAnalysisResult>
      );

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(createHairShineBoostAlert).toHaveBeenCalledWith(50);
      expect(json.alerts).toContainEqual(expect.objectContaining({ type: 'hair_shine_boost' }));
    });
  });
});

describe('GET /api/analyze/hair', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
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
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBeDefined();
    });
  });

  describe('데이터 조회', () => {
    it('분석 목록을 반환한다', async () => {
      const mockData = [mockDbResult, { ...mockDbResult, id: 'hair-456' }];

      mockSupabase.from = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      }));

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toEqual(mockData);
      expect(json.count).toBe(2);
    });

    it('분석 결과가 없으면 빈 배열을 반환한다', async () => {
      mockSupabase.from = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }));

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toEqual([]);
      expect(json.count).toBe(0);
    });

    it('DB 에러 시 에러 응답을 반환한다', async () => {
      mockSupabase.from = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database query error' },
        }),
      }));

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('분석 결과를 불러오는데 실패했습니다.');
    });
  });
});
