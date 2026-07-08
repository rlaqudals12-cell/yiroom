'use client';

/**
 * 내 트윈에게 입혀보기 — 승인된 트윈 위 착장 결합 (ADR-115, SDD §4)
 *
 * approved 트윈이 있을 때만 노출된다(호출부에서 게이팅). POST /api/visual/twin/compose로
 * 트윈에 옷을 입힌 이미지를 생성하고, 결과에는 "AI 생성 이미지" 배지를 상시 노출한다.
 * 결과는 저장하지 않는 다운로드/공유용 이미지다.
 */

import { useState } from 'react';
import { Shirt, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface TwinTryonButtonProps {
  /** 승인된 트윈 ID */
  twinId: string;
  /** 의류 이미지 URL (옷장 아이템) */
  garmentImageUrl: string;
  className?: string;
}

export function TwinTryonButton({ twinId, garmentImageUrl, className }: TwinTryonButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const reset = () => {
    setResultUrl(null);
    setLoading(false);
  };

  const compose = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/visual/twin/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twinId, garmentImageUrl }),
      });
      if (res.status === 429) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error ?? '오늘은 더 만들 수 없어요. 내일 다시 시도해 주세요.');
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error ?? '입혀보기에 실패했어요. 잠시 후 다시 시도해 주세요.');
        return;
      }
      const data = await res.json().catch(() => null);
      const url = typeof data?.imageUrl === 'string' ? data.imageUrl : null;
      if (!url) {
        toast.error('입혀보기에 실패했어요. 잠시 후 다시 시도해 주세요.');
        return;
      }
      setResultUrl(url);
    } catch {
      toast.error('네트워크 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = 'yiroom-twin-outfit.jpg';
    a.target = '_blank';
    a.rel = 'noopener';
    a.click();
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
        data-testid="twin-tryon-button"
      >
        <Shirt className="mr-2 h-4 w-4" aria-hidden="true" />내 트윈에게 입혀보기
      </Button>
      <DialogContent className="max-w-md" data-testid="twin-tryon-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shirt className="h-5 w-5" aria-hidden="true" />내 트윈에게 입혀보기
          </DialogTitle>
          <DialogDescription>
            내 트윈에게 이 옷을 입힌 모습을 만들어봐요. 실제 사이즈가 아닌 참고용 이미지예요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {resultUrl ? (
            <div className="relative overflow-hidden rounded-xl bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resultUrl}
                alt="트윈 착장 결과"
                className="max-h-[380px] w-full object-contain"
              />
              <span
                data-testid="ai-generated-label"
                className="absolute left-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white"
              >
                AI 생성 이미지
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <Shirt className="h-6 w-6" aria-hidden="true" />
              <p>내 트윈에게 이 옷을 입혀볼게요.</p>
            </div>
          )}

          <div className="flex gap-2">
            {!resultUrl && (
              <Button className="flex-1" onClick={compose} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Shirt className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                {loading ? '만드는 중… (최대 40초)' : '입혀보기'}
              </Button>
            )}
            {resultUrl && (
              <>
                <Button variant="outline" className="flex-1" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                  저장
                </Button>
                <Button variant="ghost" size="sm" onClick={compose} disabled={loading}>
                  다시 만들기
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TwinTryonButton;
