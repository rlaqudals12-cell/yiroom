/**
 * Inventory API
 * GET: 인벤토리 아이템 목록 조회
 * POST: 인벤토리 아이템 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getInventoryItems, createInventoryItem, getInventoryStats } from '@/lib/inventory';
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
