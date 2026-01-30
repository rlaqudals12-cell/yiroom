'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Shield, Star, Users, CheckCircle2, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * TrustBadge 변형 정의
 *
 * 신뢰 지표를 표시하는 뱃지 컴포넌트
 * - default: 일반 신뢰 뱃지 (반투명 배경)
 * - highlight: 강조 뱃지 (primary 색상)
 * - success: 성공/검증 뱃지 (그린)
 * - premium: 프리미엄/골드 뱃지
 */
const trustBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-white/10 text-foreground/80 dark:bg-white/5 dark:text-foreground/70',
        highlight:
          'bg-primary/10 text-primary dark:bg-primary/20',
        success:
          'bg-status-success/10 text-status-success dark:bg-status-success/20',
        premium:
          'bg-[linear-gradient(135deg,oklch(0.85_0.08_80),oklch(0.75_0.10_60))] text-amber-900 dark:text-amber-100',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

type IconType = 'shield' | 'star' | 'users' | 'check' | 'sparkles' | 'none';

const iconComponents: Record<Exclude<IconType, 'none'>, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  star: Star,
  users: Users,
  check: CheckCircle2,
  sparkles: Sparkles,
};

export interface TrustBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof trustBadgeVariants> {
  /** 뱃지 앞에 표시할 아이콘 */
  icon?: IconType;
  /** 아이콘 색상 (기본: 텍스트 색상 상속) */
  iconClassName?: string;
}

/**
 * TrustBadge - 신뢰 지표 뱃지
 *
 * @example
 * // 기본 사용
 * <TrustBadge icon="users">10만+ 사용자 신뢰</TrustBadge>
 *
 * // AI 정확도 표시
 * <TrustBadge icon="sparkles" variant="highlight">AI 정확도 92%</TrustBadge>
 *
 * // 검증 완료 뱃지
 * <TrustBadge icon="check" variant="success">검증 완료</TrustBadge>
 *
 * // 프리미엄 뱃지
 * <TrustBadge icon="star" variant="premium">프리미엄</TrustBadge>
 */
function TrustBadge({
  className,
  variant,
  size,
  icon = 'none',
  iconClassName,
  children,
  ...props
}: TrustBadgeProps): React.JSX.Element {
  const IconComponent = icon !== 'none' ? iconComponents[icon] : null;

  // 아이콘 사이즈 매핑
  const iconSize = {
    sm: 'size-3',
    md: 'size-3.5',
    lg: 'size-4',
  }[size ?? 'md'];

  return (
    <span
      data-slot="trust-badge"
      data-testid="trust-badge"
      className={cn(trustBadgeVariants({ variant, size, className }))}
      {...props}
    >
      {IconComponent && (
        <IconComponent className={cn(iconSize, 'shrink-0', iconClassName)} />
      )}
      {children}
    </span>
  );
}

export { TrustBadge, trustBadgeVariants };
