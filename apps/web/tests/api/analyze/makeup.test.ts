/**
 * M-1 메이크업 분석 API 테스트
 * @description POST/GET /api/analyze/makeup 테스트
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
  analyzeMakeup: vi.fn(),
}));

vi.mock('@/lib/mock/makeup-analysis', () => ({
  generateMockMakeupAnalysisResult: vi.fn(),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  applyRateLimit: vi.fn(),
}));

vi.mock('@/lib/gamification', () => ({
  addXp: vi.fn(),
}));

vi.mock('@/lib/alerts', () => ({
  createSkinToneNutritionAlert: vi.fn(),
  createCollagenBoostAlert: vi.fn(),
}));

vi.mock('@/lib/api/error-response', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/error-response')>(
    '@/lib/api/error-response'
  );
  return actual;
});

// import는 mock 선언 이후
import { GET, POST } from '@/app/api/analyze/makeup/route';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { analyzeMakeup } from '@/lib/gemini';
import { generateMockMakeupAnalysisResult } from '@/lib/mock/makeup-analysis';
import { applyRateLimit } from '@/lib/security/rate-limit';
import { addXp } from '@/lib/gamification';
import { createSkinToneNutritionAlert, createCollagenBoostAlert } from '@/lib/alerts';
import { NextRequest } from 'next/server';
import type { MakeupAnalysisResult } from '@/lib/mock/makeup-analysis';

// Mock 요청 헬퍼 (NextRequest 호환)
function createMockPostRequest(body: unknown): NextRequest {
  const url = 'http://localhost/api/analyze/makeup';
  const req = new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return req;
}

// Mock 메이크업 분석 결과
const mockMakeupAnalysisResult: MakeupAnalysisResult = {
  undertone: 'warm',
  undertoneLabel: '웜톤',
  eyeShape: 'double',
  eyeShapeLabel: '유쌍',
  lipShape: 'full',
  lipShapeLabel: '도톰한 입술',
  faceShape: 'oval',
  faceShapeLabel: '계란형',
  overallScore: 72,
  metrics: [
    {
      id: 'skinTexture',
      label: '피부 결',
      value: 75,
      status: 'good',
      description: '피부 표면의 매끄러움',
    },
    {
      id: 'skinTone',
      label: '피부톤 균일도',
      value: 70,
      status: 'good',
      description: '전체적인 피부톤 일관성',
    },
    { id: 'hydration', label: '수분감', value: 65, status: 'normal', description: '피부의 촉촉함' },
    {
      id: 'poreVisibility',
      label: '모공 상태',
      value: 60,
      status: 'normal',
      description: '모공의 눈에 띄는 정도',
    },
    {
      id: 'oilBalance',
      label: '유수분 밸런스',
      value: 70,
      status: 'good',
      description: '피부의 유분/수분 균형',
    },
  ],
  concerns: ['dark-circles', 'redness'],
  insight: '웜톤에 계란형 얼굴형이시네요.',
  recommendedStyles: ['natural', 'glam', 'chic'],
  colorRecommendations: [
    {
      category: 'foundation',
      categoryLabel: '파운데이션',
      colors: [
        { name: '골든 베이지', hex: '#E8C39E', description: '웜톤에 어울리는 황금빛 베이지' },
      ],
    },
    {
      category: 'lip',
      categoryLabel: '립',
      colors: [{ name: '코랄 오렌지', hex: '#FF6B4A', description: '화사한 코랄' }],
    },
  ],
  makeupTips: [
    {
      category: '베이스',
      tips: ['피부결에 맞게 파운데이션을 발라주세요'],
    },
  ],
  personalColorConnection: {
    season: '봄 웜 또는 가을 웜',
    compatibility: 'medium',
    note: '퍼스널 컬러 진단 결과와 함께 보시면 더 정확한 컬러 추천을 받으실 수 있어요.',
  },
  analyzedAt: new Date('2026-02-06T10:00:00Z'),
  analysisReliability: 'medium',
};

// Mock Gemini 응답 (route.ts에서 필드를 매핑하므로 동일 구조)
const mockGeminiResponse = {
  undertone: 'warm',
  undertoneLabel: '웜톤',
  eyeShape: 'double',
  eyeShapeLabel: '유쌍',
  lipShape: 'full',
  lipShapeLabel: '도톰한 입술',
  faceShape: 'oval',
  faceShapeLabel: '계란형',
  overallScore: 72,
  metrics: mockMakeupAnalysisResult.metrics,
  concerns: ['dark-circles', 'redness'],
  insight: '웜톤에 계란형 얼굴형이시네요.',
  recommendedStyles: ['natural', 'glam', 'chic'],
  colorRecommendations: [
    {
      category: 'foundation',
      categoryLabel: '파운데이션',
      colors: [
        { name: '골든 베이지', hex: '#E8C39E', description: '웜톤에 어울리는 황금빛 베이지' },
      ],
    },
    {
      category: 'lip',
      categoryLabel: '립',
      colors: [{ name: '코랄 오렌지', hex: '#FF6B4A', description: '화사한 코랄' }],
    },
  ],
  makeupTips: mockMakeupAnalysisResult.makeupTips,
  personalColorConnection: mockMakeupAnalysisResult.personalColorConnection,
  analysisReliability: 'medium',
};

// Mock DB 결과
const mockDbResult = {
  id: 'makeup-123',
  clerk_user_id: 'user_test123',
  image_url: 'user_test123/1234567890_makeup.jpg',
  undertone: 'warm',
  eye_shape: 'double',
  lip_shape: 'full',
  face_shape: 'oval',
  skin_texture: 75,
  skin_tone_uniformity: 70,
  hydration: 65,
  pore_visibility: 60,
  oil_balance: 70,
  overall_score: 72,
  concerns: ['dark-circles', 'redness'],
  recommendations: {
    insight: mockMakeupAnalysisResult.insight,
    styles: mockMakeupAnalysisResult.recommendedStyles,
    colors: mockMakeupAnalysisResult.colorRecommendations,
    tips: mockMakeupAnalysisResult.makeupTips,
    personalColorConnection: mockMakeupAnalysisResult.personalColorConnection,
    analysisReliability: mockMakeupAnalysisResult.analysisReliability,
  },
  analysis_reliability: 'medium',
  created_at: '2026-02-06T10:00:00Z',
};

describe('POST /api/analyze/makeup', () => {
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
    vi.mocked(applyRateLimit).mockReturnValue({ success: true, response: null });
    vi.mocked(generateMockMakeupAnalysisResult).mockReturnValue(mockMakeupAnalysisResult);
    vi.mocked(analyzeMakeup).mockResolvedValue(
      mockGeminiResponse as Awaited<ReturnType<typeof analyzeMakeup>>
    );
    vi.mocked(addXp).mockResolvedValue(undefined);
    vi.mocked(createSkinToneNutritionAlert).mockReturnValue({
      type: 'skin_tone_nutrition',
      priority: 'medium',
      title: '피부톤 개선 영양 추천',
      message: '비타민C와 항산화 식품으로 피부 광채를 높여보세요',
      data: {},
      targetModules: ['nutrition'],
    } as unknown as ReturnType<typeof createSkinToneNutritionAlert>);
    vi.mocked(createCollagenBoostAlert).mockReturnValue({
      type: 'collagen_boost',
      priority: 'medium',
      title: '콜라겐 섭취 추천',
      message: '피부 탄력 개선을 위해 콜라겐 섭취를 권장해요',
      data: {},
      targetModules: ['nutrition'],
    } as unknown as ReturnType<typeof createCollagenBoostAlert>);

    // Default supabase mock
    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'makeup_analyses') {
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
        data: { path: 'user_test123/1234567890_makeup.jpg' },
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
      expect(json.error).toBe('인증이 필요합니다.');
      expect(json.code).toBe('UNAUTHORIZED');
    });
  });

  describe('입력 검증', () => {
    it('이미지가 없으면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({}));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('이미지가 필요합니다.');
      expect(json.code).toBe('VALIDATION_ERROR');
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
      expect(generateMockMakeupAnalysisResult).toHaveBeenCalled();
      expect(analyzeMakeup).not.toHaveBeenCalled();
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
      expect(analyzeMakeup).toHaveBeenCalledWith('data:image/jpeg;base64,/9j/test');
      expect(json.result.undertone).toBe('warm');
    });

    it('Gemini 분석 실패 시 Mock으로 폴백한다', async () => {
      vi.mocked(analyzeMakeup).mockRejectedValue(new Error('Gemini timeout'));

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedMock).toBe(true);
      expect(generateMockMakeupAnalysisResult).toHaveBeenCalled();
    });
  });

  describe('DB 저장', () => {
    it('분석 결과가 DB에 저장되고 응답에 포함된다', async () => {
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
      expect(json.data.id).toBe('makeup-123');
      expect(json.data.undertone).toBe('warm');
      expect(json.data.overall_score).toBe(72);
    });

    it('DB 저장 실패 시 dbError를 반환한다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'makeup_analyses') {
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
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
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
      expect(json.code).toBe('DB_ERROR');
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
      expect(json.result).toHaveProperty('undertone');
      expect(json.result).toHaveProperty('undertoneLabel');
      expect(json.result).toHaveProperty('eyeShape');
      expect(json.result).toHaveProperty('lipShape');
      expect(json.result).toHaveProperty('faceShape');
      expect(json.result).toHaveProperty('overallScore');
      expect(json.result).toHaveProperty('metrics');
      expect(json.result).toHaveProperty('concerns');
      expect(json.result).toHaveProperty('colorRecommendations');
      expect(json.result).toHaveProperty('makeupTips');
      expect(json.gamification).toHaveProperty('badgeResults');
      expect(json.gamification).toHaveProperty('xpAwarded', 15);
    });
  });

  describe('게이미피케이션 연동', () => {
    it('분석 완료 시 XP 15점을 추가한다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(addXp).toHaveBeenCalledWith(mockSupabase, 'user_test123', 15);
      expect(json.gamification.xpAwarded).toBe(15);
    });
  });

  describe('크로스 모듈 알림', () => {
    it('skinConcerns가 있으면 피부톤 영양 알림을 생성한다', async () => {
      // concerns에 항목이 있는 기본 mock 결과 사용
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      // undertone: 'warm', concerns: ['dark-circles', 'redness']
      expect(createSkinToneNutritionAlert).toHaveBeenCalledWith('warm', [
        'dark-circles',
        'redness',
      ]);
      expect(json.alerts).toContainEqual(expect.objectContaining({ type: 'skin_tone_nutrition' }));
    });

    it('skinConcerns가 빈 배열이면 피부톤 영양 알림을 생성하지 않는다', async () => {
      const noConcernsResult = {
        ...mockMakeupAnalysisResult,
        concerns: [] as string[],
      };
      vi.mocked(generateMockMakeupAnalysisResult).mockReturnValue(
        noConcernsResult as unknown as MakeupAnalysisResult
      );

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      await response.json();

      expect(createSkinToneNutritionAlert).not.toHaveBeenCalled();
    });

    it('탄력 proxy가 60 미만이면 콜라겐 알림을 생성한다', async () => {
      // skinTexture=40, hydration=40 -> proxy=(40+40)/2=40 < 60
      const lowElasticityResult = {
        ...mockMakeupAnalysisResult,
        metrics: mockMakeupAnalysisResult.metrics.map((m) => {
          if (m.id === 'skinTexture') return { ...m, value: 40 };
          if (m.id === 'hydration') return { ...m, value: 40 };
          return m;
        }),
      };
      vi.mocked(generateMockMakeupAnalysisResult).mockReturnValue(lowElasticityResult);

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(createCollagenBoostAlert).toHaveBeenCalledWith(40);
      expect(json.alerts).toContainEqual(expect.objectContaining({ type: 'collagen_boost' }));
    });

    it('탄력 proxy가 60 이상이면 콜라겐 알림을 생성하지 않는다', async () => {
      // 기본 mock: skinTexture=75, hydration=65 -> proxy=(75+65)/2=70 >= 60
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      await response.json();

      expect(createCollagenBoostAlert).not.toHaveBeenCalled();
    });
  });
});

describe('GET /api/analyze/makeup', () => {
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
      expect(json.error).toBe('인증이 필요합니다.');
      expect(json.code).toBe('UNAUTHORIZED');
    });
  });

  describe('데이터 조회', () => {
    it('분석 목록을 반환한다', async () => {
      const mockData = [mockDbResult, { ...mockDbResult, id: 'makeup-456' }];

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

    it('DB 에러 시 dbError를 반환한다', async () => {
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
      expect(json.error).toBe('분석 목록을 불러올 수 없습니다.');
      expect(json.code).toBe('DB_ERROR');
    });
  });
});
