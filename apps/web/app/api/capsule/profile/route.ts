/**
 * BeautyProfile API
 *
 * GET  /api/capsule/profile — 프로필 조회 (On-Read 마이그레이션 트리거)
 * PATCH /api/capsule/profile — 프로필 부분 업데이트
 *
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getBeautyProfile, upsertBeautyProfile } from '@/lib/capsule';

// PATCH 요청 스키마
const updateSchema = z
  .object({
    personalColor: z
      .object({
        season: z.string(),
        subType: z.string(),
        palette: z.array(z.string()),
      })
      .optional(),
    skin: z
      .object({
        type: z.string(),
        concerns: z.array(z.string()),
        scores: z.record(z.number()),
      })
      .optional(),
    body: z
      .object({
        shape: z.string(),
        measurements: z.record(z.number()),
      })
      .optional(),
    workout: z
      .object({
        fitnessLevel: z.string(),
        goals: z.array(z.string()),
        history: z.array(z.string()),
      })
      .optional(),
    nutrition: z
      .object({
        deficiencies: z.array(z.string()),
        dietType: z.string(),
        allergies: z.array(z.string()),
      })
      .optional(),
    hair: z
      .object({
        type: z.string(),
        scalp: z.string(),
        concerns: z.array(z.string()),
      })
      .optional(),
    makeup: z
      .object({
        preferences: z.record(z.string()),
        skillLevel: z.string(),
      })
      .optional(),
    oral: z
      .object({
        conditions: z.array(z.string()),
        goals: z.array(z.string()),
      })
      .optional(),
    fashion: z
      .object({
        style: z.string(),
        sizeProfile: z.record(z.string()),
        wardrobe: z.array(z.string()),
      })
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: '최소 하나의 필드를 포함해야 합니다.',
  });

/**
 * GET /api/capsule/profile
 * BeautyProfile 조회 (없으면 On-Read 마이그레이션으로 자동 생성)
 */
export async function GET(): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'User not authenticated',
            userMessage: '로그인이 필요합니다.',
          },
        },
        { status: 401 }
      );
    }

    const profile = await getBeautyProfile(userId);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('[API] GET /api/capsule/profile error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          userMessage: '프로필을 불러올 수 없습니다.',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/capsule/profile
 * BeautyProfile 부분 업데이트
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'User not authenticated',
            userMessage: '로그인이 필요합니다.',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = updateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            userMessage: '입력 정보를 확인해주세요.',
            details: validated.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const updated = await upsertBeautyProfile(userId, validated.data);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('[API] PATCH /api/capsule/profile error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          userMessage: '프로필 저장에 실패했습니다.',
        },
      },
      { status: 500 }
    );
  }
}
