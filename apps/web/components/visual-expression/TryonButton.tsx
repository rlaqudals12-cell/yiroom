'use client';

/**
 * 가상 착장 "입어보기" 버튼 — 표현 레이어 UI (ADR-113)
 *
 * FASHN_API_KEY가 없으면(`/api/visual/tryon` GET → available:false) 아무것도
 * 렌더하지 않는다(유령 UI 방지 · 준비중 배너 금지).
 * 결과 이미지에는 "AI 생성 이미지" 라벨을 상시 노출한다.
 */

import { useEffect, useRef, useState } from 'react';
import { Shirt, Loader2, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { TryonCategory } from '@/lib/visual-expression/types';

interface TryonButtonProps {
  /** 의류 이미지 URL (옷장/추천 코디) */
  garmentImageUrl: string;
  /** FASHN 카테고리 */
  category: TryonCategory;
  className?: string;
}

interface TryonResponse {
  imageUrl: string;
  aiGenerated?: true;
}

export function TryonButton({ garmentImageUrl, category, className }: TryonButtonProps) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [result, setResult] = useState<TryonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 사용 가능 여부 확인 — false면 표면 자체 비노출
  useEffect(() => {
    let active = true;
    fetch('/api/visual/tryon')
      .then((r) => (r.ok ? r.json() : { available: false }))
      .then((d) => {
        if (active) setAvailable(Boolean(d.available));
      })
      .catch(() => {
        if (active) setAvailable(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (available !== true) return null;

  const reset = () => {
    setModelImage(null);
    setResult(null);
    setLoading(false);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setResult(null);
      setModelImage(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!modelImage) return;
    setLoading(true);
    try {
      const res = await fetch('/api/visual/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelImageBase64: modelImage,
          garmentImageUrl,
          category,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? '착장 생성에 실패했어요. 잠시 후 다시 시도해 주세요.');
        return;
      }
      const data = (await res.json()) as TryonResponse;
      setResult(data);
    } catch {
      toast.error('네트워크 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result?.imageUrl) return;
    const a = document.createElement('a');
    a.href = result.imageUrl;
    a.download = 'yiroom-tryon.jpg';
    a.target = '_blank';
    a.rel = 'noopener';
    a.click();
  };

  // 미리보기: 결과 > 내 사진 > 업로드 유도 (중첩 삼항 회피)
  const renderPreview = () => {
    if (result) {
      return (
        <div className="relative rounded-xl overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.imageUrl}
            alt="가상 착장 결과"
            className="w-full object-contain max-h-[380px]"
          />
          <span
            data-testid="ai-generated-label"
            className="absolute top-2 left-2 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white"
          >
            AI 생성 이미지
          </span>
        </div>
      );
    }
    if (modelImage) {
      return (
        <div className="rounded-xl overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={modelImage}
            alt="내 사진 미리보기"
            className="w-full object-contain max-h-[320px]"
          />
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/30 py-12 text-sm text-muted-foreground hover:bg-muted/40"
      >
        <Upload className="h-6 w-6" aria-hidden="true" />
        전신 사진 선택하기
      </button>
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <Button
        variant="outline"
        size="sm"
        className={className}
        onClick={() => setOpen(true)}
        data-testid="tryon-button"
      >
        <Shirt className="w-4 h-4 mr-2" aria-hidden="true" />
        입어보기
      </Button>
      <DialogContent className="max-w-md" data-testid="tryon-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shirt className="w-5 h-5" aria-hidden="true" />
            가상 착장
          </DialogTitle>
          <DialogDescription>
            내 사진에 이 옷을 입혀봐요. 실제 사이즈가 아닌 참고용 이미지예요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {renderPreview()}

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

          <div className="flex gap-2">
            {modelImage && !result && (
              <Button className="flex-1" onClick={handleGenerate} disabled={loading}>
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                ) : (
                  <Shirt className="w-4 h-4 mr-2" aria-hidden="true" />
                )}
                {loading ? '생성 중… (최대 40초)' : '입어보기 생성'}
              </Button>
            )}
            {result && (
              <Button variant="outline" className="flex-1" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                저장
              </Button>
            )}
            {(modelImage || result) && (
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
      </DialogContent>
    </Dialog>
  );
}

export default TryonButton;
