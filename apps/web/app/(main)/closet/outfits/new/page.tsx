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
// 비공개 버킷 이미지 해석 — 'use client' 번들에 서버 repository가 딸려오지 않도록 image-url만 직접 import
import { resolveInventoryImageUrl, signInventoryImagePaths } from '@/lib/inventory/image-url';
import type { InventoryItem, InventoryItemDB, Season, Occasion } from '@/types/inventory';
import { SEASON_LABELS, OCCASION_LABELS } from '@/types/inventory';

type Step = 'select' | 'details';

// Radix Select는 빈 문자열 value의 Item을 금지한다(렌더 중 throw → 페이지 전체가 죽는다).
// "선택 안함"은 센티널 값으로 표현하고 저장 직전에 null로 되돌린다.
const NO_OCCASION = '__none__';

export default function NewOutfitPage() {
  const router = useRouter();
  const supabase = useClerkSupabaseClient();

  const [step, setStep] = useState<Step>('select');
  const [saving, setSaving] = useState(false);
  // 저장 실패 안내 — alert()는 화면 밖 모달이라 테스트·접근성 모두에서 사라진다
  const [saveError, setSaveError] = useState<string | null>(null);

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

    const rows = data as InventoryItemDB[];
    // 비공개 버킷 — 선택 그리드에 뿌릴 이미지 경로를 한 번에 서명한다(아이템별 서명 = N+1 요청)
    const signedImages = await signInventoryImagePaths(supabase, [
      ...rows.flatMap((r) => [r.image_url, r.original_image_url]),
    ]);

    const clientItems = rows.map((row) => ({
      id: row.id,
      clerkUserId: row.clerk_user_id,
      category: row.category,
      subCategory: row.sub_category,
      name: row.name,
      imageUrl: resolveInventoryImageUrl(row.image_url, signedImages),
      originalImageUrl: resolveInventoryImageUrl(row.original_image_url, signedImages),
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
      prev.includes(season) ? prev.filter((s) => s !== season) : [...prev, season]
    );
  };

  // 아이템 선택 완료
  const handleItemsSelected = (items: InventoryItem[]) => {
    setSelectedItems(items);
    setStep('details');
  };

  // 저장 — API 경유 (클라이언트 직접 insert는 clerk_user_id를 채울 수 없어
  // NOT NULL·RLS INSERT 정책에 항상 걸렸다. 서버가 auth()의 userId를 주입한다)
  const handleSave = async () => {
    if (selectedItems.length === 0) return;

    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch('/api/inventory/outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || undefined,
          description: description || undefined,
          itemIds: selectedItems.map((i) => i.id),
          season: seasons,
          // 센티널은 onValueChange에서 이미 ''로 되돌아온다 → 여기선 미선택 = 전송 안 함
          occasion: occasion || undefined,
        }),
      });

      if (!res.ok) throw new Error(`save failed: ${res.status}`);

      router.push('/closet/outfits');
    } catch (error) {
      console.error('[NewOutfit] Save error:', error);
      setSaveError('코디를 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
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
                step === s || (step === 'details' && s === 'select') ? 'bg-primary' : 'bg-muted'
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
              <p className="text-sm text-muted-foreground">코디에 포함할 옷을 골라주세요</p>
            </div>

            {loading && <div className="text-center py-8 text-muted-foreground">로딩 중...</div>}
            {!loading && items.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">옷장에 등록된 옷이 없어요</p>
                <Button onClick={() => router.push('/closet/add')}>옷 추가하기</Button>
              </div>
            )}
            {!loading && items.length > 0 && (
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
                onValueChange={(v) => setOccasion(v === NO_OCCASION ? '' : (v as Occasion))}
              >
                <SelectTrigger data-testid="occasion-select">
                  <SelectValue placeholder="상황 선택 (선택)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_OCCASION}>선택 안함</SelectItem>
                  {(Object.keys(OCCASION_LABELS) as Occasion[]).map((o) => (
                    <SelectItem key={o} value={o}>
                      {OCCASION_LABELS[o]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {saveError && (
              <p data-testid="outfit-save-error" role="alert" className="text-sm text-destructive">
                {saveError}
              </p>
            )}

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
