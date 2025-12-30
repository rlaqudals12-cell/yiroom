'use client';

import { useState, useRef, useEffect } from 'react';
import { Info, HelpCircle, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfoTooltipProps {
  /** 툴팁 내용 */
  content: string | React.ReactNode;
  /** 아이콘 타입 */
  variant?: 'info' | 'help';
  /** 커스텀 아이콘 */
  icon?: LucideIcon;
  /** 아이콘 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 툴팁 위치 */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** 추가 클래스 */
  className?: string;
  /** 트리거 요소 클래스 */
  triggerClassName?: string;
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const positionClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowClasses = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-foreground border-l-transparent border-r-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-foreground border-l-transparent border-r-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-foreground border-t-transparent border-b-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-foreground border-t-transparent border-b-transparent border-l-transparent',
};

/**
 * 정보 툴팁 컴포넌트
 * - 복잡한 기능에 대한 컨텍스트 도움말 제공
 * - 점진적 공개 패턴으로 필요할 때만 정보 표시
 */
export function InfoTooltip({
  content,
  variant = 'info',
  icon: CustomIcon,
  size = 'sm',
  side = 'top',
  className,
  triggerClassName,
}: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const Icon = CustomIcon || (variant === 'help' ? HelpCircle : Info);

  // 표시 지연
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShouldRender(true);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 200);
  };

  // 숨기기 지연
  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
    timeoutRef.current = setTimeout(() => {
      setShouldRender(false);
    }, 150);
  };

  // 클린업
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          'text-muted-foreground hover:text-foreground transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary/20',
          triggerClassName
        )}
        aria-label="도움말"
      >
        <Icon className={sizeClasses[size]} />
      </button>

      {/* 툴팁 내용 */}
      {shouldRender && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 pointer-events-none',
            positionClasses[side],
            'transition-opacity duration-150',
            isVisible ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div
            className={cn(
              'px-3 py-2 text-sm bg-foreground text-background rounded-lg shadow-lg',
              'max-w-[200px] text-center',
              className
            )}
          >
            {content}
            {/* 화살표 */}
            <div
              className={cn(
                'absolute w-0 h-0 border-4',
                arrowClasses[side]
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 인라인 도움말 컴포넌트
 * - 라벨 옆에 표시되는 도움말
 */
export function InlineHelp({
  label,
  help,
  size = 'sm',
  className,
}: {
  label: string;
  help: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span>{label}</span>
      <InfoTooltip content={help} variant="help" size={size} />
    </span>
  );
}

export default InfoTooltip;
