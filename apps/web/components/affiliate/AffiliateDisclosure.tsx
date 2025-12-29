'use client';

/**
 * 어필리에이트 법적 고지
 * @description 제휴 마케팅 관련 법적 고지 표시
 */

import { cn } from '@/lib/utils';

// ============================================
// 타입 정의
// ============================================

export type DisclosureVariant = 'inline' | 'banner' | 'tooltip' | 'footer';

export interface AffiliateDisclosureProps {
  /** 표시 스타일 */
  variant?: DisclosureVariant;
  /** 상세 표시 여부 */
  detailed?: boolean;
  /** 추가 클래스 */
  className?: string;
}

// ============================================
// 고지 문구
// ============================================

const SHORT_DISCLOSURE = '* 이 링크를 통해 구매 시 이룸에 수수료가 지급됩니다.';

const DETAILED_DISCLOSURE = `
이 페이지에는 제휴 마케팅 링크가 포함되어 있습니다.
링크를 통해 구매하시면 이룸에 소정의 수수료가 지급되며,
구매자에게 추가 비용이 발생하지 않습니다.
저희는 직접 사용하거나 신뢰할 수 있는 제품만 추천드립니다.
`.trim();

// ============================================
// 컴포넌트
// ============================================

export function AffiliateDisclosure({
  variant = 'inline',
  detailed = false,
  className,
}: AffiliateDisclosureProps) {
  const text = detailed ? DETAILED_DISCLOSURE : SHORT_DISCLOSURE;

  switch (variant) {
    case 'banner':
      return (
        <div
          className={cn(
            'bg-amber-50 border border-amber-200 rounded-lg p-3',
            className
          )}
          data-testid="affiliate-disclosure"
        >
          <div className="flex items-start gap-2">
            <span className="text-amber-600">ℹ️</span>
            <p className="text-xs text-amber-800 whitespace-pre-line">{text}</p>
          </div>
        </div>
      );

    case 'tooltip':
      return (
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs text-muted-foreground cursor-help',
            className
          )}
          title={DETAILED_DISCLOSURE}
          data-testid="affiliate-disclosure"
        >
          <span>제휴 링크</span>
          <span className="text-amber-500">ⓘ</span>
        </span>
      );

    case 'footer':
      return (
        <footer
          className={cn(
            'mt-8 pt-4 border-t text-center',
            className
          )}
          data-testid="affiliate-disclosure"
        >
          <p className="text-xs text-muted-foreground">
            {SHORT_DISCLOSURE}
          </p>
          {detailed && (
            <p className="text-[10px] text-muted-foreground mt-1">
              제품 추천은 이룸의 독립적인 판단에 기반하며, 제휴 관계가 추천에 영향을 미치지 않습니다.
            </p>
          )}
        </footer>
      );

    case 'inline':
    default:
      return (
        <p
          className={cn(
            'text-xs text-muted-foreground',
            className
          )}
          data-testid="affiliate-disclosure"
        >
          {text}
        </p>
      );
  }
}

/**
 * 페이지 레벨 어필리에이트 고지 (상단 배너)
 */
export function AffiliatePageBanner({ className }: { className?: string }) {
  return (
    <AffiliateDisclosure
      variant="banner"
      detailed={true}
      className={className}
    />
  );
}

/**
 * 제품 카드용 인라인 고지
 */
export function AffiliateCardDisclosure({ className }: { className?: string }) {
  return (
    <AffiliateDisclosure
      variant="inline"
      detailed={false}
      className={className}
    />
  );
}

/**
 * 툴팁 형태의 간단한 표시
 */
export function AffiliateTooltip({ className }: { className?: string }) {
  return (
    <AffiliateDisclosure
      variant="tooltip"
      className={className}
    />
  );
}
