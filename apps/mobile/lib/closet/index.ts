/**
 * 옷장 모듈
 *
 * 의류 아이템 CRUD, 필터, 통계
 *
 * @module lib/closet
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── 타입 ────────────────────────────────────────────

export type ClothingCategory =
  | 'outer'
  | 'top'
  | 'bottom'
  | 'dress'
  | 'shoes'
  | 'bag'
  | 'accessory';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Occasion = 'casual' | 'formal' | 'sports' | 'date' | 'travel' | 'office';
export type Pattern = 'solid' | 'stripe' | 'check' | 'floral' | 'dot' | 'print' | 'other';
export type Material = 'cotton' | 'polyester' | 'denim' | 'silk' | 'wool' | 'linen' | 'leather' | 'knit' | 'other';

export interface ClothingItem {
  id: string;
  clerkUserId: string;
  name: string;
  category: ClothingCategory;
  color: string;
  imageUrl: string | null;
  seasons: Season[];
  occasions: Occasion[];
  pattern: Pattern;
  material: Material;
  brand: string | null;
  isFavorite: boolean;
  wearCount: number;
  lastWornAt: string | null;
  createdAt: string;
}

export interface ClosetFilterOptions {
  category?: ClothingCategory;
  season?: Season[];
  occasion?: Occasion[];
  color?: string;
  isFavorite?: boolean;
  search?: string;
}

export type ClosetSortOption = 'newest' | 'oldest' | 'name' | 'mostWorn' | 'recentlyWorn';

export interface ClosetStats {
  totalItems: number;
  favoriteCount: number;
  categoryCount: Record<string, number>;
  unwornItems: number;
  avgWearCount: number;
}

export interface AddClothingInput {
  name: string;
  category: ClothingCategory;
  color: string;
  imageUrl?: string;
  seasons?: Season[];
  occasions?: Occasion[];
  pattern?: Pattern;
  material?: Material;
  brand?: string;
}

// ─── 상수 ─────────────────────────────────────────────

export const CLOTHING_CATEGORY_LABELS: Record<ClothingCategory, string> = {
  outer: '아우터',
  top: '상의',
  bottom: '하의',
  dress: '원피스',
  shoes: '신발',
  bag: '가방',
  accessory: '액세서리',
};

export const SEASON_LABELS: Record<Season, string> = {
  spring: '봄',
  summer: '여름',
  autumn: '가을',
  winter: '겨울',
};

export const OCCASION_LABELS: Record<Occasion, string> = {
  casual: '캐주얼',
  formal: '포멀',
  sports: '스포츠',
  date: '데이트',
  travel: '여행',
  office: '오피스',
};

export const CLOSET_SORT_LABELS: Record<ClosetSortOption, string> = {
  newest: '최신순',
  oldest: '오래된순',
  name: '이름순',
  mostWorn: '많이 입은순',
  recentlyWorn: '최근 착용순',
};

// ─── 조회 ───────────────────────────────────────────

/**
 * 옷장 아이템 조회
 */
export async function getClosetItems(
  supabase: SupabaseClient,
  userId: string,
  filter?: ClosetFilterOptions,
  sort: ClosetSortOption = 'newest',
  limit = 50
): Promise<ClothingItem[]> {
  let query = supabase
    .from('closet_items')
    .select('*')
    .eq('clerk_user_id', userId);

  if (filter?.category) {
    query = query.eq('category', filter.category);
  }
  if (filter?.isFavorite) {
    query = query.eq('is_favorite', true);
  }
  if (filter?.search) {
    query = query.ilike('name', `%${filter.search}%`);
  }

  // 정렬
  switch (sort) {
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'name':
      query = query.order('name', { ascending: true });
      break;
    case 'mostWorn':
      query = query.order('wear_count', { ascending: false });
      break;
    case 'recentlyWorn':
      query = query.order('last_worn_at', { ascending: false });
      break;
  }

  const { data } = await query.limit(limit);
  return (data ?? []).map(mapToClothingItem);
}

/**
 * 옷장 통계
 */
export async function getClosetStats(
  supabase: SupabaseClient,
  userId: string
): Promise<ClosetStats> {
  const { data } = await supabase
    .from('closet_items')
    .select('category, is_favorite, wear_count')
    .eq('clerk_user_id', userId);

  if (!data || data.length === 0) {
    return { totalItems: 0, favoriteCount: 0, categoryCount: {}, unwornItems: 0, avgWearCount: 0 };
  }

  const categoryCount: Record<string, number> = {};
  let favoriteCount = 0;
  let unwornItems = 0;
  let totalWearCount = 0;

  data.forEach((item) => {
    categoryCount[item.category] = (categoryCount[item.category] ?? 0) + 1;
    if (item.is_favorite) favoriteCount++;
    if (item.wear_count === 0) unwornItems++;
    totalWearCount += item.wear_count ?? 0;
  });

  return {
    totalItems: data.length,
    favoriteCount,
    categoryCount,
    unwornItems,
    avgWearCount: Math.round(totalWearCount / data.length),
  };
}

// ─── 추가/수정/삭제 ──────────────────────────────────

/**
 * 아이템 추가
 */
export async function addClothingItem(
  supabase: SupabaseClient,
  userId: string,
  input: AddClothingInput
): Promise<ClothingItem | null> {
  const { data, error } = await supabase
    .from('closet_items')
    .insert({
      clerk_user_id: userId,
      name: input.name,
      category: input.category,
      color: input.color,
      image_url: input.imageUrl ?? null,
      seasons: input.seasons ?? [],
      occasions: input.occasions ?? [],
      pattern: input.pattern ?? 'solid',
      material: input.material ?? 'other',
      brand: input.brand ?? null,
    })
    .select()
    .single();

  if (error || !data) return null;
  return mapToClothingItem(data);
}

/**
 * 아이템 삭제
 */
export async function deleteClothingItem(
  supabase: SupabaseClient,
  userId: string,
  itemId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('closet_items')
    .delete()
    .eq('id', itemId)
    .eq('clerk_user_id', userId);
  return !error;
}

/**
 * 즐겨찾기 토글
 */
export async function toggleFavorite(
  supabase: SupabaseClient,
  userId: string,
  itemId: string,
  isFavorite: boolean
): Promise<boolean> {
  const { error } = await supabase
    .from('closet_items')
    .update({ is_favorite: isFavorite })
    .eq('id', itemId)
    .eq('clerk_user_id', userId);
  return !error;
}

/**
 * 착용 기록
 */
export async function recordWear(
  supabase: SupabaseClient,
  userId: string,
  itemId: string
): Promise<boolean> {
  const { error } = await supabase.rpc('increment_wear_count', {
    p_item_id: itemId,
    p_user_id: userId,
  });

  // RPC가 없으면 직접 업데이트
  if (error) {
    const { data } = await supabase
      .from('closet_items')
      .select('wear_count')
      .eq('id', itemId)
      .eq('clerk_user_id', userId)
      .single();

    if (!data) return false;

    const { error: updateError } = await supabase
      .from('closet_items')
      .update({
        wear_count: (data.wear_count ?? 0) + 1,
        last_worn_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .eq('clerk_user_id', userId);

    return !updateError;
  }

  return true;
}

// ─── 내부 유틸리티 ────────────────────────────────────

function mapToClothingItem(row: Record<string, unknown>): ClothingItem {
  return {
    id: row.id as string,
    clerkUserId: row.clerk_user_id as string,
    name: row.name as string,
    category: row.category as ClothingCategory,
    color: (row.color as string) ?? '',
    imageUrl: (row.image_url as string) ?? null,
    seasons: (row.seasons as Season[]) ?? [],
    occasions: (row.occasions as Occasion[]) ?? [],
    pattern: (row.pattern as Pattern) ?? 'solid',
    material: (row.material as Material) ?? 'other',
    brand: (row.brand as string) ?? null,
    isFavorite: (row.is_favorite as boolean) ?? false,
    wearCount: (row.wear_count as number) ?? 0,
    lastWornAt: (row.last_worn_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}
