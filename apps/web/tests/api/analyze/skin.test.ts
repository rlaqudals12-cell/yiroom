/**
 * S-1 피부 분석 API 테스트
 * @description POST/GET /api/analyze/skin 테스트
 * @version 1.0
 * @date 2025-12-09
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
  analyzeSkin: vi.fn(),
}));

vi.mock('@/lib/mock/skin-analysis', () => ({
  generateMockAnalysisResult: vi.fn(),
}));

vi.mock('@/lib/ingredients', () => ({
  getWarningIngredientsForSkinType: vi.fn(),
}));

vi.mock('@/lib/product-recommendations', () => ({
  generateProductRecommendations: vi.fn(),
  formatProductsForDB: vi.fn(),
}));

import { GET, POST } from '@/app/api/analyze/skin/route';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { analyzeSkin } from '@/lib/gemini';
import { generateMockAnalysisResult } from '@/lib/mock/skin-analysis';
import { getWarningIngredientsForSkinType } from '@/lib/ingredients';
import { generateProductRecommendations, formatProductsForDB } from '@/lib/product-recommendations';

// Mock 요청 헬퍼
function createMockPostRequest(body: unknown): Request {
  return {
    url: 'http://localhost/api/analyze/skin',
    json: () => Promise.resolve(body),
  } as Request;
}

// Mock 데이터
const mockSkinAnalysisResult = {
  overallScore: 75,
  skinType: 'combination' as const,
  skinTypeLabel: '복합성',
  sensitivityLevel: 'medium' as const,
  concernAreas: ['T존', '눈가'],
  metrics: [
    {
      id: 'hydration',
      name: '수분',
      value: 65,
      status: 'normal' as const,
      description: '적절한 수분 상태',
    },
    {
      id: 'oil',
      name: '유분',
      value: 55,
      status: 'normal' as const,
      description: '적절한 유분 상태',
    },
    {
      id: 'pores',
      name: '모공',
      value: 70,
      status: 'good' as const,
      description: '양호한 모공 상태',
    },
    {
      id: 'wrinkles',
      name: '주름',
      value: 80,
      status: 'good' as const,
      description: '양호한 주름 상태',
    },
    {
      id: 'pigmentation',
      name: '색소침착',
      value: 75,
      status: 'good' as const,
      description: '양호한 색소 상태',
    },
    {
      id: 'sensitivity',
      name: '민감도',
      value: 40,
      status: 'normal' as const,
      description: '보통 민감도',
    },
  ],
  insight: '전반적으로 건강한 피부 상태입니다.',
  recommendedIngredients: [
    { name: '히알루론산', reason: '수분 공급' },
    { name: '나이아신아마이드', reason: '피부 장벽 강화' },
  ],
  analyzedAt: new Date(),
};

const mockDbResult = {
  id: 'skin-123',
  clerk_user_id: 'user_test123',
  skin_type: 'combination',
  overall_score: 75,
  hydration: 65,
  oil_level: 55,
  created_at: '2025-12-09T10:00:00Z',
};

const mockProductRecommendations = {
  routine: [
    {
      step: 1,
      category: 'cleanser' as const,
      categoryLabel: '클렌저',
      products: ['밀크 클렌저', '폼 클렌저'],
      tip: '부드럽게 세안하세요',
    },
  ],
  specialCare: [
    {
      name: '마스크팩',
      category: 'mask' as const,
      description: '수분 마스크',
      keyIngredients: ['히알루론산', '세라마이드'],
      suitableFor: ['dry' as const, 'combination' as const],
      priceRange: 'mid' as const,
    },
  ],
  skincareRoutine: { morning: '아침 루틴', evening: '저녁 루틴' },
  careTips: { weeklyCare: ['주간 관리', '팩 하기'], lifestyleTips: ['수분 섭취', '충분한 수면'] },
};

const mockWarningIngredients = [
  {
    id: 'ingredient-1',
    name_ko: '향료',
    name_en: 'Fragrance',
    aliases: ['Parfum', 'Fragrance Mix'],
    warning_sensitive: 5,
    warning_dry: 3,
    warning_oily: 2,
    warning_combination: 3,
    ewg_grade: 8,
    side_effects: '자극 가능',
    description: '인공 향료 성분',
    category: '향료',
    alternatives: ['무향료 제품 선택'],
  },
];

describe('POST /api/analyze/skin', () => {
  const mockStorageUpload = vi.fn();
  const mockPcSelect = vi.fn();
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockImplementation(() => {
      return {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: mockPcSelect,
      };
    }),
    single: vi.fn(),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: mockStorageUpload,
      }),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as Awaited<
      ReturnType<typeof auth>
    >);
    vi.mocked(createServiceRoleClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>
    );
    vi.mocked(generateMockAnalysisResult).mockReturnValue(mockSkinAnalysisResult);
    vi.mocked(getWarningIngredientsForSkinType).mockResolvedValue(mockWarningIngredients);
    vi.mocked(generateProductRecommendations).mockReturnValue(mockProductRecommendations);
    vi.mocked(formatProductsForDB).mockReturnValue({ cleanser: ['밀크 클렌저'] });
    mockStorageUpload.mockResolvedValue({ data: { path: 'user_test123/123.jpg' }, error: null });
    mockPcSelect.mockResolvedValue({ data: { season: 'Spring' }, error: null });
  });

  describe('인증', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const response = await POST(createMockPostRequest({ imageBase64: 'test' }));
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });
  });

  describe('입력 검증', () => {
    it('이미지가 없으면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({}));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Image is required');
    });
  });

  describe('Mock 분석', () => {
    it('useMock=true이면 Mock 분석을 사용한다', async () => {
      // insert 후 single 호출 설정
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'skin_analyses') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockDbResult, error: null }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { season: 'Spring' }, error: null }),
          }),
        };
      });

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
      expect(generateMockAnalysisResult).toHaveBeenCalled();
    });
  });

  describe('AI 분석', () => {
    beforeEach(() => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'skin_analyses') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockDbResult, error: null }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { season: 'Spring' }, error: null }),
          }),
        };
      });
    });

    it('AI 분석 성공 시 결과를 반환한다', async () => {
      vi.mocked(analyzeSkin).mockResolvedValue(mockSkinAnalysisResult);

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedMock).toBe(false);
    });

    it('AI 분석 실패 시 Mock으로 폴백한다', async () => {
      vi.mocked(analyzeSkin).mockRejectedValue(new Error('API Error'));

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedMock).toBe(true);
    });
  });

  describe('퍼스널 컬러 연동', () => {
    it('퍼스널 컬러 정보가 응답에 포함된다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'skin_analyses') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockDbResult, error: null }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { season: 'Spring' }, error: null }),
          }),
        };
      });

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.personalColorSeason).toBe('Spring');
    });
  });

  describe('성분 경고', () => {
    it('피부 타입별 성분 경고가 생성된다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'skin_analyses') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockDbResult, error: null }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      });

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(getWarningIngredientsForSkinType).toHaveBeenCalled();
      expect(json.ingredientWarnings).toBeDefined();
    });
  });

  describe('응답 형식', () => {
    it('성공 응답에 필수 필드가 포함된다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'skin_analyses') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockDbResult, error: null }),
              }),
            }),
          };
        }
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { season: 'Spring' }, error: null }),
          }),
        };
      });

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
      expect(json).toHaveProperty('personalColorSeason');
      expect(json).toHaveProperty('ingredientWarnings');
      expect(json).toHaveProperty('productRecommendations');
      expect(json).toHaveProperty('usedMock');
    });
  });
});

describe('GET /api/analyze/skin', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn(),
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
      expect(json.error).toBe('Unauthorized');
    });
  });

  describe('데이터 조회', () => {
    it('분석 결과 목록을 반환한다', async () => {
      mockSupabase.limit.mockResolvedValue({ data: [mockDbResult], error: null });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(1);
      expect(json.count).toBe(1);
    });

    it('분석 결과가 없으면 빈 배열을 반환한다', async () => {
      mockSupabase.limit.mockResolvedValue({ data: [], error: null });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(0);
      expect(json.count).toBe(0);
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockSupabase.limit.mockResolvedValue({ data: null, error: { message: 'DB Error' } });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Failed to fetch analyses');
    });
  });
});
