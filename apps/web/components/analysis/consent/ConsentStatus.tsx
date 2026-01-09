'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Camera, CameraOff, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type ConsentStatusProps } from './types';

/**
 * 동의 상태 표시 컴포넌트
 * 현재 이미지 저장 동의 상태를 배지 형태로 표시
 *
 * @example
 * ```tsx
 * <ConsentStatus
 *   consent={userConsent}
 *   analysisType="skin"
 *   onManage={() => router.push('/settings/privacy')}
 * />
 * ```
 */
export function ConsentStatus({
  consent,
  analysisType: _analysisType,
  showDetails = true,
  onManage,
  className,
}: ConsentStatusProps) {
  const isConsented = consent?.consent_given ?? false;

  // 만료일 포맷
  const expiryDate = consent?.retention_until
    ? format(new Date(consent.retention_until), 'yyyy년 M월 d일', { locale: ko })
    : null;

  return (
    <div
      className={cn(
        'rounded-lg border p-3',
        isConsented
          ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
          : 'bg-gray-50 border-gray-200 dark:bg-gray-900/30 dark:border-gray-700',
        className
      )}
      data-testid="consent-status"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConsented ? (
            <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <CameraOff className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-sm font-medium">{isConsented ? '사진 저장됨' : '사진 미저장'}</span>
        </div>

        {onManage && (
          <Button variant="ghost" size="sm" onClick={onManage} className="text-xs h-7 px-2">
            <Settings className="w-3 h-3 mr-1" />
            {isConsented ? '관리' : '활성화'}
          </Button>
        )}
      </div>

      {showDetails && (
        <p className="text-xs text-muted-foreground mt-1 pl-6">
          {isConsented && expiryDate ? `만료: ${expiryDate}` : '변화 추적 기능이 꺼져 있어요'}
        </p>
      )}
    </div>
  );
}

export default ConsentStatus;
