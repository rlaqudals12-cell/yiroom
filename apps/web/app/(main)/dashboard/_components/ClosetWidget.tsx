'use client';

/**
 * 대시보드 옷장 위젯
 *
 * 오늘의 코디 추천 + 옷장 통계
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Shirt, Sparkles, ArrowRight, Plus } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TodayOutfitCard, ClosetInsightCard } from '@/components/inventory';
import { getCurrentWeather, type WeatherData } from '@/lib/weather';
import type { InventoryItem, InventoryItemDB } from '@/types/inventory';
import type { PersonalColorSeason } from '@/lib/color-recommendations';

interface ClosetWidgetProps {
  userId: string;
  personalColor?: string | null;
  bodyType?: string | null;
}

// 체형 타입 매핑 (3타입으로 변환)
function mapBodyType(bodyType: string | null): 'S' | 'W' | 'N' | null {
  if (!bodyType) return null;

  // 이미 3타입인 경우
  if (bodyType === 'S' || bodyType === 'W' || bodyType === 'N') {
    return bodyType as 'S' | 'W' | 'N';
  }

  // 8타입 → 3타입 매핑
  const mapping: Record<string, 'S' | 'W' | 'N'> = {
    hourglass: 'W',
    pear: 'W',
    apple: 'W',
    rectangle: 'S',
    inverted_triangle: 'S',
    X: 'S',
    V: 'S',
    Y: 'S',
    A: 'W',
    '8': 'W',
    O: 'W',
    H: 'N',
    I: 'N',
  };

  return mapping[bodyType] || 'N';
}

export default function ClosetWidget({ userId, personalColor, bodyType }: ClosetWidgetProps) {
  const router = useRouter();
  const supabase = useClerkSupabaseClient();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  // 옷장 아이템 로드
  const fetchItems = useCallback(async () => {
    if (!supabase || !userId) return;

    const { data, error } = await supabase
      .from('user_inventory')
      .select('*')
      .eq('category', 'closet')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ClosetWidget] Fetch error:', error);
      return;
    }

    const clientItems = (data as InventoryItemDB[]).map((row) => ({
      id: row.id,
      clerkUserId: row.clerk_user_id,
      category: row.category,
      subCategory: row.sub_category,
      name: row.name,
      imageUrl: row.image_url,
      originalImageUrl: row.original_image_url,
      brand: row.brand,
      tags: row.tags,
      isFavorite: row.is_favorite,
      useCount: row.use_count,
      lastUsedAt: row.last_used_at,
      expiryDate: row.expiry_date,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    setItems(clientItems);
    setLoading(false);
  }, [supabase, userId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // 날씨 데이터 로드
  useEffect(() => {
    getCurrentWeather().then(setWeather);
  }, []);

  // 매핑된 값들
  const mappedPersonalColor = personalColor as PersonalColorSeason | null;
  const mappedBodyType = mapBodyType(bodyType || null);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Shirt className="w-5 h-5 text-muted-foreground" />
          <Skeleton className="w-24 h-5" />
        </div>
        <Skeleton className="w-full h-48 rounded-xl" />
      </div>
    );
  }

  // 빈 상태
  if (items.length === 0) {
    return (
      <div data-testid="closet-widget-empty" className="bg-muted/30 rounded-xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Shirt className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">내 옷장</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          옷을 등록하고 맞춤 코디를 추천받아보세요
        </p>
        <Button onClick={() => router.push('/closet/add')}>
          <Plus className="w-4 h-4 mr-2" />옷 추가하기
        </Button>
      </div>
    );
  }

  return (
    <div data-testid="closet-widget" className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shirt className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">내 옷장</h3>
          <span className="text-sm text-muted-foreground">({items.length}개)</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/closet')}>
          전체 보기
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* 오늘의 코디 추천 */}
      <TodayOutfitCard
        items={items}
        personalColor={mappedPersonalColor}
        bodyType={mappedBodyType}
        weather={weather}
      />

      {/* 옷장 분석 */}
      <ClosetInsightCard
        items={items}
        personalColor={mappedPersonalColor}
        bodyType={mappedBodyType}
      />

      {/* 퀵 액션 */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => router.push('/closet/add')}
        >
          <Plus className="w-4 h-4 mr-1" />옷 추가
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => router.push('/closet/outfits/new')}
        >
          <Sparkles className="w-4 h-4 mr-1" />
          코디 만들기
        </Button>
      </div>
    </div>
  );
}
