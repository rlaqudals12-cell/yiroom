/**
 * 갭 분석 API
 *
 * GET /api/capsule/gap — 전 도메인 캡슐 갭 분석
 *
 * @see docs/adr/ADR-069-capsule-ecosystem-architecture.md
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getBeautyProfile } from '@/lib/capsule/profile';
import { getAllDomains } from '@/lib/capsule/registry';
import { getCapsule } from '@/lib/capsule/capsule-repository';

/** 갭 아이템 — 부족한 카테고리/수량 */
interface GapItem {
  domainId: string;
  domainName: string;
  currentCount: number;
  optimalCount: number;
  gap: number;
  hasCapsule: boolean;
}

/**
 * GET /api/capsule/gap
 * 모든 등록 도메인에 대한 갭 분석 (현재 아이템 수 vs 최적 N)
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
    const domains = getAllDomains();

    const gaps: GapItem[] = [];

    for (const engine of domains) {
      const capsule = await getCapsule(userId, engine.domainId);
      const optimalN = engine.getOptimalN(profile);
      const currentCount = capsule?.items.length ?? 0;

      gaps.push({
        domainId: engine.domainId,
        domainName: engine.domainName,
        currentCount,
        optimalCount: optimalN,
        gap: Math.max(0, optimalN - currentCount),
        hasCapsule: capsule !== null,
      });
    }

    // 갭이 큰 순서로 정렬
    gaps.sort((a, b) => b.gap - a.gap);

    const totalGap = gaps.reduce((sum, g) => sum + g.gap, 0);

    return NextResponse.json({
      success: true,
      data: {
        gaps,
        totalGap,
        completedDomains: gaps.filter((g) => g.gap === 0 && g.hasCapsule).length,
        totalDomains: gaps.length,
      },
    });
  } catch (error) {
    console.error('[API] GET /api/capsule/gap error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          userMessage: '갭 분석을 수행할 수 없습니다.',
        },
      },
      { status: 500 }
    );
  }
}
