'use client';

/**
 * AI 분석 결과 배지 컴포넌트
 * AI 기본법 제31조 (2026.1.22 시행) 준수
 * - AI 생성 결과임을 사용자에게 명시
 *
 * WCAG 2.1 AA 준수:
 * - role="status" 라이브 리전
 * - aria-label 상세 설명
 * - 아이콘 aria-hidden
 *
 * @see docs/adr/ADR-024-ai-transparency.md
 * @see docs/specs/SDD-ACCESSIBILITY-GUIDELINES.md
 */

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AIBadgeVariant = 'default' | 'small' | 'inline' | 'card';

interface AIBadgeProps {
  /** 배지 스타일 변형 */
  variant?: AIBadgeVariant;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 커스텀 라벨 (기본: "AI 분석 결과") */
  label?: string;
  /** 툴팁/접근성 설명 */
  description?: string;
}

const variantStyles: Record<AIBadgeVariant, string> = {
  default: 'px-2.5 py-1 text-xs gap-1.5',
  small: 'px-2 py-0.5 text-[10px] gap-1',
  inline: 'px-1.5 py-0.5 text-[10px] gap-0.5',
  card: 'px-3 py-1.5 text-sm gap-2',
};

const iconSizes: Record<AIBadgeVariant, string> = {
  default: 'h-3.5 w-3.5',
  small: 'h-3 w-3',
  inline: 'h-2.5 w-2.5',
  card: 'h-4 w-4',
};

/**
 * AI 분석 결과 배지
 * 모든 AI 생성 결과에 표시하여 투명성 확보
 *
 * 접근성:
 * - role="status" 스크린리더 알림
 * - aria-label 상세 설명
 * - 아이콘 aria-hidden 처리
 */
export function AIBadge({
  variant = 'default',
  className,
  label = 'AI 분석 결과',
  description = '이 결과는 AI 기술을 사용하여 생성되었습니다',
}: AIBadgeProps) {
  return (
    <div
      role="status"
      className={cn(
        'inline-flex items-center rounded-full',
        'bg-violet-50 dark:bg-violet-950/30',
        'text-violet-700 dark:text-violet-300',
        'border border-violet-200 dark:border-violet-800',
        variantStyles[variant],
        className
      )}
      title={description}
      aria-label={description}
      data-testid="ai-badge"
    >
      <Sparkles className={cn(iconSizes[variant], 'flex-shrink-0')} aria-hidden="true" />
      <span className="font-medium">{label}</span>
    </div>
  );
}

/**
 * AI 투명성 고지 컴포넌트 (상세 설명 포함)
 * 온보딩, 약관 동의 등 서비스 진입점에서 사용
 *
 * 접근성:
 * - role="note" 정보성 콘텐츠
 * - aria-labelledby 제목 연결
 * - 아이콘 aria-hidden 처리
 */
interface AITransparencyNoticeProps {
  /** 추가 CSS 클래스 */
  className?: string;
  /** 컴팩트 모드 (짧은 설명만) */
  compact?: boolean;
}

export function AITransparencyNotice({ className, compact = false }: AITransparencyNoticeProps) {
  if (compact) {
    return (
      <aside
        role="note"
        aria-label="AI 기술 사용 안내"
        className={cn(
          'flex items-center gap-2 p-3 rounded-lg',
          'bg-violet-50 dark:bg-violet-950/30',
          'border border-violet-200 dark:border-violet-800',
          className
        )}
        data-testid="ai-transparency-notice-compact"
      >
        <Sparkles
          className="h-4 w-4 text-violet-600 dark:text-violet-400 flex-shrink-0"
          aria-hidden="true"
        />
        <p className="text-xs text-violet-700 dark:text-violet-300">
          이 서비스는 AI 기술을 사용하여 분석 결과를 제공합니다.
        </p>
      </aside>
    );
  }

  return (
    <aside
      role="note"
      aria-labelledby="ai-notice-title"
      className={cn(
        'p-4 rounded-xl',
        'bg-gradient-to-r from-violet-50 to-fuchsia-50',
        'dark:from-violet-950/30 dark:to-fuchsia-950/30',
        'border border-violet-200 dark:border-violet-800',
        className
      )}
      data-testid="ai-transparency-notice"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/50 flex items-center justify-center flex-shrink-0"
          aria-hidden="true"
        >
          <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1">
          <h3 id="ai-notice-title" className="font-semibold text-sm text-foreground mb-1">
            AI 기술 사용 안내
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            이룸은 Google Gemini AI 기술을 사용하여 퍼스널컬러, 피부, 체형 등의 분석 결과를 제공합니다.
            AI 분석 결과는 참고용이며, 정확한 진단이 필요한 경우 전문가 상담을 권장합니다.
          </p>
        </div>
      </div>
    </aside>
  );
}

export default AIBadge;
