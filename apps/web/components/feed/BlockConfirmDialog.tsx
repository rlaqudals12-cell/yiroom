'use client';

import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BlockConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  authorName: string;
  blockedUserId: string;
  onConfirm: (blockedUserId: string) => Promise<void>;
}

/**
 * 차단 확인 다이얼로그
 * - 차단 시 양방향으로 게시물 비노출
 */
export function BlockConfirmDialog({
  open,
  onOpenChange,
  authorName,
  blockedUserId,
  onConfirm,
}: BlockConfirmDialogProps) {
  const [isBlocking, setIsBlocking] = useState(false);

  const handleConfirm = async () => {
    setIsBlocking(true);
    try {
      await onConfirm(blockedUserId);
      onOpenChange(false);
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="block-confirm-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-destructive" />
            {authorName}님을 차단할까요?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>차단하면 다음과 같이 적용돼요.</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>상대방의 게시물이 피드에서 보이지 않아요</li>
              <li>상대방도 내 게시물을 볼 수 없어요</li>
              <li>설정에서 언제든 차단을 해제할 수 있어요</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isBlocking}>
            {isBlocking ? '차단 중...' : '차단하기'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
