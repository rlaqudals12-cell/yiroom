/**
 * N-1 Task 2.18: 간헐적 단식 API
 *
 * 엔드포인트: /api/nutrition/fasting
 * - GET: 활성 단식 세션 및 히스토리 조회
 * - POST: 새 단식 세션 시작
 * - PATCH: 단식 세션 완료/업데이트
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

// 단식 세션 시작 요청 타입
interface StartFastingRequest {
  targetHours: number;
  notes?: string;
}

// 단식 세션 업데이트 요청 타입
interface UpdateFastingRequest {
  id: string;
  isCompleted?: boolean;
  notes?: string;
}

/**
 * GET: 활성 단식 세션 및 히스토리 조회
 *
 * Query params:
 * - includeHistory: boolean (히스토리 포함 여부)
 * - historyLimit: number (히스토리 개수, 기본값 10)
 */
export async function GET(request: Request) {
  try {
    // 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query params 파싱
    const url = new URL(request.url);
    const includeHistory = url.searchParams.get('includeHistory') === 'true';
    const historyLimit = parseInt(url.searchParams.get('historyLimit') || '10', 10);

    const supabase = createServiceRoleClient();

    // 활성 단식 세션 조회 (is_completed = false)
    const { data: activeSession, error: activeError } = await supabase
      .from('fasting_records')
      .select('*')
      .eq('clerk_user_id', userId)
      .is('end_time', null)
      .single();

    // PGRST116은 결과가 없을 때 발생하는 정상적인 에러
    if (activeError && activeError.code !== 'PGRST116') {
      console.error('[Fasting API] Active session fetch error:', activeError);
      return NextResponse.json(
        { error: 'Failed to fetch active fasting session', details: activeError.message },
        { status: 500 }
      );
    }

    // 결과 객체
    const result: {
      success: boolean;
      activeSession: typeof activeSession | null;
      history?: Array<typeof activeSession>;
    } = {
      success: true,
      activeSession: activeSession || null,
    };

    // 히스토리 포함 요청 시
    if (includeHistory) {
      const { data: history, error: historyError } = await supabase
        .from('fasting_records')
        .select('*')
        .eq('clerk_user_id', userId)
        .order('start_time', { ascending: false })
        .limit(historyLimit);

      if (historyError) {
        console.error('[Fasting API] History fetch error:', historyError);
        return NextResponse.json(
          { error: 'Failed to fetch fasting history', details: historyError.message },
          { status: 500 }
        );
      }

      result.history = history || [];
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Fasting API] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST: 새 단식 세션 시작
 *
 * Body:
 * - targetHours: number (목표 단식 시간, 1-24)
 * - notes?: string (메모)
 */
export async function POST(request: Request) {
  try {
    // 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 요청 본문 파싱
    const body: StartFastingRequest = await request.json();

    // targetHours 필수 검증
    if (!body.targetHours) {
      return NextResponse.json(
        { error: 'targetHours is required' },
        { status: 400 }
      );
    }

    // targetHours 유효 범위 검증 (1-24시간)
    if (body.targetHours < 1 || body.targetHours > 24) {
      return NextResponse.json(
        { error: 'targetHours must be between 1 and 24' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // 이미 진행 중인 단식 세션이 있는지 확인
    const { data: existingSession, error: checkError } = await supabase
      .from('fasting_records')
      .select('id')
      .eq('clerk_user_id', userId)
      .is('end_time', null)
      .single();

    // PGRST116은 결과가 없을 때 발생 (정상)
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[Fasting API] Check existing session error:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing session', details: checkError.message },
        { status: 500 }
      );
    }

    // 이미 진행 중인 세션이 있으면 에러
    if (existingSession) {
      return NextResponse.json(
        { error: 'Active fasting session already exists. Complete the current session first.' },
        { status: 409 }
      );
    }

    // 새 단식 세션 생성
    const { data, error } = await supabase
      .from('fasting_records')
      .insert({
        clerk_user_id: userId,
        start_time: new Date().toISOString(),
        target_hours: body.targetHours,
        notes: body.notes || null,
        is_completed: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[Fasting API] Create session error:', error);
      return NextResponse.json(
        { error: 'Failed to create fasting session', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Fasting API] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: 단식 세션 완료/업데이트
 *
 * Body:
 * - id: string (단식 기록 ID, 필수)
 * - isCompleted?: boolean (완료 여부)
 * - notes?: string (메모 업데이트)
 */
export async function PATCH(request: Request) {
  try {
    // 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 요청 본문 파싱
    const body: UpdateFastingRequest = await request.json();

    // id 필수 검증
    if (!body.id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // 업데이트할 필드 준비
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // 완료 처리 시 end_time과 actual_hours 계산
    if (body.isCompleted) {
      // 먼저 기존 세션 정보를 가져와서 actual_hours 계산
      const { data: existingSession, error: fetchError } = await supabase
        .from('fasting_records')
        .select('start_time')
        .eq('id', body.id)
        .eq('clerk_user_id', userId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          return NextResponse.json(
            { error: 'Fasting session not found' },
            { status: 404 }
          );
        }
        console.error('[Fasting API] Fetch session for completion error:', fetchError);
        return NextResponse.json(
          { error: 'Failed to fetch fasting session', details: fetchError.message },
          { status: 500 }
        );
      }

      const endTime = new Date();
      const startTime = new Date(existingSession.start_time);
      const actualHours = Math.round(((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)) * 10) / 10;

      updateData.end_time = endTime.toISOString();
      updateData.actual_hours = actualHours;
      updateData.is_completed = true;
    }

    // 메모 업데이트
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }

    // 업데이트 실행
    const { data, error } = await supabase
      .from('fasting_records')
      .update(updateData)
      .eq('id', body.id)
      .eq('clerk_user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Fasting session not found' },
          { status: 404 }
        );
      }
      console.error('[Fasting API] Update session error:', error);
      return NextResponse.json(
        { error: 'Failed to update fasting session', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Fasting session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[Fasting API] PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
