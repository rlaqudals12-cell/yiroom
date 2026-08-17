/**
 * Inventory API
 * GET: 인벤토리 아이템 목록 조회
 * POST: 인벤토리 아이템 생성
 * PATCH: 여러 아이템 일괄 처리 (착용 기록)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import {
  getInventoryItems,
  createInventoryItem,
  getInventoryStats,
  recordItemsUsage,
  ITEM_NOT_FOUND,
} from '@/lib/inventory';
import type { InventoryCategory, InventoryListFilter } from '@/types/inventory';

/**
 * GET /api/inventory
 * Query params: category, subCategory, search, isFavorite, limit, offset, orderBy, orderDir
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // 통계 요청인 경우
    if (searchParams.get('stats') === 'true') {
      const category = searchParams.get('category') as InventoryCategory;
      if (!category) {
        return NextResponse.json({ error: 'Category required for stats' }, { status: 400 });
      }
      const stats = await getInventoryStats(userId, category);
      return NextResponse.json({ success: true, stats });
    }

    // 필터 파싱
    const filter: InventoryListFilter = {};

    const category = searchParams.get('category');
    if (category) filter.category = category as InventoryCategory;

    const subCategory = searchParams.get('subCategory');
    if (subCategory) filter.subCategory = subCategory;

    const search = searchParams.get('search');
    if (search) filter.search = search;

    const isFavorite = searchParams.get('isFavorite');
    if (isFavorite === 'true') filter.isFavorite = true;

    const tags = searchParams.get('tags');
    if (tags) filter.tags = tags.split(',');

    const limit = searchParams.get('limit');
    if (limit) filter.limit = parseInt(limit, 10);

    const offset = searchParams.get('offset');
    if (offset) filter.offset = parseInt(offset, 10);

    const orderBy = searchParams.get('orderBy');
    if (orderBy) filter.orderBy = orderBy as InventoryListFilter['orderBy'];

    const orderDir = searchParams.get('orderDir');
    if (orderDir) filter.orderDir = orderDir as InventoryListFilter['orderDir'];

    const items = await getInventoryItems(userId, filter);

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    console.error('[Inventory API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/inventory
 * Body: CreateInventoryItemRequest
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // 필수 필드 검증
    if (!body.category || !body.name || !body.imageUrl) {
      return NextResponse.json({ error: 'category, name, imageUrl are required' }, { status: 400 });
    }

    const item = await createInventoryItem(userId, {
      category: body.category,
      subCategory: body.subCategory,
      name: body.name,
      imageUrl: body.imageUrl,
      originalImageUrl: body.originalImageUrl,
      brand: body.brand,
      tags: body.tags,
      isFavorite: body.isFavorite,
      expiryDate: body.expiryDate,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    console.error('[Inventory API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 여러 아이템 일괄 착용 기록 — 코디는 아이템 여러 벌이 한 번에 입혀지므로
// 아이템별 PATCH N회(부분 성공 가능)가 아니라 한 요청으로 처리한다
const batchActionSchema = z.object({
  action: z.literal('recordUsage'),
  itemIds: z.array(z.string().uuid()).min(1).max(30),
});

/**
 * PATCH /api/inventory
 * Body: { action: 'recordUsage', itemIds: string[] }
 */
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = batchActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message ?? 'Invalid request body',
            userMessage: '요청 정보를 확인해주세요.',
          },
        },
        { status: 400 }
      );
    }

    await recordItemsUsage(userId, parsed.data.itemIds);

    return NextResponse.json({ success: true, recorded: parsed.data.itemIds.length });
  } catch (error) {
    console.error('[Inventory API] PATCH error:', error);

    // 내 옷장에 없는 아이템 — 서버 오류가 아니라 잘못된 대상이다
    if (error instanceof Error && error.message === ITEM_NOT_FOUND) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
