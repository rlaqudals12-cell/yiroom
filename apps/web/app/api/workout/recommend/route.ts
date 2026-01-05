import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  recommendExercises,
  type ExerciseRecommendationInput,
  type GeminiExerciseRecommendationResult,
} from '@/lib/gemini';
import { generateMockExerciseRecommendation } from '@/lib/mock/workout-analysis';
import { getAllExercises, getExerciseById } from '@/lib/workout/exercises';
import type { WorkoutType } from '@/types/workout';

// 환경변수: Mock 모드 강제 여부 (개발/테스트용)
const FORCE_MOCK = process.env.FORCE_MOCK_AI === 'true';

/**
 * W-1 운동 추천 API (Task 3.5)
 *
 * POST /api/workout/recommend
 * Body: {
 *   workoutType: string,           // 운동 타입 (toner, builder, burner, mover, flexer)
 *   bodyType?: string,             // 체형 (C-1 연동)
 *   goals: string[],               // 운동 목표
 *   concerns: string[],            // 집중 부위
 *   injuries?: string[],           // 부상/통증 부위 (Fallback용 - 호환성)
 *   equipment: string[],           // 사용 가능 장비
 *   location: string,              // 운동 장소
 *   userLevel?: string,            // 운동 레벨 (beginner, intermediate, advanced)
 *   sessionMinutes?: number,       // 목표 운동 시간 (기본 30분)
 *   userWeight?: number,           // 체중 (칼로리 계산용)
 *   useMock?: boolean              // Mock 모드 강제 (선택)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   result: GeminiExerciseRecommendationResult,  // 추천 결과
 *   exercises: Exercise[],                        // 추천된 운동 상세 정보
 *   usedMock: boolean
 * }
 */
export async function POST(req: Request) {
  try {
    // Clerk 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      workoutType,
      bodyType,
      goals,
      concerns,
      injuries,
      equipment,
      location,
      userLevel,
      sessionMinutes,
      userWeight,
      useMock = false,
    } = body;

    // 필수 필드 검증
    if (!workoutType) {
      return NextResponse.json({ error: 'Workout type is required' }, { status: 400 });
    }

    // 유효한 운동 타입인지 확인
    const validWorkoutTypes: WorkoutType[] = ['toner', 'builder', 'burner', 'mover', 'flexer'];
    if (!validWorkoutTypes.includes(workoutType as WorkoutType)) {
      return NextResponse.json({ error: 'Invalid workout type' }, { status: 400 });
    }

    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      return NextResponse.json({ error: 'Goals are required' }, { status: 400 });
    }

    // 유효한 운동 장소인지 확인 (기본값: home)
    const validLocations = ['home', 'gym', 'outdoor'] as const;
    type ValidLocation = (typeof validLocations)[number];
    const validatedLocation: ValidLocation = validLocations.includes(location as ValidLocation)
      ? (location as ValidLocation)
      : 'home';

    // 유효한 운동 레벨인지 확인 (기본값: beginner)
    const validLevels = ['beginner', 'intermediate', 'advanced'] as const;
    type ValidLevel = (typeof validLevels)[number];
    const validatedLevel: ValidLevel = validLevels.includes(userLevel as ValidLevel)
      ? (userLevel as ValidLevel)
      : 'beginner';

    // 운동 DB 로드
    const allExercises = getAllExercises();

    // AI용 운동 데이터 변환 (필요한 필드만)
    const exercisesForAI = allExercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      category: ex.category,
      bodyParts: ex.bodyParts,
      equipment: ex.equipment,
      difficulty: ex.difficulty,
      met: ex.met,
    }));

    // AI 추천 입력 데이터 구성
    const recommendInput: ExerciseRecommendationInput = {
      workoutType: workoutType as WorkoutType,
      bodyType,
      goals,
      concerns: concerns || [],
      injuries: injuries || [],
      equipment: equipment || [],
      location: validatedLocation,
      availableExercises: exercisesForAI,
      userLevel: validatedLevel,
      sessionMinutes: sessionMinutes || 30,
      userWeight: userWeight || 60,
    };

    // AI 추천 실행 (Real AI 또는 Mock)
    let result: GeminiExerciseRecommendationResult;
    let usedMock = false;

    if (FORCE_MOCK || useMock) {
      // Mock 모드
      result = generateMockExerciseRecommendation(recommendInput);
      usedMock = true;
      console.log('[W-1] Using mock exercise recommendation');
    } else {
      // Real AI 추천
      try {
        console.log('[W-1] Starting Gemini exercise recommendation...');
        result = await recommendExercises(recommendInput);
        console.log('[W-1] Gemini recommendation completed');
      } catch (aiError) {
        // AI 실패 시 Mock으로 폴백
        console.error('[W-1] Gemini error, falling back to mock:', aiError);
        result = generateMockExerciseRecommendation(recommendInput);
        usedMock = true;
      }
    }

    // 추천된 운동 ID로 상세 정보 조회
    const recommendedExercises = result.dailyExercises
      .map((rec) => {
        const exercise = getExerciseById(rec.exerciseId);
        if (!exercise) return null;
        return {
          ...exercise,
          recommendation: {
            reason: rec.reason,
            sets: rec.sets,
            reps: rec.reps,
            restSeconds: rec.restSeconds,
            weight: rec.weight,
            duration: rec.duration,
            priority: rec.priority,
          },
        };
      })
      .filter(Boolean);

    // 워밍업 운동 상세 정보
    const warmupExercises = result.warmupExercises.map((id) => getExerciseById(id)).filter(Boolean);

    // 쿨다운 운동 상세 정보
    const cooldownExercises = result.cooldownExercises
      .map((id) => getExerciseById(id))
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        recommendedAt: new Date().toISOString(),
      },
      exercises: {
        main: recommendedExercises,
        warmup: warmupExercises,
        cooldown: cooldownExercises,
      },
      summary: {
        totalExercises: recommendedExercises.length,
        estimatedMinutes: result.estimatedMinutes,
        estimatedCalories: result.estimatedCalories,
        difficultyLevel: result.difficultyLevel,
        focusBodyParts: result.focusBodyParts,
      },
      usedMock,
    });
  } catch (error) {
    console.error('[W-1] Exercise recommendation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
