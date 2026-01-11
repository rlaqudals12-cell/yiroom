/**
 * Phase J P3-B: 저장된 코디 훅
 * 코디 저장/삭제/조회 기능
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import type { FullOutfit, OutfitOccasion } from '@/types/styling';
import type { SeasonType } from '@/lib/mock/personal-color';
import type { SavedOutfit } from '@/lib/api/outfits';

interface UseSavedOutfitsOptions {
  seasonType?: SeasonType;
  occasion?: OutfitOccasion;
  limit?: number;
  autoFetch?: boolean;
}

interface UseSavedOutfitsReturn {
  savedOutfits: SavedOutfit[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  // 조회
  fetchSavedOutfits: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  // 저장/삭제
  saveOutfit: (
    outfit: FullOutfit,
    seasonType: SeasonType,
    occasion: OutfitOccasion
  ) => Promise<boolean>;
  deleteOutfit: (outfitId: string) => Promise<boolean>;
  isOutfitSaved: (outfitId: string) => boolean;
  // 토글
  toggleSaveOutfit: (
    outfit: FullOutfit,
    seasonType: SeasonType,
    occasion: OutfitOccasion
  ) => Promise<boolean>;
}

export function useSavedOutfits(options: UseSavedOutfitsOptions = {}): UseSavedOutfitsReturn {
  const { seasonType, occasion, limit = 20, autoFetch = false } = options;

  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);

  // 저장된 코디 목록 조회
  const fetchSavedOutfits = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (seasonType) params.set('seasonType', seasonType);
      if (occasion) params.set('occasion', occasion);
      params.set('limit', limit.toString());
      params.set('offset', '0');

      const response = await fetch(`/api/outfits?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch saved outfits');
      }

      const result = await response.json();
      setSavedOutfits(
        result.data.map((item: SavedOutfit) => ({
          ...item,
          savedAt: new Date(item.savedAt),
        }))
      );
      setTotalCount(result.count);
      setOffset(limit);
    } catch (err) {
      console.error('[useSavedOutfits] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [seasonType, occasion, limit]);

  // 더 불러오기
  const loadMore = useCallback(async () => {
    if (isLoading || savedOutfits.length >= totalCount) return;

    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      if (seasonType) params.set('seasonType', seasonType);
      if (occasion) params.set('occasion', occasion);
      params.set('limit', limit.toString());
      params.set('offset', offset.toString());

      const response = await fetch(`/api/outfits?${params}`);

      if (!response.ok) {
        throw new Error('Failed to load more');
      }

      const result = await response.json();
      setSavedOutfits((prev) => [
        ...prev,
        ...result.data.map((item: SavedOutfit) => ({
          ...item,
          savedAt: new Date(item.savedAt),
        })),
      ]);
      setOffset((prev) => prev + limit);
    } catch (err) {
      console.error('[useSavedOutfits] Load more error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, savedOutfits.length, totalCount, seasonType, occasion, limit, offset]);

  // 코디 저장
  const saveOutfit = useCallback(
    async (outfit: FullOutfit, st: SeasonType, occ: OutfitOccasion): Promise<boolean> => {
      try {
        const response = await fetch('/api/outfits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outfitId: outfit.id,
            seasonType: st,
            occasion: occ,
            outfit,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          if (data.code === 'ALREADY_SAVED') {
            return false; // 이미 저장됨
          }
          throw new Error(data.error || 'Failed to save outfit');
        }

        const saved = await response.json();
        setSavedOutfits((prev) => [{ ...saved, savedAt: new Date(saved.savedAt) }, ...prev]);
        setTotalCount((prev) => prev + 1);

        return true;
      } catch (err) {
        console.error('[useSavedOutfits] Save error:', err);
        return false;
      }
    },
    []
  );

  // 코디 삭제 (outfit_id 기준)
  const deleteOutfit = useCallback(async (outfitId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/outfits/${outfitId}?byOutfitId=true`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete outfit');
      }

      setSavedOutfits((prev) => prev.filter((o) => o.outfitId !== outfitId));
      setTotalCount((prev) => Math.max(0, prev - 1));

      return true;
    } catch (err) {
      console.error('[useSavedOutfits] Delete error:', err);
      return false;
    }
  }, []);

  // 저장 여부 확인
  const isOutfitSaved = useCallback(
    (outfitId: string): boolean => {
      return savedOutfits.some((o) => o.outfitId === outfitId);
    },
    [savedOutfits]
  );

  // 저장 토글
  const toggleSaveOutfit = useCallback(
    async (outfit: FullOutfit, st: SeasonType, occ: OutfitOccasion): Promise<boolean> => {
      const isSaved = isOutfitSaved(outfit.id);

      if (isSaved) {
        return deleteOutfit(outfit.id);
      } else {
        return saveOutfit(outfit, st, occ);
      }
    },
    [isOutfitSaved, deleteOutfit, saveOutfit]
  );

  // 자동 조회
  useEffect(() => {
    if (autoFetch) {
      fetchSavedOutfits();
    }
  }, [autoFetch, fetchSavedOutfits]);

  return {
    savedOutfits,
    isLoading,
    error,
    totalCount,
    fetchSavedOutfits,
    loadMore,
    hasMore: savedOutfits.length < totalCount,
    saveOutfit,
    deleteOutfit,
    isOutfitSaved,
    toggleSaveOutfit,
  };
}
