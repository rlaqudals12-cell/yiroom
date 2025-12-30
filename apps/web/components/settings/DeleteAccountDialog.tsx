'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

export function DeleteAccountDialog({
  open,
  onOpenChange,
  userEmail,
}: DeleteAccountDialogProps) {
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmation.toLowerCase() === userEmail.toLowerCase();

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || '계정 삭제에 실패했습니다.');
      }

      // 성공 시 홈으로 리다이렉트 (세션이 자동으로 만료됨)
      window.location.href = '/';
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmation('');
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="delete-account-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            계정 삭제
          </DialogTitle>
          <DialogDescription>
            정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 삭제되는 데이터 안내 */}
          <div className="p-3 bg-destructive/10 rounded-lg text-sm">
            <p className="font-medium text-destructive mb-2">삭제되는 데이터:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>모든 분석 결과 (퍼스널컬러, 피부, 체형, 운동)</li>
              <li>운동 및 영양 기록</li>
              <li>친구 및 소셜 데이터</li>
              <li>위시리스트 및 설정</li>
            </ul>
          </div>

          {/* 이메일 확인 입력 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              확인을 위해 이메일을 입력하세요
            </label>
            <Input
              type="email"
              placeholder={userEmail}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              disabled={isDeleting}
              data-testid="delete-confirmation-input"
            />
            <p className="text-xs text-muted-foreground">
              계정 이메일: {userEmail}
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            data-testid="delete-account-confirm-button"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                삭제 중...
              </>
            ) : (
              '계정 삭제'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
