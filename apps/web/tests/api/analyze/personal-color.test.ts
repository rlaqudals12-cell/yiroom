/**
 * PC-1 퍼스널 컬러 분석 API 테스트
 * @description POST/GET /api/analyze/personal-color 테스트
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

import { GET, POST } from '@/app/api/analyze/personal-color/route';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { analyzePersonalColor } from '@/lib/gemini';
import { generateMockPersonalColorResult } from '@/lib/mock/personal-color';

// Mock 요청 헬퍼
function createMockPostRequest(body: unknown): Request {
  return {
    url: 'http://localhost/api/analyze/personal-color',
    json: () => Promise.resolve(body),
  } as Request;
}

function createMockGetRequest(): Request {
  return {
    url: 'http://localhost/api/analyze/personal-color',
    json: () => Promise.resolve({}),
  } as Request;
}

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
          frontImageBase64: 'data:image/jpeg;base64,/9j/front',
          leftImageBase64: 'data:image/jpeg;base64,/9j/left',
          rightImageBase64: 'data:image/jpeg;base64,/9j/right',
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
          frontImageBase64: 'data:image/jpeg;base64,/9j/front',
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
          imageBase64: 'data:image/jpeg;base64,/9j/test',
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
          frontImageBase64: 'data:image/jpeg;base64,/9j/front',
          leftImageBase64: 'data:image/jpeg;base64,/9j/left',
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
          frontImageBase64: 'data:image/jpeg;base64,/9j/front',
          wristImageBase64: 'data:image/jpeg;base64,/9j/wrist',
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

    it('imageBase64가 빈 문자열이면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({ imageBase64: '' }));
      const json = await response.json();

      expect(response.status).toBe(400);
    });
  });

  describe('Mock 분석', () => {
    it('useMock=true이면 Mock 분석을 사용한다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

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
      expect(generateMockPersonalColorResult).toHaveBeenCalled();
    });

    it('문진 응답과 함께 분석이 가능하다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          questionnaireAnswers: { q1: 'warm', q2: 'gold' },
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  describe('AI 분석', () => {
    it('AI 분석 성공 시 결과를 반환한다', async () => {
      vi.mocked(analyzePersonalColor).mockResolvedValue(mockPersonalColorResult);
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

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
      vi.mocked(analyzePersonalColor).mockRejectedValue(new Error('API Error'));
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

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

  describe('DB 저장', () => {
    it('분석 결과가 DB에 저장된다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabase.from).toHaveBeenCalledWith('personal_color_assessments');
      expect(mockSupabase.insert).toHaveBeenCalled();
      expect(json.data).toEqual(mockDbResult);
    });

    it('DB 저장 실패 시 500을 반환한다', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'DB Error' } });

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Failed to save analysis');
    });
  });

  describe('이미지 업로드', () => {
    it('이미지가 Storage에 업로드된다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('personal-color-images');
      expect(mockStorageUpload).toHaveBeenCalled();
    });

    it('이미지 업로드 실패해도 분석은 계속된다', async () => {
      mockStorageUpload.mockResolvedValue({ data: null, error: { message: 'Upload failed' } });
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

      const response = await POST(
        createMockPostRequest({
          imageBase64: 'data:image/jpeg;base64,/9j/test',
          useMock: true,
        })
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  describe('응답 형식', () => {
    it('성공 응답에 필수 필드가 포함된다', async () => {
      mockSupabase.single.mockResolvedValue({ data: mockDbResult, error: null });

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
      expect(json.error).toBe('Unauthorized');
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
      expect(json.error).toBe('Failed to fetch analysis');
    });
  });
});
