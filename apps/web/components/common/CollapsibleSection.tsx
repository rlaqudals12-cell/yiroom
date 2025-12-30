'use client';

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  /** 섹션 제목 */
  title: string;
  /** 제목 옆 부제목 (선택) */
  subtitle?: string;
  /** 제목 옆 배지 (선택) */
  badge?: React.ReactNode;
  /** 기본 열림 상태 */
  defaultOpen?: boolean;
  /** 외부 제어 열림 상태 */
  isOpen?: boolean;
  /** 외부 제어 토글 함수 */
  onOpenChange?: (isOpen: boolean) => void;
  /** 자식 요소 */
  children: React.ReactNode;
  /** 추가 클래스 */
  className?: string;
  /** 헤더 추가 클래스 */
  headerClassName?: string;
  /** 콘텐츠 추가 클래스 */
  contentClassName?: string;
  /** 항상 열려있는 상태 (접기 비활성화) */
  alwaysOpen?: boolean;
  /** 아이콘 커스텀 */
  icon?: React.ReactNode;
  /** 헤더 우측 액션 */
  headerAction?: React.ReactNode;
}

/**
 * 점진적 공개를 위한 접을 수 있는 섹션 컴포넌트
 * - 복잡한 정보를 단계적으로 공개
 * - 사용자가 필요한 정보만 볼 수 있도록 지원
 */
export function CollapsibleSection({
  title,
  subtitle,
  badge,
  defaultOpen = false,
  isOpen: controlledOpen,
  onOpenChange,
  children,
  className,
  headerClassName,
  contentClassName,
  alwaysOpen = false,
  icon,
  headerAction,
}: CollapsibleSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  // 제어/비제어 모드 지원
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = useCallback(
    (value: boolean) => {
      if (onOpenChange) {
        onOpenChange(value);
      } else {
        setInternalOpen(value);
      }
    },
    [onOpenChange]
  );

  const handleToggle = useCallback(() => {
    if (!alwaysOpen) {
      setIsOpen(!isOpen);
    }
  }, [alwaysOpen, isOpen, setIsOpen]);

  return (
    <div
      className={cn('rounded-xl border border-border bg-card', className)}
      data-testid="collapsible-section"
    >
      {/* 헤더 */}
      <button
        onClick={handleToggle}
        disabled={alwaysOpen}
        className={cn(
          'w-full flex items-center justify-between p-4 text-left transition-colors',
          !alwaysOpen && 'hover:bg-muted/50 cursor-pointer',
          alwaysOpen && 'cursor-default',
          headerClassName
        )}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {/* 토글 아이콘 */}
          {!alwaysOpen && (
            <div className="text-muted-foreground transition-transform duration-200">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}

          {/* 커스텀 아이콘 */}
          {icon && <div className="text-muted-foreground">{icon}</div>}

          {/* 제목 */}
          <div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>

          {/* 배지 */}
          {badge && <div className="ml-2">{badge}</div>}
        </div>

        {/* 헤더 우측 액션 */}
        {headerAction && (
          <div onClick={(e) => e.stopPropagation()}>{headerAction}</div>
        )}
      </button>

      {/* 콘텐츠 (애니메이션 포함) */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className={cn('px-4 pb-4', contentClassName)}>{children}</div>
      </div>
    </div>
  );
}

export default CollapsibleSection;
