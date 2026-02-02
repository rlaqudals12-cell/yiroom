/**
 * 개인화 패션 추천 API
 *
 * @description K-2 통합 개인화 추천 (스타일 + 사이즈 + 옷장)
 * @route POST /api/fashion/personalize
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import {
  getPersonalizedBest10,
  getRecommendedStyles,
  isTrendItem2026,
  type StyleCategory,
} from '@/lib/fashion';

// 입력 스키마
const personalizeSchema = z.object({
  // 퍼스널컬러 (선택)
  personalColor: z.enum(['Spring', 'Summer', 'Autumn', 'Winter']).optional(),
  // 체형 (선택)
  bodyType: z.enum(['S', 'W', 'N']).optional(),
  // 상황 (선택) - Occasion 타입 준수
  occasion: z.enum(['casual', 'formal', 'workout', 'date', 'travel']).optional(),
  // 계절 (선택)
  season: z.enum(['spring', 'summer', 'autumn', 'winter']).optional(),
  // 선호 스타일 (선택)
  preferredStyles: z
    .array(
      z.enum([
        'casual',
        'formal',
        'street',
        'minimal',
        'sporty',
        'classic',
        'preppy',
        'hiphop',
        'romantic',
        'workwear',
      ])
    )
    .optional(),
  // 트렌드 우선 여부
  prioritizeTrends: z.boolean().optional(),
});

/**
 * POST /api/fashion/personalize
 * 통합 개인화 추천
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 인증 확인 (선택적)
    const { userId } = await auth();

    const body = await request.json();
    const validated = personalizeSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            userMessage: '요청 데이터를 확인해주세요.',
            details: validated.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { personalColor, bodyType, occasion, season, preferredStyles, prioritizeTrends } =
      validated.data;

    // 1. 추천 스타일 결정
    let recommendedStyles: StyleCategory[] = [];

    if (preferredStyles && preferredStyles.length > 0) {
      // 사용자 선호 스타일 사용
      recommendedStyles = preferredStyles as StyleCategory[];
    } else if (personalColor) {
      // 퍼스널컬러 기반 추천
      recommendedStyles = getRecommendedStyles(personalColor);
    } else {
      // 기본값: 캐주얼, 미니멀, 클래식
      recommendedStyles = ['casual', 'minimal', 'classic'];
    }

    // 2. 각 스타일별 Best 추천 가져오기 (파라미터 이름 변환)
    const allRecommendations = recommendedStyles.flatMap((style) => {
      const items = getPersonalizedBest10(style, {
        seasonType: personalColor, // PersonalColorSeason
        currentSeason: season,
        occasion,
      });

      // 트렌드 우선 시 트렌드 아이템에 가산점
      if (prioritizeTrends) {
        return items.map((item) => ({
          ...item,
          trendBonus: isTrendItem2026(item.name) ? 10 : 0,
        }));
      }

      return items;
    });

    // 3. 중복 제거 및 정렬
    const uniqueRecommendations = Array.from(
      new Map(allRecommendations.map((item) => [item.id, item])).values()
    );

    // 트렌드 보너스 적용 시 정렬
    if (prioritizeTrends) {
      uniqueRecommendations.sort(
        (a, b) => ((b as { trendBonus?: number }).trendBonus || 0) - ((a as { trendBonus?: number }).trendBonus || 0)
      );
    }

    // 4. 상위 10개만 반환
    const topRecommendations = uniqueRecommendations.slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        userId: userId || null,
        filters: {
          personalColor,
          bodyType,
          occasion,
          season,
          preferredStyles,
          prioritizeTrends,
        },
        recommendedStyles,
        recommendations: topRecommendations,
        totalCount: uniqueRecommendations.length,
      },
    });
  } catch (error) {
    console.error('[API] POST /api/fashion/personalize error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get personalized recommendations',
          userMessage: '맞춤 추천을 불러오는 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    );
  }
}
