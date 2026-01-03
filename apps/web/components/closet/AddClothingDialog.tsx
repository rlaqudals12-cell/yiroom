'use client';

/**
 * 옷 추가 다이얼로그
 * - 이미지 업로드 (드래그 앤 드롭)
 * - AI 자동 분류
 * - 상세 정보 입력
 */

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Camera, X, Loader2, Wand2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ClothingCategory,
  CLOTHING_SUB_CATEGORIES,
  Season,
  SEASON_LABELS,
  Occasion,
  OCCASION_LABELS,
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

type ProcessingStep = 'idle' | 'uploading' | 'processing' | 'classifying' | 'done' | 'error';

const STEP_LABELS: Record<ProcessingStep, string> = {
  idle: '이미지를 업로드하세요',
  uploading: '업로드 중...',
  processing: '이미지 처리 중...',
  classifying: 'AI 분석 중...',
  done: '완료!',
  error: '오류가 발생했습니다',
};

const STEP_PROGRESS: Record<ProcessingStep, number> = {
  idle: 0,
  uploading: 20,
  processing: 50,
  classifying: 80,
  done: 100,
  error: 0,
};

interface AddClothingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ClothingFormData) => Promise<void>;
}

export interface ClothingFormData {
  name: string;
  category: ClothingCategory;
  subCategory: string;
  brand: string;
  imageBase64: string;
  colors: string[];
  seasons: Season[];
  occasions: Occasion[];
  tags: string[];
}

export function AddClothingDialog({ open, onOpenChange, onSave }: AddClothingDialogProps) {
  // 처리 상태
  const [step, setStep] = useState<ProcessingStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 이미지
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 폼 데이터
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ClothingCategory>('top');
  const [subCategory, setSubCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // 초기화
  const resetForm = useCallback(() => {
    setStep('idle');
    setError(null);
    setPreviewUrl(null);
    setImageBase64('');
    setName('');
    setCategory('top');
    setSubCategory('');
    setBrand('');
    setColors([]);
    setSeasons([]);
    setOccasions([]);
    setTags([]);
    setTagInput('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  // 다이얼로그 닫기
  const handleClose = useCallback(() => {
    resetForm();
    onOpenChange(false);
  }, [resetForm, onOpenChange]);

  // 파일 처리
  const processFile = useCallback(async (file: File) => {
    setError(null);

    // 유효성 검사
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다');
      setStep('error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('파일 크기는 10MB 이하여야 합니다');
      setStep('error');
      return;
    }

    try {
      setStep('uploading');

      // FileReader로 base64 변환
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      setPreviewUrl(base64);
      setImageBase64(base64);
      setStep('processing');

      // AI 분류 호출
      setStep('classifying');
      try {
        const response = await fetch('/api/inventory/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64 }),
        });

        if (response.ok) {
          const classification = await response.json();
          // AI 결과 자동 적용
          if (classification.suggestedName) setName(classification.suggestedName);
          if (classification.category) setCategory(classification.category);
          if (classification.subCategory) setSubCategory(classification.subCategory);
          if (classification.colors) setColors(classification.colors);
        }
      } catch (classifyError) {
        console.warn('[AddClothingDialog] Classification failed:', classifyError);
      }

      setStep('done');
    } catch (err) {
      console.error('[AddClothingDialog] Processing error:', err);
      setError('이미지 처리 중 오류가 발생했습니다');
      setStep('error');
    }
  }, []);

  // 파일 선택
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  // 드래그 앤 드롭
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

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

  // 저장
  const handleSave = async () => {
    if (!imageBase64 || !name) return;

    setSaving(true);
    try {
      await onSave({
        name,
        category,
        subCategory: subCategory || category,
        brand,
        imageBase64,
        colors,
        seasons,
        occasions,
        tags,
      });
      handleClose();
    } catch (err) {
      console.error('[AddClothingDialog] Save error:', err);
      setError('저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  const isProcessing = ['uploading', 'processing', 'classifying'].includes(step);
  const showForm = step === 'done' && previewUrl;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>옷 추가하기</DialogTitle>
          <DialogDescription>사진을 업로드하면 AI가 자동으로 분류해드려요</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 업로드 영역 */}
          {!showForm && (
            <div
              onClick={() => !isProcessing && inputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                'relative flex flex-col items-center justify-center',
                'min-h-[200px] rounded-xl border-2 border-dashed transition-colors',
                'cursor-pointer hover:bg-muted/50',
                isDragging && 'border-primary bg-primary/5',
                isProcessing && 'pointer-events-none',
                error && 'border-destructive'
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />

              {previewUrl ? (
                <div className="relative w-full aspect-square">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="object-contain rounded-lg"
                  />
                  {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                      <div className="text-center text-white">
                        <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                        <p className="text-sm">{STEP_LABELS[step]}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    이미지를 드래그하거나 클릭하여 업로드
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP (최대 10MB)</p>
                </>
              )}
            </div>
          )}

          {/* 진행 표시 */}
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={STEP_PROGRESS[step]} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">{STEP_LABELS[step]}</p>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <X className="w-4 h-4" />
              <p>{error}</p>
            </div>
          )}

          {/* 폼 */}
          {showForm && (
            <div className="space-y-4">
              {/* 미리보기 */}
              <div className="flex justify-center">
                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted">
                  <Image src={previewUrl} alt="Preview" fill className="object-contain" />
                  <div className="absolute top-1 right-1 flex items-center gap-0.5 px-1.5 py-0.5 bg-green-500 text-white text-[10px] rounded-full">
                    <Wand2 className="w-2.5 h-2.5" />
                    <span>AI</span>
                  </div>
                </div>
              </div>

              {/* 이름 */}
              <div className="space-y-1.5">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 베이지 트렌치코트"
                />
              </div>

              {/* 카테고리 */}
              <div className="space-y-1.5">
                <Label>카테고리</Label>
                <Select
                  value={category}
                  onValueChange={(v) => {
                    setCategory(v as ClothingCategory);
                    setSubCategory('');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
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
              <div className="space-y-1.5">
                <Label>종류</Label>
                <Select value={subCategory} onValueChange={setSubCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="선택" />
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
              <div className="space-y-1.5">
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
                <div className="space-y-1.5">
                  <Label>색상 (AI)</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {colors.map((color, idx) => (
                      <Badge key={idx} variant="secondary">
                        {color}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 시즌 */}
              <div className="space-y-1.5">
                <Label>시즌</Label>
                <div className="flex flex-wrap gap-1.5">
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
              <div className="space-y-1.5">
                <Label>상황</Label>
                <div className="flex flex-wrap gap-1.5">
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

              {/* 태그 */}
              <div className="space-y-1.5">
                <Label>태그</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="태그 입력"
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
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                      >
                        #{tag} x
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* 저장 버튼 */}
              <Button className="w-full" onClick={handleSave} disabled={saving || !name}>
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
      </DialogContent>
    </Dialog>
  );
}
