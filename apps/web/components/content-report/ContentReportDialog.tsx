'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  CONTENT_REPORT_REASON_LABELS,
  type ContentReportReason,
  type ContentReportTargetType,
} from '@/lib/content-report/contract';
import { cn } from '@/lib/utils';

export type { ContentReportTargetType } from '@/lib/content-report/contract';

interface ContentReportDialogProps {
  targetType: ContentReportTargetType;
  targetId: string;
  triggerLabel: string;
  contentExcerpt?: string;
  className?: string;
  testId?: string;
}

interface ReportErrorEnvelope {
  success: false;
  error?: {
    userMessage?: string;
  };
}

const REPORT_REASONS = Object.entries(CONTENT_REPORT_REASON_LABELS) as Array<
  [ContentReportReason, string]
>;

const DEFAULT_ERROR_MESSAGE = '신고를 접수하지 못했어요. 잠시 후 다시 시도해주세요.';

/**
 * AI 생성물 공통 신고 대화상자.
 * 신고 접수와 완료 확인을 한 대화상자 안에서 끝내 앱 이탈이나 외부 메일 의존을 막는다.
 */
export function ContentReportDialog({
  targetType,
  targetId,
  triggerLabel,
  contentExcerpt,
  className,
  testId,
}: ContentReportDialogProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<ContentReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reset = (): void => {
    setSelectedReason(null);
    setDescription('');
    setIsComplete(false);
    setErrorMessage(null);
  };

  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen) reset();
    setOpen(nextOpen);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!selectedReason || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          reason: selectedReason,
          ...(description.trim() ? { description: description.trim() } : {}),
          ...(contentExcerpt ? { contentExcerpt: contentExcerpt.slice(0, 2000) } : {}),
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as ReportErrorEnvelope | null;
        throw new Error(body?.error?.userMessage ?? DEFAULT_ERROR_MESSAGE);
      }

      setIsComplete(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className
        )}
        data-testid={testId}
      >
        <Flag className="h-3.5 w-3.5" aria-hidden="true" />
        {triggerLabel}
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md" data-testid="content-report-dialog">
          {isComplete ? (
            <>
              <DialogHeader>
                <DialogTitle>신고가 접수됐어요</DialogTitle>
                <DialogDescription>
                  보내주신 내용을 확인하고 필요한 조치를 검토할게요.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => handleOpenChange(false)}>
                  확인
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>AI 생성물 신고</DialogTitle>
                <DialogDescription>
                  문제가 있다고 느낀 이유를 선택해주세요. 신고는 이 화면에서 바로 접수돼요.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2 py-2" role="radiogroup" aria-label="신고 사유">
                {REPORT_REASONS.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selectedReason === value}
                    onClick={() => setSelectedReason(value)}
                    className={cn(
                      'w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                      selectedReason === value
                        ? 'border-foreground/50 bg-muted text-foreground'
                        : 'border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {selectedReason && (
                <Textarea
                  aria-label="신고 상세 설명"
                  placeholder="추가 설명이 있으면 입력해주세요 (선택)"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  maxLength={500}
                />
              )}

              {errorMessage && (
                <p role="alert" className="text-sm text-destructive">
                  {errorMessage}
                </p>
              )}

              <DialogFooter>
                <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                  취소
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSubmit}
                  disabled={!selectedReason || isSubmitting}
                >
                  {isSubmitting ? '신고 중...' : '신고하기'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
