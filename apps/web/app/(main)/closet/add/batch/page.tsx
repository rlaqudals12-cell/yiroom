'use client';

/**
 * 의류 일괄 등록 페이지 — 옷장 자동화 (Phase 3)
 *
 * 사진 여러 장 선택 → 장당 AI 자동 분류(이름·카테고리·색상·시즌·상황) →
 * 확인/수정 → 일괄 저장. 옷장 앱 공통 이탈 장벽인 "한 벌씩 등록 피로"를 해소.
 *
 * 저장되는 이미지는 원본 사진 그대로다 — 단건 등록도 동일하다(배경 제거 기능 없음,
 * 2026-08 수리 전에는 "일괄은 배경 제거 없이"라며 존재하지 않는 차이를 고지했다).
 */

import { useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  type ClothingClassificationResult,
} from '@/lib/inventory/imageProcessing';
import { prepareUploadBlob, uploadErrorMessage } from '@/lib/image/upload-downscale';
import { readCurationContext, withCurationContext, curationReturnHref } from '@/lib/closet';
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
  /** AI 자동 분류가 실패해 사용자 확인이 필요한 상태 (지어낸 분류를 채택하지 않았음) */
  classifyFailed?: boolean;
  errorMessage?: string;
  /**
   * 업로드까지는 성공한 스토리지 경로.
   * DB 등록만 실패한 경우 재시도에서 재업로드 없이 이 경로를 그대로 쓴다
   * (예전에는 경로를 잃어버려 재시도 자체가 불가능했고, 올라간 파일은 고아로 남았다).
   */
  uploadedPath?: string;
}

// 동시 처리 수 — 분류(Gemini)·저장 모두 3개씩 (rate limit·브라우저 부하 균형)
const CONCURRENCY = 3;

// 자동 분류 실패 시 적용하는 패치 — AI가 판정하지 못했으면 지어낸 분류를 채우지 않고
// 중립 기본값 + 실패 표식만 남긴다 (classification 미설정 → 저장 시 빈 metadata)
const CLASSIFY_FAILED_PATCH = {
  status: 'ready',
  name: '의류',
  category: 'top',
  classifyFailed: true,
} satisfies Partial<BatchItem>;

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
  const searchParams = useSearchParams();
  // 통합 분석 큐레이션에서 넘어온 맥락 — 등록을 마치면 그 세션의 코디 추천으로 돌아갈 수 있게 한다
  const curation = readCurationContext(searchParams);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [saving, setSaving] = useState(false);
  // 선택했으나 지원하지 않는 형식·손상 등으로 건너뛴 파일 안내
  // (조용히 버리면 "사진 골랐는데 아무 반응 없음"으로 오해되던 버그)
  const [intakeNotice, setIntakeNotice] = useState<string | null>(null);

  const updateItem = useCallback((id: string, patch: Partial<BatchItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  // 파일 선택 → 리사이즈 → AI 분류 (동시 3개)
  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      setIntakeNotice(null);

      const selectedCount = files.length;
      let rejectedFormat = 0;
      const accepted: Array<{ id: string; file: File }> = [];
      for (const file of Array.from(files)) {
        const check = validateImageFile(file);
        if (check.valid) accepted.push({ id: crypto.randomUUID(), file });
        else rejectedFormat += 1;
      }

      // 미리보기 즉시 생성 (디코딩 실패 파일은 건너뛰되 개수를 집계해 안내)
      const prepared: BatchItem[] = [];
      let failedDecode = 0;
      for (const { id, file } of accepted) {
        try {
          const resized = await resizeImage(file, 800, 800);
          const previewUrl = await blobToDataUrl(resized);
          prepared.push({ id, previewUrl, status: 'classifying', name: '', category: 'top' });
        } catch {
          failedDecode += 1;
        }
      }

      const skipped = rejectedFormat + failedDecode;
      if (prepared.length === 0) {
        // 전부 실패 — 조용히 끝내지 않고 이유를 명확히 표면화
        setIntakeNotice(
          `사진 ${selectedCount}장을 열지 못했어요. JPG·PNG·WebP 형식의 이미지인지 확인해주세요. ` +
            `(아이폰 HEIC 사진은 '가장 호환성 높게' 설정으로 촬영하거나 JPG로 변환해 올려주세요.)`
        );
        return;
      }
      if (skipped > 0) {
        setIntakeNotice(`${skipped}장은 지원하지 않는 형식이거나 열 수 없어 건너뛰었어요.`);
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
            // 폴백 응답(AI 미가용·파싱 실패)은 지어낸 값이므로 채택하지 않고
            // 아래 catch와 동일한 '정직 실패 경로'로 합류한다 — 사용자가 직접 확인한다
            if (classification.usedFallback) {
              updateItem(item.id, { ...CLASSIFY_FAILED_PATCH });
              return;
            }
            updateItem(item.id, {
              status: 'ready',
              classification,
              name: classification.suggestedName || '의류',
              category: classification.category || 'top',
            });
          } catch {
            updateItem(item.id, { ...CLASSIFY_FAILED_PATCH });
          }
        }),
        CONCURRENCY
      );
    },
    [updateItem]
  );

  // 일괄 저장: 장당 업로드 → API 등록
  // 대상에 'error'를 포함한다 — 저장에 실패한 항목을 사진 재선택 없이 다시 시도할 수 있어야 한다
  // (예전엔 'ready'만 대상이라 한 번 실패하면 그 항목은 영영 저장할 수 없었다)
  const handleSaveAll = async () => {
    const targets = items.filter((it) => it.status === 'ready' || it.status === 'error');
    if (targets.length === 0) return;
    setSaving(true);

    await runPool(
      targets.map((item) => async () => {
        updateItem(item.id, { status: 'saving', errorMessage: undefined });
        // 이미 올라간 사진은 다시 올리지 않는다(재업로드 = 중복 트래픽 + 새 고아 파일)
        let uploadedPath = item.uploadedPath;
        try {
          if (!uploadedPath) {
            const formData = new FormData();
            // Vercel 본문 제한(4.5MB) 대응 — 전송 전 축소 (2026-07-11 실증 수리)
            formData.append('file', await prepareUploadBlob(item.previewUrl), 'image.png');
            formData.append('category', 'closet');
            // 항목 id를 그대로 쓴다 — 경로가 고정돼야 재시도·보상 삭제가 같은 파일을 가리킨다
            formData.append('itemId', item.id);
            formData.append('type', 'processed');

            const uploadRes = await fetch('/api/inventory/upload', {
              method: 'POST',
              body: formData,
            });
            if (!uploadRes.ok) throw new Error(uploadErrorMessage(uploadRes.status));
            // 공개 URL이 아니라 스토리지 경로를 저장한다 (비공개 버킷 — closet/add와 동일 계약)
            const { path } = await uploadRes.json();
            uploadedPath = path as string;
            // 업로드 성공 시점에 경로를 항목에 보존 (이후 DB 저장이 실패해도 살아남는다)
            updateItem(item.id, { uploadedPath });
          }
          const imageUrl = uploadedPath;

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
                // sub_category에는 한글 세부종류가 들어갈 수 있어(AI 자유 응답 포함)
                // 조립기(closetMatcher)가 쓸 영문 대분류를 별도 보존한다
                clothingCategory: item.category,
              },
            }),
          });
          if (!saveRes.ok) throw new Error('저장 실패');
          updateItem(item.id, { status: 'saved' });
        } catch (e) {
          updateItem(item.id, {
            status: 'error',
            // 업로드까지 성공했다면 경로를 남겨 재시도가 재업로드를 건너뛰게 한다
            uploadedPath,
            errorMessage: e instanceof Error ? e.message : '저장 실패',
          });
        }
      }),
      CONCURRENCY
    );

    setSaving(false);
  };

  /**
   * 목록에서 항목 제외 — 등록을 최종 포기하는 지점이다.
   * 업로드만 성공하고 DB 등록이 안 된 사진은 아무 행에서도 참조하지 않는 고아가 되므로
   * 스토리지에서 지우려 시도한다(실패해도 사용자 흐름은 막지 않는다).
   */
  const handleRemoveItem = useCallback((item: BatchItem) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));

    if (!item.uploadedPath) return;
    const params = new URLSearchParams({
      category: 'closet',
      itemId: item.id,
      type: 'processed',
    });
    void fetch(`/api/inventory/upload?${params.toString()}`, { method: 'DELETE' }).catch(() => {
      // 보상 삭제 실패는 사용자 흐름을 막지 않는다. 고아 스위퍼는 아직 없으므로
      // 이 경우 파일은 버킷에 남는다(계정 삭제 시 purgeUserStorage가 함께 지운다).
    });
  }, []);

  const readyCount = items.filter((i) => i.status === 'ready').length;
  const errorCount = items.filter((i) => i.status === 'error').length;
  const savedCount = items.filter((i) => i.status === 'saved').length;
  const classifyingCount = items.filter((i) => i.status === 'classifying').length;
  const allDone = items.length > 0 && items.every((i) => i.status === 'saved');
  // 저장 버튼 대상 = 아직 저장 안 된 항목(실패분 포함 — 재시도 경로)
  const pendingCount = readyCount + errorCount;

  // 저장 버튼 라벨 — 분류 대기 / 재시도 전용 / 일반 저장
  const saveButtonLabel = ((): string => {
    if (classifyingCount > 0) return `AI 분류 중 (${classifyingCount}장 남음)`;
    if (readyCount === 0 && errorCount > 0) return `${errorCount}벌 다시 시도`;
    return `${pendingCount}벌 한 번에 저장`;
  })();

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
          <span className="text-[11px]" data-testid="save-mode-notice">
            원본 사진 그대로 저장돼요
          </span>
        </button>

        {/* 촬영 가이드 — 전신 착장샷은 여러 벌이 한 장에 담겨 한 벌로 잘못 등록된다 */}
        <p className="text-center text-xs text-muted-foreground" data-testid="shot-guide">
          옷 한 벌만 나오게 찍어주세요 — 전신 착장샷은 한 벌로 인식돼요
        </p>

        {/* 한 벌씩 등록 경로 — 기본은 일괄이지만 단건 경로를 막지 않는다 */}
        <button
          onClick={() => router.push(withCurationContext('/closet/add', curation))}
          data-testid="batch-single-add-link"
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
        >
          한 벌씩 등록할래요
        </button>

        {/* 파일 인테이크 안내 (전부/일부 건너뜀) */}
        {intakeNotice && (
          <div
            data-testid="batch-intake-notice"
            role="status"
            className="flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{intakeNotice}</span>
          </div>
        )}

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
                      onClick={() => handleRemoveItem(item)}
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
                  {/* 자동 분류 실패 — 지어낸 분류를 채우지 않았음을 알리고 확인을 요청한다 */}
                  {item.classifyFailed && (
                    <p
                      data-testid="batch-classify-failed"
                      className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400"
                    >
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      자동 분류 실패 — 직접 확인해주세요
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
        <div className="fixed bottom-0 inset-x-0 z-20 bg-background/95 backdrop-blur-sm border-t px-4 py-3 space-y-2">
          {allDone ? (
            <Button className="w-full" onClick={() => router.push('/closet')}>
              옷장 보러 가기 ({savedCount}벌 등록 완료)
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={handleSaveAll}
              disabled={saving || pendingCount === 0 || classifyingCount > 0}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중 ({savedCount}/{items.length})
                </>
              ) : (
                saveButtonLabel
              )}
            </Button>
          )}

          {/* 큐레이션에서 왔고 한 벌이라도 등록했다면, 보던 코디 추천으로 돌아가는 길을 연다.
              강제로 튕기지 않는 이유 = 남은 사진을 이어서 등록하는 흐름을 끊지 않기 위해 */}
          {curation.isFromIntegrated && savedCount > 0 && (
            <Button
              variant={allDone ? 'outline' : 'default'}
              className="w-full"
              data-testid="batch-curation-return-cta"
              onClick={() => router.push(curationReturnHref(curation))}
            >
              등록한 옷으로 코디 다시 보기
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
