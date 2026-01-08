'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/share';
import { cn } from '@/lib/utils';

/**
 * 분석 결과 페이지 하단 고정 액션 버튼
 * - 다시 분석하기 + 공유하기 (+ 옵션 액션)
 * - iOS Safe Area 대응 (bottom-20 = 하단 네비 위)
 */
interface FixedBottomActionsProps {
  /** 다시 분석하기 클릭 핸들러 */
  onRetry: () => void;
  /** 공유 함수 (ShareButton용) */
  onShare?: () => Promise<void>;
  /** 공유 로딩 상태 */
  shareLoading?: boolean;
  /** 다시 분석하기 버튼 텍스트 */
  retryLabel?: string;
  /** 공유 버튼 표시 여부 */
  showShare?: boolean;
  /** 추가 액션 버튼 (제품 추천 등) */
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  className?: string;
}

export function FixedBottomActions({
  onRetry,
  onShare,
  shareLoading = false,
  retryLabel = '다시 분석하기',
  showShare = true,
  primaryAction,
  className,
}: FixedBottomActionsProps) {
  return (
    <div
      className={cn(
        'fixed bottom-20 left-0 right-0 p-4 bg-card/95 backdrop-blur-sm border-t border-border/50 z-10',
        className
      )}
      data-testid="fixed-bottom-actions"
    >
      <div className="max-w-md mx-auto space-y-2">
        {/* 주요 액션 (제품 추천 등) */}
        {primaryAction && (
          <Button className="w-full" onClick={primaryAction.onClick}>
            {primaryAction.icon}
            {primaryAction.label}
          </Button>
        )}

        {/* 다시 분석하기 + 공유 */}
        <div className="flex gap-2">
          <Button
            variant={primaryAction ? 'outline' : 'default'}
            className="flex-1"
            onClick={onRetry}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {retryLabel}
          </Button>

          {showShare && onShare && (
            <ShareButton onShare={onShare} loading={shareLoading} variant="outline" />
          )}
        </div>
      </div>
    </div>
  );
}

export default FixedBottomActions;
