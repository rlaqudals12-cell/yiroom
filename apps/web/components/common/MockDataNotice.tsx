'use client';

/**
 * Mock 데이터 사용 알림 컴포넌트
 * AI 서비스 불가 시 Fallback 데이터 사용을 사용자에게 알림
 *
 * @see docs/specs/SDD-AI-TRANSPARENCY.md - Phase 2
 * @see docs/adr/ADR-007-mock-fallback-strategy.md
 */

import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MockDataNoticeProps {
  /** 추가 CSS 클래스 */
  className?: string;
  /** 컴팩트 모드 (짧은 메시지만) */
  compact?: boolean;
}

/**
 * Mock 데이터 사용 알림
 * AI 분석 실패 시 Fallback 데이터가 사용되었음을 표시
 */
export function MockDataNotice({ className, compact = false }: MockDataNoticeProps) {
  if (compact) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs',
          'bg-amber-50 dark:bg-amber-950/50',
          'text-amber-700 dark:text-amber-300',
          'border border-amber-200 dark:border-amber-800',
          className
        )}
        role="status"
        aria-label="임시 데이터가 표시되고 있습니다"
        data-testid="mock-data-notice-compact"
      >
        <AlertTriangle className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
        <span className="font-medium">샘플 결과</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg',
        'bg-amber-50 dark:bg-amber-950/50',
        'border border-amber-200 dark:border-amber-800',
        className
      )}
      role="alert"
      aria-live="polite"
      data-testid="mock-data-notice"
    >
      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
        <AlertTriangle
          className="w-4 h-4 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-amber-800 dark:text-amber-200">
          임시 데이터 표시 중
        </p>
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          현재 AI 분석 서비스를 이용할 수 없어 샘플 결과를 표시합니다.
          잠시 후 다시 시도하시면 정확한 분석 결과를 받으실 수 있습니다.
        </p>
      </div>
    </div>
  );
}

export default MockDataNotice;
