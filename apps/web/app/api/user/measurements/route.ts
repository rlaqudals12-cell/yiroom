import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * 사용자 신체 측정 API
 * L-1-2: 키/몸무게 필수 게이트
 */

/**
 * GET /api/user/measurements
 * 사용자 신체 정보 조회
 */
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from('user_body_measurements')
      .select('height, weight, body_type, chest, waist, hip, shoulder, preferred_fit')
      .eq('clerk_user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Measurements API] GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch measurements' }, { status: 500 });
    }

    return NextResponse.json({
      hasMeasurements: !!data?.height && !!data?.weight,
      measurements: data,
    });
  } catch (err) {
    console.error('[Measurements API] GET exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/user/measurements
 * 사용자 신체 정보 저장
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Body 파싱
    const body = await request.json();
    const { height, weight, bodyFat } = body as {
      height: number;
      weight: number;
      bodyFat?: number | null;
    };

    // 유효성 검증
    if (!height || height < 100 || height > 250) {
      return NextResponse.json({ error: '키는 100~250cm 범위여야 합니다' }, { status: 400 });
    }

    if (!weight || weight < 20 || weight > 200) {
      return NextResponse.json({ error: '몸무게는 20~200kg 범위여야 합니다' }, { status: 400 });
    }

    if (bodyFat !== null && bodyFat !== undefined && (bodyFat < 3 || bodyFat > 60)) {
      return NextResponse.json({ error: '체지방률은 3~60% 범위여야 합니다' }, { status: 400 });
    }

    // upsert로 저장
    const { data, error } = await supabase
      .from('user_body_measurements')
      .upsert(
        {
          clerk_user_id: userId,
          height,
          weight,
          ...(bodyFat !== null && bodyFat !== undefined && { body_fat_percentage: bodyFat }),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'clerk_user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[Measurements API] POST error:', error);
      return NextResponse.json({ error: 'Failed to save measurements' }, { status: 500 });
    }

    // users 테이블에도 체지방률 업데이트 (있는 경우)
    if (bodyFat !== null && bodyFat !== undefined) {
      const { error: userError } = await supabase
        .from('users')
        .update({ body_fat_percentage: bodyFat })
        .eq('clerk_user_id', userId);

      if (userError) {
        console.error('[Measurements API] User update error:', userError);
        // 체지방률 저장 실패해도 측정값은 성공으로 처리
      }
    }

    return NextResponse.json(
      {
        success: true,
        measurements: data,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[Measurements API] POST exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
