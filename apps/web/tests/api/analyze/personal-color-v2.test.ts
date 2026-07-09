/**
 * PC-2 퍼스널컬러 v2 API 테스트
 * @description POST/GET /api/analyze/personal-color-v2 테스트 (Lab 12톤 시스템)
 * @see docs/specs/SDD-PERSONAL-COLOR-v2.md
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
  extractSkinColorWithGemini: vi.fn(),
  mapBrightnessToValueLevel: vi.fn().mockReturnValue('medium'),
  mapSaturationLevel: vi.fn().mockReturnValue('medium'),
}));

vi.mock('@/lib/analysis/personal-color-v2', () => ({
  classifyTone: vi.fn(),
  rgbToLab: vi.fn().mockReturnValue({ L: 65, a: 12, b: 15 }),
  generateMockResult: vi.fn(),
  getTonePalette: vi.fn(),
  getToneLabel: vi.fn().mockReturnValue('트루 스프링'),
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

// conditional-helpers 모킹
vi.mock('@/lib/utils/conditional-helpers', () => ({
  selectByKey: vi.fn().mockImplementation((key, map, def) => map[key] ?? def),
}));

// capsule 모킹 (dynamic import)
vi.mock('@/lib/capsule', () => ({
  updateBeautyProfileField: vi.fn().mockResolvedValue(undefined),
  mapPCAssessment: vi.fn().mockReturnValue({}),
}));

import { GET, POST } from '@/app/api/analyze/personal-color-v2/route';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { extractSkinColorWithGemini } from '@/lib/gemini/v2-analysis';
import {
  classifyTone,
  rgbToLab,
  generateMockResult,
  getTonePalette,
} from '@/lib/analysis/personal-color-v2';
import { NextRequest } from 'next/server';

// Mock 요청 헬퍼 (NextRequest 호환)
function createMockPostRequest(body: unknown): NextRequest {
  const url = 'http://localhost/api/analyze/personal-color-v2';
  const req = new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return req;
}

// Mock 분류 결과
const mockClassification = {
  season: 'spring' as const,
  undertone: 'warm' as const,
  tone: 'true-spring' as const,
  subtype: 'vivid',
  confidence: 85,
  measuredLab: { L: 65, a: 12, b: 15 },
};

// Mock 팔레트
const mockPalette = {
  mainColors: ['#FFD700', '#FF6347'],
  avoidColors: ['#000080', '#4B0082'],
  lipColors: ['코랄', '피치'],
  eyeshadowColors: ['골드', '브론즈'],
  blushColors: ['피치', '코랄'],
};

// Mock PersonalColorV2Result
const mockPersonalColorResult = {
  id: 'pc2-mock-123',
  classification: mockClassification,
  palette: mockPalette,
  detailedAnalysis: {
    // contrastLevel(퍼스널 대비)은 모발 실측값 — 미측정 시 생략(ADR-116)
    skinToneLab: { L: 65, a: 12, b: 15 },
    saturationLevel: 'medium' as const,
    valueLevel: 'medium' as const,
  },
  stylingRecommendations: {
    clothing: ['아이보리', '베이지'],
    metals: ['gold', 'rose-gold'] as ('gold' | 'silver' | 'rose-gold')[],
    jewelry: ['골드', '앰버'],
  },
  analyzedAt: new Date().toISOString(),
  usedFallback: false,
};

// Mock Gemini 추출 응답
const mockGeminiExtractResult = {
  data: {
    skinRgb: { r: 200, g: 160, b: 140 },
    brightnessLevel: 'medium' as const,
    saturationLevel: 'medium' as const,
  },
  usedFallback: false,
};

// Mock DB 결과
const mockDbResult = {
  id: 'pc-v2-db-123',
  clerk_user_id: 'user_test123',
  season: 'Spring',
  undertone: 'Warm',
  confidence: 85,
  image_analysis: {
    version: 2,
    tone: 'true-spring',
    toneLabel: '트루 스프링',
    subtype: 'vivid',
    skinLab: { L: 65, a: 12, b: 15 },
    palette: mockPalette,
  },
  best_colors: ['#FFD700', '#FF6347'],
  worst_colors: ['#000080', '#4B0082'],
  created_at: '2026-01-29T10:00:00Z',
};

describe('POST /api/analyze/personal-color-v2', () => {
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
    vi.mocked(generateMockResult).mockReturnValue(
      mockPersonalColorResult as unknown as ReturnType<typeof generateMockResult>
    );
    vi.mocked(classifyTone).mockReturnValue(
      mockClassification as unknown as ReturnType<typeof classifyTone>
    );
    vi.mocked(rgbToLab).mockReturnValue({ L: 65, a: 12, b: 15 });
    vi.mocked(getTonePalette).mockReturnValue(
      mockPalette as unknown as ReturnType<typeof getTonePalette>
    );
    vi.mocked(extractSkinColorWithGemini).mockResolvedValue(
      mockGeminiExtractResult as unknown as Awaited<ReturnType<typeof extractSkinColorWithGemini>>
    );

    // Default supabase mock
    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'personal_color_assessments') {
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
    it('이미지와 피부색 RGB 모두 없으면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({}));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.code).toBe('VALIDATION_ERROR');
    });

    it('imageBase64만 있어도 유효하다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );

      expect(response.status).toBe(200);
    });

    it('skinRgb만 있어도 유효하다', async () => {
      const response = await POST(
        createMockPostRequest({
          skinRgb: { r: 200, g: 160, b: 140 },
        })
      );

      expect(response.status).toBe(200);
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
      expect(generateMockResult).toHaveBeenCalled();
    });

    it('Mock 분석 시 Gemini를 호출하지 않는다', async () => {
      await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );

      expect(extractSkinColorWithGemini).not.toHaveBeenCalled();
    });
  });

  describe('skinRgb 직접 분석', () => {
    it('skinRgb 제공 시 Gemini 없이 직접 Lab 변환 및 분류한다', async () => {
      const response = await POST(
        createMockPostRequest({
          skinRgb: { r: 200, g: 160, b: 140 },
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(rgbToLab).toHaveBeenCalledWith(200, 160, 140);
      expect(classifyTone).toHaveBeenCalled();
      expect(getTonePalette).toHaveBeenCalled();
      expect(extractSkinColorWithGemini).not.toHaveBeenCalled();
    });

    it('skinRgb 분석 결과에 classification이 포함된다', async () => {
      const response = await POST(
        createMockPostRequest({
          skinRgb: { r: 200, g: 160, b: 140 },
        })
      );
      const json = await response.json();

      expect(json.result.classification).toBeDefined();
      expect(json.result.classification.season).toBe('spring');
      expect(json.result.classification.undertone).toBe('warm');
      expect(json.result.classification.tone).toBe('true-spring');
    });

    it('skinRgb 분석 시 usedFallback은 false이다', async () => {
      const response = await POST(
        createMockPostRequest({
          skinRgb: { r: 200, g: 160, b: 140 },
        })
      );
      const json = await response.json();

      expect(json.usedFallback).toBe(false);
    });
  });

  describe('이미지 기반 Gemini 분석', () => {
    it('이미지만 있으면 Gemini로 피부색을 추출한다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          skipQualityCheck: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(extractSkinColorWithGemini).toHaveBeenCalledWith('data:image/jpeg;base64,/9j/test');
      expect(rgbToLab).toHaveBeenCalledWith(200, 160, 140);
      expect(classifyTone).toHaveBeenCalled();
    });

    it('Gemini 성공 시 추출된 RGB로 12톤 분류한다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          skipQualityCheck: true,
        })
      );
      const json = await response.json();

      expect(json.result.classification.season).toBe('spring');
      expect(json.result.classification.tone).toBe('true-spring');
      expect(json.usedFallback).toBe(false);
    });

    it('Gemini 실패 시 Mock으로 폴백한다', async () => {
      vi.mocked(extractSkinColorWithGemini).mockResolvedValue({
        data: null,
        usedFallback: true,
      });

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          skipQualityCheck: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedFallback).toBe(true);
      expect(generateMockResult).toHaveBeenCalled();
    });

    it('Gemini 예외 발생 시 Mock으로 폴백한다', async () => {
      vi.mocked(extractSkinColorWithGemini).mockRejectedValue(new Error('Gemini API timeout'));

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          skipQualityCheck: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedFallback).toBe(true);
      expect(generateMockResult).toHaveBeenCalled();
    });
  });

  describe('DB 저장', () => {
    it('분석 결과가 personal_color_assessments 테이블에 저장된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
      expect(json.data.id).toBe('pc-v2-db-123');
      expect(mockSupabase.from).toHaveBeenCalledWith('personal_color_assessments');
    });

    it('DB 저장 데이터에 v2 버전 정보가 포함된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data.image_analysis.version).toBe(2);
    });

    it('users 테이블에 PC-2 결과가 동기화된다', async () => {
      const usersUpdateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'personal_color_assessments') {
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
        if (table === 'personal_color_assessments') {
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

    it('DB 전체 예외 발생 시에도 분석 결과를 반환한다', async () => {
      vi.mocked(createServiceRoleClient).mockReturnValue({
        from: vi.fn().mockImplementation(() => {
          throw new Error('Connection refused');
        }),
      } as unknown as ReturnType<typeof createServiceRoleClient>);

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

    it('DB 저장 실패 시 XP는 부여되지 않는다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'personal_color_assessments') {
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

    it('result에 classification, palette, stylingRecommendations가 포함된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(json.result).toHaveProperty('classification');
      expect(json.result).toHaveProperty('palette');
      expect(json.result).toHaveProperty('stylingRecommendations');
      expect(json.result).toHaveProperty('analyzedAt');
    });

    it('classification에 season, undertone, tone이 포함된다', async () => {
      const response = await POST(
        createMockPostRequest({
          skinRgb: { r: 200, g: 160, b: 140 },
        })
      );
      const json = await response.json();

      expect(json.result.classification).toHaveProperty('season');
      expect(json.result.classification).toHaveProperty('undertone');
      expect(json.result.classification).toHaveProperty('tone');
      expect(json.result.classification).toHaveProperty('confidence');
    });

    it('palette에 mainColors, avoidColors, lipColors가 포함된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(json.result.palette).toHaveProperty('mainColors');
      expect(json.result.palette).toHaveProperty('avoidColors');
      expect(json.result.palette).toHaveProperty('lipColors');
      expect(json.result.palette).toHaveProperty('eyeshadowColors');
      expect(json.result.palette).toHaveProperty('blushColors');
    });
  });

  describe('하이브리드 신뢰도', () => {
    it('응답에 trust 정보가 포함된다', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(json.trust).toBeDefined();
      expect(json.trust.overallTrust).toBe(0.85);
      expect(json.trust.trustLevel).toBe('high');
    });
  });
});

describe('GET /api/analyze/personal-color-v2', () => {
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

    it('personal_color_assessments 테이블을 조회한다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      await GET();

      expect(mockSupabase.from).toHaveBeenCalledWith('personal_color_assessments');
    });
  });
});
