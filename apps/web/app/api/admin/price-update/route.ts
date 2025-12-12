/**
 * 관리자 가격 업데이트 API
 * @description 제품 가격을 수동으로 업데이트하는 관리자 API
 * @version 1.0
 * @date 2025-12-09
 *
 * POST /api/admin/price-update
 * - productType: 제품 타입 (선택)
 * - limit: 업데이트할 제품 수 (선택, 기본 50)
 * - source: 가격 소스 (선택)
 *
 * 인증: ADMIN_API_KEY 환경 변수 필요
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ProductType } from '@/types/product';
import {
  updatePricesForType,
  updateAllPrices,
  type PriceSource,
} from '@/lib/crawler';

// 관리자 API 키 검증
function validateAdminKey(request: NextRequest): boolean {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    console.warn('[Admin API] ADMIN_API_KEY not configured');
    return false;
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return false;
  }

  const [type, key] = authHeader.split(' ');
  return type === 'Bearer' && key === adminKey;
}

export async function POST(request: NextRequest) {
  // 인증 검증
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      productType,
      limit = 50,
      source,
    } = body as {
      productType?: ProductType;
      limit?: number;
      source?: PriceSource;
    };

    // 입력 검증
    const validTypes: ProductType[] = [
      'cosmetic',
      'supplement',
      'workout_equipment',
      'health_food',
    ];

    if (productType && !validTypes.includes(productType)) {
      return NextResponse.json(
        {
          error: 'Invalid productType',
          validTypes,
        },
        { status: 400 }
      );
    }

    if (limit < 1 || limit > 500) {
      return NextResponse.json(
        { error: 'limit must be between 1 and 500' },
        { status: 400 }
      );
    }

    console.log(
      `[Admin API] Price update requested: type=${productType || 'all'}, limit=${limit}, source=${source || 'auto'}`
    );

    // 가격 업데이트 실행
    let result;
    if (productType) {
      result = await updatePricesForType(productType, { limit, source });
    } else {
      result = await updateAllPrices({ limitPerType: limit, source });
    }

    return NextResponse.json({
      success: true,
      result,
      message: productType
        ? `Updated ${productType} prices`
        : 'Updated all product prices',
    });
  } catch (error) {
    console.error('[Admin API] Price update error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET: 현재 상태 조회
export async function GET(request: NextRequest) {
  // 인증 검증
  if (!validateAdminKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    status: 'ready',
    availableTypes: ['cosmetic', 'supplement', 'workout_equipment', 'health_food'],
    endpoints: {
      POST: {
        description: 'Trigger price update',
        body: {
          productType: 'optional - specific product type',
          limit: 'optional - max products per type (default: 50, max: 500)',
          source: 'optional - price source (naver_shopping, coupang, oliveyoung, mock)',
        },
      },
    },
  });
}
