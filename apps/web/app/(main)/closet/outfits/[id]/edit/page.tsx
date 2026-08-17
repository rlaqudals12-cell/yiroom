'use client';

/**
 * 코디 수정 페이지
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Check, Loader2, Trash2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { CollageView, OutfitBuilder } from '@/components/inventory';
// 비공개 버킷 이미지 해석 — 'use client' 번들에 서버 repository가 딸려오지 않도록 image-url만 직접 import
import { resolveInventoryImageUrl, signInventoryImagePaths } from '@/lib/inventory/image-url';
import type { InventoryItem, InventoryItemDB, Season, Occasion } from '@/types/inventory';
import { SEASON_LABELS, OCCASION_LABELS } from '@/types/inventory';

interface SavedOutfitDB {
  id: string;
  clerk_user_id: string;
  name: string | null;
  description: string | null;
  item_ids: string[];
  season: Season[];
  occasion: string | null;
  wear_count: number;
  last_worn_at: string | null;
  created_at: string;
  updated_at: string;
}

type Step = 'details' | 'items';

// Radix Select는 빈 문자열 value의 Item을 금지한다(렌더 중 throw → 페이지 전체가 죽는다).
// "선택 안함"은 센티널 값으로 표현하고 저장 직전에 해제로 되돌린다.
const NO_OCCASION = '__none__';

export default function EditOutfitPage() {
  const router = useRouter();
  const params = useParams();
  const outfitId = params.id as string;
  const supabase = useClerkSupabaseClient();

  const [step, setStep] = useState<Step>('details');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // 저장·삭제 실패 안내 — alert()는 화면 밖 모달이라 접근성·검증 모두에서 사라진다
  const [actionError, setActionError] = useState<string | null>(null);

  // 모든 아이템 (아이템 선택용)
  const [allItems, setAllItems] = useState<InventoryItem[]>([]);

  // 선택된 아이템
  const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);

  // 폼 데이터
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [occasion, setOccasion] = useState<Occasion | ''>('');

  // 데이터 로드
  const loadData = useCallback(async () => {
    if (!supabase || !outfitId) return;

    // 코디 정보 로드
    const { data: outfitData, error: outfitError } = await supabase
      .from('saved_outfits')
      .select('*')
      .eq('id', outfitId)
      .single();

    if (outfitError || !outfitData) {
      console.error('[EditOutfit] Load error:', outfitError);
      router.push('/closet/outfits');
      return;
    }

    const outfit = outfitData as SavedOutfitDB;
    setName(outfit.name || '');
    setDescription(outfit.description || '');
    setSeasons(outfit.season || []);
    setOccasion((outfit.occasion as Occasion) || '');

    // 모든 아이템 로드
    const { data: allItemsData, error: allItemsError } = await supabase
      .from('user_inventory')
      .select('*')
      .eq('category', 'closet')
      .order('created_at', { ascending: false });

    if (!allItemsError && allItemsData) {
      const rows = allItemsData as InventoryItemDB[];
      // 비공개 버킷 — 아이템 선택 그리드용 이미지 경로를 한 번에 서명한다(아이템별 서명 = N+1 요청)
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
      setAllItems(clientItems);

      // 선택된 아이템 설정
      if (outfit.item_ids?.length > 0) {
        const selected = clientItems.filter((item) => outfit.item_ids.includes(item.id));
        setSelectedItems(selected);
      }
    }

    setLoading(false);
  }, [supabase, outfitId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  // 저장 — API 경유 (서버가 소유권을 확인하고 clerk_user_id 스코프로 갱신한다.
  // 클라이언트 직접 update는 소유자 조건 없이 id만 걸어 RLS에만 기대고 있었다)
  const handleSave = async () => {
    if (selectedItems.length === 0) return;

    setSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/inventory/outfits/${outfitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || null,
          description: description || null,
          itemIds: selectedItems.map((i) => i.id),
          season: seasons,
          // 센티널은 onValueChange에서 이미 ''로 되돌아온다 → 미선택은 null로 저장(해제)
          occasion: occasion || null,
        }),
      });

      if (!res.ok) throw new Error(`save failed: ${res.status}`);

      router.push(`/closet/outfits/${outfitId}`);
    } catch (error) {
      console.error('[EditOutfit] Save error:', error);
      setActionError('코디를 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  // 삭제 — 실패를 조용히 삼키던 경로(에러면 아무 일도 안 일어남)를 정직하게 알린다
  const handleDelete = async () => {
    setDeleting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/inventory/outfits/${outfitId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`delete failed: ${res.status}`);

      router.push('/closet/outfits');
    } catch (error) {
      console.error('[EditOutfit] Delete error:', error);
      setActionError('코디를 삭제하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="w-9 h-9 rounded-md" />
            <Skeleton className="w-24 h-6" />
          </div>
        </div>
        <div className="px-4 py-4 space-y-6">
          <div className="flex justify-center">
            <Skeleton className="w-40 h-40 rounded-xl" />
          </div>
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-full h-10" />
          <Skeleton className="w-full h-10" />
        </div>
      </div>
    );
  }

  return (
    <div data-testid="edit-outfit-page" className="min-h-screen pb-20">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (step === 'items') {
                  setStep('details');
                } else {
                  router.back();
                }
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">코디 수정</h1>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              {/* 아이콘 단독 버튼 — 라벨이 없으면 스크린리더에 "버튼"으로만 읽힌다 */}
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                aria-label="코디 삭제"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>코디 삭제</AlertDialogTitle>
                <AlertDialogDescription>
                  이 코디를 삭제하시겠어요? 이 작업은 되돌릴 수 없어요.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? '삭제 중...' : '삭제'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* 상세 정보 수정 */}
        {step === 'details' && (
          <div className="space-y-6">
            {/* 콜라주 미리보기 */}
            <div className="flex justify-center">
              <CollageView items={selectedItems} layout="mannequin" size="md" />
            </div>

            {/* 아이템 변경 버튼 */}
            <Button variant="outline" className="w-full" onClick={() => setStep('items')}>
              아이템 변경 ({selectedItems.length}개 선택됨)
            </Button>

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

            {actionError && (
              <p
                data-testid="outfit-action-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {actionError}
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
                  저장하기
                </>
              )}
            </Button>
          </div>
        )}

        {/* 아이템 선택 */}
        {step === 'items' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold mb-1">옷을 선택하세요</h2>
              <p className="text-sm text-muted-foreground">코디에 포함할 옷을 골라주세요</p>
            </div>

            <OutfitBuilder
              items={allItems}
              initialSelection={selectedItems}
              onComplete={handleItemsSelected}
              onCancel={() => setStep('details')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
