'use client';

/**
 * 의류 수정 페이지
 */

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Check, Loader2, Trash2 } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ClothingCategory,
  CLOTHING_SUB_CATEGORIES,
  Season,
  SEASON_LABELS,
  Occasion,
  OCCASION_LABELS,
  Pattern,
  PATTERN_LABELS,
  ClothingMetadata,
  InventoryItemDB,
} from '@/types/inventory';

const CATEGORY_LABELS: Record<ClothingCategory, string> = {
  outer: '아우터',
  top: '상의',
  bottom: '하의',
  dress: '원피스',
  shoes: '신발',
  bag: '가방',
  accessory: '액세서리',
};

export default function EditClothingPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.id as string;
  const supabase = useClerkSupabaseClient();

  // 상태
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 원본 데이터
  const [imageUrl, setImageUrl] = useState('');

  // 폼 데이터
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClothingCategory>('top');
  const [subCategory, setSubCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [pattern, setPattern] = useState<Pattern>('solid');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // 데이터 로드
  useEffect(() => {
    async function loadItem() {
      if (!supabase || !itemId) return;

      const { data, error } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error || !data) {
        console.error('[EditClothing] Load error:', error);
        router.push('/closet');
        return;
      }

      const item = data as InventoryItemDB;
      const metadata = item.metadata as Partial<ClothingMetadata>;

      setImageUrl(item.image_url);
      setName(item.name);
      setCategory((item.sub_category as ClothingCategory) || 'top');
      setSubCategory(item.sub_category || '');
      setBrand(item.brand || '');
      setColors(metadata.color || []);
      setSeasons(metadata.season || []);
      setOccasions(metadata.occasion || []);
      setPattern(metadata.pattern || 'solid');
      setTags(item.tags || []);

      setLoading(false);
    }

    loadItem();
  }, [supabase, itemId, router]);

  // 시즌 토글
  const toggleSeason = (season: Season) => {
    setSeasons((prev) =>
      prev.includes(season)
        ? prev.filter((s) => s !== season)
        : [...prev, season]
    );
  };

  // 상황 토글
  const toggleOccasion = (occasion: Occasion) => {
    setOccasions((prev) =>
      prev.includes(occasion)
        ? prev.filter((o) => o !== occasion)
        : [...prev, occasion]
    );
  };

  // 태그 추가
  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
      setTagInput('');
    }
  };

  // 태그 삭제
  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  // 저장
  const handleSave = async () => {
    if (!supabase) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_inventory')
        .update({
          name: name || '이름 없음',
          sub_category: subCategory || category,
          brand: brand || null,
          tags,
          metadata: {
            color: colors,
            season: seasons,
            occasion: occasions,
            pattern,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) {
        console.error('[EditClothing] Save error:', error);
        throw error;
      }

      router.push('/closet');
    } catch (error) {
      console.error('[EditClothing] Error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (!supabase) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('user_inventory')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('[EditClothing] Delete error:', error);
        throw error;
      }

      router.push('/closet');
    } catch (error) {
      console.error('[EditClothing] Error:', error);
      alert('삭제 중 오류가 발생했습니다.');
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
    <div data-testid="edit-clothing-page" className="min-h-screen pb-20">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">옷 수정</h1>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive">
                <Trash2 className="w-5 h-5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>아이템 삭제</AlertDialogTitle>
                <AlertDialogDescription>
                  이 옷을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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

      <div className="px-4 py-4 space-y-6">
        {/* 이미지 미리보기 */}
        <div className="flex justify-center">
          <div className="w-40 h-40 rounded-xl overflow-hidden bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* 이름 */}
        <div className="space-y-2">
          <Label htmlFor="name">이름</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 베이지 트렌치코트"
          />
        </div>

        {/* 카테고리 */}
        <div className="space-y-2">
          <Label>카테고리</Label>
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v as ClothingCategory);
              setSubCategory('');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 서브카테고리 */}
        <div className="space-y-2">
          <Label>종류</Label>
          <Select value={subCategory} onValueChange={setSubCategory}>
            <SelectTrigger>
              <SelectValue placeholder="종류 선택" />
            </SelectTrigger>
            <SelectContent>
              {CLOTHING_SUB_CATEGORIES[category].map((sub) => (
                <SelectItem key={sub} value={sub}>
                  {sub}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 브랜드 */}
        <div className="space-y-2">
          <Label htmlFor="brand">브랜드 (선택)</Label>
          <Input
            id="brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="예: ZARA"
          />
        </div>

        {/* 색상 */}
        {colors.length > 0 && (
          <div className="space-y-2">
            <Label>색상</Label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color, idx) => (
                <Badge key={idx} variant="secondary">
                  {color}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 시즌 */}
        <div className="space-y-2">
          <Label>시즌</Label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SEASON_LABELS) as Season[]).map((season) => (
              <Button
                key={season}
                type="button"
                variant={seasons.includes(season) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleSeason(season)}
              >
                {SEASON_LABELS[season]}
              </Button>
            ))}
          </div>
        </div>

        {/* 상황 */}
        <div className="space-y-2">
          <Label>상황</Label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(OCCASION_LABELS) as Occasion[]).map((occasion) => (
              <Button
                key={occasion}
                type="button"
                variant={occasions.includes(occasion) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleOccasion(occasion)}
              >
                {OCCASION_LABELS[occasion]}
              </Button>
            ))}
          </div>
        </div>

        {/* 패턴 */}
        <div className="space-y-2">
          <Label>패턴</Label>
          <Select
            value={pattern}
            onValueChange={(v) => setPattern(v as Pattern)}
          >
            <SelectTrigger>
              <SelectValue placeholder="패턴 선택" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PATTERN_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 태그 */}
        <div className="space-y-2">
          <Label>태그</Label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="태그 입력 후 추가"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={addTag}>
              추가
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => removeTag(tag)}
                >
                  #{tag} ×
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* 저장 버튼 */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleSave}
          disabled={saving || !name}
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
    </div>
  );
}
