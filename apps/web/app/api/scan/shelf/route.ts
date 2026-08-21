/**
 * 제품함 API
 * - GET: 제품함 목록 조회
 * - POST: 제품함에 추가
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import {
  getShelfItems,
  addToShelf,
  getShelfCounts,
  type AddToShelfRequest,
  type ShelfStatus,
} from '@/lib/scan/product-shelf';

const ingredientSchema = z
  .object({
    order: z.number().int().nonnegative(),
    inciName: z.string().trim().min(1).max(200),
    nameKo: z.string().trim().max(200).optional(),
    concentration: z.enum(['high', 'medium', 'low', 'unknown']).optional(),
    purpose: z
      .array(
        z.enum([
          'moisturizing',
          'exfoliating',
          'antioxidant',
          'brightening',
          'anti_aging',
          'soothing',
          'cleansing',
          'preservative',
          'fragrance',
          'surfactant',
          'other',
        ])
      )
      .optional(),
    ewgGrade: z.number().int().min(1).max(10).optional(),
    note: z.string().trim().max(500).optional(),
  })
  .strict();

const addToShelfSchema = z
  .object({
    productId: z.string().uuid().optional(),
    productName: z.string().trim().min(1).max(200),
    productBrand: z.string().trim().max(120).optional(),
    productBarcode: z.string().trim().max(64).optional(),
    productImageUrl: z.string().trim().max(2048).optional(),
    productIngredients: z.array(ingredientSchema).max(200).optional(),
    scanMethod: z.enum(['barcode', 'ocr', 'search', 'manual']),
    compatibilityScore: z.number().min(0).max(100).optional(),
    analysisResult: z.record(z.string(), z.unknown()).optional(),
    status: z.enum(['owned', 'wishlist', 'used_up', 'archived']).optional(),
    userNote: z.string().trim().max(1000).optional(),
  })
  .strict();

function postError(
  code: 'AUTH_ERROR' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR',
  message: string,
  userMessage: string,
  status: number
): NextResponse {
  return NextResponse.json({ success: false, error: { code, message, userMessage } }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as ShelfStatus | null;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeCounts = searchParams.get('counts') === 'true';

    const supabase = createClerkSupabaseClient();

    // 아이템 목록 조회
    const result = await getShelfItems(supabase, userId, {
      status: status || undefined,
      limit,
      offset,
    });

    // 카운트 포함 여부
    let counts = undefined;
    if (includeCounts) {
      counts = await getShelfCounts(supabase, userId);
    }

    return NextResponse.json({
      items: result.items,
      total: result.total,
      counts,
    });
  } catch (error) {
    console.error('[Shelf API] GET error:', error);
    return NextResponse.json({ error: '제품함 조회 중 오류가 발생했습니다' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return postError('AUTH_ERROR', 'Authentication required', '로그인이 필요합니다.', 401);
    }

    const parsed = addToShelfSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return postError(
        'VALIDATION_ERROR',
        'Invalid product shelf payload',
        '제품 정보를 확인해주세요.',
        400
      );
    }

    const supabase = createClerkSupabaseClient();
    const item = await addToShelf(supabase, userId, parsed.data as AddToShelfRequest);

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  } catch (error) {
    console.error('[Shelf API] POST error:', error);
    return postError(
      'INTERNAL_ERROR',
      'Failed to add product shelf item',
      '제품함에 추가하지 못했습니다.',
      500
    );
  }
}
