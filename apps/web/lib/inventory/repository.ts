/**
 * 인벤토리 Repository
 * CRUD 및 조회 기능 제공
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { inventoryLogger } from '@/lib/utils/logger';
import {
  InventoryItem,
  InventoryItemDB,
  InventoryCategory,
  InventoryListFilter,
  CreateInventoryItemRequest,
  UpdateInventoryItemRequest,
  SavedOutfit,
  SavedOutfitDB,
  CreateOutfitRequest,
  UpdateOutfitRequest,
  ClothingItem,
  Season,
  Occasion,
  dbToClient,
  outfitDbToClient,
  toClothingItem,
  toClothingItems,
  getClothingMetadata,
} from '@/types/inventory';

// =====================================================
// 인벤토리 아이템 CRUD
// =====================================================

/**
 * 인벤토리 아이템 목록 조회
 */
export async function getInventoryItems(
  userId: string,
  filter: InventoryListFilter = {}
): Promise<InventoryItem[]> {
  const supabase = createClerkSupabaseClient();

  let query = supabase.from('user_inventory').select('*').eq('clerk_user_id', userId);

  // 카테고리 필터
  if (filter.category) {
    query = query.eq('category', filter.category);
  }

  // 서브 카테고리 필터
  if (filter.subCategory) {
    query = query.eq('sub_category', filter.subCategory);
  }

  // 즐겨찾기 필터
  if (filter.isFavorite !== undefined) {
    query = query.eq('is_favorite', filter.isFavorite);
  }

  // 태그 필터 (하나라도 포함)
  if (filter.tags && filter.tags.length > 0) {
    query = query.overlaps('tags', filter.tags);
  }

  // 검색 (이름)
  if (filter.search) {
    query = query.ilike('name', `%${filter.search}%`);
  }

  // 계절 필터 (의류 전용, metadata.season 배열에 포함)
  if (filter.season && filter.category === 'closet') {
    query = query.contains('metadata', { season: [filter.season] });
  }

  // 상황 필터 (의류 전용)
  if (filter.occasion && filter.category === 'closet') {
    query = query.contains('metadata', { occasion: [filter.occasion] });
  }

  // 색상 필터 (의류 전용)
  if (filter.color && filter.category === 'closet') {
    query = query.contains('metadata', { color: [filter.color] });
  }

  // 정렬
  const orderBy = filter.orderBy || 'createdAt';
  const orderDir = filter.orderDir || 'desc';
  const columnMap: Record<string, string> = {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    useCount: 'use_count',
    name: 'name',
  };
  query = query.order(columnMap[orderBy] || 'created_at', {
    ascending: orderDir === 'asc',
  });

  // 페이지네이션
  if (filter.offset) {
    query = query.range(filter.offset, filter.offset + (filter.limit || 20) - 1);
  } else if (filter.limit) {
    query = query.limit(filter.limit);
  }

  const { data, error } = await query;

  if (error) {
    inventoryLogger.error(' getInventoryItems error:', error);
    throw error;
  }

  return (data as InventoryItemDB[]).map(dbToClient);
}

/**
 * 인벤토리 아이템 단일 조회
 */
export async function getInventoryItemById(
  userId: string,
  itemId: string
): Promise<InventoryItem | null> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('user_inventory')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('id', itemId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    inventoryLogger.error(' getInventoryItemById error:', error);
    throw error;
  }

  return dbToClient(data as InventoryItemDB);
}

/**
 * 인벤토리 아이템 생성
 */
export async function createInventoryItem(
  userId: string,
  request: CreateInventoryItemRequest
): Promise<InventoryItem> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('user_inventory')
    .insert({
      clerk_user_id: userId,
      category: request.category,
      sub_category: request.subCategory || null,
      name: request.name,
      image_url: request.imageUrl,
      original_image_url: request.originalImageUrl || null,
      brand: request.brand || null,
      tags: request.tags || [],
      is_favorite: request.isFavorite || false,
      expiry_date: request.expiryDate || null,
      metadata: request.metadata || {},
    })
    .select()
    .single();

  if (error) {
    inventoryLogger.error(' createInventoryItem error:', error);
    throw error;
  }

  return dbToClient(data as InventoryItemDB);
}

/**
 * 인벤토리 아이템 수정
 */
export async function updateInventoryItem(
  userId: string,
  itemId: string,
  request: UpdateInventoryItemRequest
): Promise<InventoryItem> {
  const supabase = createClerkSupabaseClient();

  // 업데이트할 필드만 포함
  const updateData: Record<string, unknown> = {};

  if (request.name !== undefined) updateData.name = request.name;
  if (request.subCategory !== undefined) updateData.sub_category = request.subCategory;
  if (request.imageUrl !== undefined) updateData.image_url = request.imageUrl;
  if (request.brand !== undefined) updateData.brand = request.brand;
  if (request.tags !== undefined) updateData.tags = request.tags;
  if (request.isFavorite !== undefined) updateData.is_favorite = request.isFavorite;
  if (request.expiryDate !== undefined) updateData.expiry_date = request.expiryDate;
  if (request.metadata !== undefined) updateData.metadata = request.metadata;

  const { data, error } = await supabase
    .from('user_inventory')
    .update(updateData)
    .eq('clerk_user_id', userId)
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    inventoryLogger.error(' updateInventoryItem error:', error);
    throw error;
  }

  return dbToClient(data as InventoryItemDB);
}

/**
 * 인벤토리 아이템 삭제
 */
export async function deleteInventoryItem(userId: string, itemId: string): Promise<void> {
  const supabase = createClerkSupabaseClient();

  const { error } = await supabase
    .from('user_inventory')
    .delete()
    .eq('clerk_user_id', userId)
    .eq('id', itemId);

  if (error) {
    inventoryLogger.error(' deleteInventoryItem error:', error);
    throw error;
  }
}

/**
 * 아이템 사용 기록 (useCount 증가, lastUsedAt 갱신)
 */
export async function recordItemUsage(userId: string, itemId: string): Promise<void> {
  const supabase = createClerkSupabaseClient();

  const { error } = await supabase.rpc('increment_inventory_use_count', {
    p_user_id: userId,
    p_item_id: itemId,
  });

  // RPC가 없으면 직접 업데이트
  if (error) {
    const { error: updateError } = await supabase
      .from('user_inventory')
      .update({
        use_count: supabase.rpc('increment_use_count') as unknown as number,
        last_used_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', userId)
      .eq('id', itemId);

    if (updateError) {
      // Fallback: 읽고 쓰기
      const item = await getInventoryItemById(userId, itemId);
      if (item) {
        await supabase
          .from('user_inventory')
          .update({
            use_count: item.useCount + 1,
            last_used_at: new Date().toISOString(),
          })
          .eq('id', itemId);
      }
    }
  }
}

/**
 * 즐겨찾기 토글
 */
export async function toggleFavorite(userId: string, itemId: string): Promise<boolean> {
  const item = await getInventoryItemById(userId, itemId);
  if (!item) throw new Error('Item not found');

  const newValue = !item.isFavorite;

  const supabase = createClerkSupabaseClient();
  const { error } = await supabase
    .from('user_inventory')
    .update({ is_favorite: newValue })
    .eq('clerk_user_id', userId)
    .eq('id', itemId);

  if (error) {
    inventoryLogger.error(' toggleFavorite error:', error);
    throw error;
  }

  return newValue;
}

// =====================================================
// 저장된 코디 CRUD
// =====================================================

/**
 * 저장된 코디 목록 조회
 */
export async function getSavedOutfits(
  userId: string,
  options: {
    occasion?: string;
    season?: Season;
    limit?: number;
    offset?: number;
  } = {}
): Promise<SavedOutfit[]> {
  const supabase = createClerkSupabaseClient();

  let query = supabase
    .from('saved_outfits')
    .select('*')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false });

  if (options.occasion) {
    query = query.eq('occasion', options.occasion);
  }

  if (options.season) {
    query = query.contains('season', [options.season]);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    inventoryLogger.error(' getSavedOutfits error:', error);
    throw error;
  }

  return (data as SavedOutfitDB[]).map(outfitDbToClient);
}

/**
 * 저장된 코디 단일 조회 (아이템 포함)
 */
export async function getSavedOutfitById(
  userId: string,
  outfitId: string
): Promise<SavedOutfit | null> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('saved_outfits')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('id', outfitId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    inventoryLogger.error(' getSavedOutfitById error:', error);
    throw error;
  }

  const outfit = outfitDbToClient(data as SavedOutfitDB);

  // 아이템 조회
  if (outfit.itemIds.length > 0) {
    const { data: items } = await supabase
      .from('user_inventory')
      .select('*')
      .eq('clerk_user_id', userId)
      .in('id', outfit.itemIds);

    if (items) {
      outfit.items = (items as InventoryItemDB[]).map((item) => toClothingItem(dbToClient(item)));
    }
  }

  return outfit;
}

/**
 * 코디 저장
 */
export async function createOutfit(
  userId: string,
  request: CreateOutfitRequest
): Promise<SavedOutfit> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('saved_outfits')
    .insert({
      clerk_user_id: userId,
      name: request.name || null,
      description: request.description || null,
      item_ids: request.itemIds,
      collage_image_url: request.collageImageUrl || null,
      occasion: request.occasion || null,
      season: request.season || [],
      weather_condition: request.weatherCondition || null,
    })
    .select()
    .single();

  if (error) {
    inventoryLogger.error(' createOutfit error:', error);
    throw error;
  }

  return outfitDbToClient(data as SavedOutfitDB);
}

/**
 * 코디 수정
 */
export async function updateOutfit(
  userId: string,
  outfitId: string,
  request: UpdateOutfitRequest
): Promise<SavedOutfit> {
  const supabase = createClerkSupabaseClient();

  const updateData: Record<string, unknown> = {};

  if (request.name !== undefined) updateData.name = request.name;
  if (request.description !== undefined) updateData.description = request.description;
  if (request.itemIds !== undefined) updateData.item_ids = request.itemIds;
  if (request.collageImageUrl !== undefined) updateData.collage_image_url = request.collageImageUrl;
  if (request.occasion !== undefined) updateData.occasion = request.occasion;
  if (request.season !== undefined) updateData.season = request.season;
  if (request.weatherCondition !== undefined)
    updateData.weather_condition = request.weatherCondition;

  const { data, error } = await supabase
    .from('saved_outfits')
    .update(updateData)
    .eq('clerk_user_id', userId)
    .eq('id', outfitId)
    .select()
    .single();

  if (error) {
    inventoryLogger.error(' updateOutfit error:', error);
    throw error;
  }

  return outfitDbToClient(data as SavedOutfitDB);
}

/**
 * 코디 삭제
 */
export async function deleteOutfit(userId: string, outfitId: string): Promise<void> {
  const supabase = createClerkSupabaseClient();

  const { error } = await supabase
    .from('saved_outfits')
    .delete()
    .eq('clerk_user_id', userId)
    .eq('id', outfitId);

  if (error) {
    inventoryLogger.error(' deleteOutfit error:', error);
    throw error;
  }
}

/**
 * 코디 착용 기록
 */
export async function recordOutfitWear(userId: string, outfitId: string): Promise<void> {
  const supabase = createClerkSupabaseClient();

  // 코디 착용 횟수 증가
  const outfit = await getSavedOutfitById(userId, outfitId);
  if (!outfit) throw new Error('Outfit not found');

  await supabase
    .from('saved_outfits')
    .update({
      wear_count: outfit.wearCount + 1,
      last_worn_at: new Date().toISOString(),
    })
    .eq('id', outfitId);

  // 구성 아이템들의 착용 횟수도 증가
  for (const itemId of outfit.itemIds) {
    await recordItemUsage(userId, itemId);
  }
}

// =====================================================
// 통계 및 분석
// =====================================================

/**
 * 카테고리별 아이템 수 조회
 */
export async function getInventoryStats(
  userId: string,
  category: InventoryCategory
): Promise<{
  total: number;
  bySubCategory: Record<string, number>;
  bySeason?: Record<Season, number>;
  favorites: number;
  recentlyUsed: number;
  unused: number;
}> {
  const supabase = createClerkSupabaseClient();

  // 전체 아이템 조회
  const { data: items, error } = await supabase
    .from('user_inventory')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('category', category);

  if (error) {
    inventoryLogger.error(' getInventoryStats error:', error);
    throw error;
  }

  const typedItems = (items as InventoryItemDB[]).map(dbToClient);

  // 서브카테고리별 집계
  const bySubCategory: Record<string, number> = {};
  typedItems.forEach((item) => {
    const sub = item.subCategory || 'uncategorized';
    bySubCategory[sub] = (bySubCategory[sub] || 0) + 1;
  });

  // 계절별 집계 (의류 전용)
  let bySeason: Record<Season, number> | undefined;
  if (category === 'closet') {
    bySeason = { spring: 0, summer: 0, autumn: 0, winter: 0 };
    typedItems.forEach((item) => {
      const meta = getClothingMetadata(item.metadata);
      if (meta.season && meta.season.length > 0) {
        meta.season.forEach((s) => {
          if (bySeason && bySeason[s] !== undefined) {
            bySeason[s]++;
          }
        });
      }
    });
  }

  // 즐겨찾기 수
  const favorites = typedItems.filter((item) => item.isFavorite).length;

  // 최근 사용 (7일 이내)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentlyUsed = typedItems.filter(
    (item) => item.lastUsedAt && new Date(item.lastUsedAt) > weekAgo
  ).length;

  // 미사용 (3개월 이상)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const unused = typedItems.filter(
    (item) => !item.lastUsedAt || new Date(item.lastUsedAt) < threeMonthsAgo
  ).length;

  return {
    total: typedItems.length,
    bySubCategory,
    bySeason,
    favorites,
    recentlyUsed,
    unused,
  };
}

/**
 * 가장 많이 사용한 아이템 조회
 */
export async function getTopUsedItems(
  userId: string,
  category: InventoryCategory,
  limit: number = 5
): Promise<InventoryItem[]> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('user_inventory')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('category', category)
    .gt('use_count', 0)
    .order('use_count', { ascending: false })
    .limit(limit);

  if (error) {
    inventoryLogger.error(' getTopUsedItems error:', error);
    throw error;
  }

  return (data as InventoryItemDB[]).map(dbToClient);
}

/**
 * 미사용 아이템 조회 (3개월 이상)
 */
export async function getUnusedItems(
  userId: string,
  category: InventoryCategory,
  monthsUnused: number = 3
): Promise<InventoryItem[]> {
  const supabase = createClerkSupabaseClient();

  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - monthsUnused);

  const { data, error } = await supabase
    .from('user_inventory')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('category', category)
    .or(`last_used_at.is.null,last_used_at.lt.${cutoffDate.toISOString()}`)
    .order('created_at', { ascending: true });

  if (error) {
    inventoryLogger.error(' getUnusedItems error:', error);
    throw error;
  }

  return (data as InventoryItemDB[]).map(dbToClient);
}

// =====================================================
// 의류 전용 유틸리티
// =====================================================

/**
 * 특정 색상의 의류 조회
 */
export async function getClothingByColor(userId: string, color: string): Promise<ClothingItem[]> {
  const items = await getInventoryItems(userId, {
    category: 'closet',
    color,
  });

  return toClothingItems(items);
}

/**
 * 특정 계절에 맞는 의류 조회
 */
export async function getClothingBySeason(userId: string, season: Season): Promise<ClothingItem[]> {
  const items = await getInventoryItems(userId, {
    category: 'closet',
    season,
  });

  return toClothingItems(items);
}

/**
 * 코디 가능한 아이템 조합 (카테고리별 최소 1개씩)
 */
export async function getOutfitCandidates(
  userId: string,
  options: {
    season?: Season;
    occasion?: Occasion;
  } = {}
): Promise<{
  outer: ClothingItem[];
  top: ClothingItem[];
  bottom: ClothingItem[];
  shoes: ClothingItem[];
  bag: ClothingItem[];
  accessory: ClothingItem[];
}> {
  const allItems = await getInventoryItems(userId, {
    category: 'closet',
    season: options.season,
    occasion: options.occasion,
  });

  const clothing = toClothingItems(allItems);

  return {
    outer: clothing.filter((i) => i.subCategory === 'outer'),
    top: clothing.filter((i) => i.subCategory === 'top'),
    bottom: clothing.filter((i) => i.subCategory === 'bottom'),
    shoes: clothing.filter((i) => i.subCategory === 'shoes'),
    bag: clothing.filter((i) => i.subCategory === 'bag'),
    accessory: clothing.filter((i) => i.subCategory === 'accessory'),
  };
}
