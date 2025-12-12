/**
 * W-1 운동 타입 분석 API 테스트
 * @description POST/GET /api/workout/analyze 테스트
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
  analyzeWorkout: vi.fn(),
}));

vi.mock('@/lib/mock/workout-analysis', () => ({
  generateMockWorkoutAnalysis: vi.fn(),
}));

vi.mock('@/lib/workout/classifyWorkoutType', () => ({
  WORKOUT_TYPE_INFO: {
    toner: { label: '토너', description: '근력 강화', icon: 'dumbbell', color: '#FF6B6B', bgColor: '#FFF5F5' },
    builder: { label: '빌더', description: '근육량 증가', icon: 'trophy', color: '#4CAF50', bgColor: '#F1F8E9' },
    burner: { label: '버너', description: '체지방 감소', icon: 'flame', color: '#FF9800', bgColor: '#FFF3E0' },
    mover: { label: '무버', description: '활동성 향상', icon: 'activity', color: '#2196F3', bgColor: '#E3F2FD' },
    flexer: { label: '플렉서', description: '유연성 증진', icon: 'stretch', color: '#9C27B0', bgColor: '#F3E5F5' },
  },
}));

import { GET, POST } from '@/app/api/workout/analyze/route';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { analyzeWorkout } from '@/lib/gemini';
import { generateMockWorkoutAnalysis } from '@/lib/mock/workout-analysis';

// Mock 요청 헬퍼
function createMockPostRequest(body: unknown): Request {
  return {
    url: 'http://localhost/api/workout/analyze',
    json: () => Promise.resolve(body),
  } as Request;
}

// Mock 데이터
const mockWorkoutAnalysisResult = {
  workoutType: 'toner' as const,
  workoutTypeLabel: '토너',
  workoutTypeDescription: '근력 강화에 집중하는 타입',
  reason: '상체 근력 강화가 목표이고 집에서 운동을 원하시네요.',
  confidence: 85,
  strengths: ['상체 밸런스', '코어 안정성'],
  recommendations: ['푸쉬업', '플랭크', '덤벨 로우'],
  bodyTypeAdvice: '상체 균형을 맞추는 운동에 집중하세요.',
  goalAdvice: '근력 강화를 위해 점진적 과부하를 적용하세요.',
  recommendedExercises: [
    { name: '푸쉬업', category: 'upper', reason: '상체 전반 강화' },
    { name: '플랭크', category: 'core', reason: '코어 안정성' },
  ],
  weeklyPlanSuggestion: {
    workoutDays: 3,
    focusAreas: ['상체', '코어'],
    intensity: 'medium' as const,
  },
};

const mockDbResult = {
  id: 'workout-123',
  user_id: 'uuid-user-123',
  workout_type: 'toner',
  workout_type_reason: '상체 근력 강화가 목표입니다.',
  workout_type_confidence: 85,
  goals: ['strength', 'tone'],
  concerns: ['upper_body'],
  frequency: '3-4',
  location: 'home',
  equipment: ['dumbbell'],
  injuries: [],
  created_at: '2025-12-09T10:00:00Z',
};

describe('POST /api/workout/analyze', () => {
  const mockUserSelect = vi.fn();
  const mockBodyAnalysisSelect = vi.fn();
  const mockPcSelect = vi.fn();
  const mockInsertSelect = vi.fn();

  const mockSupabase = {
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);
    vi.mocked(generateMockWorkoutAnalysis).mockReturnValue(mockWorkoutAnalysisResult);

    // Default supabase mock
    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockUserSelect.mockResolvedValue({ data: { id: 'uuid-user-123' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'body_analyses') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: mockBodyAnalysisSelect.mockResolvedValue({ data: { id: 'body-123' }, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'personal_color_assessments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: mockPcSelect.mockResolvedValue({ data: { id: 'pc-123' }, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'workout_analyses') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: mockInsertSelect.mockResolvedValue({ data: mockDbResult, error: null }),
            }),
          }),
        };
      }
      return {};
    });
  });

  describe('인증', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const response = await POST(createMockPostRequest({
        goals: ['strength'],
        frequency: '3-4',
      }));
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });
  });

  describe('입력 검증', () => {
    it('goals가 없으면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({
        frequency: '3-4',
      }));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Goals are required');
    });

    it('goals가 빈 배열이면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({
        goals: [],
        frequency: '3-4',
      }));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Goals are required');
    });

    it('frequency가 없으면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({
        goals: ['strength'],
      }));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Frequency is required');
    });
  });

  describe('Mock 분석', () => {
    it('useMock=true이면 Mock 분석을 사용한다', async () => {
      const response = await POST(createMockPostRequest({
        goals: ['strength', 'tone'],
        frequency: '3-4',
        useMock: true,
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedMock).toBe(true);
      expect(generateMockWorkoutAnalysis).toHaveBeenCalled();
    });

    it('체형 정보와 함께 분석이 가능하다', async () => {
      const response = await POST(createMockPostRequest({
        bodyType: 'hourglass',
        goals: ['strength'],
        concerns: ['upper_body'],
        frequency: '3-4',
        location: 'home',
        equipment: ['dumbbell'],
        useMock: true,
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  describe('AI 분석', () => {
    it('AI 분석 성공 시 결과를 반환한다', async () => {
      vi.mocked(analyzeWorkout).mockResolvedValue(mockWorkoutAnalysisResult);

      const response = await POST(createMockPostRequest({
        goals: ['strength'],
        frequency: '3-4',
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedMock).toBe(false);
    });

    it('AI 분석 실패 시 Mock으로 폴백한다', async () => {
      vi.mocked(analyzeWorkout).mockRejectedValue(new Error('API Error'));

      const response = await POST(createMockPostRequest({
        goals: ['strength'],
        frequency: '3-4',
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedMock).toBe(true);
    });
  });

  describe('사용자 조회', () => {
    it('사용자를 찾을 수 없으면 404를 반환한다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
              }),
            }),
          };
        }
        return {};
      });

      const response = await POST(createMockPostRequest({
        goals: ['strength'],
        frequency: '3-4',
        useMock: true,
      }));
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe('User not found');
    });
  });

  describe('DB 저장', () => {
    it('분석 결과가 DB에 저장된다', async () => {
      const response = await POST(createMockPostRequest({
        goals: ['strength'],
        frequency: '3-4',
        useMock: true,
      }));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toEqual(mockDbResult);
    });

    it('DB 저장 실패 시 500을 반환한다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'uuid-user-123' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'body_analyses' || table === 'personal_color_assessments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'workout_analyses') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
              }),
            }),
          };
        }
        return {};
      });

      const response = await POST(createMockPostRequest({
        goals: ['strength'],
        frequency: '3-4',
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
        goals: ['strength'],
        frequency: '3-4',
        useMock: true,
      }));
      const json = await response.json();

      expect(json).toHaveProperty('success', true);
      expect(json).toHaveProperty('data');
      expect(json).toHaveProperty('result');
      expect(json).toHaveProperty('usedMock');
      expect(json.result).toHaveProperty('workoutType');
      expect(json.result).toHaveProperty('workoutTypeLabel');
      expect(json.result).toHaveProperty('analyzedAt');
    });
  });
});

describe('GET /api/workout/analyze', () => {
  const mockUserSelect = vi.fn();
  const mockAnalysisSelect = vi.fn();

  const mockSupabase = {
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as Awaited<ReturnType<typeof auth>>);
    vi.mocked(createServiceRoleClient).mockReturnValue(mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>);

    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockUserSelect.mockResolvedValue({ data: { id: 'uuid-user-123' }, error: null }),
            }),
          }),
        };
      }
      if (table === 'workout_analyses') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: mockAnalysisSelect.mockResolvedValue({ data: mockDbResult, error: null }),
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });
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
    it('최신 분석 결과를 반환한다', async () => {
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.data.workout_type).toBe('toner');
    });

    it('분석 결과가 없으면 null을 반환한다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'uuid-user-123' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'workout_analyses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeNull();
    });

    it('사용자를 찾을 수 없으면 404를 반환한다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
              }),
            }),
          };
        }
        return {};
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe('User not found');
    });

    it('DB 에러 시 500을 반환한다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'uuid-user-123' }, error: null }),
              }),
            }),
          };
        }
        if (table === 'workout_analyses') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: { code: 'OTHER', message: 'DB Error' } }),
                  }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Failed to fetch analysis');
    });
  });
});
