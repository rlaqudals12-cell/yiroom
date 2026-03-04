/**
 * 도메인별 캡슐 API
 *
 * GET /api/capsule/[domain] — 도메인별 활성 캡슐 조회
 *
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCapsule } from '@/lib/capsule/capsule-repository';
import { hasDomain } from '@/lib/capsule/registry';

interface RouteContext {
  params: Promise<{ domain: string }>;
}

/**
 * GET /api/capsule/[domain]
 * 도메인별 활성 캡슐 조회 (없으면 빈 캡슐 반환)
 */
export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
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

    const { domain } = await context.params;

    // 도메인 유효성 검사
    if (!hasDomain(domain)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND_ERROR',
            message: `Domain '${domain}' not found`,
            userMessage: '존재하지 않는 도메인입니다.',
          },
        },
        { status: 404 }
      );
    }

    const capsule = await getCapsule(userId, domain);

    return NextResponse.json({
      success: true,
      data: capsule,
    });
  } catch (error) {
    console.error('[API] GET /api/capsule/[domain] error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          userMessage: '캡슐을 불러올 수 없습니다.',
        },
      },
      { status: 500 }
    );
  }
}
