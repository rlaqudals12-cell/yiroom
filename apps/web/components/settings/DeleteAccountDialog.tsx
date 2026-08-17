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
import { useTranslations } from 'next-intl';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

/**
 * 이메일을 확인할 수 없을 때 요구하는 고정 확인 문구.
 *
 * 이 경로로 제출하면 서버(`DELETE /api/user/account`)는 여전히 Clerk 이메일 일치를
 * 요구하므로 실제 삭제는 되지 않고 "이메일이 일치하지 않습니다"로 거절된다.
 * 즉 이 문구는 "이메일 없는 우회 삭제 경로"가 아니라, 빈 입력으로 삭제 버튼이
 * 눌리는 것을 막는 클라이언트 가드다.
 */
const FALLBACK_CONFIRMATION = '계정삭제';

export function DeleteAccountDialog({ open, onOpenChange, userEmail }: DeleteAccountDialogProps) {
  const t = useTranslations('settingsUI');
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 이메일이 아직 로드되지 않았거나(useUser 로딩 중) 이메일이 없는 계정이면 userEmail은 ''.
  // 그대로 비교하면 '' === ''가 참이 되어 아무것도 입력하지 않아도 삭제 버튼이 활성화됐다
  // (확인 절차 무력화). 이메일이 있을 때만 이메일 비교, 없으면 고정 문구 입력을 요구한다.
  const hasEmail = userEmail.length > 0;
  const expectedConfirmation = hasEmail ? userEmail : FALLBACK_CONFIRMATION;
  const isConfirmed = confirmation.toLowerCase() === expectedConfirmation.toLowerCase();

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
      setError(err instanceof Error ? err.message : t('deleteAccountDialog0'));
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
            <p className="font-medium text-destructive mb-2">{t('deleteAccountDialog1')}</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>{t('deleteAccountDialog2')}</li>
              <li>{t('deleteAccountDialog3')}</li>
              <li>{t('deleteAccountDialog4')}</li>
              <li>{t('deleteAccountDialog5')}</li>
            </ul>
          </div>

          {/* 확인 입력 — 이메일이 있으면 이메일, 없으면 고정 문구 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {hasEmail
                ? '확인을 위해 이메일을 입력하세요'
                : `확인을 위해 "${FALLBACK_CONFIRMATION}"를 입력하세요`}
            </label>
            <Input
              type={hasEmail ? 'email' : 'text'}
              placeholder={expectedConfirmation}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              disabled={isDeleting}
              data-testid="delete-confirmation-input"
            />
            <p className="text-xs text-muted-foreground">
              {hasEmail
                ? `계정 이메일: ${userEmail}`
                : '계정 이메일을 불러오지 못했어요. 삭제가 진행되지 않으면 잠시 후 다시 시도해주세요.'}
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
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
              t('deleteAccountDialog6')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
