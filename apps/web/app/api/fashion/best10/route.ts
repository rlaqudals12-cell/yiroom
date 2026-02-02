/**
 * 패션 Best 10 API
 *
 * @description K-2 스타일별 Best 10 코디 조회
 * @route GET /api/fashion/best10?style={category}
 * @route POST /api/fashion/best10 (필터링)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getStyleBest10,
  getAllStyleBest10,
  getPersonalizedBest10,
  type StyleCategory,
} from '@/lib/fashion';

// 스타일 카테고리 유효성 검증
const styleCategories = [
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
] as const;

const getBest10Schema = z.object({
  style: z.enum(styleCategories).optional(),
});

const postBest10Schema = z.object({
  style: z.enum(styleCategories),
  personalColor: z.enum(['Spring', 'Summer', 'Autumn', 'Winter']).optional(),
  season: z.enum(['spring', 'summer', 'autumn', 'winter']).optional(),
  occasion: z.enum(['casual', 'formal', 'workout', 'date', 'travel']).optional(),
});

/**
 * GET /api/fashion/best10
 * 전체 또는 특정 스타일의 Best 10 조회
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const style = searchParams.get('style');

    const validated = getBest10Schema.safeParse({ style });

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid style category',
            userMessage: '올바른 스타일 카테고리를 선택해주세요.',
            details: validated.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // 특정 스타일 조회
    if (validated.data.style) {
      const result = getStyleBest10(validated.data.style as StyleCategory);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // 전체 스타일 조회
    const allStyles = getAllStyleBest10();
    return NextResponse.json({
      success: true,
      data: allStyles,
    });
  } catch (error) {
    console.error('[API] GET /api/fashion/best10 error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch best 10',
          userMessage: '스타일 정보를 불러오는 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/fashion/best10
 * 필터링된 개인화 Best 10 조회
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validated = postBest10Schema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            userMessage: '요청 데이터를 확인해주세요.',
            details: validated.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { style, personalColor, season, occasion } = validated.data;

    // 개인화 필터링 (파라미터 이름 변환)
    const result = getPersonalizedBest10(style as StyleCategory, {
      seasonType: personalColor, // PersonalColorSeason
      currentSeason: season,
      occasion,
    });

    return NextResponse.json({
      success: true,
      data: {
        style,
        filters: { personalColor, season, occasion },
        recommendations: result,
        count: result.length,
      },
    });
  } catch (error) {
    console.error('[API] POST /api/fashion/best10 error:', error);
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
