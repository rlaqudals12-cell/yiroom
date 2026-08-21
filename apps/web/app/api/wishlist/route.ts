/**
 * 인증 위시리스트 API
 *
 * 모바일은 user_wishlists를 직접 접근하지 않고 이 경계에서 사용자 ID와 입력을 검증한다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

import {
  addToWishlist,
  checkWishlistStatusOrThrow,
  getUserWishlistOrThrow,
  removeFromWishlist,
  type WishlistItem,
} from '@/lib/wishlist';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import type { ProductType } from '@/types/product';

const productTypeSchema = z.enum(['cosmetic', 'supplement', 'workout_equipment', 'health_food']);

const productSchema = z
  .object({
    productType: productTypeSchema,
    productId: z.string().uuid(),
  })
  .strict();

const querySchema = z
  .object({
    productType: productTypeSchema.optional(),
    productId: z.string().uuid().optional(),
  })
  .superRefine((value, context) => {
    if (value.productId && !value.productType) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['productType'],
        message: 'productId 조회에는 productType이 필요합니다.',
      });
    }
  });

function errorResponse(
  code: 'AUTH_ERROR' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR',
  message: string,
  userMessage: string,
  status: number
): NextResponse {
  return NextResponse.json({ success: false, error: { code, message, userMessage } }, { status });
}

interface ProductMetaRow {
  id: string;
  name: string;
  brand: string | null;
  price_krw: number | null;
}

const PRODUCT_TABLES: Record<ProductType, string> = {
  cosmetic: 'cosmetic_products',
  supplement: 'supplement_products',
  workout_equipment: 'workout_equipment',
  health_food: 'health_foods',
};

async function enrichWishlistItems(
  db: ReturnType<typeof createClerkSupabaseClient>,
  items: WishlistItem[]
): Promise<Array<WishlistItem & { name?: string; brand?: string; priceKrw?: number }>> {
  const metaByKey = new Map<string, ProductMetaRow>();

  await Promise.all(
    (Object.keys(PRODUCT_TABLES) as ProductType[]).map(async (productType) => {
      const ids = items
        .filter((item) => item.productType === productType)
        .map((item) => item.productId);
      if (ids.length === 0) return;

      const { data, error } = await db
        .from(PRODUCT_TABLES[productType])
        .select('id, name, brand, price_krw')
        .in('id', ids);
      if (error) throw error;

      for (const row of (data ?? []) as ProductMetaRow[]) {
        metaByKey.set(`${productType}:${row.id}`, row);
      }
    })
  );

  return items.map((item) => {
    const meta = metaByKey.get(`${item.productType}:${item.productId}`);
    if (!meta) return item;
    return {
      ...item,
      name: meta.name,
      brand: meta.brand ?? undefined,
      priceKrw: meta.price_krw ?? undefined,
    };
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return errorResponse('AUTH_ERROR', 'Authentication required', '로그인이 필요합니다.', 401);
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      productType: searchParams.get('productType') ?? undefined,
      productId: searchParams.get('productId') ?? undefined,
    });
    if (!parsed.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid wishlist query',
        '찜 목록 조회 조건을 확인해주세요.',
        400
      );
    }

    const db = createClerkSupabaseClient();
    if (parsed.data.productId && parsed.data.productType) {
      const isWishlisted = await checkWishlistStatusOrThrow(
        db,
        userId,
        parsed.data.productType,
        parsed.data.productId
      );
      return NextResponse.json({ success: true, data: { isWishlisted } });
    }

    const items = await getUserWishlistOrThrow(db, userId, parsed.data.productType);
    const enrichedItems = await enrichWishlistItems(db, items);
    return NextResponse.json({ success: true, data: { items: enrichedItems } });
  } catch (error) {
    console.error('[API] Wishlist GET error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to get wishlist',
      '찜 목록을 불러오지 못했습니다.',
      500
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return errorResponse('AUTH_ERROR', 'Authentication required', '로그인이 필요합니다.', 401);
    }

    const parsed = productSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid wishlist payload',
        '찜할 제품 정보를 확인해주세요.',
        400
      );
    }

    const db = createClerkSupabaseClient();
    const result = await addToWishlist(db, userId, parsed.data.productType, parsed.data.productId);
    if (!result.success) {
      return errorResponse(
        'INTERNAL_ERROR',
        result.error ?? 'Failed to add wishlist item',
        '제품을 찜하지 못했습니다.',
        500
      );
    }

    return NextResponse.json({ success: true, data: { isWishlisted: true } }, { status: 201 });
  } catch (error) {
    console.error('[API] Wishlist POST error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to add wishlist item',
      '제품을 찜하지 못했습니다.',
      500
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return errorResponse('AUTH_ERROR', 'Authentication required', '로그인이 필요합니다.', 401);
    }

    const parsed = productSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid wishlist payload',
        '삭제할 제품 정보를 확인해주세요.',
        400
      );
    }

    const db = createClerkSupabaseClient();
    const result = await removeFromWishlist(
      db,
      userId,
      parsed.data.productType,
      parsed.data.productId
    );
    if (!result.success) {
      return errorResponse(
        'INTERNAL_ERROR',
        result.error ?? 'Failed to remove wishlist item',
        '찜 목록에서 제품을 삭제하지 못했습니다.',
        500
      );
    }

    return NextResponse.json({ success: true, data: { isWishlisted: false } });
  } catch (error) {
    console.error('[API] Wishlist DELETE error:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to remove wishlist item',
      '찜 목록에서 제품을 삭제하지 못했습니다.',
      500
    );
  }
}
