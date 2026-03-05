/**
 * 인벤토리-캡슐 브릿지 API
 * GET /api/inventory/capsule?domain=skin  → 도메인별 아이템
 * GET /api/inventory/capsule?action=repurchase  → 재구매 필요 목록
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getItemsForCapsule,
  getRepurchaseNeeded,
  type CapsuleDomain,
} from '@/lib/inventory/capsule-bridge';

const VALID_DOMAINS: CapsuleDomain[] = ['skin', 'makeup', 'hair', 'nutrition', 'fashion'];

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTH_ERROR',
            message: 'Unauthorized',
            userMessage: '로그인이 필요합니다.',
          },
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') as CapsuleDomain | null;
    const action = searchParams.get('action');

    // 재구매 필요 목록
    if (action === 'repurchase') {
      const daysStr = searchParams.get('days');
      const days = daysStr ? parseInt(daysStr, 10) : 30;

      if (isNaN(days) || days < 1 || days > 365) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid days parameter',
              userMessage: '유효하지 않은 기간이에요.',
            },
          },
          { status: 400 }
        );
      }

      const items = await getRepurchaseNeeded(userId, days);
      return NextResponse.json({
        success: true,
        data: items.map(({ item, estimate }) => ({
          id: item.id,
          name: item.name,
          brand: item.brand,
          category: item.category,
          imageUrl: item.imageUrl,
          daysRemaining: estimate.daysRemaining,
          estimatedDate: estimate.estimatedDate?.toISOString() ?? null,
          confidence: estimate.confidence,
        })),
      });
    }

    // 도메인별 아이템 조회
    if (domain) {
      if (!VALID_DOMAINS.includes(domain)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: `Invalid domain: ${domain}`,
              userMessage: '유효하지 않은 도메인이에요.',
            },
          },
          { status: 400 }
        );
      }

      const items = await getItemsForCapsule(userId, domain);
      return NextResponse.json({
        success: true,
        data: items.map((item) => ({
          id: item.id,
          name: item.name,
          brand: item.brand,
          category: item.category,
          subCategory: item.subCategory,
          imageUrl: item.imageUrl,
          useCount: item.useCount,
          lastUsedAt: item.lastUsedAt,
          tags: item.tags,
        })),
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing domain or action parameter',
          userMessage: '도메인 또는 액션을 지정해주세요.',
        },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API] GET /api/inventory/capsule error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
          userMessage: '서버 오류가 발생했어요.',
        },
      },
      { status: 500 }
    );
  }
}
