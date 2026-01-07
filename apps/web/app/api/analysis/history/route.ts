/**
 * 분석 이력 조회 API
 * GET /api/analysis/history
 *
 * Query params:
 * - type: 'body' | 'skin' | 'personal-color' | 'hair' | 'makeup'
 * - limit: number (default: 10, max: 50)
 * - period: '1w' | '1m' | '3m' | '6m' | '1y' | 'all'
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type {
  AnalysisType,
  AnalysisHistoryResponse,
  SkinAnalysisHistoryItem,
  BodyAnalysisHistoryItem,
  PersonalColorHistoryItem,
  HairAnalysisHistoryItem,
  MakeupAnalysisHistoryItem,
  PeriodFilter,
} from '@/types/analysis-history';

// 기간별 일수
const PERIOD_DAYS_MAP: Record<PeriodFilter, number | null> = {
  '1w': 7,
  '1m': 30,
  '3m': 90,
  '6m': 180,
  '1y': 365,
  all: null,
};

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as AnalysisType | null;
    const limitParam = searchParams.get('limit');
    const periodParam = searchParams.get('period') as PeriodFilter | null;

    if (!type || !['body', 'skin', 'personal-color', 'hair', 'makeup'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be body, skin, personal-color, hair, or makeup' },
        { status: 400 }
      );
    }

    const limit = Math.min(parseInt(limitParam || '10', 10), 50);
    const period = periodParam || 'all';
    const periodDays = PERIOD_DAYS_MAP[period] || null;

    const supabase = createClerkSupabaseClient();

    // 기간 필터 날짜 계산
    let startDate: string | null = null;
    if (periodDays) {
      const date = new Date();
      date.setDate(date.getDate() - periodDays);
      startDate = date.toISOString();
    }

    let analyses:
      | SkinAnalysisHistoryItem[]
      | BodyAnalysisHistoryItem[]
      | PersonalColorHistoryItem[]
      | HairAnalysisHistoryItem[]
      | MakeupAnalysisHistoryItem[] = [];

    if (type === 'skin') {
      let query = supabase.from('skin_analyses').select('*').eq('clerk_user_id', userId);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);

      if (error) {
        console.error('[Analysis History] Skin query error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      analyses = (data || []).map((item) => ({
        id: item.id,
        date: item.created_at,
        overallScore: item.overall_score || 0,
        imageUrl: item.image_url,
        type: 'skin' as const,
        details: {
          skinType: item.skin_type,
          hydration: item.hydration || 0,
          oilLevel: item.oil_level || 0,
          pores: item.pores || 0,
          pigmentation: item.pigmentation || 0,
          wrinkles: item.wrinkles || 0,
          sensitivity: item.sensitivity || 0,
        },
      }));
    } else if (type === 'body') {
      let query = supabase.from('body_analyses').select('*').eq('clerk_user_id', userId);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);

      if (error) {
        console.error('[Analysis History] Body query error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      // 체형 분석은 overall_score가 없으므로 계산
      analyses = (data || []).map((item) => {
        const avgScore = Math.round(
          ((item.shoulder || 0) + (item.waist || 0) + (item.hip || 0)) / 3
        );
        return {
          id: item.id,
          date: item.created_at,
          overallScore: avgScore,
          imageUrl: item.image_url,
          type: 'body' as const,
          details: {
            bodyType: item.body_type,
            height: item.height ? parseFloat(item.height) : undefined,
            weight: item.weight ? parseFloat(item.weight) : undefined,
            shoulder: item.shoulder || 0,
            waist: item.waist || 0,
            hip: item.hip || 0,
            ratio: item.ratio ? parseFloat(item.ratio) : undefined,
          },
        };
      });
    } else if (type === 'personal-color') {
      let query = supabase
        .from('personal_color_assessments')
        .select('*')
        .eq('clerk_user_id', userId);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);

      if (error) {
        console.error('[Analysis History] PC query error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      analyses = (data || []).map((item) => ({
        id: item.id,
        date: item.created_at,
        overallScore: item.confidence || 0,
        imageUrl: item.face_image_url,
        type: 'personal-color' as const,
        details: {
          season: item.season,
          undertone: item.undertone || 'Neutral',
          confidence: item.confidence || 0,
        },
      }));
    } else if (type === 'hair') {
      let query = supabase.from('hair_analyses').select('*').eq('clerk_user_id', userId);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);

      if (error) {
        console.error('[Analysis History] Hair query error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      analyses = (data || []).map((item) => ({
        id: item.id,
        date: item.created_at,
        overallScore: item.overall_score || 0,
        imageUrl: item.image_url,
        type: 'hair' as const,
        details: {
          hairType: item.hair_type || 'straight',
          scalpHealth: item.scalp_health || 0,
          hairDensity: item.hair_density || 0,
          hairThickness: item.hair_thickness || 0,
          damageLevel: item.damage_level || 0,
        },
      }));
    } else {
      // makeup
      let query = supabase.from('makeup_analyses').select('*').eq('clerk_user_id', userId);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);

      if (error) {
        console.error('[Analysis History] Makeup query error:', error);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
      }

      analyses = (data || []).map((item) => ({
        id: item.id,
        date: item.created_at,
        overallScore: item.overall_score || 0,
        imageUrl: item.image_url,
        type: 'makeup' as const,
        details: {
          undertone: item.undertone || 'neutral',
          faceShape: item.face_shape || 'oval',
          eyeShape: item.eye_shape,
          lipShape: item.lip_shape,
        },
      }));
    }

    // 트렌드 계산 (최근 2개 비교)
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (analyses.length >= 2) {
      const latestScore = analyses[0].overallScore;
      const previousScore = analyses[1].overallScore;
      const diff = latestScore - previousScore;

      if (diff > 2) {
        trend = 'improving';
      } else if (diff < -2) {
        trend = 'declining';
      }
    }

    const response: AnalysisHistoryResponse = {
      analyses,
      trend,
      totalCount: analyses.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Analysis History] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
