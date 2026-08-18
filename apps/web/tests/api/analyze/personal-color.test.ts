/**
 * PC-1 퍼스널 컬러 분석 API 테스트
 * @description POST/GET /api/analyze/personal-color 테스트
 * @version 2.0
 * @date 2026-01-22
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
  analyzePersonalColor: vi.fn(),
}));

vi.mock('@/lib/mock/personal-color', () => ({
  generateMockPersonalColorResult: vi.fn(),
  STYLE_DESCRIPTIONS: {
    spring: { imageKeywords: [], makeupStyle: '', fashionStyle: '', accessories: '' },
    summer: { imageKeywords: [], makeupStyle: '', fashionStyle: '', accessories: '' },
    autumn: { imageKeywords: [], makeupStyle: '', fashionStyle: '', accessories: '' },
    winter: { imageKeywords: [], makeupStyle: '', fashionStyle: '', accessories: '' },
  },
}));

vi.mock('@/lib/gamification', () => ({
  awardAnalysisBadge: vi.fn().mockResolvedValue(null),
  checkAndAwardAllAnalysisBadge: vi.fn().mockResolvedValue(null),
  addXp: vi.fn().mockResolvedValue(undefined),
}));

// Rate Limit 모킹 - 항상 통과
vi.mock('@/lib/security/rate-limit', () => ({
  applyRateLimit: vi.fn().mockReturnValue({ success: true }),
}));

import { GET, POST } from '@/app/api/analyze/personal-color/route';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { analyzePersonalColor } from '@/lib/gemini';
import { generateMockPersonalColorResult } from '@/lib/mock/personal-color';
// 시드 유틸은 모킹하지 않는다 — 라우트가 실제로 만드는 시드와 동일한 값을 테스트에서 재계산해 대조
import { buildFallbackSeed } from '@/lib/utils/seeded-random';
import { NextRequest } from 'next/server';

// Mock 요청 헬퍼 (NextRequest 호환)
function createMockPostRequest(body: unknown): NextRequest {
  const url = 'http://localhost/api/analyze/personal-color';
  const req = new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return req;
}

function createMockGetRequest(): NextRequest {
  const url = 'http://localhost/api/analyze/personal-color';
  const req = new NextRequest(url, {
    method: 'GET',
  });
  return req;
}

// 검증 통과용 mock base64 (min 100자)
const MOCK_BASE64 = 'data:image/jpeg;base64,/9j/' + 'A'.repeat(100);
const MOCK_BASE64_FRONT = 'data:image/jpeg;base64,/9j/' + 'F'.repeat(100);
const MOCK_BASE64_LEFT = 'data:image/jpeg;base64,/9j/' + 'L'.repeat(100);
const MOCK_BASE64_RIGHT = 'data:image/jpeg;base64,/9j/' + 'R'.repeat(100);
const MOCK_BASE64_WRIST = 'data:image/jpeg;base64,/9j/' + 'W'.repeat(100);

// Mock 데이터
const mockPersonalColorResult = {
  seasonType: 'spring' as const,
  seasonLabel: '봄 웜톤',
  seasonDescription: '밝고 따뜻한 색상이 어울리는 봄 웜톤입니다.',
  tone: 'warm' as const,
  depth: 'light' as const,
  confidence: 0.85,
  bestColors: [
    { hex: '#FFD700', name: '골드' },
    { hex: '#FF6347', name: '토마토' },
    { hex: '#98FB98', name: '페일 그린' },
  ],
  worstColors: [
    { hex: '#000080', name: '네이비' },
    { hex: '#4B0082', name: '인디고' },
  ],
  lipstickRecommendations: [
    { colorName: '코랄', hex: '#FF7F50', brandExample: '에뛰드' },
    { colorName: '피치', hex: '#FFDAB9', brandExample: '롬앤' },
  ],
  clothingRecommendations: [
    { item: '아이보리 블라우스', colorSuggestion: '아이보리', reason: '밝고 따뜻한 이미지 강조' },
    { item: '베이지 카디건', colorSuggestion: '베이지', reason: '자연스러운 피부톤 연출' },
  ],
  styleDescription: {
    imageKeywords: ['화사한', '생기있는', '밝은'],
    makeupStyle: '코랄, 피치 계열의 따뜻한 컬러 메이크업이 잘 어울립니다.',
    fashionStyle: '아이보리, 크림색, 연한 오렌지 톤의 밝고 따뜻한 색상이 어울립니다.',
    accessories: '골드 주얼리, 베이지톤 가방이 잘 어울립니다.',
  },
  insight: '밝은 색상과 따뜻한 톤이 잘 어울립니다.',
  analyzedAt: new Date(),
};

const mockDbResult = {
  id: 'pc-123',
  clerk_user_id: 'user_test123',
  season: 'Spring',
  undertone: 'Warm',
  confidence: 0.85,
  best_colors: ['#FFD700', '#FF6347'],
  worst_colors: ['#000080'],
  created_at: '2025-12-09T10:00:00Z',
};

describe('POST /api/analyze/personal-color', () => {
  const mockStorageUpload = vi.fn();
  const mockUpdate = vi.fn().mockReturnValue({ error: null });
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockImplementation(() => mockUpdate()),
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
    vi.mocked(generateMockPersonalColorResult).mockReturnValue(mockPersonalColorResult);
    mockStorageUpload.mockResolvedValue({ data: { path: 'user_test123/123.jpg' }, error: null });
  });

  describe('다각도 촬영 지원', () => {
    it('다각도 이미지(정면+좌측+우측)로 분석이 가능하다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await POST(
        createMockPostRequest({
          frontImageBase64: MOCK_BASE64_FRONT,
          leftImageBase64: MOCK_BASE64_LEFT,
          rightImageBase64: MOCK_BASE64_RIGHT,
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.imagesCount).toBe(3);
      expect(json.analysisReliability).toBe('high');
    });

    it('정면 이미지만으로도 분석이 가능하다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await POST(
        createMockPostRequest({
          frontImageBase64: MOCK_BASE64_FRONT,
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.imagesCount).toBe(1);
    });

    it('하위 호환성: imageBase64 단일 이미지로도 분석이 가능하다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await POST(
        createMockPostRequest({
          imageBase64: MOCK_BASE64,
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.imagesCount).toBe(1);
    });

    it('다각도 분석 시 신뢰도가 high로 설정된다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await POST(
        createMockPostRequest({
          frontImageBase64: MOCK_BASE64_FRONT,
          leftImageBase64: MOCK_BASE64_LEFT,
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.analysisReliability).toBe('high');
    });

    it('손목 이미지 포함 시 신뢰도가 high로 설정된다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await POST(
        createMockPostRequest({
          frontImageBase64: MOCK_BASE64_FRONT,
          wristImageBase64: MOCK_BASE64_WRIST,
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.analysisReliability).toBe('high');
    });
  });

  describe('인증', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const response = await POST(createMockPostRequest({ imageBase64: 'test' }));
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('인증이 필요합니다.');
    });
  });

  describe('입력 검증', () => {
    it('이미지가 없으면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({}));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('이미지가 필요합니다.');
    });

    it('imageBase64가 빈 문자열이면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({ imageBase64: '' }));
      await response.json();

      expect(response.status).toBe(400);
    });
  });

  describe('Mock 분석', () => {
    it('useMock=true이면 Mock 분석을 사용한다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await POST(
        createMockPostRequest({
          imageBase64: MOCK_BASE64,
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedMock).toBe(true);
      expect(generateMockPersonalColorResult).toHaveBeenCalled();
    });

    it('문진 응답과 함께 분석이 가능하다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await POST(
        createMockPostRequest({
          imageBase64: MOCK_BASE64,
          questionnaireAnswers: { q1: 'warm', q2: 'gold' },
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  // 재현성 계약: 폴백 Mock은 난수가 아니라 "사용자 + 축 + 사진 지문" 시드로 결정되어야 한다.
  // 시드 배선이 끊기면 같은 사진 재분석마다 시즌이 널뛴다 (V1이 웹·모바일 주력 경로).
  describe('폴백 시드 배선', () => {
    it('Mock 모드에서 buildFallbackSeed(userId, personal-color, 이미지) 시드를 전달한다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      await POST(createMockPostRequest({ imageBase64: MOCK_BASE64, useMock: true }));

      expect(generateMockPersonalColorResult).toHaveBeenCalledWith(undefined, {
        seed: buildFallbackSeed('user_test123', 'personal-color', MOCK_BASE64),
      });
    });

    it('AI 호출에도 같은 폴백 시드를 넘긴다 (gemini 내부 Mock 경로 대비)', async () => {
      vi.mocked(analyzePersonalColor).mockResolvedValue(mockPersonalColorResult);
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      await POST(createMockPostRequest({ imageBase64: MOCK_BASE64 }));

      expect(analyzePersonalColor).toHaveBeenCalledWith(
        expect.objectContaining({ frontImageBase64: MOCK_BASE64 }),
        undefined,
        'ko',
        buildFallbackSeed('user_test123', 'personal-color', MOCK_BASE64)
      );
    });

    it('AI 실패 폴백에도 같은 시드를 전달한다', async () => {
      vi.mocked(analyzePersonalColor).mockRejectedValue(new Error('API Error'));
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      await POST(createMockPostRequest({ imageBase64: MOCK_BASE64 }));

      expect(generateMockPersonalColorResult).toHaveBeenCalledWith(undefined, {
        seed: buildFallbackSeed('user_test123', 'personal-color', MOCK_BASE64),
      });
    });

    it('다각도 요청은 정면 이미지를 시드 재료로 쓴다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      await POST(
        createMockPostRequest({
          frontImageBase64: MOCK_BASE64_FRONT,
          leftImageBase64: MOCK_BASE64_LEFT,
          useMock: true,
        })
      );

      expect(generateMockPersonalColorResult).toHaveBeenCalledWith(undefined, {
        seed: buildFallbackSeed('user_test123', 'personal-color', MOCK_BASE64_FRONT),
      });
    });

    it('같은 사진을 다시 분석하면 같은 시드가 전달된다 (시즌 널뜀 방지)', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      await POST(createMockPostRequest({ imageBase64: MOCK_BASE64, useMock: true }));
      await POST(createMockPostRequest({ imageBase64: MOCK_BASE64, useMock: true }));

      const seeds = vi
        .mocked(generateMockPersonalColorResult)
        .mock.calls.map((call) => (call[1] as { seed?: string } | undefined)?.seed);
      expect(seeds).toHaveLength(2);
      expect(seeds[0]).toBe(seeds[1]);
      expect(seeds[0]).toBeDefined();
    });

    it('다른 사진은 다른 시드를 만든다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      await POST(createMockPostRequest({ imageBase64: MOCK_BASE64, useMock: true }));
      await POST(createMockPostRequest({ imageBase64: MOCK_BASE64_WRIST, useMock: true }));

      const seeds = vi
        .mocked(generateMockPersonalColorResult)
        .mock.calls.map((call) => (call[1] as { seed?: string } | undefined)?.seed);
      expect(seeds[0]).not.toBe(seeds[1]);
    });
  });

  describe('AI 분석', () => {
    it('AI 분석 성공 시 결과를 반환한다', async () => {
      vi.mocked(analyzePersonalColor).mockResolvedValue(mockPersonalColorResult);
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await POST(
        createMockPostRequest({
          imageBase64: MOCK_BASE64,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedMock).toBe(false);
    });

    it('AI 분석 실패 시 Mock Fallback으로 결과를 반환한다', async () => {
      vi.mocked(analyzePersonalColor).mockRejectedValue(new Error('API Error'));
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await POST(
        createMockPostRequest({
          imageBase64: MOCK_BASE64,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
    });

    it('AI 실패 폴백은 Mock의 높은 신뢰도를 쓰지 않고 저신뢰(≤50)로 저장한다', async () => {
      // Mock 생성기는 데모 realism용으로 85~95를 낸다 — 폴백이 그대로 저장하면
      // 결과 화면이 '현재 92%'가 되고 저신뢰 경고(<70)가 영원히 안 뜬다.
      vi.mocked(generateMockPersonalColorResult).mockReturnValue({
        ...mockPersonalColorResult,
        confidence: 92,
      });
      vi.mocked(analyzePersonalColor).mockRejectedValue(new Error('API Error'));
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await POST(createMockPostRequest({ imageBase64: MOCK_BASE64 }));
      const json = await response.json();

      // 응답 결과
      expect(json.result.confidence).toBeLessThanOrEqual(50);
      expect(json.result.confidence).toBeGreaterThan(0);

      // DB 저장 페이로드(confidence + season_scores 모두 저신뢰 대역)
      const insertPayload = vi.mocked(mockSupabase.insert).mock.calls[0][0] as {
        confidence: number;
        season_scores: Record<string, number>;
      };
      expect(insertPayload.confidence).toBeLessThanOrEqual(50);
      expect(insertPayload.season_scores.spring).toBeLessThanOrEqual(50);
    });

    it('AI 성공 경로의 신뢰도는 폴백 값으로 덮어쓰지 않는다', async () => {
      vi.mocked(analyzePersonalColor).mockResolvedValue({
        ...mockPersonalColorResult,
        confidence: 88,
      });
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await POST(createMockPostRequest({ imageBase64: MOCK_BASE64 }));
      const json = await response.json();

      expect(json.usedMock).toBe(false);
      expect(json.result.confidence).toBe(88);
    });

    it('veinColor가 blue인데 tone이 warm이면 cool로 수정한다', async () => {
      // AI가 잘못된 결과 반환 시 서버 측 보정
      const inconsistentResult = {
        ...mockPersonalColorResult,
        seasonType: 'autumn' as const,
        seasonLabel: '가을 웜톤',
        tone: 'warm' as const,
        analysisEvidence: {
          veinColor: 'blue' as const, // blue 혈관 → cool 톤이어야 함
          veinScore: 75,
          skinUndertone: 'pink' as const,
          skinHairContrast: 'medium' as const,
          eyeColor: 'brown' as const,
          lipNaturalColor: 'pink' as const,
        },
      };
      vi.mocked(analyzePersonalColor).mockResolvedValue(inconsistentResult);
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await POST(
        createMockPostRequest({
          imageBase64: MOCK_BASE64,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      // cool로 수정되고, autumn(warm)에서 summer(cool)로 변경되어야 함
      expect(json.result.tone).toBe('cool');
      expect(json.result.seasonType).toBe('summer');
    });

    it('cool 톤인데 winter이고 contrast가 medium이면 summer로 수정한다', async () => {
      // Winter는 very_high contrast가 필요
      const winterResult = {
        ...mockPersonalColorResult,
        seasonType: 'winter' as const,
        seasonLabel: '겨울 쿨톤',
        tone: 'cool' as const,
        depth: 'deep' as const,
        analysisEvidence: {
          veinColor: 'blue' as const,
          veinScore: 80,
          skinUndertone: 'pink' as const,
          skinHairContrast: 'medium' as const, // very_high 아님 → summer로
          eyeColor: 'brown' as const,
          lipNaturalColor: 'pink' as const,
        },
      };
      vi.mocked(analyzePersonalColor).mockResolvedValue(winterResult);
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await POST(
        createMockPostRequest({
          imageBase64: MOCK_BASE64,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.result.seasonType).toBe('summer');
      expect(json.result.seasonLabel).toBe('여름 쿨톤');
    });

    it('veinColor가 green이면 warm 톤으로 유지한다', async () => {
      const warmResult = {
        ...mockPersonalColorResult,
        seasonType: 'autumn' as const,
        seasonLabel: '가을 웜톤',
        tone: 'warm' as const,
        analysisEvidence: {
          veinColor: 'green' as const, // green 혈관 → warm 톤
          veinScore: 30,
          skinUndertone: 'yellow' as const,
          skinHairContrast: 'medium' as const,
          eyeColor: 'brown' as const,
          lipNaturalColor: 'coral' as const,
        },
      };
      vi.mocked(analyzePersonalColor).mockResolvedValue(warmResult);
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await POST(
        createMockPostRequest({
          imageBase64: MOCK_BASE64,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.result.tone).toBe('warm');
      expect(json.result.seasonType).toBe('autumn');
    });
  });

  describe('DB 저장', () => {
    it('분석 결과가 DB에 저장된다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await POST(
        createMockPostRequest({
          imageBase64: MOCK_BASE64,
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabase.from).toHaveBeenCalledWith('personal_color_assessments');
      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(json.data).toEqual(mockDbResult);
    });

    it('Mock 분석의 DB 저장 실패는 두 출처 플래그를 각각 보존한다', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'DB Error' } });

      const response = await POST(
        createMockPostRequest({
          imageBase64: MOCK_BASE64,
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.dbSaveFailed).toBe(true);
      expect(json.usedMock).toBe(true);
      expect(json.data.image_analysis.usedMock).toBe(true);
    });

    it('실 AI 성공 후 DB만 실패하면 결과를 Mock으로 위장하지 않는다', async () => {
      vi.mocked(analyzePersonalColor).mockResolvedValue(mockPersonalColorResult);
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'DB Error' } });

      const response = await POST(createMockPostRequest({ imageBase64: MOCK_BASE64 }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.dbSaveFailed).toBe(true);
      expect(json.usedMock).toBe(false);
      expect(json.data.image_analysis.usedMock).toBe(false);
    });
  });

  describe('이미지 업로드', () => {
    it('saveImage=true일 때 이미지가 Storage에 업로드된다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      await POST(
        createMockPostRequest({
          imageBase64: MOCK_BASE64,
          useMock: true,
          saveImage: true,
        })
      );

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('personal-color-images');
      expect(mockStorageUpload).toHaveBeenCalled();
    });

    it('saveImage=false일 때 이미지가 업로드되지 않는다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      await POST(
        createMockPostRequest({
          imageBase64: MOCK_BASE64,
          useMock: true,
          saveImage: false,
        })
      );

      expect(mockStorageUpload).not.toHaveBeenCalled();
    });

    it('이미지 업로드 실패해도 분석은 계속된다', async () => {
      mockStorageUpload.mockResolvedValue({ data: null, error: { message: 'Upload failed' } });
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await POST(
        createMockPostRequest({
          imageBase64: MOCK_BASE64,
          useMock: true,
          saveImage: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  describe('퍼스널 대비 실측 (ADR-116)', () => {
    it('클라이언트 실측 contrastLevel이 image_analysis에 저장된다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await POST(
        createMockPostRequest({
          imageBase64: MOCK_BASE64,
          useMock: true,
          contrastLevel: 'high',
        })
      );

      expect(response.status).toBe(200);
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          image_analysis: expect.objectContaining({ contrastLevel: 'high' }),
        })
      );
    });

    it('contrastLevel이 없으면 image_analysis에 필드를 넣지 않는다 (추측 금지)', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      await POST(
        createMockPostRequest({
          imageBase64: MOCK_BASE64,
          useMock: true,
        })
      );

      const insertArg = mockSupabase.insert.mock.calls[0][0] as {
        image_analysis: Record<string, unknown>;
      };
      expect(insertArg.image_analysis).not.toHaveProperty('contrastLevel');
    });

    it('잘못된 contrastLevel enum 값은 400을 반환한다 (zod 검증)', async () => {
      const response = await POST(
        createMockPostRequest({
          imageBase64: MOCK_BASE64,
          useMock: true,
          contrastLevel: 'extreme',
        })
      );

      expect(response.status).toBe(400);
    });
  });

  describe('응답 형식', () => {
    it('성공 응답에 필수 필드가 포함된다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await POST(
        createMockPostRequest({
          imageBase64: MOCK_BASE64,
          useMock: true,
        })
      );
      const json = await response.json();

      expect(json).toHaveProperty('success', true);
      expect(json).toHaveProperty('data');
      expect(json).toHaveProperty('result');
      expect(json).toHaveProperty('usedMock');
      expect(json.result).toHaveProperty('analyzedAt');
    });
  });
});

describe('GET /api/analyze/personal-color', () => {
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
      expect(json.error).toBe('인증이 필요합니다.');
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
        error: { code: 'OTHER', message: 'DB Error' },
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('분석 결과를 불러오는데 실패했습니다.');
    });
  });
});
