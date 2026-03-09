'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { REPORT_REASON_LABELS } from '@/lib/feed/types';
import type { ReportReason } from '@/lib/feed/types';

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  onSubmit: (postId: string, reason: ReportReason, description?: string) => Promise<void>;
}

const REASONS = Object.entries(REPORT_REASON_LABELS) as [ReportReason, string][];

/**
 * 신고 모달
 * - 신고 사유 선택 (5종)
 * - 선택적 상세 설명 입력
 */
export function ReportModal({ open, onOpenChange, postId, onSubmit }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      await onSubmit(postId, selectedReason, description || undefined);
      onOpenChange(false);
      setSelectedReason(null);
      setDescription('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedReason(null);
      setDescription('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="report-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            게시물 신고
          </DialogTitle>
          <DialogDescription>신고 사유를 선택해주세요.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {REASONS.map(([reason, label]) => (
            <button
              key={reason}
              onClick={() => setSelectedReason(reason)}
              className={cn(
                'w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors',
                selectedReason === reason
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border hover:bg-muted text-muted-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {selectedReason && (
          <Textarea
            placeholder="추가 설명이 있으면 입력해주세요 (선택)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={500}
          />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
          >
            {isSubmitting ? '신고 중...' : '신고하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
