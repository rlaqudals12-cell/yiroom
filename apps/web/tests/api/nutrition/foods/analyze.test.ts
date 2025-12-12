/**
 * N-1 음식 분석 API Route 테스트
 * Task 2.3: 음식 분석 API Route
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
  analyzeFoodImage: vi.fn(),
}));

vi.mock('@/lib/mock/food-analysis', () => ({
  generateMockFoodAnalysis: vi.fn(),
}));

import { POST } from '@/app/api/nutrition/foods/analyze/route';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { analyzeFoodImage } from '@/lib/gemini';
import { generateMockFoodAnalysis } from '@/lib/mock/food-analysis';

// Mock 응답 데이터
const mockFoodAnalysisResult: import('@/lib/gemini').GeminiFoodAnalysisResult = {
  foods: [
    {
      name: '비빔밥',
      portion: '1인분 (400g)',
      calories: 550,
      protein: 20,
      carbs: 80,
      fat: 15,
      trafficLight: 'yellow' as const,
      confidence: 0.9,
    },
    {
      name: '된장찌개',
      portion: '1그릇 (250ml)',
      calories: 100,
      protein: 8,
      carbs: 10,
      fat: 4,
      trafficLight: 'green' as const,
      confidence: 0.85,
    },
  ],
  totalCalories: 650,
  totalProtein: 28,
  totalCarbs: 90,
  totalFat: 19,
  mealType: 'lunch',
  analyzedAt: '2025-12-02T12:00:00.000Z',
  insight: '균형 잡힌 한식 식사입니다.',
};

// 유효한 1x1 PNG 이미지 Base64 (테스트용)
const VALID_BASE64_IMAGE = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Mock Request 헬퍼
function createMockRequest(body: unknown): Request {
  return {
    json: () => Promise.resolve(body),
  } as Request;
}

// ReturnType helper for auth
type AuthReturnType = ReturnType<typeof auth> extends Promise<infer T> ? T : never;

describe('POST /api/nutrition/foods/analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 기본 인증 설정
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as AuthReturnType);
    // 기본 Mock 분석 결과
    vi.mocked(generateMockFoodAnalysis).mockReturnValue(mockFoodAnalysisResult);
    vi.mocked(analyzeFoodImage).mockResolvedValue(mockFoodAnalysisResult);
  });

  describe('인증', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as AuthReturnType);

      const request = createMockRequest({
        imageBase64: VALID_BASE64_IMAGE,
        mealType: 'lunch',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('입력 검증', () => {
    it('잘못된 JSON body는 400을 반환한다', async () => {
      const request = {
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Request;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON body');
    });

    it('imageBase64가 없으면 400을 반환한다', async () => {
      const request = createMockRequest({
        mealType: 'lunch',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('imageBase64 is required');
    });

    it('imageBase64가 문자열이 아니면 400을 반환한다', async () => {
      const request = createMockRequest({
        imageBase64: 12345,
        mealType: 'lunch',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('imageBase64 is required');
    });

    it('유효하지 않은 base64 형식은 400을 반환한다', async () => {
      const request = createMockRequest({
        imageBase64: 'invalid-base64-format!!!',
        mealType: 'lunch',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid base64 format');
    });

    it('유효하지 않은 mealType은 400을 반환한다', async () => {
      const request = createMockRequest({
        imageBase64: VALID_BASE64_IMAGE,
        mealType: 'invalid',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid mealType');
    });

    it('data URL 형식 이미지를 올바르게 처리한다', async () => {
      const request = createMockRequest({
        imageBase64: `data:image/png;base64,${VALID_BASE64_IMAGE}`,
        mealType: 'lunch',
        useMock: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('AI 분석', () => {
    it('useMock=true이면 Mock 분석을 사용한다', async () => {
      const request = createMockRequest({
        imageBase64: VALID_BASE64_IMAGE,
        mealType: 'lunch',
        useMock: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.usedMock).toBe(true);
      expect(vi.mocked(generateMockFoodAnalysis)).toHaveBeenCalled();
      expect(vi.mocked(analyzeFoodImage)).not.toHaveBeenCalled();
    });

    it('AI 분석 성공 시 결과를 반환한다', async () => {
      const request = createMockRequest({
        imageBase64: VALID_BASE64_IMAGE,
        mealType: 'breakfast',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.usedMock).toBe(false);
      expect(data.result).toEqual(mockFoodAnalysisResult);
      expect(vi.mocked(analyzeFoodImage)).toHaveBeenCalledWith({
        imageBase64: VALID_BASE64_IMAGE,
        mealType: 'breakfast',
      });
    });

    it('음식이 인식되지 않으면 warning을 포함한 응답을 반환한다', async () => {
      const emptyResult: import('@/lib/gemini').GeminiFoodAnalysisResult = {
        foods: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        mealType: 'lunch',
        analyzedAt: '2025-12-02T12:00:00.000Z',
        insight: '',
      };
      vi.mocked(analyzeFoodImage).mockResolvedValue(emptyResult);

      const request = createMockRequest({
        imageBase64: VALID_BASE64_IMAGE,
        mealType: 'lunch',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result.foods).toHaveLength(0);
      expect(data.warning).toBe('No food detected in the image');
    });

    it('AI 분석 실패 시 Mock으로 폴백한다', async () => {
      vi.mocked(analyzeFoodImage).mockRejectedValue(new Error('API Error'));

      const request = createMockRequest({
        imageBase64: VALID_BASE64_IMAGE,
        mealType: 'dinner',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.usedMock).toBe(true);
      expect(vi.mocked(generateMockFoodAnalysis)).toHaveBeenCalled();
    });

    it('mealType이 없으면 lunch를 기본값으로 사용한다', async () => {
      const request = createMockRequest({
        imageBase64: VALID_BASE64_IMAGE,
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(vi.mocked(analyzeFoodImage)).toHaveBeenCalledWith({
        imageBase64: VALID_BASE64_IMAGE,
        mealType: 'lunch',
      });
    });
  });

  describe('DB 저장', () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    beforeEach(() => {
      vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);
    });

    it('saveToDb=false이면 DB에 저장하지 않는다', async () => {
      const request = createMockRequest({
        imageBase64: VALID_BASE64_IMAGE,
        mealType: 'lunch',
        saveToDb: false,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.savedRecord).toBeNull();
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('saveToDb=true이면 DB에 저장한다', async () => {
      const savedRecord = {
        id: 'record-123',
        clerk_user_id: 'user_test123',
        meal_type: 'lunch',
        foods: mockFoodAnalysisResult.foods,
        total_calories: 650,
      };

      mockSupabase.single.mockResolvedValue({
        data: savedRecord,
        error: null,
      });

      const request = createMockRequest({
        imageBase64: VALID_BASE64_IMAGE,
        mealType: 'lunch',
        saveToDb: true,
        useMock: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.savedRecord).toEqual(savedRecord);
      expect(mockSupabase.from).toHaveBeenCalledWith('meal_records');
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('DB 저장 실패 시 분석 결과는 반환하고 에러를 표시한다', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const request = createMockRequest({
        imageBase64: VALID_BASE64_IMAGE,
        mealType: 'lunch',
        saveToDb: true,
        useMock: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result).toBeDefined();
      expect(data.dbError).toBe('Failed to save to database');
    });

    it('저장 시 올바른 영양소 합계를 계산한다', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'record-123' },
        error: null,
      });

      const request = createMockRequest({
        imageBase64: VALID_BASE64_IMAGE,
        mealType: 'lunch',
        saveToDb: true,
        useMock: true,
      });

      await POST(request);

      // insert 호출 확인
      const insertCall = mockSupabase.insert.mock.calls[0][0];
      expect(insertCall.total_calories).toBe(650); // 550 + 100
      expect(insertCall.total_protein).toBe(28); // 20 + 8
      expect(insertCall.total_carbs).toBe(90); // 80 + 10
      expect(insertCall.total_fat).toBe(19); // 15 + 4
      expect(insertCall.record_type).toBe('photo');
      expect(insertCall.ai_recognized_food).toBe('비빔밥, 된장찌개');
    });

    it('신뢰도 레벨을 올바르게 계산한다 (high)', async () => {
      mockSupabase.single.mockResolvedValue({
        data: { id: 'record-123' },
        error: null,
      });

      // 높은 신뢰도 (0.9, 0.85 평균 = 0.875 -> high)
      const request = createMockRequest({
        imageBase64: VALID_BASE64_IMAGE,
        mealType: 'lunch',
        saveToDb: true,
        useMock: true,
      });

      await POST(request);

      const insertCall = mockSupabase.insert.mock.calls[0][0];
      expect(insertCall.ai_confidence).toBe('high');
    });
  });

  describe('식사 타입별 분석', () => {
    it.each(['breakfast', 'lunch', 'dinner', 'snack'] as const)(
      '%s 식사 타입을 올바르게 처리한다',
      async (mealType) => {
        const request = createMockRequest({
          imageBase64: VALID_BASE64_IMAGE,
          mealType,
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(vi.mocked(analyzeFoodImage)).toHaveBeenCalledWith({
          imageBase64: VALID_BASE64_IMAGE,
          mealType,
        });
      }
    );
  });

  describe('응답 형식', () => {
    it('성공 응답에 필수 필드가 포함된다', async () => {
      const request = createMockRequest({
        imageBase64: VALID_BASE64_IMAGE,
        mealType: 'lunch',
        useMock: true,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('result');
      expect(data).toHaveProperty('usedMock');
      expect(data.result).toHaveProperty('foods');
      expect(data.result).toHaveProperty('totalCalories');
      expect(data.result).toHaveProperty('mealType');
    });
  });
});
