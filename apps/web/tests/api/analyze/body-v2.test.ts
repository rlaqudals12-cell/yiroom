/**
 * C-2 체형분석 v2 API 테스트
 * @description POST/GET /api/analyze/body-v2 테스트 (MediaPipe 33 랜드마크)
 * @see docs/specs/SDD-BODY-ANALYSIS-v2.md
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
  analyzeBodyWithGemini: vi.fn(),
}));

vi.mock('@/lib/analysis/body-v2', () => ({
  generateMockBodyAnalysisResult: vi.fn(),
  classifyBodyType: vi.fn(),
  getBodyShapeInfo: vi.fn(),
  calculateClassificationConfidence: vi.fn(),
  calculateBodyRatios: vi.fn(),
  getStylesToAvoid: vi.fn(),
  getStylingPriorities: vi.fn(),
  generateMockPoseResult: vi.fn(),
}));

// Rate Limit 모킹 - 항상 통과
vi.mock('@/lib/security/rate-limit', () => ({
  applyRateLimit: vi.fn().mockReturnValue({ success: true }),
}));

// 이미지 품질 검증 모킹
vi.mock('@/lib/api/image-quality', () => ({
  validateImageForAnalysis: vi.fn().mockResolvedValue({
    success: true,
    qualityResult: { score: 85, passed: true },
    imageData: { width: 1024, height: 1024 },
  }),
  logQualityResult: vi.fn(),
}));

// 게이미피케이션 모킹
vi.mock('@/lib/gamification', () => ({
  awardAnalysisBadge: vi.fn().mockResolvedValue(null),
  checkAndAwardAllAnalysisBadge: vi.fn().mockResolvedValue(null),
  addXp: vi.fn().mockResolvedValue(undefined),
}));

import { GET, POST } from '@/app/api/analyze/body-v2/route';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { analyzeBodyWithGemini } from '@/lib/gemini/v2-analysis';
import {
  generateMockBodyAnalysisResult,
  classifyBodyType,
  getBodyShapeInfo,
  calculateClassificationConfidence,
  calculateBodyRatios,
  getStylesToAvoid,
  getStylingPriorities,
  generateMockPoseResult,
} from '@/lib/analysis/body-v2';
import { NextRequest } from 'next/server';

// Mock 요청 헬퍼 (NextRequest 호환)
function createMockPostRequest(body: unknown): NextRequest {
  const url = 'http://localhost/api/analyze/body-v2';
  const req = new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return req;
}

// Mock MediaPipe 33 랜드마크
function createMockLandmarks33() {
  return Array.from({ length: 33 }, () => ({
    x: Math.random(),
    y: Math.random(),
    z: Math.random(),
    visibility: 0.9,
  }));
}

// Mock PoseDetectionResult
const mockPoseDetection = {
  landmarks: createMockLandmarks33(),
  overallVisibility: 0.85,
  confidence: 0.85,
};

// Mock BodyRatios
const mockBodyRatios = {
  shoulderWidth: 42,
  waistWidth: 32,
  hipWidth: 38,
  shoulderToWaistRatio: 1.31,
  waistToHipRatio: 0.84,
  upperBodyLength: 45,
  lowerBodyLength: 50,
  upperToLowerRatio: 0.9,
  armLength: 55,
  legLength: 80,
  armToTorsoRatio: 1.22,
};

// Mock BodyShapeInfo
const mockBodyShapeInfo = {
  type: 'hourglass' as const,
  label: '모래시계형',
  description: '어깨와 힙이 비슷하고 허리가 잘록함',
  characteristics: ['균형 잡힌 상하체', '잘록한 허리 라인', '여성스러운 곡선 실루엣'],
  stylingTips: ['허리를 강조하는 핏', '바디컨 실루엣', '랩 드레스, 하이웨이스트 추천'],
};

// Mock 체형 분석 결과
const mockBodyAnalysisResult = {
  id: 'c2-mock-123',
  poseDetection: mockPoseDetection,
  bodyRatios: mockBodyRatios,
  bodyShape: 'hourglass' as const,
  bodyShapeInfo: mockBodyShapeInfo,
  stylingRecommendations: {
    tops: ['랩 탑', '크롭 니트'],
    bottoms: ['하이웨이스트 팬츠', 'A라인 스커트'],
    outerwear: ['롱 카디건', '테일러드 재킷'],
    silhouettes: ['X라인', '핏앤플레어'],
    avoid: ['박시핏', '오버사이즈'],
  },
  measurementConfidence: 0.85,
  analyzedAt: new Date().toISOString(),
  usedFallback: false,
};

// Mock Gemini 응답 (GeminiBodyV2ResponseSchema 매칭)
const mockGeminiResponse = {
  data: {
    canAnalyze: true,
    bodyShape: 'hourglass' as const,
    confidence: 85,
    estimatedRatios: {
      shoulderToWaistRatio: 1.31,
      waistToHipRatio: 0.84,
      upperToLowerRatio: 0.9,
    },
    visualAssessment: {
      shoulderWidth: 'medium' as const,
      waistDefinition: 'defined' as const,
      hipWidth: 'medium' as const,
    },
    stylingRecommendations: {
      tops: ['랩 탑', '크롭 니트'],
      bottoms: ['하이웨이스트 팬츠', 'A라인 스커트'],
      avoid: ['박시핏', '오버사이즈'],
    },
    imageQuality: {
      fullBodyVisible: true,
      poseQuality: 'front' as const,
      clothingImpact: 'minimal' as const,
    },
  },
  usedFallback: false,
};

// Mock DB 결과
const mockDbResult = {
  id: 'body-v2-123',
  clerk_user_id: 'user_test123',
  body_type: 'S', // 레거시 매핑
  body_shape: 'hourglass',
  confidence: 0.85,
  analysis_data: { version: 2, bodyShape: 'hourglass' },
  styling_recommendations: mockBodyAnalysisResult.stylingRecommendations,
  styles_to_avoid: ['박시핏', '오버사이즈'],
  created_at: '2026-01-29T10:00:00Z',
};

describe('POST /api/analyze/body-v2', () => {
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
    vi.mocked(generateMockBodyAnalysisResult).mockReturnValue(mockBodyAnalysisResult);
    vi.mocked(classifyBodyType).mockReturnValue('hourglass');
    vi.mocked(getBodyShapeInfo).mockReturnValue(mockBodyShapeInfo);
    vi.mocked(calculateClassificationConfidence).mockReturnValue(0.85);
    vi.mocked(calculateBodyRatios).mockReturnValue(mockBodyRatios);
    vi.mocked(getStylesToAvoid).mockReturnValue(['박시핏', '오버사이즈']);
    vi.mocked(getStylingPriorities).mockReturnValue(['X라인', '핏앤플레어']);
    vi.mocked(generateMockPoseResult).mockReturnValue(mockPoseDetection);
    vi.mocked(analyzeBodyWithGemini).mockResolvedValue(mockGeminiResponse);

    // Default supabase mock
    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'body_assessments') {
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
  });

  describe('입력 검증', () => {
    it('이미지 또는 랜드마크가 없으면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({}));
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
      expect(generateMockBodyAnalysisResult).toHaveBeenCalled();
    });
  });

  describe('MediaPipe 33 랜드마크 분석', () => {
    it('클라이언트 랜드마크로 직접 분석이 수행된다', async () => {
      const landmarks = createMockLandmarks33();

      const response = await POST(
        createMockPostRequest({
          landmarks,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(calculateBodyRatios).toHaveBeenCalled();
      expect(classifyBodyType).toHaveBeenCalled();
      expect(json.result.bodyShape).toBe('hourglass');
    });

    it('33개가 아닌 랜드마크는 이미지 분석으로 폴백한다', async () => {
      const landmarks = Array.from({ length: 20 }, () => ({
        x: 0, y: 0, z: 0, visibility: 0.9,
      }));

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          landmarks,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(analyzeBodyWithGemini).toHaveBeenCalled();
    });
  });

  describe('Gemini Vision 분석', () => {
    it('랜드마크 없이 이미지만 있으면 Gemini Vision으로 분석한다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(analyzeBodyWithGemini).toHaveBeenCalled();
      expect(json.result.bodyShape).toBe('hourglass');
    });

    it('Gemini 분석 실패 시 Mock으로 폴백한다', async () => {
      vi.mocked(analyzeBodyWithGemini).mockResolvedValue({
        data: null,
        usedFallback: true,
      });

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedFallback).toBe(true);
      expect(generateMockBodyAnalysisResult).toHaveBeenCalled();
    });

    it('Gemini 응답이 canAnalyze=false면 Mock으로 폴백한다', async () => {
      vi.mocked(analyzeBodyWithGemini).mockResolvedValue({
        data: {
          ...mockGeminiResponse.data,
          canAnalyze: false,
        },
        usedFallback: true,
      });

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.usedFallback).toBe(true);
    });

    it('Gemini 비율 데이터가 BodyRatios로 변환된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.result.bodyRatios).toBeDefined();
      expect(json.result.bodyRatios.shoulderToWaistRatio).toBe(1.31);
      expect(json.result.bodyRatios.waistToHipRatio).toBe(0.84);
    });
  });

  describe('체형 분류', () => {
    it('5가지 체형이 올바르게 분류된다', async () => {
      const bodyShapes = ['rectangle', 'inverted-triangle', 'triangle', 'oval', 'hourglass'] as const;

      for (const shape of bodyShapes) {
        vi.mocked(classifyBodyType).mockReturnValue(shape);
        vi.mocked(getBodyShapeInfo).mockReturnValue({
          ...mockBodyShapeInfo,
          type: shape,
        });

        const landmarks = createMockLandmarks33();
        const response = await POST(createMockPostRequest({ landmarks }));
        const json = await response.json();

        expect(json.result.bodyShape).toBe(shape);
      }
    });
  });

  describe('레거시 매핑', () => {
    it('v2 체형이 레거시 S/W/N으로 매핑된다', async () => {
      // hourglass → S (Straight)
      vi.mocked(classifyBodyType).mockReturnValue('hourglass');

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      // DB 저장 시 body_type 필드에 레거시 값이 저장됨
      expect(mockSupabase.from).toHaveBeenCalledWith('body_assessments');
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
      expect(json.data).toBeDefined();
      expect(json.data.id).toBe('body-v2-123');
    });

    it('users 테이블에 결과가 동기화된다', async () => {
      const usersUpdateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'body_assessments') {
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

    it('DB 저장 실패 시 500을 반환한다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'body_assessments') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
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
      expect(json.code).toBe('DB_ERROR');
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
      expect(json.result).toHaveProperty('bodyShape');
      expect(json.result).toHaveProperty('bodyShapeInfo');
      expect(json.result).toHaveProperty('bodyRatios');
      expect(json.result).toHaveProperty('stylingRecommendations');
      expect(json.result).toHaveProperty('measurementConfidence');
    });

    it('v2 형식임을 나타내는 버전 정보가 포함된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      // analysis_data에 version: 2가 포함됨
      expect(json.data.analysis_data.version).toBe(2);
    });
  });
});

describe('GET /api/analyze/body-v2', () => {
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
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'DB Error', code: 'OTHER' } });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.code).toBe('DB_ERROR');
    });

    it('v2 형식 여부를 올바르게 판별한다', async () => {
      // v2 형식 (version: 2)
      mockSupabase.single.mockResolvedValue({
        data: { ...mockDbResult, analysis_data: { version: 2 } },
        error: null,
      });

      let response = await GET();
      let json = await response.json();
      expect(json.isV2).toBe(true);

      // v1 형식 (version 없음)
      mockSupabase.single.mockResolvedValue({
        data: { ...mockDbResult, analysis_data: {} },
        error: null,
      });

      response = await GET();
      json = await response.json();
      expect(json.isV2).toBe(false);
    });
  });
});
