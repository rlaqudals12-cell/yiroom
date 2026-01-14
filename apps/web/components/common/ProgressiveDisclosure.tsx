'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

/**
 * Progressive Disclosure 토글 래퍼 컴포넌트
 * @description 추가 정보를 펼치기/접기로 표시하여 UI 복잡도 관리
 */
export interface ProgressiveDisclosureProps {
  /** 토글 버튼에 표시될 제목 */
  title: string;
  /** 제목 옆에 표시될 아이콘 (선택) */
  icon?: React.ReactNode;
  /** 초기 펼침 상태 (기본값: false) */
  defaultOpen?: boolean;
  /** 펼쳐질 콘텐츠 */
  children: React.ReactNode;
  /** 추가 className */
  className?: string;
}

/**
 * Progressive Disclosure 컴포넌트
 * 클릭 시 추가 정보를 부드럽게 펼치거나 접음
 */
export function ProgressiveDisclosure({
  title,
  icon,
  defaultOpen = false,
  children,
  className,
}: ProgressiveDisclosureProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn('w-full', className)}
      data-testid="progressive-disclosure"
    >
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between rounded-lg px-3 py-2',
          'bg-muted/50 hover:bg-muted transition-colors',
          'text-sm font-medium text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span>{title}</span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent
        className={cn(
          'overflow-hidden',
          // Radix Collapsible 애니메이션을 위한 CSS 변수 활용
          'data-[state=open]:animate-collapsible-down',
          'data-[state=closed]:animate-collapsible-up'
        )}
      >
        <div className="pt-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}
