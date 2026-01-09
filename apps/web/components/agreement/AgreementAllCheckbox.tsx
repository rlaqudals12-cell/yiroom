'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface AgreementAllCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

/**
 * 전체 동의 체크박스
 * SDD-TERMS-AGREEMENT.md §6.2
 */
export function AgreementAllCheckbox({
  checked,
  indeterminate = false,
  onChange,
  className,
}: AgreementAllCheckboxProps) {
  return (
    <div
      className={cn('flex items-center gap-3 py-4 border-b-2 border-border', className)}
      data-testid="agreement-all"
    >
      <Checkbox
        id="agreement-all"
        checked={indeterminate ? 'indeterminate' : checked}
        onCheckedChange={onChange}
        aria-label="전체동의"
        className="w-5 h-5"
      />
      <label
        htmlFor="agreement-all"
        className="text-base font-semibold cursor-pointer text-foreground"
      >
        전체동의
      </label>
    </div>
  );
}

export default AgreementAllCheckbox;
