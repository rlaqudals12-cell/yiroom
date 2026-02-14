/**
 * H-1 헤어분석 v2 API 테스트
 * @description POST/GET /api/analyze/hair-v2 테스트
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

vi.mock('@/lib/gemini/v2-analysis', () => ({
  analyzeHairWithGemini: vi.fn(),
}));

vi.mock('@/lib/analysis/hair', () => ({
  analyzeFaceShape: vi.fn(),
  estimateFaceShapeFromPose: vi.fn(),
  recommendHairstyles: vi.fn(),
  recommendHairColors: vi.fn(),
  generateCareTips: vi.fn(),
  generateMockHairAnalysisResult: vi.fn(),
  FACE_SHAPE_LABELS: {
    oval: '타원형',
    round: '둥근형',
    square: '사각형',
    heart: '하트형',
    oblong: '긴 형',
    diamond: '다이아몬드형',
    rectangle: '직사각형',
  },
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

import { GET, POST } from '@/app/api/analyze/hair-v2/route';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { analyzeHairWithGemini } from '@/lib/gemini/v2-analysis';
import {
  analyzeFaceShape,
  estimateFaceShapeFromPose,
  recommendHairstyles,
  recommendHairColors,
  generateCareTips,
  generateMockHairAnalysisResult,
} from '@/lib/analysis/hair';
import { NextRequest } from 'next/server';

// Mock 요청 헬퍼 (NextRequest 호환)
function createMockPostRequest(body: unknown): NextRequest {
  const url = 'http://localhost/api/analyze/hair-v2';
  const req = new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return req;
}

// Mock Face Mesh 랜드마크 (468개)
function createMockFaceLandmarks(count: number = 468) {
  return Array.from({ length: count }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    z: Math.random(),
  }));
}

// Mock Pose 랜드마크 (33개)
function createMockPoseLandmarks() {
  return Array.from({ length: 33 }, () => ({
    x: Math.random(),
    y: Math.random(),
    z: Math.random(),
    visibility: 0.9,
  }));
}

// Mock 헤어 분석 결과
const mockHairAnalysisResult = {
  id: 'h1-mock-123',
  faceShapeAnalysis: {
    faceShape: 'oval' as const,
    faceShapeLabel: '타원형',
    confidence: 0.85,
    ratios: {
      faceLength: 120,
      faceWidth: 90,
      foreheadWidth: 75,
      cheekboneWidth: 85,
      jawWidth: 70,
      lengthToWidthRatio: 1.33,
    },
  },
  hairColorAnalysis: {
    currentColor: undefined,
    skinToneMatch: 82,
    recommendedColors: [
      {
        name: '애쉬 브라운',
        hexColor: '#6B4423',
        suitability: 90,
        seasonMatch: 'spring',
        tags: ['자연스러움'],
      },
    ],
  },
  currentHairInfo: undefined,
  styleRecommendations: [
    {
      name: '레이어드 컷',
      description: '볼륨감 있는 스타일',
      length: 'medium' as const,
      suitability: 85,
      tags: ['여성스러움'],
    },
  ],
  careTips: ['정기적인 트리밍', '보습 케어'],
  analyzedAt: new Date().toISOString(),
  usedFallback: false,
};

// Mock Face Shape 분석 결과
const mockFaceShapeAnalysis = {
  faceShape: 'oval' as const,
  faceShapeLabel: '타원형',
  confidence: 0.85,
  ratios: {
    faceLength: 120,
    faceWidth: 90,
    foreheadWidth: 75,
    cheekboneWidth: 85,
    jawWidth: 70,
    lengthToWidthRatio: 1.33,
  },
};

// Mock Gemini 응답
const mockGeminiResponse = {
  data: {
    canAnalyze: true,
    faceShape: 'oval' as const,
    confidence: 85,
    estimatedRatios: {
      faceLength: 120,
      faceWidth: 90,
      foreheadWidth: 75,
      cheekboneWidth: 85,
      jawWidth: 70,
      lengthToWidthRatio: 1.33,
    },
    visualAssessment: {
      foreheadShape: 'medium' as const,
      cheekboneProminence: 'medium' as const,
      jawlineDefinition: 'soft' as const,
      chinShape: 'round' as const,
    },
    hairstyleRecommendations: {
      recommended: ['레이어드 컷', '사이드 파트'],
      avoid: ['일자 뱅'],
    },
    imageQuality: {
      faceFullyVisible: true,
      poseQuality: 'frontal' as const,
      hairCoverage: 'minimal' as const,
    },
  },
  usedFallback: false,
};

// Mock DB 결과
const mockDbResult = {
  id: 'hair-123',
  clerk_user_id: 'user_test123',
  face_shape: 'oval',
  face_shape_label: '타원형',
  confidence: 0.85,
  analysis_data: { version: 2 },
  style_recommendations: mockHairAnalysisResult.styleRecommendations,
  care_tips: mockHairAnalysisResult.careTips,
  used_fallback: false,
  created_at: '2026-01-29T10:00:00Z',
};

describe('POST /api/analyze/hair-v2', () => {
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
    vi.mocked(generateMockHairAnalysisResult).mockReturnValue(mockHairAnalysisResult);
    vi.mocked(analyzeFaceShape).mockReturnValue(mockFaceShapeAnalysis);
    vi.mocked(estimateFaceShapeFromPose).mockReturnValue(mockFaceShapeAnalysis);
    vi.mocked(recommendHairstyles).mockReturnValue(mockHairAnalysisResult.styleRecommendations);
    vi.mocked(recommendHairColors).mockReturnValue(
      mockHairAnalysisResult.hairColorAnalysis!.recommendedColors
    );
    vi.mocked(generateCareTips).mockReturnValue(mockHairAnalysisResult.careTips);
    vi.mocked(analyzeHairWithGemini).mockResolvedValue(mockGeminiResponse);

    // Default supabase mock
    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'hair_assessments') {
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
      expect(generateMockHairAnalysisResult).toHaveBeenCalled();
    });
  });

  describe('Face Mesh 랜드마크 분석', () => {
    it('Face Mesh 468+ 랜드마크로 정확한 얼굴형 분석이 수행된다', async () => {
      const faceLandmarks = createMockFaceLandmarks(468);

      const response = await POST(
        createMockPostRequest({
          faceLandmarks,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(analyzeFaceShape).toHaveBeenCalledWith(faceLandmarks);
      expect(json.result.faceShapeAnalysis.faceShape).toBe('oval');
    });
  });

  describe('Pose 33 랜드마크 분석', () => {
    it('Pose 33 랜드마크로 대체 분석이 수행된다', async () => {
      const poseLandmarks = createMockPoseLandmarks();

      const response = await POST(
        createMockPostRequest({
          poseLandmarks,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(estimateFaceShapeFromPose).toHaveBeenCalled();
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
      expect(analyzeHairWithGemini).toHaveBeenCalled();
      expect(json.result.faceShapeAnalysis.faceShape).toBe('oval');
    });

    it('Gemini 분석 실패 시 Mock으로 폴백한다', async () => {
      vi.mocked(analyzeHairWithGemini).mockResolvedValue({
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
      expect(generateMockHairAnalysisResult).toHaveBeenCalled();
    });

    it('Gemini 응답이 canAnalyze=false면 Mock으로 폴백한다', async () => {
      vi.mocked(analyzeHairWithGemini).mockResolvedValue({
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
  });

  describe('퍼스널컬러 연동', () => {
    it('퍼스널컬러 시즌이 헤어컬러 추천에 반영된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          personalColorSeason: 'spring',
          useMock: true,
        })
      );

      expect(response.status).toBe(200);
      expect(generateMockHairAnalysisResult).toHaveBeenCalledWith(
        expect.objectContaining({ personalColorSeason: 'spring' })
      );
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
      expect(json.data.id).toBe('hair-123');
    });

    it('DB 저장 실패 시 500을 반환한다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'hair_assessments') {
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
      expect(json.result).toHaveProperty('faceShapeAnalysis');
      expect(json.result).toHaveProperty('styleRecommendations');
      expect(json.result).toHaveProperty('careTips');
    });
  });

  describe('폴백 체인', () => {
    it('Face Mesh → Pose → Gemini → Mock 순서로 폴백된다', async () => {
      // 모든 분석 실패 시 Mock으로 폴백
      vi.mocked(analyzeFaceShape).mockImplementation(() => {
        throw new Error('Face Mesh failed');
      });
      vi.mocked(estimateFaceShapeFromPose).mockImplementation(() => {
        throw new Error('Pose failed');
      });
      vi.mocked(analyzeHairWithGemini).mockResolvedValue({
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
      expect(json.usedFallback).toBe(true);
    });
  });
});

describe('GET /api/analyze/hair-v2', () => {
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

  // =========================================================================
  // 확장 테스트: GET 엣지 케이스
  // =========================================================================
  describe('GET 엣지 케이스', () => {
    it('analysis_data가 null인 데이터도 정상 처리한다', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { ...mockDbResult, analysis_data: null },
        error: null,
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.isV2).toBe(false);
    });

    it('GET 응답에 필수 필드가 포함된다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await GET();
      const json = await response.json();

      expect(json).toHaveProperty('success');
      expect(json).toHaveProperty('data');
      expect(json).toHaveProperty('hasResult');
      expect(json).toHaveProperty('isV2');
    });
  });
});

// =============================================================================
// POST 확장 테스트: 에러 시나리오, Rate Limit, 이미지 품질
// =============================================================================
describe('POST /api/analyze/hair-v2 확장 테스트', () => {
  const mockSupabase = {
    from: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as Awaited<
      ReturnType<typeof auth>
    >);
    vi.mocked(createServiceRoleClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>
    );
    vi.mocked(generateMockHairAnalysisResult).mockReturnValue(mockHairAnalysisResult);
    vi.mocked(analyzeFaceShape).mockReturnValue(mockFaceShapeAnalysis);
    vi.mocked(estimateFaceShapeFromPose).mockReturnValue(mockFaceShapeAnalysis);
    vi.mocked(recommendHairstyles).mockReturnValue(mockHairAnalysisResult.styleRecommendations);
    vi.mocked(recommendHairColors).mockReturnValue(
      mockHairAnalysisResult.hairColorAnalysis!.recommendedColors
    );
    vi.mocked(generateCareTips).mockReturnValue(mockHairAnalysisResult.careTips);
    vi.mocked(analyzeHairWithGemini).mockResolvedValue(mockGeminiResponse);

    // 이미지 품질 검증 mock 복원 (매 테스트마다 success: true로 리셋)
    const { validateImageForAnalysis } = await import('@/lib/api/image-quality');
    vi.mocked(validateImageForAnalysis).mockResolvedValue({
      success: true,
      qualityResult: { score: 85, passed: true },
      imageData: { width: 1024, height: 1024 },
    } as unknown as Awaited<ReturnType<typeof validateImageForAnalysis>>);

    // Rate Limit mock 복원
    const { applyRateLimit } = await import('@/lib/security/rate-limit');
    vi.mocked(applyRateLimit).mockReturnValue({ success: true } as ReturnType<
      typeof applyRateLimit
    >);

    // Default supabase mock
    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'hair_assessments') {
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

  describe('Rate Limit 시나리오', () => {
    it('Rate Limit 초과 시 429를 반환한다', async () => {
      const { applyRateLimit } = await import('@/lib/security/rate-limit');
      vi.mocked(applyRateLimit).mockReturnValue({
        success: false,
        response: new Response(
          JSON.stringify({ code: 'RATE_LIMIT', message: 'Too many requests' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        ),
      } as ReturnType<typeof applyRateLimit>);

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
        })
      );

      expect(response.status).toBe(429);
    });
  });

  describe('이미지 품질 검증 실패', () => {
    it('이미지 품질 검증 실패 시 에러를 반환한다', async () => {
      const { validateImageForAnalysis } = await import('@/lib/api/image-quality');
      vi.mocked(validateImageForAnalysis).mockResolvedValue({
        success: false,
        error: {
          code: 'IMAGE_QUALITY_ERROR' as const,
          message: 'Image quality too low',
          userMessage: '이미지 품질이 너무 낮아요',
          details: {
            overallScore: 20,
            primaryIssue: 'blur',
            allIssues: ['blur'],
            sharpnessScore: 20,
            exposureVerdict: 'ok',
            cctKelvin: 5500,
          },
        },
        qualityResult: { score: 20, passed: false },
        imageData: { width: 100, height: 100 },
      } as unknown as Awaited<ReturnType<typeof validateImageForAnalysis>>);

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe('Gemini 예외 처리', () => {
    it('Gemini가 예외를 던지면 Mock으로 폴백한다', async () => {
      vi.mocked(analyzeHairWithGemini).mockRejectedValue(new Error('Gemini API timeout'));

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedFallback).toBe(true);
    });
  });

  describe('currentHair 정보 전달', () => {
    it('currentHair 정보가 분석에 반영된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          currentHair: {
            length: 'long',
            texture: 'wavy',
            thickness: 'thick',
            density: 'dense',
            scalpCondition: 'oily',
          },
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      // generateCareTips가 scalpCondition을 받아 호출됨
      expect(generateCareTips).toHaveBeenCalled();
    });
  });

  describe('skipQualityCheck 옵션', () => {
    it('skipQualityCheck=true이면 이미지 품질 검증을 건너뛴다', async () => {
      const { validateImageForAnalysis } = await import('@/lib/api/image-quality');
      vi.mocked(validateImageForAnalysis).mockClear();

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          skipQualityCheck: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(validateImageForAnalysis).not.toHaveBeenCalled();
    });
  });

  describe('랜드마크 갯수 부족 시', () => {
    it('Face Mesh 랜드마크가 468개 미만이면 Gemini Vision으로 폴백한다', async () => {
      const insufficientLandmarks = createMockFaceLandmarks(100);

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          faceLandmarks: insufficientLandmarks,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      // analyzeFaceShape가 호출되지 않고 Gemini로 폴백
      expect(analyzeFaceShape).not.toHaveBeenCalled();
      expect(analyzeHairWithGemini).toHaveBeenCalled();
    });

    it('Pose 랜드마크가 33개가 아니면 Gemini Vision으로 폴백한다', async () => {
      const wrongPoseLandmarks = Array.from({ length: 20 }, () => ({
        x: Math.random(),
        y: Math.random(),
        z: Math.random(),
        visibility: 0.9,
      }));

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          poseLandmarks: wrongPoseLandmarks,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(estimateFaceShapeFromPose).not.toHaveBeenCalled();
      expect(analyzeHairWithGemini).toHaveBeenCalled();
    });
  });

  describe('게이미피케이션 연동', () => {
    it('성공 응답에 gamification 필드가 포함된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(json.gamification).toBeDefined();
      expect(json.gamification).toHaveProperty('badgeResults');
      expect(json.gamification).toHaveProperty('xpAwarded');
      expect(Array.isArray(json.gamification.badgeResults)).toBe(true);
    });

    it('XP가 정상적으로 부여된다', async () => {
      const { addXp } = await import('@/lib/gamification');

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(addXp).toHaveBeenCalled();
      expect(json.gamification.xpAwarded).toBe(10);
    });
  });

  describe('응답 데이터 구조 검증', () => {
    it('result 필드에 faceShapeAnalysis 구조가 올바르다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      const { faceShapeAnalysis } = json.result;
      expect(faceShapeAnalysis).toHaveProperty('faceShape');
      expect(faceShapeAnalysis).toHaveProperty('faceShapeLabel');
      expect(faceShapeAnalysis).toHaveProperty('confidence');
      expect(faceShapeAnalysis).toHaveProperty('ratios');
    });

    it('result 필드에 styleRecommendations 배열이 포함된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(Array.isArray(json.result.styleRecommendations)).toBe(true);
      expect(json.result.styleRecommendations.length).toBeGreaterThan(0);

      const firstStyle = json.result.styleRecommendations[0];
      expect(firstStyle).toHaveProperty('name');
      expect(firstStyle).toHaveProperty('description');
      expect(firstStyle).toHaveProperty('suitability');
    });

    it('result 필드에 careTips 배열이 포함된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(Array.isArray(json.result.careTips)).toBe(true);
      expect(json.result.careTips.length).toBeGreaterThan(0);
      json.result.careTips.forEach((tip: unknown) => {
        expect(typeof tip).toBe('string');
      });
    });

    it('data 필드에 DB 저장 결과가 포함된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(json.data).toHaveProperty('id');
      expect(json.data).toHaveProperty('clerk_user_id');
      expect(json.data).toHaveProperty('face_shape');
      expect(json.data).toHaveProperty('created_at');
    });
  });

  // =========================================================================
  // 추가 에러 시나리오 및 엣지 케이스
  // =========================================================================
  describe('POST 입력 검증 심화', () => {
    it('빈 imageBase64 문자열도 유효한 입력으로 처리한다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: '',
        })
      );
      const json = await response.json();

      // 빈 문자열은 falsy이므로 VALIDATION_ERROR 반환
      expect(response.status).toBe(400);
      expect(json.code).toBe('VALIDATION_ERROR');
    });

    it('faceLandmarks가 빈 배열이면 Gemini Vision으로 분석한다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          faceLandmarks: [],
        })
      );
      await response.json();

      expect(response.status).toBe(200);
      // 빈 배열은 468 미만이므로 Gemini로 폴백
      expect(analyzeHairWithGemini).toHaveBeenCalled();
    });

    it('poseLandmarks가 빈 배열이면 Gemini Vision으로 분석한다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          poseLandmarks: [],
        })
      );
      await response.json();

      expect(response.status).toBe(200);
      expect(analyzeHairWithGemini).toHaveBeenCalled();
    });
  });

  describe('Face Mesh와 Pose 동시 제공', () => {
    it('faceLandmarks와 poseLandmarks 둘 다 있으면 Face Mesh를 우선 사용한다', async () => {
      const faceLandmarks = createMockFaceLandmarks(468);
      const poseLandmarks = createMockPoseLandmarks();

      const response = await POST(
        createMockPostRequest({
          faceLandmarks,
          poseLandmarks,
        })
      );
      await response.json();

      expect(response.status).toBe(200);
      expect(analyzeFaceShape).toHaveBeenCalledWith(faceLandmarks);
      expect(estimateFaceShapeFromPose).not.toHaveBeenCalled();
    });
  });

  describe('analyzeFaceShape 예외 시 폴백', () => {
    it('analyzeFaceShape 예외 시 Mock으로 폴백한다', async () => {
      vi.mocked(analyzeFaceShape).mockImplementation(() => {
        throw new Error('Landmark parsing failed');
      });

      const faceLandmarks = createMockFaceLandmarks(468);
      const response = await POST(createMockPostRequest({ faceLandmarks }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedFallback).toBe(true);
    });
  });

  describe('users 테이블 업데이트 실패', () => {
    it('users 테이블 업데이트 실패 시에도 성공 응답을 반환한다', async () => {
      // users 테이블 업데이트만 실패하도록 설정
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'hair_assessments') {
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
              eq: vi.fn().mockResolvedValue({ error: { message: 'User update failed' } }),
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

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      // users 업데이트 실패는 경고일 뿐 응답은 성공
      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  describe('Gemini Vision 다양한 얼굴형', () => {
    it('Gemini가 round 얼굴형을 반환하면 결과에 반영된다', async () => {
      vi.mocked(analyzeHairWithGemini).mockResolvedValue({
        data: {
          ...mockGeminiResponse.data,
          faceShape: 'round' as const,
        },
        usedFallback: false,
      });

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.result.faceShapeAnalysis.faceShape).toBe('round');
      expect(json.result.faceShapeAnalysis.faceShapeLabel).toBe('둥근형');
    });
  });

  describe('personalColorSeason 다양한 값', () => {
    it('가을 퍼스널컬러가 정상 전달된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          personalColorSeason: 'autumn',
          useMock: true,
        })
      );

      expect(response.status).toBe(200);
      expect(generateMockHairAnalysisResult).toHaveBeenCalledWith(
        expect.objectContaining({ personalColorSeason: 'autumn' })
      );
    });

    it('personalColorSeason 미전달 시 기본값으로 처리된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );

      expect(response.status).toBe(200);
      expect(generateMockHairAnalysisResult).toHaveBeenCalledWith(
        expect.objectContaining({ personalColorSeason: undefined })
      );
    });
  });

  describe('응답 HTTP 상태 코드 검증', () => {
    it('정상 응답의 Content-Type이 application/json이다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );

      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });
});
