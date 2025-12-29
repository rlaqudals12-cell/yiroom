'use client';

/**
 * 의류 등록 페이지
 * - 이미지 업로드
 * - AI 자동 분류
 * - 상세 정보 입력
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { ItemUploader, type UploadResult } from '@/components/inventory';
import {
  ClothingCategory,
  CLOTHING_SUB_CATEGORIES,
  Season,
  SEASON_LABELS,
  Occasion,
  OCCASION_LABELS,
  Pattern,
  PATTERN_LABELS,
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

type Step = 'upload' | 'details' | 'confirm';

export default function AddClothingPage() {
  const router = useRouter();
  const supabase = useClerkSupabaseClient();

  // 단계
  const [step, setStep] = useState<Step>('upload');
  const [saving, setSaving] = useState(false);

  // 업로드 결과
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

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

  // 업로드 완료 핸들러
  const handleUploadComplete = (result: UploadResult) => {
    setUploadResult(result);

    // AI 분류 결과 자동 적용
    if (result.classification) {
      const { classification } = result;
      setName(classification.suggestedName || '');
      setCategory(classification.category || 'top');
      setSubCategory(classification.subCategory || '');
      setColors(classification.colors || []);
      if (classification.pattern) {
        setPattern(classification.pattern);
      }
    }

    setStep('details');
  };

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
    if (!supabase || !uploadResult) return;

    setSaving(true);
    try {
      // 먼저 이미지를 Storage에 업로드
      const itemId = crypto.randomUUID();

      // 이미지 업로드
      const formData = new FormData();

      // base64 to blob
      const base64 = uploadResult.processedUrl.split(',')[1];
      const binary = atob(base64);
      const array = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        array[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([array], { type: 'image/png' });

      formData.append('file', blob, 'image.png');
      formData.append('category', 'closet');
      formData.append('itemId', itemId);
      formData.append('type', 'processed');

      const uploadResponse = await fetch('/api/inventory/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Image upload failed');
      }

      const { url: imageUrl } = await uploadResponse.json();

      // DB에 아이템 저장
      const { error } = await supabase.from('user_inventory').insert({
        id: itemId,
        category: 'closet',
        sub_category: subCategory || category,
        name: name || '이름 없음',
        image_url: imageUrl,
        brand: brand || null,
        tags,
        metadata: {
          color: colors,
          season: seasons,
          occasion: occasions,
          pattern,
        },
      });

      if (error) {
        console.error('[AddClothing] Save error:', error);
        throw error;
      }

      router.push('/closet');
    } catch (error) {
      console.error('[AddClothing] Error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="add-clothing-page" className="min-h-screen pb-20">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (step === 'upload') {
                router.back();
              } else {
                setStep('upload');
              }
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">옷 추가하기</h1>
        </div>

        {/* 단계 표시 */}
        <div className="flex px-4 pb-3 gap-2">
          {(['upload', 'details'] as const).map((s, _i) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full ${
                step === s || (step === 'details' && s === 'upload')
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Step 1: 업로드 */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold mb-1">옷 사진을 올려주세요</h2>
              <p className="text-sm text-muted-foreground">
                AI가 자동으로 분류해드려요
              </p>
            </div>

            <ItemUploader
              onUploadComplete={handleUploadComplete}
              autoRemoveBackground={true}
              autoClassify={true}
            />
          </div>
        )}

        {/* Step 2: 상세 정보 */}
        {step === 'details' && uploadResult && (
          <div className="space-y-6">
            {/* 미리보기 이미지 */}
            <div className="flex justify-center">
              <div className="w-40 h-40 rounded-xl overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadResult.processedUrl}
                  alt="Preview"
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
                <Label>색상 (AI 분석)</Label>
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
                {(Object.keys(OCCASION_LABELS) as Occasion[]).map(
                  (occasion) => (
                    <Button
                      key={occasion}
                      type="button"
                      variant={
                        occasions.includes(occasion) ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => toggleOccasion(occasion)}
                    >
                      {OCCASION_LABELS[occasion]}
                    </Button>
                  )
                )}
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
        )}
      </div>
    </div>
  );
}
