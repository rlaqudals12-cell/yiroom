/**
 * S-2 피부분석 v2 API 테스트
 * @description POST/GET /api/analyze/skin-v2 테스트 (6존 고도화)
 * @see docs/specs/SDD-SKIN-ANALYSIS-v2.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock 모듈 설정
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/gemini/v2-analysis', () => ({
  analyzeSkinV2WithGemini: vi.fn(),
}));

vi.mock('@/lib/analysis/skin-v2', () => ({
  generateMockSkinAnalysisV2Result: vi.fn(),
}));

// Rate Limit 모킹 - 항상 통과
vi.mock('@/lib/security/rate-limit', () => ({
  applyRateLimit: vi.fn().mockReturnValue({ success: true }),
}));

// 이미지 파이프라인 모킹
vi.mock('@/lib/api/image-pipeline', () => ({
  runFullPipeline: vi.fn().mockResolvedValue({
    success: true,
    pipeline: { score: 85 },
  }),
  computeHybridTrust: vi.fn().mockReturnValue({
    overallTrust: 0.85,
    trustLevel: 'high',
  }),
}));

// 게이미피케이션 모킹
vi.mock('@/lib/gamification', () => ({
  awardAnalysisBadge: vi.fn().mockResolvedValue(null),
  checkAndAwardAllAnalysisBadge: vi.fn().mockResolvedValue(null),
  addXp: vi.fn().mockResolvedValue(undefined),
}));

// 캡슐 모킹
vi.mock('@/lib/capsule', () => ({
  updateBeautyProfileField: vi.fn().mockResolvedValue(undefined),
  mapSkinAssessment: vi.fn().mockReturnValue({}),
}));

import { GET, POST } from '@/app/api/analyze/skin-v2/route';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { analyzeSkinV2WithGemini } from '@/lib/gemini/v2-analysis';
import { generateMockSkinAnalysisV2Result } from '@/lib/analysis/skin-v2';
import { runFullPipeline } from '@/lib/api/image-pipeline';
import { NextRequest } from 'next/server';

// Mock 요청 헬퍼 (NextRequest 호환)
function createMockPostRequest(body: unknown): NextRequest {
  const url = 'http://localhost/api/analyze/skin-v2';
  const req = new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return req;
}

// Mock SkinAnalysisV2Result
const mockSkinAnalysisV2Result = {
  id: 's2-mock-123',
  skinType: 'combination' as const,
  vitalityScore: 72,
  vitalityGrade: 'B',
  scoreBreakdown: {
    hydration: 65,
    oilBalance: 70,
    sensitivity: 80,
    wrinkles: 75,
  },
  zoneAnalysis: {
    zones: [
      {
        zone: 'forehead',
        scores: { hydration: 60, oilBalance: 75 },
      },
    ],
    groupAverages: { tZone: 70, uZone: 65 },
    tUzoneDifference: 5,
  },
  primaryConcerns: ['dehydration', 'oiliness'],
  routineRecommendations: [
    {
      step: 1,
      category: 'cleanser',
      reason: '이중 세안',
      ingredients: ['salicylic acid'],
      avoidIngredients: ['alcohol'],
    },
  ],
  analyzedAt: new Date().toISOString(),
  usedFallback: false,
};

// Mock Gemini 응답
const mockGeminiResponse = {
  result: mockSkinAnalysisV2Result,
  usedFallback: false,
};

// Mock DB 저장 결과
const mockDbResult = {
  id: 'skin-v2-123',
  clerk_user_id: 'user_test123',
  skin_type: 'combination',
  scores: {
    version: 2,
    vitalityScore: 72,
    vitalityGrade: 'B',
    scoreBreakdown: { hydration: 65, oilBalance: 70, sensitivity: 80, wrinkles: 75 },
  },
  zone_details: {
    zones: [{ zone: 'forehead', scores: { hydration: 60, oilBalance: 75 } }],
    groupAverages: { tZone: 70, uZone: 65 },
    tUzoneDifference: 5,
  },
  concerns: ['dehydration', 'oiliness'],
  recommendations: [
    {
      step: 1,
      category: 'cleanser',
      reason: '이중 세안',
      ingredients: ['salicylic acid'],
      avoidIngredients: ['alcohol'],
    },
  ],
  created_at: '2026-01-29T10:00:00Z',
};

describe('POST /api/analyze/skin-v2', () => {
  const mockSupabase = {
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as Awaited<
      ReturnType<typeof auth>
    >);
    vi.mocked(createServiceRoleClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>
    );
    vi.mocked(generateMockSkinAnalysisV2Result).mockReturnValue(
      mockSkinAnalysisV2Result as unknown as ReturnType<typeof generateMockSkinAnalysisV2Result>
    );
    vi.mocked(analyzeSkinV2WithGemini).mockResolvedValue(
      mockGeminiResponse as unknown as Awaited<ReturnType<typeof analyzeSkinV2WithGemini>>
    );

    // Default supabase mock
    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'skin_assessments') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockDbResult, error: null }),
            }),
          }),
        };
      }
      if (table === 'users') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'user_levels') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'level-123', level: 1, current_xp: 0, total_xp: 0, tier: 'beginner' },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
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
  });

  describe('인증', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const response = await POST(createMockPostRequest({ imageBase64: 'test' }));
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.code).toBe('UNAUTHORIZED');
    });

    it('인증된 요청은 정상 처리된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );

      expect(response.status).toBe(200);
    });
  });

  describe('입력 검증', () => {
    it('이미지가 없으면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({}));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.code).toBe('VALIDATION_ERROR');
    });

    it('imageBase64가 빈 문자열이면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({ imageBase64: '' }));
      const json = await response.json();

      expect(response.status).toBe(400);
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
      expect(json.usedFallback).toBe(true);
      expect(generateMockSkinAnalysisV2Result).toHaveBeenCalled();
    });

    it('useMock=true이면 Gemini를 호출하지 않는다', async () => {
      await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );

      expect(analyzeSkinV2WithGemini).not.toHaveBeenCalled();
    });

    it('useMock=true이면 이미지 파이프라인을 건너뛴다', async () => {
      await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );

      expect(runFullPipeline).not.toHaveBeenCalled();
    });
  });

  describe('Gemini 분석', () => {
    it('Gemini Vision으로 피부 분석이 수행된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(analyzeSkinV2WithGemini).toHaveBeenCalledWith('data:image/jpeg;base64,/9j/test');
      expect(json.result.skinType).toBe('combination');
    });

    it('Gemini 분석 결과에 점수 분해가 포함된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
        })
      );
      const json = await response.json();

      expect(json.result.scoreBreakdown).toBeDefined();
      expect(json.result.scoreBreakdown.hydration).toBe(65);
      expect(json.result.scoreBreakdown.oilBalance).toBe(70);
      expect(json.result.scoreBreakdown.sensitivity).toBe(80);
      expect(json.result.scoreBreakdown.wrinkles).toBe(75);
    });

    it('Gemini 분석 실패 시 Mock으로 폴백한다', async () => {
      vi.mocked(analyzeSkinV2WithGemini).mockRejectedValue(new Error('Gemini timeout'));

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedFallback).toBe(true);
      expect(generateMockSkinAnalysisV2Result).toHaveBeenCalled();
    });

    it('Gemini 결과의 usedFallback이 전파된다', async () => {
      vi.mocked(analyzeSkinV2WithGemini).mockResolvedValue({
        result: mockSkinAnalysisV2Result as unknown as ReturnType<
          typeof generateMockSkinAnalysisV2Result
        >,
        usedFallback: true,
      } as unknown as Awaited<ReturnType<typeof analyzeSkinV2WithGemini>>);

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
        })
      );
      const json = await response.json();

      expect(json.usedFallback).toBe(true);
    });
  });

  describe('이미지 파이프라인', () => {
    it('이미지 품질 검증 파이프라인이 실행된다', async () => {
      await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
        })
      );

      expect(runFullPipeline).toHaveBeenCalledWith('data:image/jpeg;base64,/9j/test', {
        minScore: 40,
        allowWarnings: true,
      });
    });

    it('skipQualityCheck=true이면 파이프라인을 건너뛴다', async () => {
      await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          skipQualityCheck: true,
        })
      );

      expect(runFullPipeline).not.toHaveBeenCalled();
    });

    it('이미지 품질 검증 실패 시 에러를 반환한다', async () => {
      vi.mocked(runFullPipeline).mockResolvedValue({
        success: false,
        error: {
          message: 'Image too blurry',
          userMessage: '이미지가 너무 흐릿합니다.',
        },
      } as never);

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/blurry',
        })
      );

      expect(response.status).not.toBe(200);
    });
  });

  describe('DB 저장', () => {
    it('분석 결과가 skin_assessments 테이블에 저장된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
      expect(json.data.id).toBe('skin-v2-123');
      expect(mockSupabase.from).toHaveBeenCalledWith('skin_assessments');
    });

    it('users 테이블에 결과가 동기화된다', async () => {
      const usersUpdateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'skin_assessments') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockDbResult, error: null }),
              }),
            }),
          };
        }
        if (table === 'users') {
          return { update: usersUpdateMock };
        }
        if (table === 'user_levels') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { level: 1 }, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return { select: vi.fn().mockReturnThis() };
      });

      await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );

      expect(usersUpdateMock).toHaveBeenCalled();
    });

    it('DB 저장 실패 시 분석 결과는 반환하되 dbSaveFailed 플래그를 포함한다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'skin_assessments') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'DB Error' },
                }),
              }),
            }),
          };
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
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
      expect(json.dbSaveFailed).toBe(true);
      expect(json.result).toBeDefined();
    });

    it('DB 저장 실패 시 gamification xpAwarded는 0이다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'skin_assessments') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'DB Error' },
                }),
              }),
            }),
          };
        }
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
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

      expect(json.gamification.xpAwarded).toBe(0);
    });
  });

  describe('게이미피케이션', () => {
    it('분석 완료 시 XP가 부여된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.gamification).toBeDefined();
      expect(json.gamification.xpAwarded).toBe(10);
    });

    it('분석 완료 시 뱃지 체크가 수행된다', async () => {
      const { awardAnalysisBadge, checkAndAwardAllAnalysisBadge } =
        await import('@/lib/gamification');

      await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );

      expect(awardAnalysisBadge).toHaveBeenCalled();
      expect(checkAndAwardAllAnalysisBadge).toHaveBeenCalled();
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
      expect(json).toHaveProperty('usedFallback');
      expect(json).toHaveProperty('gamification');
      expect(json).toHaveProperty('trust');
    });

    it('result에 v2 피부분석 필수 필드가 포함된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(json.result).toHaveProperty('skinType');
      expect(json.result).toHaveProperty('vitalityScore');
      expect(json.result).toHaveProperty('vitalityGrade');
      expect(json.result).toHaveProperty('scoreBreakdown');
      expect(json.result).toHaveProperty('zoneAnalysis');
      expect(json.result).toHaveProperty('primaryConcerns');
      expect(json.result).toHaveProperty('routineRecommendations');
    });

    it('zoneAnalysis에 6존 구조가 포함된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(json.result.zoneAnalysis).toHaveProperty('zones');
      expect(json.result.zoneAnalysis).toHaveProperty('groupAverages');
      expect(json.result.zoneAnalysis).toHaveProperty('tUzoneDifference');
      expect(json.result.zoneAnalysis.groupAverages).toHaveProperty('tZone');
      expect(json.result.zoneAnalysis.groupAverages).toHaveProperty('uZone');
    });

    it('routineRecommendations에 스텝 정보가 포함된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      const rec = json.result.routineRecommendations[0];
      expect(rec).toHaveProperty('step');
      expect(rec).toHaveProperty('category');
      expect(rec).toHaveProperty('reason');
      expect(rec).toHaveProperty('ingredients');
      expect(rec).toHaveProperty('avoidIngredients');
    });

    it('trust 정보에 overallTrust와 trustLevel이 포함된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(json.trust).toHaveProperty('overallTrust');
      expect(json.trust).toHaveProperty('trustLevel');
    });

    it('DB 저장된 scores에 version: 2가 포함된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.scores.version).toBe(2);
    });
  });
});

describe('GET /api/analyze/skin-v2', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
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
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.code).toBe('UNAUTHORIZED');
    });
  });

  describe('데이터 조회', () => {
    it('최근 분석 결과를 반환한다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toEqual(mockDbResult);
      expect(json.hasResult).toBe(true);
      expect(json.isV2).toBe(true);
    });

    it('분석 결과가 없으면 null을 반환한다', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeNull();
      expect(json.hasResult).toBe(false);
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'DB Error', code: 'OTHER' },
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.code).toBe('DB_ERROR');
    });

    it('v2 형식 여부를 올바르게 판별한다 (version: 2)', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockDbResult, scores: { version: 2 } },
        error: null,
      });

      const response = await GET();
      const json = await response.json();

      expect(json.isV2).toBe(true);
    });

    it('v1 형식은 isV2=false로 판별된다', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockDbResult, scores: {} },
        error: null,
      });

      const response = await GET();
      const json = await response.json();

      expect(json.isV2).toBe(false);
    });

    it('scores가 없는 데이터는 isV2=false로 판별된다', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockDbResult, scores: null },
        error: null,
      });

      const response = await GET();
      const json = await response.json();

      expect(json.isV2).toBe(false);
    });
  });
});
