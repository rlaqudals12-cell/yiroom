'use client';

/**
 * 내 사진으로 공유 (AI 자연 보정) — 표현 레이어 UI (ADR-113)
 *
 * 사진 업로드 → 자연 보정 → 미리보기(AI 보정됨 라벨 상시) → 저장/공유.
 * 기존 익명 일러스트 공유와는 별개의 선택지로 제공한다.
 * 보정본에는 "AI 보정됨" 배지 + "Google SynthID 워터마크 포함" 문구를 상시 노출한다.
 */

import { useRef, useState } from 'react';
import { Sparkles, Loader2, Download, Share2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';

interface BeautifyResponse {
  imageBase64: string;
  aiEdited?: true;
  model?: string;
}

// data URL → Blob (다운로드/공유용)
function dataUrlToBlob(dataUrl: string): Blob | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const [, mimeType, b64] = match;
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mimeType });
}

export function BeautifyShareButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<BeautifyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPreview(null);
    setResult(null);
    setLoading(false);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setResult(null);
      setPreview(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  const handleBeautify = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      const res = await fetch('/api/visual/beautify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: preview }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? '보정에 실패했어요. 잠시 후 다시 시도해 주세요.');
        return;
      }
      const data = (await res.json()) as BeautifyResponse;
      setResult(data);
      if (!data.aiEdited) {
        // 보정 실패 시 원본 반환 — 정직하게 안내
        toast.info('보정에 실패해 원본을 그대로 보여드려요.');
      }
    } catch {
      toast.error('네트워크 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  };

  const shownImage = result?.imageBase64 ?? preview;
  const isBeautified = result?.aiEdited === true;

  const handleDownload = () => {
    if (!shownImage) return;
    const blob = dataUrlToBlob(shownImage);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yiroom-share.jpg';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!shownImage) return;
    const blob = dataUrlToBlob(shownImage);
    if (!blob) return;
    const file = new File([blob], 'yiroom-share.jpg', { type: blob.type });
    if (
      typeof navigator !== 'undefined' &&
      navigator.share &&
      navigator.canShare?.({ files: [file] })
    ) {
      try {
        await navigator.share({ files: [file], title: '이룸' });
      } catch {
        /* 사용자 취소 — 무시 */
      }
    } else {
      handleDownload();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`shadow-lg bg-card whitespace-nowrap ${className ?? ''}`}
          data-testid="beautify-share-button"
        >
          <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />내 사진으로 공유
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md" data-testid="beautify-share-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" aria-hidden="true" />내 사진으로 공유 (AI 자연 보정)
          </DialogTitle>
          <DialogDescription>
            피부 결과 조명만 자연스럽게 정돈해요. 이목구비나 체형은 바꾸지 않아요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* 미리보기 */}
          {shownImage ? (
            <div className="relative rounded-xl overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shownImage}
                alt="공유 미리보기"
                className="w-full object-contain max-h-[360px]"
              />
              {isBeautified && (
                <span
                  data-testid="ai-edited-label"
                  className="absolute top-2 left-2 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white"
                >
                  AI 보정됨
                </span>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 py-12 text-sm text-muted-foreground hover:bg-muted/40"
            >
              <Upload className="h-6 w-6" aria-hidden="true" />
              사진 선택하기
            </button>
          )}

          {/* SynthID/AI 표시 문구 — 보정본에 상시 */}
          {isBeautified && (
            <p className="text-[11px] text-muted-foreground">
              AI로 자연스럽게 보정된 이미지예요 · Google SynthID 워터마크 포함
            </p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          {/* 액션 */}
          <div className="flex gap-2">
            {preview && !result && (
              <Button className="flex-1" onClick={handleBeautify} disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" aria-hidden="true" />
                )}
                자연 보정하기
              </Button>
            )}
            {result && (
              <>
                <Button variant="outline" className="flex-1" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" aria-hidden="true" />
                  공유
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                  저장
                </Button>
              </>
            )}
            {shownImage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                aria-label="다른 사진 선택"
              >
                다시 선택
              </Button>
            )}
          </div>
        </div>

        <VisuallyHidden>
          <span>{loading ? '보정 중' : '대기'}</span>
        </VisuallyHidden>
      </DialogContent>
    </Dialog>
  );
}

export default BeautifyShareButton;
