import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

/**
 * GET /api/analyze/personal-color/[id]
 * 특정 ID의 퍼스널 컬러 분석 결과 조회
 *
 * @param params.id - 분석 결과 ID (UUID)
 * @returns 분석 결과 데이터
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // 분석 결과 조회 (본인 데이터만)
    const { data, error } = await supabase
      .from('personal_color_assessments')
      .select('*')
      .eq('id', id)
      .eq('clerk_user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return NextResponse.json({ error: '분석 결과를 찾을 수 없습니다' }, { status: 404 });
      }
      console.error('[PC-1] Database query error:', error);
      return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[PC-1] Get by ID error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
