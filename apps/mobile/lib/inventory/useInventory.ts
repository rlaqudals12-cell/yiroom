/**
 * 인벤토리 시스템 훅
 * 옷장, 뷰티, 운동장비, 영양제, 냉장고 관리
 */

import { useUser } from '@clerk/clerk-expo';
import { useCallback, useEffect, useState } from 'react';

import { useClerkSupabaseClient } from '../supabase';
import { closetLogger } from '../utils/logger';

import type {
  InventoryItem,
  InventoryCategory,
  ClothingCategory,
  InventoryItemRow,
  SavedOutfit,
  SavedOutfitRow,
} from './index';
import { rowToInventoryItem, rowToSavedOutfit, toClothingItems } from './index';

// ============================================================
// 인벤토리 아이템 훅
// ============================================================

interface UseInventoryResult {
  items: InventoryItem[];
  isLoading: boolean;
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
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!user?.id || !supabase) return;

    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('inventory_items')
        .select('*')
        .eq('clerk_user_id', user.id)
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setItems((data as InventoryItemRow[]).map(rowToInventoryItem));
    } catch (err) {
      closetLogger.error(' useInventory error:', err);
      setError('아이템을 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabase, category]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = useCallback(
    async (
      item: Omit<
        InventoryItem,
        'id' | 'clerkUserId' | 'createdAt' | 'updatedAt'
      >
    ): Promise<InventoryItem | null> => {
      if (!user?.id || !supabase) return null;

      try {
        const { data, error: insertError } = await supabase
          .from('inventory_items')
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
        if (updates.subCategory !== undefined)
          updateData.sub_category = updates.subCategory;
        if (updates.imageUrl !== undefined)
          updateData.image_url = updates.imageUrl;
        if (updates.brand !== undefined) updateData.brand = updates.brand;
        if (updates.tags !== undefined) updateData.tags = updates.tags;
        if (updates.isFavorite !== undefined)
          updateData.is_favorite = updates.isFavorite;
        if (updates.metadata !== undefined)
          updateData.metadata = updates.metadata;

        const { error: updateError } = await supabase
          .from('inventory_items')
          .update(updateData)
          .eq('id', id);

        if (updateError) throw updateError;

        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
        );
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
        const { error: deleteError } = await supabase
          .from('inventory_items')
          .delete()
          .eq('id', id);

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
      return inventory.items.filter((item) => item.subCategory === category);
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
  deleteOutfit: (id: string) => Promise<boolean>;
  recordWear: (id: string) => Promise<boolean>;
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
        .from('saved_outfits')
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
      outfit: Omit<
        SavedOutfit,
        'id' | 'clerkUserId' | 'createdAt' | 'updatedAt'
      >
    ): Promise<SavedOutfit | null> => {
      if (!user?.id || !supabase) return null;

      try {
        const { data, error: insertError } = await supabase
          .from('saved_outfits')
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
          .from('saved_outfits')
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

  const recordWear = useCallback(
    async (id: string): Promise<boolean> => {
      if (!supabase) return false;

      try {
        const outfit = outfits.find((o) => o.id === id);
        if (!outfit) return false;

        const { error: updateError } = await supabase
          .from('saved_outfits')
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

  return {
    outfits,
    isLoading,
    error,
    refetch: fetchOutfits,
    saveOutfit,
    deleteOutfit,
    recordWear,
  };
}
