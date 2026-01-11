'use client';

/**
 * 조건부 루틴 뱃지 컴포넌트
 * - 조건부 단계에 뱃지 표시
 * - 예: "건조할 때 2회", "여드름 있을 때"
 * @version 1.0
 * @date 2026-01-11
 */

import { memo } from 'react';
import { RefreshCw, Plus, Minus, Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConditionalModification } from '@/lib/skincare/conditional-routine';

// ================================================
// 타입 정의
// ================================================

interface ConditionalBadgeProps {
  /** 조건부 수정 정보 */
  conditionalMod: ConditionalModification;
  /** 크기 */
  size?: 'sm' | 'md';
  className?: string;
}

// 간단한 뱃지용 타입
interface SimpleBadgeProps {
  /** 조건 텍스트 */
  condition: string;
  /** 수정 텍스트 */
  modificationText: string;
  /** 수정 타입 */
  type: 'repeat' | 'add' | 'skip' | 'extend' | 'tip';
  /** 크기 */
  size?: 'sm' | 'md';
  className?: string;
}

type ModificationType = 'repeat' | 'add' | 'skip' | 'extend' | 'tip';

// ================================================
// 스타일 상수
// ================================================

const MODIFICATION_STYLES: Record<
  ModificationType,
  {
    bg: string;
    text: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  repeat: {
    bg: 'bg-blue-100 dark:bg-blue-900/40',
    text: 'text-blue-700 dark:text-blue-300',
    icon: RefreshCw,
  },
  add: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    icon: Plus,
  },
  skip: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-600 dark:text-gray-400',
    icon: Minus,
  },
  extend: {
    bg: 'bg-purple-100 dark:bg-purple-900/40',
    text: 'text-purple-700 dark:text-purple-300',
    icon: Clock,
  },
  tip: {
    bg: 'bg-amber-100 dark:bg-amber-900/40',
    text: 'text-amber-700 dark:text-amber-300',
    icon: Zap,
  },
};

// ================================================
// 유틸리티 함수
// ================================================

/**
 * 수정 사항에서 타입 결정
 */
function getModificationType(mod: ConditionalModification['modification']): ModificationType {
  if (mod.skipStep) return 'skip';
  if (mod.repeatCount && mod.repeatCount > 1) return 'repeat';
  if (mod.substituteWith) return 'add';
  if (mod.extendDuration) return 'extend';
  if (mod.addTip) return 'tip';
  return 'tip';
}

/**
 * 수정 사항에서 표시 텍스트 생성
 */
function getModificationText(mod: ConditionalModification['modification']): string {
  if (mod.skipStep) {
    return '건너뛰기';
  }

  if (mod.repeatCount && mod.repeatCount > 1) {
    return `${mod.repeatCount}회`;
  }

  if (mod.substituteWith) {
    return `→ ${mod.substituteWith}`;
  }

  if (mod.extendDuration) {
    return mod.extendDuration;
  }

  if (mod.addTip) {
    return mod.addTip.slice(0, 10) + (mod.addTip.length > 10 ? '...' : '');
  }

  return '';
}

/**
 * 조건에서 짧은 라벨 추출
 */
function getShortConditionLabel(condition: string): string {
  if (condition.includes('건조')) return '건조';
  if (condition.includes('번들') || condition.includes('지성')) return '번들';
  if (condition.includes('여드름') || condition.includes('트러블')) return '트러블';
  if (condition.includes('홍조')) return '홍조';
  if (condition.includes('칙칙')) return '칙칙';
  if (condition.includes('민감')) return '민감';
  return condition.slice(0, 4);
}

// ================================================
// 메인 컴포넌트
// ================================================

const ConditionalBadge = memo(function ConditionalBadge({
  conditionalMod,
  size = 'sm',
  className,
}: ConditionalBadgeProps) {
  const modType = getModificationType(conditionalMod.modification);
  const modText = getModificationText(conditionalMod.modification);
  const style = MODIFICATION_STYLES[modType];
  const Icon = style.icon;
  const shortLabel = getShortConditionLabel(conditionalMod.condition);

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        style.bg,
        style.text,
        sizeClasses[size],
        className
      )}
      data-testid="conditional-badge"
      title={`${conditionalMod.condition}: ${modText || '조건부 적용'}`}
    >
      <Icon className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} aria-hidden="true" />
      <span className="truncate max-w-[80px]">{shortLabel}</span>
      {modText && (
        <>
          <span className="opacity-50">·</span>
          <span>{modText}</span>
        </>
      )}
    </div>
  );
});

export default ConditionalBadge;

// Named export
export { ConditionalBadge };

// ================================================
// 간단한 뱃지 컴포넌트 (직접 값 전달용)
// ================================================

export const SimpleBadge = memo(function SimpleBadge({
  condition,
  modificationText,
  type,
  size = 'sm',
  className,
}: SimpleBadgeProps) {
  const style = MODIFICATION_STYLES[type];
  const Icon = style.icon;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        style.bg,
        style.text,
        sizeClasses[size],
        className
      )}
      data-testid="simple-badge"
    >
      <Icon className={cn(size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5')} aria-hidden="true" />
      <span className="truncate max-w-[80px]">{condition}</span>
      {modificationText && (
        <>
          <span className="opacity-50">·</span>
          <span>{modificationText}</span>
        </>
      )}
    </div>
  );
});

// ================================================
// 프리셋 뱃지 컴포넌트
// ================================================

/**
 * 건조 시 2회 적용 뱃지
 */
export const DryRepeatBadge = memo(function DryRepeatBadge({
  repeatCount = 2,
  size = 'sm',
  className,
}: {
  repeatCount?: number;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <SimpleBadge
      condition="건조"
      modificationText={`${repeatCount}회`}
      type="repeat"
      size={size}
      className={className}
    />
  );
});

/**
 * 트러블 시 스팟 추가 뱃지
 */
export const AcneSpotBadge = memo(function AcneSpotBadge({
  size = 'sm',
  className,
}: {
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <SimpleBadge
      condition="트러블"
      modificationText="+스팟"
      type="add"
      size={size}
      className={className}
    />
  );
});

/**
 * 번들거림 시 건너뛰기 뱃지
 */
export const OilySkipBadge = memo(function OilySkipBadge({
  size = 'sm',
  className,
}: {
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <SimpleBadge
      condition="번들"
      modificationText="건너뛰기"
      type="skip"
      size={size}
      className={className}
    />
  );
});
