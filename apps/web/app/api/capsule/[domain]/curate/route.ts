/**
 * 캡슐 큐레이션 API
 *
 * POST /api/capsule/[domain]/curate — 도메인별 큐레이션 실행
 *
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 * @see docs/adr/ADR-071-cross-module-scoring.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getBeautyProfile } from '@/lib/capsule/profile';
import { getDomain } from '@/lib/capsule/registry';
import { createCapsule, getCrossDomainRules } from '@/lib/capsule/capsule-repository';
import { calculateCCS } from '@/lib/capsule/scoring';
import type { DomainItemGroup } from '@/lib/capsule/scoring';

const curateSchema = z.object({
  maxItems: z.number().int().min(1).max(30).optional(),
  excludeRecentlyUsed: z.boolean().optional(),
  preferNewItems: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ domain: string }>;
}

/**
 * POST /api/capsule/[domain]/curate
 * 프로필 기반 캡슐 큐레이션 실행 → CCS 계산 → DB 저장
 */
export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
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

    // 도메인 엔진 조회
    const engine = getDomain(domain);
    if (!engine) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND_ERROR',
            message: `Domain engine '${domain}' not registered`,
            userMessage: '존재하지 않는 도메인입니다.',
          },
        },
        { status: 404 }
      );
    }

    // 요청 본문 검증
    const body = await request.json();
    const validated = curateSchema.safeParse(body);

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

    // 1. BeautyProfile 로드
    const profile = await getBeautyProfile(userId);

    // 2. 큐레이션 실행
    const items = await engine.curate(profile, validated.data);

    // 3. CCS 계산
    const rules = await getCrossDomainRules();
    const group: DomainItemGroup = {
      domainId: domain,
      items: items.map((item, i) => ({
        id: `temp-${i}`,
        capsuleId: '',
        item,
        profileFitScore: 70,
        usageCount: 0,
        lastUsed: null,
        addedAt: new Date().toISOString(),
      })),
    };
    const ccsResult = calculateCCS([group], profile, rules);

    // 4. DB 저장
    const capsule = await createCapsule(userId, domain, items, ccsResult.score);

    return NextResponse.json({
      success: true,
      data: {
        capsule,
        ccs: ccsResult,
      },
    });
  } catch (error) {
    console.error('[API] POST /api/capsule/[domain]/curate error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          userMessage: '큐레이션을 수행할 수 없습니다.',
        },
      },
      { status: 500 }
    );
  }
}
