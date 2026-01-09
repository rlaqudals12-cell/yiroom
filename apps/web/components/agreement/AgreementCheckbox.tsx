'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { AgreementItem } from './types';

interface AgreementCheckboxProps {
  item: AgreementItem;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

/**
 * 개별 동의 항목 체크박스
 * SDD-TERMS-AGREEMENT.md §8.3
 */
export function AgreementCheckbox({ item, checked, onChange, className }: AgreementCheckboxProps) {
  return (
    <div
      className={cn('flex items-center justify-between py-4 border-b border-border/50', className)}
      data-testid={`agreement-item-${item.id}`}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          id={`agreement-${item.id}`}
          checked={checked}
          onCheckedChange={onChange}
          aria-label={item.label}
        />
        <label htmlFor={`agreement-${item.id}`} className="flex flex-col cursor-pointer">
          <span className="text-sm">
            <span
              className={cn(
                'font-medium',
                item.required ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              ({item.required ? '필수' : '선택'})
            </span>
            <span className="ml-1 text-foreground">{item.label}</span>
          </span>
          {item.description && (
            <span className="text-xs text-muted-foreground mt-0.5">{item.description}</span>
          )}
        </label>
      </div>

      <Link
        href={item.detailUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 hover:bg-muted rounded-lg transition-colors"
        aria-label={`${item.label} 상세 보기`}
      >
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </Link>
    </div>
  );
}

export default AgreementCheckbox;
