'use client';

/**
 * 새 코디 만들기 페이지
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OutfitBuilder, CollageView } from '@/components/inventory';
import type {
  InventoryItem,
  InventoryItemDB,
  Season,
  Occasion,
} from '@/types/inventory';
import { SEASON_LABELS, OCCASION_LABELS } from '@/types/inventory';

type Step = 'select' | 'details';

export default function NewOutfitPage() {
  const router = useRouter();
  const supabase = useClerkSupabaseClient();

  const [step, setStep] = useState<Step>('select');
  const [saving, setSaving] = useState(false);

  // 아이템 목록
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 선택된 아이템
  const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);

  // 폼 데이터
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [occasion, setOccasion] = useState<Occasion | ''>('');

  // 아이템 로드
  const fetchItems = useCallback(async () => {
    if (!supabase) return;

    const { data, error } = await supabase
      .from('user_inventory')
      .select('*')
      .eq('category', 'closet')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[NewOutfit] Fetch error:', error);
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
  }, [supabase]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // 시즌 토글
  const toggleSeason = (season: Season) => {
    setSeasons((prev) =>
      prev.includes(season)
        ? prev.filter((s) => s !== season)
        : [...prev, season]
    );
  };

  // 아이템 선택 완료
  const handleItemsSelected = (items: InventoryItem[]) => {
    setSelectedItems(items);
    setStep('details');
  };

  // 저장
  const handleSave = async () => {
    if (!supabase || selectedItems.length === 0) return;

    setSaving(true);
    try {
      const { error } = await supabase.from('saved_outfits').insert({
        name: name || null,
        description: description || null,
        item_ids: selectedItems.map((i) => i.id),
        season: seasons,
        occasion: occasion || null,
      });

      if (error) {
        console.error('[NewOutfit] Save error:', error);
        throw error;
      }

      router.push('/closet/outfits');
    } catch (error) {
      console.error('[NewOutfit] Error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="new-outfit-page" className="min-h-screen pb-20">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (step === 'details') {
                setStep('select');
              } else {
                router.back();
              }
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">새 코디 만들기</h1>
        </div>

        {/* 단계 표시 */}
        <div className="flex px-4 pb-3 gap-2">
          {(['select', 'details'] as const).map((s, _i) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full ${
                step === s || (step === 'details' && s === 'select')
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Step 1: 아이템 선택 */}
        {step === 'select' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold mb-1">옷을 선택하세요</h2>
              <p className="text-sm text-muted-foreground">
                코디에 포함할 옷을 골라주세요
              </p>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                로딩 중...
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  옷장에 등록된 옷이 없어요
                </p>
                <Button onClick={() => router.push('/closet/add')}>
                  옷 추가하기
                </Button>
              </div>
            ) : (
              <OutfitBuilder
                items={items}
                initialSelection={selectedItems}
                onComplete={handleItemsSelected}
                onCancel={() => router.back()}
              />
            )}
          </div>
        )}

        {/* Step 2: 상세 정보 */}
        {step === 'details' && (
          <div className="space-y-6">
            {/* 콜라주 미리보기 */}
            <div className="flex justify-center">
              <CollageView items={selectedItems} layout="mannequin" size="lg" />
            </div>

            {/* 선택된 아이템 수 */}
            <div className="text-center text-sm text-muted-foreground">
              {selectedItems.length}개 아이템 선택됨
            </div>

            {/* 이름 */}
            <div className="space-y-2">
              <Label htmlFor="name">코디 이름 (선택)</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 봄 데이트룩"
              />
            </div>

            {/* 설명 */}
            <div className="space-y-2">
              <Label htmlFor="description">메모 (선택)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="이 코디에 대한 메모..."
                rows={2}
              />
            </div>

            {/* 시즌 */}
            <div className="space-y-2">
              <Label>시즌</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(SEASON_LABELS) as Season[]).map((s) => (
                  <Button
                    key={s}
                    type="button"
                    variant={seasons.includes(s) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleSeason(s)}
                  >
                    {SEASON_LABELS[s]}
                  </Button>
                ))}
              </div>
            </div>

            {/* 상황 */}
            <div className="space-y-2">
              <Label>상황</Label>
              <Select
                value={occasion}
                onValueChange={(v) => setOccasion(v as Occasion)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="상황 선택 (선택)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">선택 안함</SelectItem>
                  {(Object.keys(OCCASION_LABELS) as Occasion[]).map((o) => (
                    <SelectItem key={o} value={o}>
                      {OCCASION_LABELS[o]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 저장 버튼 */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSave}
              disabled={saving || selectedItems.length === 0}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  코디 저장하기
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
