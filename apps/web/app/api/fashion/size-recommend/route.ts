/**
 * 사이즈 추천 API
 *
 * @description K-2 체형 기반 사이즈 추천
 * @route POST /api/fashion/size-recommend
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { recommendSize, type Gender, type UserMeasurements } from '@/lib/fashion';

// 입력 스키마
const sizeRecommendSchema = z.object({
  gender: z.enum(['male', 'female']),
  height: z.number().min(100).max(250), // cm
  weight: z.number().min(30).max(200), // kg
  chest: z.number().min(60).max(150).optional(), // cm
  waist: z.number().min(50).max(130).optional(), // cm
  hip: z.number().min(60).max(150).optional(), // cm
  footLength: z.number().min(200).max(320).optional(), // mm
  shoulderWidth: z.number().min(30).max(60).optional(), // cm
  bodyType: z.enum(['S', 'W', 'N']).optional(), // 체형 (스트레이트, 웨이브, 내추럴)
});

/**
 * POST /api/fashion/size-recommend
 * 사이즈 추천 요청
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const validated = sizeRecommendSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid measurements',
            userMessage: '신체 정보를 정확히 입력해주세요.',
            details: validated.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { gender, bodyType, ...measurements } = validated.data;

    // UserMeasurements 타입으로 변환
    const userMeasurements: UserMeasurements = {
      height: measurements.height,
      weight: measurements.weight,
      ...(measurements.chest && { chest: measurements.chest }),
      ...(measurements.waist && { waist: measurements.waist }),
      ...(measurements.hip && { hip: measurements.hip }),
      ...(measurements.footLength && { footLength: measurements.footLength }),
      ...(measurements.shoulderWidth && { shoulderWidth: measurements.shoulderWidth }),
    };

    // 사이즈 추천 계산
    const sizeProfile = recommendSize(
      userMeasurements,
      gender as Gender,
      bodyType as 'S' | 'W' | 'N' | undefined
    );

    return NextResponse.json({
      success: true,
      data: sizeProfile,
    });
  } catch (error) {
    console.error('[API] POST /api/fashion/size-recommend error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to calculate size recommendation',
          userMessage: '사이즈 추천 계산 중 오류가 발생했습니다.',
        },
      },
      { status: 500 }
    );
  }
}
