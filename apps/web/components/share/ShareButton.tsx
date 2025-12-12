'use client';

import { Share2, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { canShareFiles } from '@/lib/share';

interface ShareButtonProps {
  /** 공유 버튼 클릭 핸들러 */
  onShare: () => Promise<void>;
  /** 로딩 상태 */
  loading?: boolean;
  /** 버튼 변형 */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  /** 버튼 크기 */
  size?: 'default' | 'sm' | 'lg';
  /** 추가 className */
  className?: string;
  /** 전체 너비 */
  fullWidth?: boolean;
}

/**
 * 결과 공유 버튼
 * - Web Share API 지원 시: 공유 아이콘
 * - 미지원 시: 다운로드 아이콘
 */
export function ShareButton({
  onShare,
  loading = false,
  variant = 'default',
  size = 'default',
  className,
  fullWidth = false,
}: ShareButtonProps) {
  const supportsShare = canShareFiles();

  return (
    <Button
      onClick={onShare}
      disabled={loading}
      variant={variant}
      size={size}
      className={`gap-2 ${fullWidth ? 'w-full' : ''} ${className || ''}`}
      aria-label="결과 공유하기"
      data-testid="share-button"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : supportsShare ? (
        <Share2 className="h-4 w-4" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {loading ? '준비 중...' : supportsShare ? '공유하기' : '이미지 저장'}
    </Button>
  );
}

export default ShareButton;
