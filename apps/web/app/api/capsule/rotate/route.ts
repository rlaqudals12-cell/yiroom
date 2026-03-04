/**
 * 캡슐 로테이션 API
 *
 * POST — 지정 도메인 캡슐 로테이션 실행
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getCapsule } from '@/lib/capsule/capsule-repository';
import { getBeautyProfile } from '@/lib/capsule/profile';
import { rotateCapsule } from '@/lib/capsule/rotation';

const rotateSchema = z.object({
  domainId: z.string().min(1),
  reason: z.enum(['time-based', 'trigger-based', 'user-requested']).default('user-requested'),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', message: '로그인이 필요합니다.' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = rotateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '입력 정보를 확인해주세요.' },
        },
        { status: 400 }
      );
    }

    const { domainId, reason } = parsed.data;

    // 프로필 조회
    const profile = await getBeautyProfile(userId);
    if (!profile) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND_ERROR', message: '프로필이 없습니다.' } },
        { status: 404 }
      );
    }

    // 캡슐 조회
    const capsule = await getCapsule(userId, domainId);
    if (!capsule) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND_ERROR', message: '활성 캡슐이 없습니다.' } },
        { status: 404 }
      );
    }

    // 로테이션 실행
    const result = await rotateCapsule(capsule, profile, reason);

    return NextResponse.json({
      success: true,
      data: {
        removedCount: result.removedCount,
        addedCount: result.addedCount,
        compatibilityBefore: result.compatibilityBefore,
        compatibilityAfter: result.compatibilityAfter,
      },
    });
  } catch (error) {
    console.error('[API] POST /capsule/rotate error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
