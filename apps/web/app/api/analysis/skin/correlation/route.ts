/**
 * 피부 다이어리 상관관계 분석 API
 * @description 생활 요인과 피부 상태 간의 상관관계 분석
 * @method GET
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { analyzeSkinCorrelation } from '@/lib/analysis/skin-correlation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClerkSupabaseClient();

    // 분석 기간 파라미터 (기본 30일)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    // 유효한 범위 확인 (7-90일)
    const validDays = Math.max(7, Math.min(90, days));

    // 상관관계 분석 실행
    const result = await analyzeSkinCorrelation(supabase, validDays);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[API] Skin correlation analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '분석에 실패했습니다.',
      },
      { status: 500 }
    );
  }
}
