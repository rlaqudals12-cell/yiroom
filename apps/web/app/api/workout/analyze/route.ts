import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  analyzeWorkout,
  type WorkoutAnalysisInput,
  type GeminiWorkoutAnalysisResult,
} from '@/lib/gemini';
import { generateMockWorkoutAnalysis } from '@/lib/mock/workout-analysis';
import { WORKOUT_TYPE_INFO } from '@/lib/workout/classifyWorkoutType';
import type { WorkoutType } from '@/types/workout';

// 환경변수: Mock 모드 강제 여부 (개발/테스트용)
const FORCE_MOCK = process.env.FORCE_MOCK_AI === 'true';

/**
 * W-1 운동 타입 분석 API (Task 3.4)
 *
 * POST /api/workout/analyze
 * Body: {
 *   bodyType?: string,           // 체형 (C-1 연동)
 *   bodyProportions?: object,    // 체형 비율
 *   goals: string[],             // 운동 목표
 *   concerns: string[],          // 신체 고민
 *   frequency: string,           // 운동 빈도
 *   location: string,            // 운동 장소
 *   equipment: string[],         // 장비
 *   injuries?: string[],         // 부상/통증
 *   targetWeight?: number,       // 목표 체중
 *   targetDate?: string,         // 목표 날짜
 *   useMock?: boolean            // Mock 모드 강제 (선택)
 * }
 *
 * Returns: {
 *   success: boolean,
 *   data: WorkoutAnalysis,       // DB 저장된 데이터
 *   result: GeminiWorkoutAnalysisResult,
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
      bodyType,
      bodyProportions,
      goals,
      concerns,
      frequency,
      location,
      equipment,
      injuries,
      targetWeight,
      targetDate,
      useMock = false,
    } = body;

    // 필수 필드 검증
    if (!goals || !Array.isArray(goals) || goals.length === 0) {
      return NextResponse.json(
        { error: 'Goals are required' },
        { status: 400 }
      );
    }

    if (!frequency) {
      return NextResponse.json(
        { error: 'Frequency is required' },
        { status: 400 }
      );
    }

    // AI 분석 입력 데이터 구성
    const analysisInput: WorkoutAnalysisInput = {
      bodyType,
      bodyProportions,
      goals,
      concerns: concerns || [],
      frequency,
      location: location || 'home',
      equipment: equipment || [],
      injuries: injuries || [],
    };

    // AI 분석 실행 (Real AI 또는 Mock)
    let result: GeminiWorkoutAnalysisResult;
    let usedMock = false;

    if (FORCE_MOCK || useMock) {
      // Mock 모드
      result = generateMockWorkoutAnalysis(analysisInput);
      usedMock = true;
      console.log('[W-1] Using mock analysis');
    } else {
      // Real AI 분석
      try {
        console.log('[W-1] Starting Gemini workout analysis...');
        result = await analyzeWorkout(analysisInput);
        console.log('[W-1] Gemini analysis completed:', result.workoutType);
      } catch (aiError) {
        // AI 실패 시 Mock으로 폴백
        console.error('[W-1] Gemini error, falling back to mock:', aiError);
        result = generateMockWorkoutAnalysis(analysisInput);
        usedMock = true;
      }
    }

    const supabase = createServiceRoleClient();

    // users 테이블에서 내부 user_id 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !userData) {
      console.error('[W-1] User not found:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // C-1 최신 체형 분석 결과 조회 (연동)
    let bodyAnalysisId: string | null = null;
    if (bodyType) {
      const { data: bodyData } = await supabase
        .from('body_analyses')
        .select('id')
        .eq('clerk_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      bodyAnalysisId = bodyData?.id || null;
    }

    // PC-1 최신 퍼스널 컬러 결과 조회 (연동)
    const { data: pcData } = await supabase
      .from('personal_color_assessments')
      .select('id')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const personalColorId = pcData?.id || null;

    // DB에 저장
    const { data, error } = await supabase
      .from('workout_analyses')
      .insert({
        user_id: userData.id,
        body_analysis_id: bodyAnalysisId,
        personal_color_id: personalColorId,
        workout_type: result.workoutType,
        workout_type_reason: result.reason,
        workout_type_confidence: result.confidence,
        goals: goals,
        concerns: concerns || [],
        frequency,
        location: location || 'home',
        equipment: equipment || [],
        injuries: injuries || [],
        target_weight: targetWeight,
        target_date: targetDate,
      })
      .select()
      .single();

    if (error) {
      console.error('[W-1] Database insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save analysis', details: error.message },
        { status: 500 }
      );
    }

    // 운동 타입 상세 정보 추가
    const workoutTypeInfo = WORKOUT_TYPE_INFO[result.workoutType as WorkoutType];

    return NextResponse.json({
      success: true,
      data,
      result: {
        ...result,
        workoutTypeLabel: result.workoutTypeLabel || workoutTypeInfo?.label,
        workoutTypeDescription: result.workoutTypeDescription || workoutTypeInfo?.description,
        workoutTypeIcon: workoutTypeInfo?.icon,
        workoutTypeColor: workoutTypeInfo?.color,
        workoutTypeBgColor: workoutTypeInfo?.bgColor,
        analyzedAt: new Date().toISOString(),
      },
      usedMock,
    });
  } catch (error) {
    console.error('[W-1] Workout analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * 사용자의 최신 운동 분석 결과 조회 API
 *
 * GET /api/workout/analyze
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // users 테이블에서 내부 user_id 조회
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 최신 분석 결과 조회
    const { data, error } = await supabase
      .from('workout_analyses')
      .select('*')
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No analysis found
        return NextResponse.json({
          success: true,
          data: null,
          message: 'No analysis found',
        });
      }
      console.error('[W-1] Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analysis' },
        { status: 500 }
      );
    }

    // 운동 타입 상세 정보 추가
    const workoutTypeInfo = WORKOUT_TYPE_INFO[data.workout_type as WorkoutType];

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        workoutTypeLabel: workoutTypeInfo?.label,
        workoutTypeDescription: workoutTypeInfo?.description,
        workoutTypeIcon: workoutTypeInfo?.icon,
        workoutTypeColor: workoutTypeInfo?.color,
        workoutTypeBgColor: workoutTypeInfo?.bgColor,
      },
    });
  } catch (error) {
    console.error('[W-1] Get workout analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
