/**
 * C-1 체형 분석 API 테스트
 * @description POST/GET /api/analyze/body 테스트
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
  analyzeBody: vi.fn(),
}));

vi.mock('@/lib/mock/body-analysis', () => ({
  generateMockBodyAnalysis: vi.fn(),
  BODY_TYPES: {
    rectangle: { label: '직사각형', description: '어깨와 골반이 비슷한 직선 실루엣' },
    hourglass: { label: '모래시계', description: '어깨와 골반이 비슷하고 허리가 가는 체형' },
    triangle: { label: '삼각형', description: '골반이 어깨보다 넓은 체형' },
    inverted_triangle: { label: '역삼각형', description: '어깨가 골반보다 넓은 체형' },
  },
}));

vi.mock('@/lib/color-recommendations', () => ({
  generateColorRecommendations: vi.fn(),
  getColorTipsForBodyType: vi.fn(),
}));

import { GET, POST } from '@/app/api/analyze/body/route';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { analyzeBody } from '@/lib/gemini';
import { generateMockBodyAnalysis } from '@/lib/mock/body-analysis';
import { generateColorRecommendations, getColorTipsForBodyType } from '@/lib/color-recommendations';

// Mock 요청 헬퍼
function createMockPostRequest(body: unknown): Request {
  return {
    url: 'http://localhost/api/analyze/body',
    json: () => Promise.resolve(body),
  } as Request;
}

// Mock 데이터
const mockBodyAnalysisResult = {
  bodyType: 'X' as const,
  bodyTypeLabel: '모래시계',
  bodyTypeDescription: '어깨와 골반이 비슷하고 허리가 가는 체형',
  measurements: [
    { name: '어깨', value: 40, description: '어깨 너비' },
    { name: '허리', value: 65, description: '허리 둘레' },
    { name: '골반', value: 95, description: '골반 둘레' },
  ],
  strengths: ['균형 잡힌 체형', '허리 라인 강조 가능'],
  insight: '모래시계 체형으로 허리 라인을 강조하는 스타일이 어울립니다.',
  styleRecommendations: [
    { item: '벨트', reason: '허리 강조' },
    { item: '피트앤플레어', reason: '실루엣 강조' },
  ],
  analyzedAt: new Date(),
};

const mockDbResult = {
  id: 'body-123',
  clerk_user_id: 'user_test123',
  body_type: 'hourglass',
  height: 165,
  weight: 55,
  shoulder: 40,
  waist: 65,
  hip: 95,
  created_at: '2025-12-09T10:00:00Z',
};

const mockColorRecommendations = {
  topColors: ['#FFD700', '#FF6347'],
  bottomColors: ['#000080', '#4B0082'],
  avoidColors: ['#000000'],
  bestCombinations: [{ top: '#FFD700', bottom: '#000080', description: '밝은 상의 + 어두운 하의' }],
  accessories: ['골드 주얼리', '베이지 가방'],
};

const mockColorTips = ['밝은 색상으로 상체 강조', '어두운 색상으로 하체 슬림하게'];

describe('POST /api/analyze/body', () => {
  const mockStorageUpload = vi.fn();
  const mockSupabase = {
    from: vi.fn(),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: mockStorageUpload,
      }),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);
    vi.mocked(generateMockBodyAnalysis).mockReturnValue(mockBodyAnalysisResult);
    vi.mocked(generateColorRecommendations).mockReturnValue(mockColorRecommendations);
    vi.mocked(getColorTipsForBodyType).mockReturnValue(mockColorTips);
    mockStorageUpload.mockResolvedValue({ data: { path: 'user_test123/123.jpg' }, error: null });

    // Default supabase mock
    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'body_analyses') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockDbResult, error: null }),
            }),
          }),
        };
      }
      // personal_color_assessments
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { season: 'Spring', best_colors: ['#FFD700'] }, error: null }),
        }),
      };
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
  });

  describe('Mock 분석', () => {
    it('useMock=true이면 Mock 분석을 사용한다', async () => {
      const response = await POST(createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/test',
        useMock: true,
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedMock).toBe(true);
      expect(generateMockBodyAnalysis).toHaveBeenCalled();
    });

    it('사용자 입력(키/체중)과 함께 분석이 가능하다', async () => {
      const response = await POST(createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/test',
        userInput: { height: 165, weight: 55 },
        useMock: true,
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.result.userInput).toEqual({ height: 165, weight: 55 });
    });
  });

  describe('AI 분석', () => {
    it('AI 분석 성공 시 결과를 반환한다', async () => {
      vi.mocked(analyzeBody).mockResolvedValue(mockBodyAnalysisResult);

      const response = await POST(createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/test',
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedMock).toBe(false);
    });

    it('AI 분석 실패 시 Mock으로 폴백한다', async () => {
      vi.mocked(analyzeBody).mockRejectedValue(new Error('API Error'));

      const response = await POST(createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/test',
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedMock).toBe(true);
    });
  });

  describe('퍼스널 컬러 연동', () => {
    it('퍼스널 컬러 정보가 응답에 포함된다', async () => {
      const response = await POST(createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/test',
        useMock: true,
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.personalColorSeason).toBe('Spring');
      expect(json.colorRecommendations).toBeDefined();
    });

    it('퍼스널 컬러 없이도 색상 추천이 생성된다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'body_analyses') {
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

      const response = await POST(createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/test',
        useMock: true,
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.colorRecommendations).toBeDefined();
      expect(generateColorRecommendations).toHaveBeenCalled();
    });
  });

  describe('BMI 계산', () => {
    it('키/체중 입력 시 BMI가 계산된다', async () => {
      const response = await POST(createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/test',
        userInput: { height: 165, weight: 55 },
        useMock: true,
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.result.bmi).toBeDefined();
      expect(json.result.bmiCategory).toBeDefined();
    });

    it('BMI 카테고리가 올바르게 분류된다', async () => {
      // 정상 체중 (BMI < 23)
      let response = await POST(createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/test',
        userInput: { height: 170, weight: 60 },
        useMock: true,
      }));
      let json = await response.json();
      expect(json.result.bmiCategory).toBe('정상');

      // 저체중 (BMI < 18.5)
      response = await POST(createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/test',
        userInput: { height: 170, weight: 50 },
        useMock: true,
      }));
      json = await response.json();
      expect(json.result.bmiCategory).toBe('저체중');
    });
  });

  describe('DB 저장', () => {
    it('분석 결과가 DB에 저장된다', async () => {
      const response = await POST(createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/test',
        useMock: true,
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toEqual(mockDbResult);
    });

    it('DB 저장 실패 시 500을 반환한다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'body_analyses') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
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

      const response = await POST(createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/test',
        useMock: true,
      }));
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Failed to save analysis');
    });
  });

  describe('응답 형식', () => {
    it('성공 응답에 필수 필드가 포함된다', async () => {
      const response = await POST(createMockPostRequest({
        imageBase64: 'data:image/jpeg;base64,/9j/test',
        useMock: true,
      }));
      const json = await response.json();

      expect(json).toHaveProperty('success', true);
      expect(json).toHaveProperty('data');
      expect(json).toHaveProperty('result');
      expect(json).toHaveProperty('personalColorSeason');
      expect(json).toHaveProperty('colorRecommendations');
      expect(json).toHaveProperty('colorTips');
      expect(json).toHaveProperty('usedMock');
      expect(json.result).toHaveProperty('analyzedAt');
    });
  });
});

describe('GET /api/analyze/body', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);
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
