/**
 * W-1 운동 추천 API 테스트
 * @description POST /api/workout/recommend 테스트
 * @version 1.0
 * @date 2025-12-09
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock 모듈 설정
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/gemini', () => ({
  recommendExercises: vi.fn(),
}));

vi.mock('@/lib/mock/workout-analysis', () => ({
  generateMockExerciseRecommendation: vi.fn(),
}));

vi.mock('@/lib/workout/exercises', () => ({
  getAllExercises: vi.fn(),
  getExerciseById: vi.fn(),
}));

import { POST } from '@/app/api/workout/recommend/route';
import { auth } from '@clerk/nextjs/server';
import { recommendExercises } from '@/lib/gemini';
import { generateMockExerciseRecommendation } from '@/lib/mock/workout-analysis';
import { getAllExercises, getExerciseById } from '@/lib/workout/exercises';

// Mock 요청 헬퍼
function createMockPostRequest(body: unknown): Request {
  return {
    url: 'http://localhost/api/workout/recommend',
    json: () => Promise.resolve(body),
  } as Request;
}

// Mock 운동 데이터
const mockExercises = [
  {
    id: 'pushup',
    name: '푸쉬업',
    category: 'upper' as const,
    bodyParts: ['chest', 'arm'] as ('chest' | 'arm')[],
    equipment: ['none'],
    difficulty: 'beginner' as const,
    met: 3.8,
    caloriesPerMinute: 7,
    instructions: ['바닥에 엎드려 손을 어깨 너비로 벌린다'],
    tips: ['코어를 유지하세요'],
    suitableFor: { bodyTypes: ['all'], goals: ['strength'] },
  },
  {
    id: 'squat',
    name: '스쿼트',
    category: 'lower' as const,
    bodyParts: ['thigh', 'hip'] as ('thigh' | 'hip')[],
    equipment: ['none'],
    difficulty: 'beginner' as const,
    met: 5.0,
    caloriesPerMinute: 9,
    instructions: ['발을 어깨 너비로 벌린다'],
    tips: ['무릎이 발끝을 넘지 않게'],
    suitableFor: { bodyTypes: ['all'], goals: ['strength'] },
  },
  {
    id: 'plank',
    name: '플랭크',
    category: 'core' as const,
    bodyParts: ['abs', 'waist'] as ('abs' | 'waist')[],
    equipment: ['none'],
    difficulty: 'beginner' as const,
    met: 3.0,
    caloriesPerMinute: 5,
    instructions: ['팔꿈치로 몸을 지탱한다'],
    tips: ['엉덩이가 내려가지 않게'],
    suitableFor: { bodyTypes: ['all'], goals: ['core'] },
  },
];

// Mock 추천 결과
const mockRecommendationResult = {
  dailyExercises: [
    {
      exerciseId: 'pushup',
      reason: '상체 근력 강화에 효과적',
      sets: 3,
      reps: 12,
      restSeconds: 60,
      priority: 1,
    },
    {
      exerciseId: 'squat',
      reason: '하체 기초 근력에 필수',
      sets: 3,
      reps: 15,
      restSeconds: 60,
      priority: 2,
    },
  ],
  warmupExercises: ['plank'],
  cooldownExercises: ['plank'],
  estimatedMinutes: 30,
  estimatedCalories: 200,
  difficultyLevel: 'beginner' as const,
  focusBodyParts: ['chest', 'thigh'],
  aiTips: ['충분한 휴식을 취하세요', '점진적으로 강도를 올리세요'],
};

describe('POST /api/workout/recommend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(getAllExercises).mockReturnValue(mockExercises);
    vi.mocked(getExerciseById).mockImplementation((id) => mockExercises.find((e) => e.id === id));
    vi.mocked(generateMockExerciseRecommendation).mockReturnValue(mockRecommendationResult);
  });

  describe('인증', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const response = await POST(createMockPostRequest({
        workoutType: 'toner',
        goals: ['strength'],
      }));
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });
  });

  describe('입력 검증', () => {
    it('workoutType이 없으면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({
        goals: ['strength'],
      }));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Workout type is required');
    });

    it('유효하지 않은 workoutType은 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({
        workoutType: 'invalid_type',
        goals: ['strength'],
      }));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid workout type');
    });

    it('goals가 없으면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({
        workoutType: 'toner',
      }));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Goals are required');
    });

    it('goals가 빈 배열이면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({
        workoutType: 'toner',
        goals: [],
      }));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Goals are required');
    });
  });

  describe('유효한 워크아웃 타입', () => {
    const validTypes = ['toner', 'builder', 'burner', 'mover', 'flexer'];

    it.each(validTypes)('workoutType=%s 는 유효하다', async (type) => {
      const response = await POST(createMockPostRequest({
        workoutType: type,
        goals: ['strength'],
        useMock: true,
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  describe('Mock 추천', () => {
    it('useMock=true이면 Mock 추천을 사용한다', async () => {
      const response = await POST(createMockPostRequest({
        workoutType: 'toner',
        goals: ['strength'],
        useMock: true,
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedMock).toBe(true);
      expect(generateMockExerciseRecommendation).toHaveBeenCalled();
    });

    it('모든 옵션과 함께 추천이 가능하다', async () => {
      const response = await POST(createMockPostRequest({
        workoutType: 'builder',
        bodyType: 'hourglass',
        goals: ['muscle', 'strength'],
        concerns: ['upper_body'],
        injuries: [],
        equipment: ['dumbbell', 'barbell'],
        location: 'gym',
        userLevel: 'intermediate',
        sessionMinutes: 45,
        userWeight: 65,
        useMock: true,
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  describe('AI 추천', () => {
    it('AI 추천 성공 시 결과를 반환한다', async () => {
      vi.mocked(recommendExercises).mockResolvedValue(mockRecommendationResult);

      const response = await POST(createMockPostRequest({
        workoutType: 'toner',
        goals: ['strength'],
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedMock).toBe(false);
    });

    it('AI 추천 실패 시 Mock으로 폴백한다', async () => {
      vi.mocked(recommendExercises).mockRejectedValue(new Error('API Error'));

      const response = await POST(createMockPostRequest({
        workoutType: 'toner',
        goals: ['strength'],
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedMock).toBe(true);
    });
  });

  describe('운동 장소 검증', () => {
    it('유효하지 않은 location은 home으로 기본값이 설정된다', async () => {
      const response = await POST(createMockPostRequest({
        workoutType: 'toner',
        goals: ['strength'],
        location: 'invalid_location',
        useMock: true,
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it.each(['home', 'gym', 'outdoor'])('location=%s 는 유효하다', async (location) => {
      const response = await POST(createMockPostRequest({
        workoutType: 'toner',
        goals: ['strength'],
        location,
        useMock: true,
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
    });
  });

  describe('운동 레벨 검증', () => {
    it('유효하지 않은 userLevel은 beginner로 기본값이 설정된다', async () => {
      const response = await POST(createMockPostRequest({
        workoutType: 'toner',
        goals: ['strength'],
        userLevel: 'invalid_level',
        useMock: true,
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });

    it.each(['beginner', 'intermediate', 'advanced'])('userLevel=%s 는 유효하다', async (level) => {
      const response = await POST(createMockPostRequest({
        workoutType: 'toner',
        goals: ['strength'],
        userLevel: level,
        useMock: true,
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
    });
  });

  describe('응답 형식', () => {
    it('성공 응답에 필수 필드가 포함된다', async () => {
      const response = await POST(createMockPostRequest({
        workoutType: 'toner',
        goals: ['strength'],
        useMock: true,
      }));
      const json = await response.json();

      expect(json).toHaveProperty('success', true);
      expect(json).toHaveProperty('result');
      expect(json).toHaveProperty('exercises');
      expect(json).toHaveProperty('summary');
      expect(json).toHaveProperty('usedMock');

      // result 필드 확인
      expect(json.result).toHaveProperty('dailyExercises');
      expect(json.result).toHaveProperty('warmupExercises');
      expect(json.result).toHaveProperty('cooldownExercises');
      expect(json.result).toHaveProperty('recommendedAt');

      // exercises 필드 확인
      expect(json.exercises).toHaveProperty('main');
      expect(json.exercises).toHaveProperty('warmup');
      expect(json.exercises).toHaveProperty('cooldown');

      // summary 필드 확인
      expect(json.summary).toHaveProperty('totalExercises');
      expect(json.summary).toHaveProperty('estimatedMinutes');
      expect(json.summary).toHaveProperty('estimatedCalories');
      expect(json.summary).toHaveProperty('difficultyLevel');
      expect(json.summary).toHaveProperty('focusBodyParts');
    });

    it('추천된 운동에 상세 정보가 포함된다', async () => {
      const response = await POST(createMockPostRequest({
        workoutType: 'toner',
        goals: ['strength'],
        useMock: true,
      }));
      const json = await response.json();

      expect(json.exercises.main).toHaveLength(2);
      expect(json.exercises.main[0]).toHaveProperty('id');
      expect(json.exercises.main[0]).toHaveProperty('name');
      expect(json.exercises.main[0]).toHaveProperty('recommendation');
      expect(json.exercises.main[0].recommendation).toHaveProperty('sets');
      expect(json.exercises.main[0].recommendation).toHaveProperty('reps');
    });
  });

  describe('세션 시간 및 체중', () => {
    it('sessionMinutes 기본값은 30이다', async () => {
      vi.mocked(generateMockExerciseRecommendation).mockImplementation((input) => {
        expect(input.sessionMinutes).toBe(30);
        return mockRecommendationResult;
      });

      await POST(createMockPostRequest({
        workoutType: 'toner',
        goals: ['strength'],
        useMock: true,
      }));

      expect(generateMockExerciseRecommendation).toHaveBeenCalled();
    });

    it('userWeight 기본값은 60이다', async () => {
      vi.mocked(generateMockExerciseRecommendation).mockImplementation((input) => {
        expect(input.userWeight).toBe(60);
        return mockRecommendationResult;
      });

      await POST(createMockPostRequest({
        workoutType: 'toner',
        goals: ['strength'],
        useMock: true,
      }));

      expect(generateMockExerciseRecommendation).toHaveBeenCalled();
    });

    it('사용자 지정 sessionMinutes가 적용된다', async () => {
      vi.mocked(generateMockExerciseRecommendation).mockImplementation((input) => {
        expect(input.sessionMinutes).toBe(60);
        return mockRecommendationResult;
      });

      await POST(createMockPostRequest({
        workoutType: 'toner',
        goals: ['strength'],
        sessionMinutes: 60,
        useMock: true,
      }));

      expect(generateMockExerciseRecommendation).toHaveBeenCalled();
    });
  });
});
