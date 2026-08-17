'use client';

/**
 * 의류 등록 페이지
 * - 이미지 업로드
 * - AI 자동 분류
 * - 상세 정보 입력
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Check, Loader2 } from 'lucide-react';
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
import { prepareUploadBlob, uploadErrorMessage } from '@/lib/image/upload-downscale';
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

  // 단계
  const [step, setStep] = useState<Step>('upload');
  const [saving, setSaving] = useState(false);

  // 업로드 결과
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  // AI 자동 분류 실패 — 업로드 단계가 끝나도 상세 폼에서 계속 고지해야 하므로 부모가 들고 있는다
  // (예전엔 업로더 내부 배지라 details로 넘어가는 순간 언마운트돼 안내가 영구 미노출이었다)
  const [classifyFailed, setClassifyFailed] = useState(false);

  // 폼 데이터
  const [name, setName] = useState('');
  // 카테고리는 미선택('')으로 시작한다 — 무고지 기본값('상의')은 사용자가 확인하지 않은 분류를
  // 그대로 저장시킨다(특히 자동 분류 실패 시). 반드시 직접 고르게 한다.
  const [category, setCategory] = useState<ClothingCategory | ''>('');
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
    setClassifyFailed(!!result.classifyFailed);

    // AI 분류 결과 자동 적용 (폴백은 업로더가 걸러내므로 여기 오는 값은 실제 판정)
    if (result.classification) {
      const { classification } = result;
      setName(classification.suggestedName || '');
      setCategory(classification.category || '');
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
      prev.includes(season) ? prev.filter((s) => s !== season) : [...prev, season]
    );
  };

  // 상황 토글
  const toggleOccasion = (occasion: Occasion) => {
    setOccasions((prev) =>
      prev.includes(occasion) ? prev.filter((o) => o !== occasion) : [...prev, occasion]
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
    // 카테고리 미선택 저장 차단 — 조립기(closetMatcher)가 쓰는 대분류가 비면
    // 등록은 되는데 코디에서 영영 안 잡힌다
    if (!uploadResult || !category) return;

    setSaving(true);
    try {
      // 먼저 이미지를 Storage에 업로드
      const itemId = crypto.randomUUID();

      // 이미지 업로드 — 원본 해상도 PNG는 Vercel 본문 제한(4.5MB)에 걸려
      // 라우트 도달 전 413이 나므로 전송 전에 축소한다(2026-07-11 실증 수리)
      const formData = new FormData();
      const blob = await prepareUploadBlob(uploadResult.processedUrl);

      formData.append('file', blob, 'image.png');
      formData.append('category', 'closet');
      formData.append('itemId', itemId);
      formData.append('type', 'processed');

      const uploadResponse = await fetch('/api/inventory/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(uploadErrorMessage(uploadResponse.status));
      }

      // 저장하는 값은 **스토리지 경로**다 (2026-08-16 보안 수리).
      // 예전엔 영구 공개 URL을 그대로 DB에 넣었는데, 그러면 URL만 알면 로그인 없이
      // 개인 사진이 열리고 경로 첫 세그먼트인 Clerk userId까지 노출된다.
      // 렌더 시점에 resolveInventoryImageUrl()이 서명 URL로 바꿔준다.
      const { path: imageUrl } = await uploadResponse.json();

      // DB에 아이템 저장 — API 경유 (직접 insert는 clerk_user_id NOT NULL/RLS에
      // 걸려 항상 실패하던 잠복 버그, 2026-07-08 수정)
      const saveResponse = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'closet',
          subCategory: subCategory || category,
          name: name || '이름 없음',
          imageUrl,
          brand: brand || null,
          tags,
          metadata: {
            color: colors,
            season: seasons,
            occasion: occasions,
            pattern,
            // sub_category에는 한글 세부종류가 들어갈 수 있어(AI 자유 응답 포함)
            // 조립기(closetMatcher)가 쓸 영문 대분류를 별도 보존한다
            clothingCategory: category,
          },
        }),
      });

      if (!saveResponse.ok) {
        const err = await saveResponse.json().catch(() => ({}));
        console.error('[AddClothing] Save error:', err);
        throw new Error(err.error ?? 'save failed');
      }

      router.push('/closet');
    } catch (error) {
      console.error('[AddClothing] Error:', error);
      // 원인별 정직한 안내(413 용량 초과 등) — 일반 문구로 뭉개지 않는다
      alert(
        error instanceof Error && error.message ? error.message : '저장 중 오류가 발생했습니다.'
      );
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
                step === s || (step === 'details' && s === 'upload') ? 'bg-primary' : 'bg-muted'
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
              <p className="text-sm text-muted-foreground">AI가 자동으로 분류해드려요</p>
              {/* 촬영 가이드 — 전신 착장샷은 여러 벌이 한 장에 담겨 한 벌로 잘못 등록된다 */}
              <p className="mt-1.5 text-xs text-muted-foreground" data-testid="shot-guide">
                옷 한 벌만 나오게 찍어주세요 — 전신 착장샷은 한 벌로 인식돼요
              </p>
            </div>

            <ItemUploader onUploadComplete={handleUploadComplete} autoClassify={true} />

            {/* 저장 방식 고지 — 두 등록 경로(단건·일괄)가 같은 말을 하게 통일 */}
            <p className="text-center text-xs text-muted-foreground" data-testid="save-mode-notice">
              원본 사진 그대로 저장돼요
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/closet/add/batch')}
            >
              여러 벌 한 번에 등록하기
            </Button>
          </div>
        )}

        {/* Step 2: 상세 정보 */}
        {step === 'details' && uploadResult && (
          <div className="space-y-6">
            {/* 자동 분류 실패 상시 배너 — 업로드 배지는 단계 전환과 함께 사라지므로
                지어낸 분류를 채우지 않았다는 사실을 폼 상단에서 계속 알린다 */}
            {classifyFailed && (
              <div
                data-testid="classify-failed-banner"
                role="status"
                className="flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  자동 분류에 실패했어요 — 이름과 카테고리를 직접 확인해주세요. 추측한 값을 대신
                  채우지 않았어요.
                </span>
              </div>
            )}

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
                <SelectTrigger data-testid="category-select">
                  <SelectValue placeholder="카테고리를 선택해주세요" />
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

            {/* 서브카테고리 — 카테고리를 골라야 목록이 정해진다 */}
            <div className="space-y-2">
              <Label>종류</Label>
              <Select value={subCategory} onValueChange={setSubCategory} disabled={!category}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={category ? '종류 선택' : '카테고리를 먼저 골라주세요'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(category ? CLOTHING_SUB_CATEGORIES[category] : []).map((sub) => (
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
              <Select value={pattern} onValueChange={(v) => setPattern(v as Pattern)}>
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

            {/* 저장 버튼 — 카테고리는 사용자가 직접 고른 값만 저장한다(기본값 자동 통과 금지) */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleSave}
              disabled={saving || !name || !category}
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
