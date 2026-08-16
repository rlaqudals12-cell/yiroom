/**
 * 인벤토리 시스템 훅
 * 옷장, 뷰티, 운동장비, 영양제, 냉장고 관리
 */

import { useUser } from '@clerk/clerk-expo';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useClerkSupabaseClient } from '../supabase';
import { resolveClothingCategory } from './clothingCategory';
import { resolveInventoryImageUrl, signInventoryImagePaths } from './image-url';
import type {
  InventoryItem,
  InventoryCategory,
  ClothingCategory,
  InventoryItemRow,
  SavedOutfit,
  SavedOutfitRow,
} from './types';
import {
  INVENTORY_TABLE,
  SAVED_OUTFITS_TABLE,
  rowToInventoryItem,
  rowToSavedOutfit,
  toClothingItems,
} from './types';
import { closetLogger } from '../utils/logger';

// ============================================================
// 인벤토리 아이템 훅
// ============================================================

interface UseInventoryResult {
  items: InventoryItem[];
  /** 최초 로드 중 — 스켈레톤/로딩 화면 게이팅용 */
  isLoading: boolean;
  /** 재조회 중 — 포커스 복귀·당겨서 새로고침 (기존 목록은 그대로 유지) */
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addItem: (
    item: Omit<InventoryItem, 'id' | 'clerkUserId' | 'createdAt' | 'updatedAt'>
  ) => Promise<InventoryItem | null>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  toggleFavorite: (id: string) => Promise<boolean>;
}

export function useInventory(category?: InventoryCategory): UseInventoryResult {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 최초 로드 성공 여부 — 포커스 복귀마다 전체 스켈레톤이 번쩍이지 않도록
  // "첫 로드(isLoading)"와 "조용한 재조회(isRefreshing)"를 구분한다
  const hasLoadedRef = useRef(false);

  const fetchItems = useCallback(async () => {
    if (!user?.id || !supabase) return;

    if (hasLoadedRef.current) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      let query = supabase
        .from(INVENTORY_TABLE)
        .select('*')
        .eq('clerk_user_id', user.id)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // 비공개 버킷(inventory-images) — DB에는 스토리지 경로만 있으므로
      // 화면에 넘기기 전에 한 번에 서명 URL로 바꾼다 (레거시 절대 URL은 그대로 통과)
      const rows = data as InventoryItemRow[];
      const signedImages = await signInventoryImagePaths(
        supabase,
        rows.flatMap((row) => [row.image_url, row.original_image_url])
      );
      setItems(
        rows.map((row) => {
          const item = rowToInventoryItem(row);
          return {
            ...item,
            imageUrl: resolveInventoryImageUrl(item.imageUrl, signedImages),
            originalImageUrl: item.originalImageUrl
              ? resolveInventoryImageUrl(item.originalImageUrl, signedImages)
              : item.originalImageUrl,
          };
        })
      );
      // 성공한 로드만 "이미 봤다"로 인정 — 첫 로드가 실패하면 다음 시도도 정식 로딩으로 처리
      hasLoadedRef.current = true;
    } catch (err) {
      closetLogger.error(' useInventory error:', err);
      setError('아이템을 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.id, supabase, category]);

  // 화면에 포커스될 때마다 재조회 — 등록/수정/삭제 화면에서 돌아오면 목록이 즉시 최신화된다.
  // (마운트 전용 useEffect는 이미 마운트된 목록을 낡은 채로 남겨, 등록에 성공해도 목록에
  //  안 보여 "등록 실패"로 오인시켰다. 삭제 후 복귀 시 유령 아이템 잔존도 같은 원인)
  useFocusEffect(
    useCallback(() => {
      // 콜백이 Promise를 반환하면 정리(cleanup) 함수로 오인되므로 void로 끊는다
      void fetchItems();
    }, [fetchItems])
  );

  const addItem = useCallback(
    async (
      item: Omit<InventoryItem, 'id' | 'clerkUserId' | 'createdAt' | 'updatedAt'>
    ): Promise<InventoryItem | null> => {
      if (!user?.id || !supabase) return null;

      try {
        const { data, error: insertError } = await supabase
          .from(INVENTORY_TABLE)
          .insert({
            clerk_user_id: user.id,
            category: item.category,
            sub_category: item.subCategory,
            name: item.name,
            image_url: item.imageUrl,
            original_image_url: item.originalImageUrl,
            brand: item.brand,
            tags: item.tags,
            is_favorite: item.isFavorite,
            use_count: item.useCount,
            last_used_at: item.lastUsedAt,
            expiry_date: item.expiryDate,
            metadata: item.metadata,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        const newItem = rowToInventoryItem(data as InventoryItemRow);
        setItems((prev) => [newItem, ...prev]);
        return newItem;
      } catch (err) {
        closetLogger.error(' addItem error:', err);
        return null;
      }
    },
    [user?.id, supabase]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<InventoryItem>): Promise<boolean> => {
      if (!supabase) return false;

      try {
        const updateData: Record<string, unknown> = {};
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.subCategory !== undefined) updateData.sub_category = updates.subCategory;
        if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
        if (updates.brand !== undefined) updateData.brand = updates.brand;
        if (updates.tags !== undefined) updateData.tags = updates.tags;
        if (updates.isFavorite !== undefined) updateData.is_favorite = updates.isFavorite;
        if (updates.metadata !== undefined) updateData.metadata = updates.metadata;

        const { error: updateError } = await supabase
          .from(INVENTORY_TABLE)
          .update(updateData)
          .eq('id', id);

        if (updateError) throw updateError;

        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
        return true;
      } catch (err) {
        closetLogger.error(' updateItem error:', err);
        return false;
      }
    },
    [supabase]
  );

  const deleteItem = useCallback(
    async (id: string): Promise<boolean> => {
      if (!supabase) return false;

      try {
        const { error: deleteError } = await supabase.from(INVENTORY_TABLE).delete().eq('id', id);

        if (deleteError) throw deleteError;

        setItems((prev) => prev.filter((item) => item.id !== id));
        return true;
      } catch (err) {
        closetLogger.error(' deleteItem error:', err);
        return false;
      }
    },
    [supabase]
  );

  const toggleFavorite = useCallback(
    async (id: string): Promise<boolean> => {
      const item = items.find((i) => i.id === id);
      if (!item) return false;

      return updateItem(id, { isFavorite: !item.isFavorite });
    },
    [items, updateItem]
  );

  return {
    items,
    isLoading,
    isRefreshing,
    error,
    refetch: fetchItems,
    addItem,
    updateItem,
    deleteItem,
    toggleFavorite,
  };
}

// ============================================================
// 옷장 전용 훅
// ============================================================

interface UseClosetResult extends Omit<UseInventoryResult, 'items'> {
  items: InventoryItem[];
  clothingItems: ReturnType<typeof toClothingItems>;
  getByCategory: (category: ClothingCategory) => InventoryItem[];
  getFavorites: () => InventoryItem[];
}

export function useCloset(): UseClosetResult {
  const inventory = useInventory('closet');

  const getByCategory = useCallback(
    (category: ClothingCategory) => {
      // sub_category에 한글 세부종류('티셔츠')가 저장된 실데이터가 있어 완전일치는 항상 0건이 된다.
      // 조립기(closetMatcher)와 같은 정규화를 써서 두 경로가 같은 옷을 본다
      return inventory.items.filter((item) => resolveClothingCategory(item) === category);
    },
    [inventory.items]
  );

  const getFavorites = useCallback(() => {
    return inventory.items.filter((item) => item.isFavorite);
  }, [inventory.items]);

  return {
    ...inventory,
    clothingItems: toClothingItems(inventory.items),
    getByCategory,
    getFavorites,
  };
}

// ============================================================
// 저장된 코디 훅
// ============================================================

interface UseSavedOutfitsResult {
  outfits: SavedOutfit[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  saveOutfit: (
    outfit: Omit<SavedOutfit, 'id' | 'clerkUserId' | 'createdAt' | 'updatedAt'>
  ) => Promise<SavedOutfit | null>;
  updateOutfit: (
    id: string,
    updates: Partial<Pick<SavedOutfit, 'name' | 'description' | 'itemIds' | 'occasion' | 'season'>>
  ) => Promise<boolean>;
  deleteOutfit: (id: string) => Promise<boolean>;
  recordWear: (id: string) => Promise<boolean>;
  getOutfitById: (id: string) => SavedOutfit | undefined;
}

export function useSavedOutfits(): UseSavedOutfitsResult {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOutfits = useCallback(async () => {
    if (!user?.id || !supabase) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from(SAVED_OUTFITS_TABLE)
        .select('*')
        .eq('clerk_user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setOutfits((data as SavedOutfitRow[]).map(rowToSavedOutfit));
    } catch (err) {
      closetLogger.error(' useSavedOutfits error:', err);
      setError('코디를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase]);

  useEffect(() => {
    fetchOutfits();
  }, [fetchOutfits]);

  const saveOutfit = useCallback(
    async (
      outfit: Omit<SavedOutfit, 'id' | 'clerkUserId' | 'createdAt' | 'updatedAt'>
    ): Promise<SavedOutfit | null> => {
      if (!user?.id || !supabase) return null;

      try {
        const { data, error: insertError } = await supabase
          .from(SAVED_OUTFITS_TABLE)
          .insert({
            clerk_user_id: user.id,
            name: outfit.name,
            description: outfit.description,
            item_ids: outfit.itemIds,
            collage_image_url: outfit.collageImageUrl,
            occasion: outfit.occasion,
            season: outfit.season,
            wear_count: outfit.wearCount,
            last_worn_at: outfit.lastWornAt,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        const newOutfit = rowToSavedOutfit(data as SavedOutfitRow);
        setOutfits((prev) => [newOutfit, ...prev]);
        return newOutfit;
      } catch (err) {
        closetLogger.error(' saveOutfit error:', err);
        return null;
      }
    },
    [user?.id, supabase]
  );

  const deleteOutfit = useCallback(
    async (id: string): Promise<boolean> => {
      if (!supabase) return false;

      try {
        const { error: deleteError } = await supabase
          .from(SAVED_OUTFITS_TABLE)
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;

        setOutfits((prev) => prev.filter((outfit) => outfit.id !== id));
        return true;
      } catch (err) {
        closetLogger.error(' deleteOutfit error:', err);
        return false;
      }
    },
    [supabase]
  );

  const updateOutfit = useCallback(
    async (
      id: string,
      updates: Partial<
        Pick<SavedOutfit, 'name' | 'description' | 'itemIds' | 'occasion' | 'season'>
      >
    ): Promise<boolean> => {
      if (!supabase) return false;

      try {
        const updateData: Record<string, unknown> = {};
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.itemIds !== undefined) updateData.item_ids = updates.itemIds;
        if (updates.occasion !== undefined) updateData.occasion = updates.occasion;
        if (updates.season !== undefined) updateData.season = updates.season;

        const { error: updateError } = await supabase
          .from(SAVED_OUTFITS_TABLE)
          .update(updateData)
          .eq('id', id);

        if (updateError) throw updateError;

        setOutfits((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
        return true;
      } catch (err) {
        closetLogger.error(' updateOutfit error:', err);
        return false;
      }
    },
    [supabase]
  );

  const recordWear = useCallback(
    async (id: string): Promise<boolean> => {
      if (!supabase) return false;

      try {
        const outfit = outfits.find((o) => o.id === id);
        if (!outfit) return false;

        const { error: updateError } = await supabase
          .from(SAVED_OUTFITS_TABLE)
          .update({
            wear_count: outfit.wearCount + 1,
            last_worn_at: new Date().toISOString(),
          })
          .eq('id', id);

        if (updateError) throw updateError;

        setOutfits((prev) =>
          prev.map((o) =>
            o.id === id
              ? {
                  ...o,
                  wearCount: o.wearCount + 1,
                  lastWornAt: new Date().toISOString(),
                }
              : o
          )
        );
        return true;
      } catch (err) {
        closetLogger.error(' recordWear error:', err);
        return false;
      }
    },
    [supabase, outfits]
  );

  const getOutfitById = useCallback(
    (id: string): SavedOutfit | undefined => {
      return outfits.find((o) => o.id === id);
    },
    [outfits]
  );

  return {
    outfits,
    isLoading,
    error,
    refetch: fetchOutfits,
    saveOutfit,
    updateOutfit,
    deleteOutfit,
    recordWear,
    getOutfitById,
  };
}
