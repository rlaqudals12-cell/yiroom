'use client';

/**
 * 의류 일괄 등록 페이지 — 옷장 자동화 (Phase 3)
 *
 * 사진 여러 장 선택 → 장당 AI 자동 분류(이름·카테고리·색상·시즌·상황) →
 * 확인/수정 → 일괄 저장. 옷장 앱 공통 이탈 장벽인 "한 벌씩 등록 피로"를 해소.
 *
 * 배경 제거는 일괄에서 생략(장당 수 초의 클라이언트 모델 — N장이면 체감 불가
 * 수준으로 느려짐). 원본 사진 그대로 저장하고, 개별 수정에서 다듬을 수 있다.
 */

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ImagePlus, Loader2, Check, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  resizeImage,
  validateImageFile,
  blobToDataUrl,
  dataUrlToBlob,
  type ClothingClassificationResult,
} from '@/lib/inventory/imageProcessing';
import type { ClothingCategory } from '@/types/inventory';

const CATEGORY_LABELS: Record<ClothingCategory, string> = {
  outer: '아우터',
  top: '상의',
  bottom: '하의',
  dress: '원피스',
  shoes: '신발',
  bag: '가방',
  accessory: '액세서리',
};

type ItemStatus = 'classifying' | 'ready' | 'saving' | 'saved' | 'error';

interface BatchItem {
  id: string;
  previewUrl: string; // 리사이즈된 dataURL (분류·업로드 공용)
  status: ItemStatus;
  name: string;
  category: ClothingCategory;
  classification?: ClothingClassificationResult;
  errorMessage?: string;
}

// 동시 처리 수 — 분류(Gemini)·저장 모두 3개씩 (rate limit·브라우저 부하 균형)
const CONCURRENCY = 3;

async function runPool<T>(tasks: Array<() => Promise<T>>, limit: number): Promise<void> {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (next < tasks.length) {
      const i = next++;
      await tasks[i]();
    }
  });
  await Promise.all(workers);
}

export default function BatchAddClothingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [saving, setSaving] = useState(false);

  const updateItem = useCallback((id: string, patch: Partial<BatchItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  // 파일 선택 → 리사이즈 → AI 분류 (동시 3개)
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;

      const accepted: Array<{ id: string; file: File }> = [];
      for (const file of Array.from(files)) {
        const check = validateImageFile(file);
        if (check.valid) accepted.push({ id: crypto.randomUUID(), file });
      }
      if (accepted.length === 0) return;

      // 미리보기 즉시 생성
      const prepared: BatchItem[] = [];
      for (const { id, file } of accepted) {
        try {
          const resized = await resizeImage(file, 800, 800);
          const previewUrl = await blobToDataUrl(resized);
          prepared.push({ id, previewUrl, status: 'classifying', name: '', category: 'top' });
        } catch {
          /* 손상 파일 — 건너뜀 */
        }
      }
      setItems((prev) => [...prev, ...prepared]);

      // 장당 분류 (실패해도 수동 입력으로 저장 가능하게 ready로 전환)
      await runPool(
        prepared.map((item) => async () => {
          try {
            const res = await fetch('/api/inventory/classify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageBase64: item.previewUrl }),
            });
            if (!res.ok) throw new Error(`classify ${res.status}`);
            const classification = (await res.json()) as ClothingClassificationResult;
            updateItem(item.id, {
              status: 'ready',
              classification,
              name: classification.suggestedName || '의류',
              category: classification.category || 'top',
            });
          } catch {
            updateItem(item.id, { status: 'ready', name: '의류', category: 'top' });
          }
        }),
        CONCURRENCY
      );
    },
    [updateItem]
  );

  // 일괄 저장: 장당 업로드 → API 등록
  const handleSaveAll = async () => {
    const targets = items.filter((it) => it.status === 'ready');
    if (targets.length === 0) return;
    setSaving(true);

    await runPool(
      targets.map((item) => async () => {
        updateItem(item.id, { status: 'saving' });
        try {
          const itemId = crypto.randomUUID();
          const formData = new FormData();
          formData.append('file', dataUrlToBlob(item.previewUrl), 'image.png');
          formData.append('category', 'closet');
          formData.append('itemId', itemId);
          formData.append('type', 'processed');

          const uploadRes = await fetch('/api/inventory/upload', {
            method: 'POST',
            body: formData,
          });
          if (!uploadRes.ok) throw new Error('이미지 업로드 실패');
          const { url: imageUrl } = await uploadRes.json();

          const c = item.classification;
          const saveRes = await fetch('/api/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              category: 'closet',
              subCategory: c?.subCategory || item.category,
              name: item.name || '이름 없음',
              imageUrl,
              tags: [],
              metadata: {
                color: c?.colors ?? [],
                season: c?.seasons ?? [],
                occasion: c?.occasions ?? [],
                pattern: c?.pattern ?? 'solid',
              },
            }),
          });
          if (!saveRes.ok) throw new Error('저장 실패');
          updateItem(item.id, { status: 'saved' });
        } catch (e) {
          updateItem(item.id, {
            status: 'error',
            errorMessage: e instanceof Error ? e.message : '저장 실패',
          });
        }
      }),
      CONCURRENCY
    );

    setSaving(false);
  };

  const readyCount = items.filter((i) => i.status === 'ready').length;
  const savedCount = items.filter((i) => i.status === 'saved').length;
  const classifyingCount = items.filter((i) => i.status === 'classifying').length;
  const allDone = items.length > 0 && items.every((i) => i.status === 'saved');

  return (
    <div data-testid="batch-add-clothing-page" className="min-h-screen pb-28">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">옷 한 번에 등록하기</h1>
            <p className="text-xs text-muted-foreground">
              사진을 여러 장 올리면 AI가 한 벌씩 자동 분류해요
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 파일 선택 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed border-muted-foreground/30 py-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <ImagePlus className="w-8 h-8" />
          <span className="text-sm font-medium">
            {items.length === 0 ? '사진 여러 장 선택' : '사진 더 추가'}
          </span>
          <span className="text-[11px]">일괄 등록은 배경 제거 없이 원본으로 저장돼요</span>
        </button>

        {/* 아이템 그리드 */}
        {items.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border bg-card overflow-hidden"
                data-testid="batch-item-card"
              >
                <div className="relative aspect-square bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.name || '의류'}
                    className="w-full h-full object-contain"
                  />
                  {/* 상태 오버레이 */}
                  {item.status === 'classifying' && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1 text-white">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-[11px]">AI 분류 중</span>
                    </div>
                  )}
                  {item.status === 'saving' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                    </div>
                  )}
                  {item.status === 'saved' && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {item.status === 'error' && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {(item.status === 'ready' || item.status === 'error') && (
                    <button
                      onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                      className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center"
                      aria-label="제외"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  )}
                </div>

                <div className="p-2 space-y-1.5">
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(item.id, { name: e.target.value })}
                    disabled={item.status !== 'ready' && item.status !== 'error'}
                    placeholder="이름"
                    className="h-8 text-xs"
                  />
                  <Select
                    value={item.category}
                    onValueChange={(v) => updateItem(item.id, { category: v as ClothingCategory })}
                    disabled={item.status !== 'ready' && item.status !== 'error'}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value} className="text-xs">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {item.classification && item.classification.colors.length > 0 && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      {item.classification.colors.join(' · ')}
                      {item.classification.seasons?.length
                        ? ` · ${item.classification.seasons.length}계절`
                        : ''}
                    </p>
                  )}
                  {item.status === 'error' && (
                    <p className="text-[10px] text-red-500">{item.errorMessage}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 하단 저장 바 */}
      {items.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-20 bg-background/95 backdrop-blur-sm border-t px-4 py-3">
          {allDone ? (
            <Button className="w-full" onClick={() => router.push('/closet')}>
              옷장 보러 가기 ({savedCount}벌 등록 완료)
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={handleSaveAll}
              disabled={saving || readyCount === 0 || classifyingCount > 0}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중 ({savedCount}/{items.length})
                </>
              ) : classifyingCount > 0 ? (
                `AI 분류 중 (${classifyingCount}장 남음)`
              ) : (
                `${readyCount}벌 한 번에 저장`
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
