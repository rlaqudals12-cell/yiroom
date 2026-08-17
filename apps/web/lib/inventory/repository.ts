/**
 * 인벤토리 Repository
 * CRUD 및 조회 기능 제공
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { inventoryLogger } from '@/lib/utils/logger';
import {
  isInventoryStoragePath,
  resolveInventoryImageUrl,
  signInventoryImagePaths,
} from './image-url';
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
// 비공개 버킷 이미지 서명 (읽기 경계)
// =====================================================

/**
 * 아이템의 이미지 경로를 서명 URL로 바꿔서 돌려준다.
 *
 * `inventory-images`는 비공개 버킷이라 DB에는 스토리지 경로만 들어 있다.
 * service role로 서명하는 이유: 서버 기본 Clerk 토큰에는 role claim이 없어
 * RLS 클라이언트로는 storage.objects의 `TO authenticated` 정책에 걸린다
 * (업로드 라우트가 service role을 쓰는 것과 동일한 근거). 소유권은 이미
 * 모든 쿼리의 `.eq('clerk_user_id', userId)` 스코프가 보장한다.
 *
 * 레거시로 저장된 절대 공개 URL은 그대로 통과한다(하위호환).
 */
async function withSignedImages<T extends InventoryItem>(items: T[]): Promise<T[]> {
  if (items.length === 0) return items;

  const values = items.flatMap((item) => [item.imageUrl, item.originalImageUrl]);

  // 서명할 경로가 하나도 없으면(전부 레거시 절대 URL) 클라이언트조차 만들지 않는다.
  // 불필요한 커넥션을 아끼는 동시에, service role 환경변수가 없는 컨텍스트(테스트 등)에서
  // 목록 조회가 통째로 죽는 것을 막는다.
  if (!values.some(isInventoryStoragePath)) return items;

  let signed: ReadonlyMap<string, string>;
  try {
    signed = await signInventoryImagePaths(createServiceRoleClient(), values);
  } catch (err) {
    // 서명 인프라 장애로 목록 전체를 실패시키지 않는다 — 이미지 없이라도 목록은 뜬다
    inventoryLogger.error(' withSignedImages: 서명 클라이언트를 만들지 못했습니다', err);
    return items;
  }

  return items.map((item) => ({
    ...item,
    imageUrl: resolveInventoryImageUrl(item.imageUrl, signed),
    originalImageUrl: item.originalImageUrl
      ? resolveInventoryImageUrl(item.originalImageUrl, signed)
      : item.originalImageUrl,
  }));
}

/** 단일 아이템용 — withSignedImages의 얇은 래퍼 */
async function withSignedImage<T extends InventoryItem>(item: T): Promise<T> {
  const [signed] = await withSignedImages([item]);
  return signed;
}

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

  // 비공개 버킷 — 경로를 서명 URL로 바꿔서 내보낸다
  return withSignedImages((data as InventoryItemDB[]).map(dbToClient));
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

  return withSignedImage(dbToClient(data as InventoryItemDB));
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

  return withSignedImage(dbToClient(data as InventoryItemDB));
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

  return withSignedImage(dbToClient(data as InventoryItemDB));
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

/** 소유하지 않았거나 존재하지 않는 아이템을 가리켰을 때의 에러 메시지(라우트가 404로 매핑) */
export const ITEM_NOT_FOUND = 'Item not found';

/**
 * 여러 아이템의 착용 기록을 한 번에 반영한다 (useCount +1, lastUsedAt 갱신).
 *
 * 2026-08 수리 배경: 예전 구현은 마이그레이션에 존재하지도 않는 RPC
 * (`increment_inventory_use_count`)를 먼저 호출하고, 실패하면 폴백에서
 * `use_count: supabase.rpc(...)`—즉 **Promise 객체**를 숫자 컬럼에 넣는 UPDATE를 던졌다.
 * 그 UPDATE도 실패하면 에러를 통째로 삼켜, 호출측은 성공으로 알고 아무것도 기록되지 않았다.
 * 여기서는 소유권을 검사한 뒤(=RLS에만 기대지 않음) 배치 UPDATE로 갱신하고,
 * 실패는 반드시 호출측으로 전파한다.
 *
 * 왕복 최소화: 같은 use_count를 가진 아이템끼리 묶어 한 문장으로 갱신한다
 * (아이템별 UPDATE = N회 왕복 + 부분 성공 위험).
 *
 * @param options.requireAll 기본 true — 요청한 아이템 중 하나라도 내 것이 아니면 실패시킨다.
 *   저장된 코디처럼 **이미 지워진 아이템을 참조할 수 있는** 호출자만 false로 낮춘다.
 */
export async function recordItemsUsage(
  userId: string,
  itemIds: string[],
  options: { requireAll?: boolean } = {}
): Promise<void> {
  const { requireAll = true } = options;
  const uniqueIds = [...new Set(itemIds)];
  if (uniqueIds.length === 0) return;

  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase
    .from('user_inventory')
    .select('id, use_count')
    .eq('clerk_user_id', userId)
    .in('id', uniqueIds);

  if (error) {
    inventoryLogger.error(' recordItemsUsage select error:', error);
    throw error;
  }

  const rows = (data ?? []) as Array<{ id: string; use_count: number | null }>;

  // 일부만 내 것이면 "일부만 기록됨"으로 뭉개지 않고 실패로 알린다
  if (requireAll && rows.length !== uniqueIds.length) {
    throw new Error(ITEM_NOT_FOUND);
  }
  if (rows.length === 0) return;

  const buckets = new Map<number, string[]>();
  for (const row of rows) {
    const count = row.use_count ?? 0;
    const bucket = buckets.get(count);
    if (bucket) bucket.push(row.id);
    else buckets.set(count, [row.id]);
  }

  const now = new Date().toISOString();
  const results = await Promise.all(
    [...buckets].map(([count, ids]) =>
      supabase
        .from('user_inventory')
        .update({ use_count: count + 1, last_used_at: now })
        .eq('clerk_user_id', userId)
        .in('id', ids)
    )
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    inventoryLogger.error(' recordItemsUsage update error:', failed.error);
    throw failed.error;
  }
}

/**
 * 아이템 사용 기록 (useCount 증가, lastUsedAt 갱신)
 */
export async function recordItemUsage(userId: string, itemId: string): Promise<void> {
  await recordItemsUsage(userId, [itemId]);
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
      // 서명은 InventoryItem 단계에서 끝낸다 — ClothingItem은 metadata가 인덱스 시그니처
      // 없는 인터페이스라 `T extends InventoryItem` 제약을 만족하지 못한다
      const signedItems = await withSignedImages((items as InventoryItemDB[]).map(dbToClient));
      outfit.items = signedItems.map(toClothingItem);
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
 *
 * 코디 카운트와 구성 아이템 카운트를 함께 올린다. 예전에는 코디 UPDATE 결과를 확인하지 않고
 * 아이템도 한 벌씩 순차 기록해, 중간에 실패하면 "일부만 기록된" 상태로 성공을 반환했다.
 * 지금은 소유권 확인 → 코디 갱신(에러 전파) → 아이템 배치 갱신(에러 전파) 순으로 진행한다.
 */
export async function recordOutfitWear(userId: string, outfitId: string): Promise<void> {
  const supabase = createClerkSupabaseClient();

  // 코디 소유권 확인 (없으면 남의 코디이거나 삭제된 코디)
  const outfit = await getSavedOutfitById(userId, outfitId);
  if (!outfit) throw new Error('Outfit not found');

  const { error } = await supabase
    .from('saved_outfits')
    .update({
      wear_count: outfit.wearCount + 1,
      last_worn_at: new Date().toISOString(),
    })
    .eq('clerk_user_id', userId)
    .eq('id', outfitId);

  if (error) {
    inventoryLogger.error(' recordOutfitWear error:', error);
    throw error;
  }

  // 구성 아이템들의 착용 횟수도 함께 (배치 1회).
  // 저장된 코디는 나중에 옷장에서 지운 옷을 계속 가리킬 수 있다 — 그 한 벌 때문에
  // 코디 착용 기록 전체를 실패시키지 않는다(남아 있는 옷만 갱신).
  await recordItemsUsage(userId, outfit.itemIds, { requireAll: false });
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

  return withSignedImages((data as InventoryItemDB[]).map(dbToClient));
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

  return withSignedImages((data as InventoryItemDB[]).map(dbToClient));
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
