/**
 * R-1 리포트 헤더 컴포넌트
 * 기간 표시 + 이전/다음 네비게이션
 */

'use client';

import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportHeaderProps {
  title: string;
  subtitle?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  canGoNext?: boolean;
}

export function ReportHeader({
  title,
  subtitle,
  onPrevious,
  onNext,
  canGoNext = true,
}: ReportHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6" data-testid="report-header">
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevious}
        disabled={!onPrevious}
        aria-label="이전"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        {subtitle && (
          <span className="text-sm text-muted-foreground">{subtitle}</span>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={!onNext || !canGoNext}
        aria-label="다음"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
