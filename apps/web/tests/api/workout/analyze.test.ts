/**
 * W-1 운동 타입 분석 API 테스트
 * @description POST/GET /api/workout/analyze 테스트
 * @version 2.0
 * @date 2026-02-13
 *
 * 테스트 케이스:
 * POST - 인증(1), 입력검증(5), Mock분석(2), AI분석(2), 사용자조회(1),
 *        C-1연동(2), DB저장(2), 게이미피케이션(1), 응답구조(3), 기본값(4), 에러(1)
 * GET  - 인증(1), 사용자조회(1), 데이터조회(3), 응답구조(2), 에러(1)
 * 총 32개
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mock 모듈 설정 ---
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

vi.mock('@/lib/levels', () => ({
  trackActivity: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/workout/classifyWorkoutType', () => ({
  WORKOUT_TYPE_INFO: {
    toner: {
      label: '토너',
      icon: '✨',
      description: '근육 탄력과 라인 만들기에 집중',
      color: 'text-purple-700',
      bgColor: 'bg-purple-50',
    },
    builder: {
      label: '빌더',
      icon: '💪',
      description: '근육량 증가와 근력 강화에 집중',
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
    },
    burner: {
      label: '버너',
      icon: '🔥',
      description: '체지방 연소와 체중 감량에 집중',
      color: 'text-red-700',
      bgColor: 'bg-red-50',
    },
    mover: {
      label: '무버',
      icon: '🏃',
      description: '체력 향상과 심폐 기능 강화에 집중',
      color: 'text-orange-700',
      bgColor: 'bg-orange-50',
    },
    flexer: {
      label: '플렉서',
      icon: '🧘',
      description: '유연성과 균형감각 향상에 집중',
      color: 'text-green-700',
      bgColor: 'bg-green-50',
    },
  },
}));

import { GET, POST } from '@/app/api/workout/analyze/route';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { analyzeWorkout } from '@/lib/gemini';
import { generateMockWorkoutAnalysis } from '@/lib/mock/workout-analysis';
import { trackActivity } from '@/lib/levels';

// --- 테스트 헬퍼 ---

/** POST 요청 생성 헬퍼 (Request.json() mock) */
function createMockPostRequest(body: unknown): Request {
  return {
    url: 'http://localhost/api/workout/analyze',
    json: () => Promise.resolve(body),
  } as Request;
}

/** 유효한 POST 요청 바디 */
function validBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    goals: ['weight_loss', 'strength'],
    frequency: '3-4',
    concerns: ['belly', 'thigh'],
    location: 'gym',
    equipment: ['dumbbell', 'barbell'],
    ...overrides,
  };
}

/** json() 호출 시 에러를 던지는 Request mock */
function createBadJsonRequest(): Request {
  return {
    url: 'http://localhost/api/workout/analyze',
    json: () => Promise.reject(new SyntaxError('Unexpected token')),
  } as Request;
}

// --- Mock 데이터 ---
const mockWorkoutAnalysisResult = {
  workoutType: 'toner' as const,
  workoutTypeLabel: '토너',
  workoutTypeDescription: '근력 강화에 집중하는 타입',
  reason: '상체 근력 강화가 목표이고 집에서 운동을 원하시네요.',
  confidence: 85,
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

// ==========================================
// POST /api/workout/analyze
// ==========================================
describe('POST /api/workout/analyze', () => {
  const mockUserSelect = vi.fn();
  const mockBodyAnalysisSelect = vi.fn();
  const mockPcSelect = vi.fn();
  const mockInsertSelect = vi.fn();

  const mockSupabase = {
    from: vi.fn(),
  };

  /** 테이블별 Supabase mock 기본 설정 복원 */
  function resetSupabaseMock(): void {
    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockUserSelect.mockResolvedValue({
                data: { id: 'uuid-user-123' },
                error: null,
              }),
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
                  single: mockBodyAnalysisSelect.mockResolvedValue({
                    data: { id: 'body-123' },
                    error: null,
                  }),
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
                  single: mockPcSelect.mockResolvedValue({
                    data: { id: 'pc-123' },
                    error: null,
                  }),
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
              single: mockInsertSelect.mockResolvedValue({
                data: mockDbResult,
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as Awaited<
      ReturnType<typeof auth>
    >);
    vi.mocked(createServiceRoleClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>
    );
    vi.mocked(generateMockWorkoutAnalysis).mockReturnValue(mockWorkoutAnalysisResult);
    resetSupabaseMock();
  });

  // --- 인증 ---
  describe('인증', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const response = await POST(createMockPostRequest(validBody()));
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });
  });

  // --- 입력 검증 ---
  describe('입력 검증', () => {
    it('goals가 없으면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest({ frequency: '3-4' }));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Goals are required');
    });

    it('goals가 빈 배열이면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest(validBody({ goals: [] })));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Goals are required');
    });

    it('goals가 배열이 아닌 문자열이면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest(validBody({ goals: 'weight_loss' })));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Goals are required');
    });

    it('frequency가 없으면 400을 반환한다', async () => {
      const body = validBody();
      delete body.frequency;

      const response = await POST(createMockPostRequest(body));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Frequency is required');
    });

    it('frequency가 빈 문자열이면 400을 반환한다', async () => {
      const response = await POST(createMockPostRequest(validBody({ frequency: '' })));
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Frequency is required');
    });
  });

  // --- Mock 분석 ---
  describe('Mock 분석', () => {
    it('useMock=true이면 Mock 분석을 사용한다', async () => {
      const response = await POST(createMockPostRequest(validBody({ useMock: true })));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedMock).toBe(true);
      expect(generateMockWorkoutAnalysis).toHaveBeenCalled();
      expect(analyzeWorkout).not.toHaveBeenCalled();
    });

    it('Mock 분석 시 입력 데이터가 올바르게 전달된다', async () => {
      await POST(
        createMockPostRequest(validBody({ useMock: true, location: 'outdoor', injuries: ['knee'] }))
      );

      expect(generateMockWorkoutAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({
          goals: ['weight_loss', 'strength'],
          frequency: '3-4',
          concerns: ['belly', 'thigh'],
          location: 'outdoor',
          equipment: ['dumbbell', 'barbell'],
          injuries: ['knee'],
        })
      );
    });
  });

  // --- AI 분석 ---
  describe('AI 분석', () => {
    it('AI 분석 성공 시 usedMock=false를 반환한다', async () => {
      vi.mocked(analyzeWorkout).mockResolvedValue(mockWorkoutAnalysisResult);

      const response = await POST(createMockPostRequest(validBody()));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedMock).toBe(false);
      expect(analyzeWorkout).toHaveBeenCalled();
    });

    it('AI 분석 실패 시 Mock으로 폴백하고 usedMock=true를 반환한다', async () => {
      vi.mocked(analyzeWorkout).mockRejectedValue(new Error('Gemini API timeout'));

      const response = await POST(createMockPostRequest(validBody()));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.usedMock).toBe(true);
      expect(analyzeWorkout).toHaveBeenCalled();
      expect(generateMockWorkoutAnalysis).toHaveBeenCalled();
    });
  });

  // --- 사용자 조회 ---
  describe('사용자 조회', () => {
    it('사용자를 찾을 수 없으면 404를 반환한다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' },
                }),
              }),
            }),
          };
        }
        return {};
      });

      const response = await POST(createMockPostRequest(validBody({ useMock: true })));
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe('User not found');
    });
  });

  // --- C-1 체형 분석 연동 ---
  describe('C-1 체형 분석 연동', () => {
    it('bodyType이 있으면 body_analyses를 조회한다', async () => {
      const response = await POST(
        createMockPostRequest(validBody({ bodyType: 'hourglass', useMock: true }))
      );
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);

      // body_analyses 테이블 호출 확인
      const fromCalls = mockSupabase.from.mock.calls;
      const bodyAnalysisCalls = fromCalls.filter((call: string[]) => call[0] === 'body_analyses');
      expect(bodyAnalysisCalls.length).toBeGreaterThan(0);
    });

    it('bodyType이 없으면 body_analyses를 조회하지 않는다', async () => {
      // bodyType 없는 요청
      const body = validBody({ useMock: true });
      delete body.bodyType;

      const response = await POST(createMockPostRequest(body));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);

      const fromCalls = mockSupabase.from.mock.calls;
      const bodyAnalysisCalls = fromCalls.filter((call: string[]) => call[0] === 'body_analyses');
      expect(bodyAnalysisCalls.length).toBe(0);
    });
  });

  // --- DB 저장 ---
  describe('DB 저장', () => {
    it('분석 결과가 DB에 저장되고 응답에 포함된다', async () => {
      const response = await POST(createMockPostRequest(validBody({ useMock: true })));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toEqual(mockDbResult);

      // workout_analyses INSERT 호출 확인
      const fromCalls = mockSupabase.from.mock.calls;
      const workoutCalls = fromCalls.filter((call: string[]) => call[0] === 'workout_analyses');
      expect(workoutCalls.length).toBeGreaterThan(0);
    });

    it('DB 저장 실패 시 500을 반환한다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'uuid-user-123' },
                  error: null,
                }),
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
                    single: vi.fn().mockResolvedValue({
                      data: null,
                      error: null,
                    }),
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
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Insert failed: constraint violation' },
                }),
              }),
            }),
          };
        }
        return {};
      });

      const response = await POST(createMockPostRequest(validBody({ useMock: true })));
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Failed to save analysis');
      expect(json.details).toBeDefined();
    });
  });

  // --- 게이미피케이션 연동 ---
  describe('게이미피케이션 연동', () => {
    it('분석 완료 후 trackActivity를 호출한다', async () => {
      const response = await POST(createMockPostRequest(validBody({ useMock: true })));

      expect(response.status).toBe(200);
      expect(trackActivity).toHaveBeenCalledWith(
        expect.anything(), // supabase 클라이언트
        'user_test123', // clerk userId
        'analysis', // activityType
        mockDbResult.id // referenceId
      );
    });
  });

  // --- 응답 구조 ---
  describe('응답 구조', () => {
    it('성공 응답에 필수 필드가 포함된다', async () => {
      const response = await POST(createMockPostRequest(validBody({ useMock: true })));
      const json = await response.json();

      expect(json).toHaveProperty('success', true);
      expect(json).toHaveProperty('data');
      expect(json).toHaveProperty('result');
      expect(json).toHaveProperty('usedMock');
    });

    it('result에 운동 타입 상세 정보가 포함된다', async () => {
      const response = await POST(createMockPostRequest(validBody({ useMock: true })));
      const json = await response.json();

      expect(json.result).toHaveProperty('workoutType');
      expect(json.result).toHaveProperty('workoutTypeLabel');
      expect(json.result).toHaveProperty('workoutTypeDescription');
      expect(json.result).toHaveProperty('workoutTypeIcon');
      expect(json.result).toHaveProperty('workoutTypeColor');
      expect(json.result).toHaveProperty('workoutTypeBgColor');
      expect(json.result).toHaveProperty('analyzedAt');
    });

    it('result의 analyzedAt이 유효한 ISO 날짜 문자열이다', async () => {
      const response = await POST(createMockPostRequest(validBody({ useMock: true })));
      const json = await response.json();

      const parsed = new Date(json.result.analyzedAt);
      expect(parsed.toISOString()).toBe(json.result.analyzedAt);
    });
  });

  // --- 선택적 필드 기본값 ---
  describe('선택적 필드 기본값', () => {
    it('concerns가 없으면 빈 배열로 처리된다', async () => {
      const body = { goals: ['strength'], frequency: '3-4', useMock: true };

      const response = await POST(createMockPostRequest(body));

      expect(response.status).toBe(200);
      expect(generateMockWorkoutAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({ concerns: [] })
      );
    });

    it('location이 없으면 home으로 기본값이 적용된다', async () => {
      const body = { goals: ['strength'], frequency: '3-4', useMock: true };

      await POST(createMockPostRequest(body));

      expect(generateMockWorkoutAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({ location: 'home' })
      );
    });

    it('equipment이 없으면 빈 배열로 처리된다', async () => {
      const body = { goals: ['strength'], frequency: '3-4', useMock: true };

      await POST(createMockPostRequest(body));

      expect(generateMockWorkoutAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({ equipment: [] })
      );
    });

    it('injuries가 없으면 빈 배열로 처리된다', async () => {
      const body = { goals: ['strength'], frequency: '3-4', useMock: true };

      await POST(createMockPostRequest(body));

      expect(generateMockWorkoutAnalysis).toHaveBeenCalledWith(
        expect.objectContaining({ injuries: [] })
      );
    });
  });

  // --- 에러 처리 ---
  describe('에러 처리', () => {
    it('req.json() 실패 등 예기치 못한 에러 시 500을 반환한다', async () => {
      const response = await POST(createBadJsonRequest());
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal server error');
    });
  });
});

// ==========================================
// GET /api/workout/analyze
// ==========================================
describe('GET /api/workout/analyze', () => {
  const mockUserSelect = vi.fn();
  const mockAnalysisSelect = vi.fn();

  const mockSupabase = {
    from: vi.fn(),
  };

  const mockGetData = {
    id: 'workout-123',
    user_id: 'uuid-user-123',
    workout_type: 'toner',
    workout_type_reason: '상체 근력 강화가 목표입니다.',
    workout_type_confidence: 85,
    goals: ['strength'],
    concerns: [],
    frequency: '3-4',
    location: 'home',
    equipment: ['dumbbell'],
    injuries: [],
    created_at: '2025-12-09T10:00:00Z',
  };

  function resetGetSupabaseMock(): void {
    mockSupabase.from = vi.fn().mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockUserSelect.mockResolvedValue({
                data: { id: 'uuid-user-123' },
                error: null,
              }),
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
                  single: mockAnalysisSelect.mockResolvedValue({
                    data: mockGetData,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ userId: 'user_test123' } as Awaited<
      ReturnType<typeof auth>
    >);
    vi.mocked(createServiceRoleClient).mockReturnValue(
      mockSupabase as unknown as ReturnType<typeof createServiceRoleClient>
    );
    resetGetSupabaseMock();
  });

  // --- 인증 ---
  describe('인증', () => {
    it('인증되지 않은 요청은 401을 반환한다', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });
  });

  // --- 사용자 조회 ---
  describe('사용자 조회', () => {
    it('사용자를 찾을 수 없으면 404를 반환한다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' },
                }),
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
  });

  // --- 데이터 조회 ---
  describe('데이터 조회', () => {
    it('최신 분석 결과를 반환한다', async () => {
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.data.workout_type).toBe('toner');
      expect(json.data.id).toBe('workout-123');
    });

    it('분석 결과가 없으면 data: null과 메시지를 반환한다 (PGRST116)', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'uuid-user-123' },
                  error: null,
                }),
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
                    single: vi.fn().mockResolvedValue({
                      data: null,
                      error: { code: 'PGRST116', message: 'No rows returned' },
                    }),
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
      expect(json.message).toBe('No analysis found');
    });

    it('DB 에러 (PGRST116 외) 시 500을 반환한다', async () => {
      mockSupabase.from = vi.fn().mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'uuid-user-123' },
                  error: null,
                }),
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
                    single: vi.fn().mockResolvedValue({
                      data: null,
                      error: { code: 'PGRST500', message: 'Database connection failed' },
                    }),
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

  // --- 응답 구조 ---
  describe('응답 구조', () => {
    it('정상 조회 시 운동 타입 상세 정보가 포함된다', async () => {
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toHaveProperty('workoutTypeLabel');
      expect(json.data).toHaveProperty('workoutTypeDescription');
      expect(json.data).toHaveProperty('workoutTypeIcon');
      expect(json.data).toHaveProperty('workoutTypeColor');
      expect(json.data).toHaveProperty('workoutTypeBgColor');
    });

    it('운동 타입 라벨이 WORKOUT_TYPE_INFO의 값과 일치한다', async () => {
      const response = await GET();
      const json = await response.json();

      // mockGetData.workout_type === 'toner'
      expect(json.data.workoutTypeLabel).toBe('토너');
      expect(json.data.workoutTypeDescription).toBe('근육 탄력과 라인 만들기에 집중');
      expect(json.data.workoutTypeIcon).toBe('✨');
    });
  });

  // --- 에러 처리 ---
  describe('에러 처리', () => {
    it('예기치 못한 에러 시 500을 반환한다', async () => {
      vi.mocked(auth).mockRejectedValue(new Error('Auth service unavailable'));

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Internal server error');
    });
  });
});
