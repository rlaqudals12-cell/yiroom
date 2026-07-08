'use client';

/**
 * 내 트윈 만들기 스튜디오 — AI 트윈 생성 플로우 + 승인 게이트 (ADR-115, SDD §4)
 *
 * 안내(본인 사진·Gemini 전송·상한 고지) → 셀카(+전신) 업로드 → 생성 로딩(정직) →
 * 승인 게이트("이게 나 맞나요?"). 승인 전 트윈은 이 컴포넌트 밖 어떤 표면에도
 * 노출되지 않는다. 트윈 이미지에는 "AI 생성" 배지를 상시 노출한다.
 *
 * O가 엔진/라우트를 동시 구현 중 — fetch는 SDD §3 스키마 기준, 응답 필드 방어.
 */

import { useRef, useState } from 'react';
import { Sparkles, Loader2, Upload, Check, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { compressFileToBase64 } from '@/lib/utils/image-compression';
import { parseTwinRecord, type TwinRecord } from './useTwin';

type Phase = 'intro' | 'upload' | 'generating' | 'review' | 'error';

interface TwinStudioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 승인 완료 시 부모(내 트윈 섹션) 새로고침 */
  onApproved?: () => void;
}

export function TwinStudio({ open, onOpenChange, onApproved }: TwinStudioProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [bodyImage, setBodyImage] = useState<string | null>(null);
  const [twin, setTwin] = useState<TwinRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const faceInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPhase('intro');
    setFaceImage(null);
    setBodyImage(null);
    setTwin(null);
    setErrorMsg('');
    setBusy(false);
  };

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (!v) reset();
  };

  const pickFile = async (file: File, kind: 'face' | 'body') => {
    try {
      const b64 = await compressFileToBase64(file);
      if (kind === 'face') setFaceImage(b64);
      else setBodyImage(b64);
    } catch {
      toast.error('사진을 불러오지 못했어요. 다른 사진을 선택해 주세요.');
    }
  };

  // 승인 전 트윈 정리(다시 만들기/그만두기) — 실패해도 흐름 진행
  const rejectCurrent = async () => {
    if (!twin) return;
    await fetch(`/api/visual/twin/${twin.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject' }),
    }).catch(() => {});
  };

  const generate = async () => {
    if (!faceImage) return;
    setPhase('generating');
    setErrorMsg('');
    try {
      const res = await fetch('/api/visual/twin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faceImageBase64: faceImage,
          ...(bodyImage ? { bodyImageBase64: bodyImage } : {}),
        }),
      });
      if (res.status === 429) {
        const d = await res.json().catch(() => ({}));
        setErrorMsg(d.error ?? '오늘은 트윈을 더 만들 수 없어요. 내일 다시 시도해 주세요.');
        setPhase('error');
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErrorMsg(d.error ?? '지금은 트윈을 만들 수 없어요. 잠시 후 다시 시도해 주세요.');
        setPhase('error');
        return;
      }
      const rec = parseTwinRecord(await res.json().catch(() => null));
      if (!rec) {
        setErrorMsg('지금은 트윈을 만들 수 없어요. 잠시 후 다시 시도해 주세요.');
        setPhase('error');
        return;
      }
      setTwin(rec);
      setPhase('review');
    } catch {
      setErrorMsg('네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.');
      setPhase('error');
    }
  };

  const approve = async () => {
    if (!twin) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/visual/twin/${twin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (!res.ok) {
        toast.error('승인에 실패했어요. 잠시 후 다시 시도해 주세요.');
        return;
      }
      toast.success('내 트윈이 만들어졌어요.');
      onApproved?.();
      handleOpenChange(false);
    } catch {
      toast.error('네트워크 오류가 발생했어요.');
    } finally {
      setBusy(false);
    }
  };

  // 다시 만들기 = 현재 트윈 거부 + 재생성(일 상한 내)
  const regenerate = async () => {
    setBusy(true);
    await rejectCurrent();
    setTwin(null);
    setBusy(false);
    await generate();
  };

  // 그만두기 = 현재 트윈 거부 + 닫기
  const discard = async () => {
    setBusy(true);
    await rejectCurrent();
    setBusy(false);
    handleOpenChange(false);
  };

  const renderIntro = () => (
    <div className="space-y-4" data-testid="twin-intro">
      <div className="rounded-xl bg-muted/60 p-4 space-y-3 text-sm">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
          <p>
            <strong>본인 사진만 사용해 주세요.</strong> 다른 사람의 사진으로 트윈을 만들 수 없어요.
          </p>
        </div>
        <div className="flex items-start gap-2.5">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" aria-hidden="true" />
          <p>사진은 Google AI로 전송돼 트윈을 만드는 데 사용돼요.</p>
        </div>
        <div className="flex items-start gap-2.5">
          <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p>트윈 만들기는 하루에 5번까지 할 수 있어요.</p>
        </div>
      </div>
      <Button
        className="w-full"
        onClick={() => setPhase('upload')}
        data-testid="twin-intro-continue"
      >
        시작하기
      </Button>
    </div>
  );

  const renderUploadTile = (
    image: string | null,
    label: string,
    hint: string,
    onClick: () => void
  ) => {
    if (image) {
      return (
        <button
          type="button"
          onClick={onClick}
          className="relative w-full overflow-hidden rounded-xl bg-muted"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={label} className="max-h-[180px] w-full object-contain" />
          <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-white">
            다시 선택
          </span>
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-muted-foreground/30 py-8 text-sm text-muted-foreground hover:bg-muted/40"
      >
        <Upload className="h-5 w-5" aria-hidden="true" />
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-xs">{hint}</span>
      </button>
    );
  };

  const renderUpload = () => (
    <div className="space-y-3" data-testid="twin-upload">
      {renderUploadTile(faceImage, '셀카 올리기 (필수)', '얼굴이 잘 보이는 정면 사진', () =>
        faceInputRef.current?.click()
      )}
      {renderUploadTile(bodyImage, '전신 사진 올리기 (선택)', '있으면 체형을 더 잘 반영해요', () =>
        bodyInputRef.current?.click()
      )}

      <input
        ref={faceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void pickFile(file, 'face');
        }}
      />
      <input
        ref={bodyInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void pickFile(file, 'body');
        }}
      />

      <Button
        className="w-full"
        onClick={generate}
        disabled={!faceImage}
        data-testid="twin-generate-button"
      >
        <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
        트윈 만들기
      </Button>
    </div>
  );

  const renderGenerating = () => (
    <div
      className="flex flex-col items-center justify-center gap-3 py-12 text-center"
      data-testid="twin-generating"
    >
      <Loader2 className="h-8 w-8 animate-spin text-purple-500" aria-hidden="true" />
      <p className="font-medium">트윈을 만들고 있어요</p>
      <p className="text-sm text-muted-foreground">
        20~40초 정도 걸려요. 창을 닫지 말고 잠시만 기다려 주세요.
      </p>
    </div>
  );

  const renderReview = () =>
    twin && (
      <div className="space-y-4" data-testid="twin-review">
        <div className="relative overflow-hidden rounded-xl bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={twin.imageUrl}
            alt="생성된 내 트윈"
            className="max-h-[380px] w-full object-contain"
          />
          <span
            data-testid="ai-generated-label"
            className="absolute left-2 top-2 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-medium text-white"
          >
            AI 생성
          </span>
        </div>

        <div className="text-center">
          <p className="font-semibold">이게 나 맞나요?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            닮은 모습으로 만들어봤어요. 마음에 들면 저장해 주세요.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <Button onClick={approve} disabled={busy} data-testid="twin-approve-button">
            <Check className="mr-2 h-4 w-4" aria-hidden="true" />
            네, 저예요
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={regenerate}
              disabled={busy}
              data-testid="twin-regenerate-button"
            >
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              다시 만들기
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              onClick={discard}
              disabled={busy}
              data-testid="twin-discard-button"
            >
              <X className="mr-2 h-4 w-4" aria-hidden="true" />
              그만두기
            </Button>
          </div>
        </div>
      </div>
    );

  const renderError = () => (
    <div
      className="flex flex-col items-center justify-center gap-3 py-8 text-center"
      data-testid="twin-error"
    >
      <p className="text-sm text-muted-foreground">{errorMsg}</p>
      <div className="flex w-full gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setPhase('upload')}
          data-testid="twin-error-retry"
        >
          다시 시도
        </Button>
        <Button variant="ghost" className="flex-1" onClick={() => handleOpenChange(false)}>
          닫기
        </Button>
      </div>
    </div>
  );

  const renderPhase = () => {
    switch (phase) {
      case 'intro':
        return renderIntro();
      case 'upload':
        return renderUpload();
      case 'generating':
        return renderGenerating();
      case 'review':
        return renderReview();
      case 'error':
        return renderError();
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" data-testid="twin-studio">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" aria-hidden="true" />내 트윈 만들기
          </DialogTitle>
          <DialogDescription>
            나를 닮은 모습을 만들어, 옷과 스타일을 입혀볼 수 있어요.
          </DialogDescription>
        </DialogHeader>

        {renderPhase()}
      </DialogContent>
    </Dialog>
  );
}

export default TwinStudio;
