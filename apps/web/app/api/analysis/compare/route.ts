/**
 * 분석 비교 API
 * GET /api/analysis/compare
 *
 * Query params:
 * - type: 'body' | 'skin' | 'personal-color'
 * - from: UUID (이전 분석 ID)
 * - to: UUID (이후 분석 ID)
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type {
  AnalysisType,
  AnalysisCompareResponse,
  SkinAnalysisHistoryItem,
  BodyAnalysisHistoryItem,
} from '@/types/analysis-history';

// 인사이트 생성 함수
function generateInsights(
  type: AnalysisType,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  changes: Record<string, number>
): string[] {
  const insights: string[] = [];

  if (type === 'skin') {
    const overallChange = changes.overall || 0;

    if (overallChange > 5) {
      insights.push('전반적인 피부 상태가 크게 개선되었어요! 🎉');
    } else if (overallChange > 0) {
      insights.push('피부 상태가 조금씩 좋아지고 있어요.');
    } else if (overallChange < -5) {
      insights.push('피부 상태가 다소 악화되었어요. 관리가 필요해요.');
    }

    if (changes.hydration && changes.hydration > 5) {
      insights.push('수분감이 크게 향상되었어요! 💧');
    }
    if (changes.pores && changes.pores > 5) {
      insights.push('모공 상태가 개선되고 있어요.');
    }
    if (changes.wrinkles && changes.wrinkles > 5) {
      insights.push('주름이 눈에 띄게 줄었어요!');
    }
    if (changes.oilLevel && changes.oilLevel < -5) {
      insights.push('유분 밸런스가 좋아지고 있어요.');
    }
  } else if (type === 'body') {
    const overallChange = changes.overall || 0;

    if (overallChange > 5) {
      insights.push('체형 밸런스가 크게 개선되었어요! 💪');
    } else if (overallChange > 0) {
      insights.push('체형이 조금씩 변화하고 있어요.');
    }

    if (changes.shoulder && changes.shoulder > 5) {
      insights.push('어깨 라인이 좋아지고 있어요.');
    }
    if (changes.waist && changes.waist > 5) {
      insights.push('허리 라인이 개선되고 있어요.');
    }
    if (changes.hip && changes.hip > 5) {
      insights.push('힙 라인이 더 균형잡혔어요.');
    }
  }

  // 기본 인사이트
  if (insights.length === 0) {
    insights.push('꾸준한 관리가 중요해요. 계속 화이팅!');
  }

  return insights;
}

// 기간 문자열 생성
function calculatePeriod(fromDate: string, toDate: string): string {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const diffMs = to.getTime() - from.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return `${diffDays}일`;
  } else if (diffDays < 30) {
    return `${Math.round(diffDays / 7)}주`;
  } else if (diffDays < 365) {
    return `${Math.round(diffDays / 30)}개월`;
  } else {
    return `${Math.round(diffDays / 365)}년`;
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as AnalysisType | null;
    const fromId = searchParams.get('from');
    const toId = searchParams.get('to');

    if (!type || !['body', 'skin', 'personal-color'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be body, skin, or personal-color' },
        { status: 400 }
      );
    }

    if (!fromId || !toId) {
      return NextResponse.json(
        { error: 'Missing from or to parameter' },
        { status: 400 }
      );
    }

    // 퍼스널 컬러는 점수 비교가 의미없으므로 지원하지 않음
    if (type === 'personal-color') {
      return NextResponse.json(
        { error: 'Personal color comparison not supported' },
        { status: 400 }
      );
    }

    const supabase = createClerkSupabaseClient();

    // 테이블 선택
    const tableName =
      type === 'skin'
        ? 'skin_analyses'
        : type === 'body'
          ? 'body_analyses'
          : 'personal_color_assessments';

    // 두 분석 조회
    const { data: fromData, error: fromError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', fromId)
      .eq('clerk_user_id', userId)
      .single();

    if (fromError || !fromData) {
      return NextResponse.json(
        { error: 'From analysis not found or unauthorized' },
        { status: 404 }
      );
    }

    const { data: toData, error: toError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', toId)
      .eq('clerk_user_id', userId)
      .single();

    if (toError || !toData) {
      return NextResponse.json(
        { error: 'To analysis not found or unauthorized' },
        { status: 404 }
      );
    }

    let beforeItem: SkinAnalysisHistoryItem | BodyAnalysisHistoryItem;
    let afterItem: SkinAnalysisHistoryItem | BodyAnalysisHistoryItem;
    let detailChanges: Record<string, number> = {};

    if (type === 'skin') {
      const fromScore = fromData.overall_score || 0;
      const toScore = toData.overall_score || 0;

      beforeItem = {
        id: fromData.id,
        date: fromData.created_at,
        overallScore: fromScore,
        imageUrl: fromData.image_url,
        type: 'skin',
        details: {
          skinType: fromData.skin_type,
          hydration: fromData.hydration || 0,
          oilLevel: fromData.oil_level || 0,
          pores: fromData.pores || 0,
          pigmentation: fromData.pigmentation || 0,
          wrinkles: fromData.wrinkles || 0,
          sensitivity: fromData.sensitivity || 0,
        },
      };

      afterItem = {
        id: toData.id,
        date: toData.created_at,
        overallScore: toScore,
        imageUrl: toData.image_url,
        type: 'skin',
        details: {
          skinType: toData.skin_type,
          hydration: toData.hydration || 0,
          oilLevel: toData.oil_level || 0,
          pores: toData.pores || 0,
          pigmentation: toData.pigmentation || 0,
          wrinkles: toData.wrinkles || 0,
          sensitivity: toData.sensitivity || 0,
        },
      };

      detailChanges = {
        hydration: afterItem.details.hydration - beforeItem.details.hydration,
        oilLevel: afterItem.details.oilLevel - beforeItem.details.oilLevel,
        pores: afterItem.details.pores - beforeItem.details.pores,
        pigmentation: afterItem.details.pigmentation - beforeItem.details.pigmentation,
        wrinkles: afterItem.details.wrinkles - beforeItem.details.wrinkles,
        sensitivity: afterItem.details.sensitivity - beforeItem.details.sensitivity,
      };
    } else if (type === 'body') {
      const calcAvg = (item: Record<string, unknown>) =>
        Math.round(
          (((item.shoulder as number) || 0) +
            ((item.waist as number) || 0) +
            ((item.hip as number) || 0)) /
            3
        );

      const fromScore = calcAvg(fromData);
      const toScore = calcAvg(toData);

      beforeItem = {
        id: fromData.id,
        date: fromData.created_at,
        overallScore: fromScore,
        imageUrl: fromData.image_url,
        type: 'body',
        details: {
          bodyType: fromData.body_type,
          height: fromData.height ? parseFloat(fromData.height) : undefined,
          weight: fromData.weight ? parseFloat(fromData.weight) : undefined,
          shoulder: fromData.shoulder || 0,
          waist: fromData.waist || 0,
          hip: fromData.hip || 0,
          ratio: fromData.ratio ? parseFloat(fromData.ratio) : undefined,
        },
      };

      afterItem = {
        id: toData.id,
        date: toData.created_at,
        overallScore: toScore,
        imageUrl: toData.image_url,
        type: 'body',
        details: {
          bodyType: toData.body_type,
          height: toData.height ? parseFloat(toData.height) : undefined,
          weight: toData.weight ? parseFloat(toData.weight) : undefined,
          shoulder: toData.shoulder || 0,
          waist: toData.waist || 0,
          hip: toData.hip || 0,
          ratio: toData.ratio ? parseFloat(toData.ratio) : undefined,
        },
      };

      detailChanges = {
        shoulder: afterItem.details.shoulder - beforeItem.details.shoulder,
        waist: afterItem.details.waist - beforeItem.details.waist,
        hip: afterItem.details.hip - beforeItem.details.hip,
      };
    } else {
      // personal-color는 점수 비교가 의미없으므로 간단 처리
      return NextResponse.json(
        { error: 'Personal color comparison not supported' },
        { status: 400 }
      );
    }

    const overallChange = afterItem.overallScore - beforeItem.overallScore;
    const period = calculatePeriod(beforeItem.date, afterItem.date);

    const insights = generateInsights(type, fromData, toData, {
      overall: overallChange,
      ...detailChanges,
    });

    const response: AnalysisCompareResponse = {
      before: beforeItem,
      after: afterItem,
      changes: {
        overall: overallChange,
        period,
        details: detailChanges,
      },
      insights,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Analysis Compare] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
