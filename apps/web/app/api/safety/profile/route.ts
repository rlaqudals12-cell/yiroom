/**
 * SafetyProfile API
 *
 * GET /api/safety/profile — 안전성 프로필 복호화 조회
 * PUT /api/safety/profile — 안전성 프로필 암호화 저장
 *
 * @see docs/adr/ADR-070-safety-profile-architecture.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getSafetyProfile, upsertSafetyProfile } from '@/lib/safety';

// PUT 요청 스키마
const upsertSchema = z.object({
  allergies: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  skinConditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  age: z.number().int().min(0).max(150).nullable().optional(),
  consentGiven: z.boolean(),
  consentVersion: z.string().optional(),
});

/**
 * GET /api/safety/profile
 * SafetyProfile 복호화 조회 (프로필 없으면 빈 프로필 반환)
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

    const profile = await getSafetyProfile(userId);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('[API] GET /api/safety/profile error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          userMessage: '안전성 프로필을 불러올 수 없습니다.',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/safety/profile
 * SafetyProfile 암호화 저장 (동의 필수)
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
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
    const validated = upsertSchema.safeParse(body);

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

    const saved = await upsertSafetyProfile(userId, validated.data);

    return NextResponse.json({
      success: true,
      data: saved,
    });
  } catch (error) {
    console.error('[API] PUT /api/safety/profile error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          userMessage: '안전성 프로필 저장에 실패했습니다.',
        },
      },
      { status: 500 }
    );
  }
}
