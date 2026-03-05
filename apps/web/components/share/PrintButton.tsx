'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PrintButtonProps {
  /** 인쇄 제목 (브라우저 탭 타이틀에 표시) */
  title?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'icon';
}

/**
 * PDF 내보내기 / 인쇄 버튼
 * 브라우저 인쇄 다이얼로그를 열어 PDF 저장 가능
 */
export function PrintButton({
  title,
  className,
  variant = 'outline',
  size = 'default',
}: PrintButtonProps) {
  const handlePrint = (): void => {
    // 인쇄 시 제목 변경 (파일명에 반영)
    const originalTitle = document.title;
    if (title) {
      document.title = title;
    }

    window.print();

    // 제목 복원
    if (title) {
      // 인쇄 다이얼로그가 닫힌 후 복원
      setTimeout(() => {
        document.title = originalTitle;
      }, 100);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePrint}
      className={cn('gap-2', className)}
      data-print-hide
      aria-label="PDF로 저장하기"
    >
      <Printer className="h-4 w-4" aria-hidden="true" />
      {size !== 'icon' && <span>PDF 저장</span>}
    </Button>
  );
}
