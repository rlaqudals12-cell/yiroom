'use client';

import { Check } from 'lucide-react';
import { ReactNode, useCallback, KeyboardEvent } from 'react';

interface SelectionCardProps {
  mode: 'single' | 'multiple';
  selected: boolean;
  onSelect: () => void;
  icon?: ReactNode;
  title: string;
  description?: string;
  disabled?: boolean;
  compact?: boolean;
  /** 에러 상태 표시 */
  error?: boolean;
  /** 에러 메시지 (스크린 리더용) */
  errorMessage?: string;
}

export default function SelectionCard({
  mode,
  selected,
  onSelect,
  icon,
  title,
  description,
  disabled = false,
  compact = false,
  error = false,
  errorMessage,
}: SelectionCardProps) {
  // 키보드 네비게이션 핸들러
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!disabled) {
          onSelect();
        }
      }
    },
    [disabled, onSelect]
  );

  // 동적 aria-label 생성
  const ariaLabel = `${title}${description ? `, ${description}` : ''}${selected ? ', 선택됨' : ''}${error ? `, 오류: ${errorMessage || '선택 필요'}` : ''}`;

  return (
    <button
      type="button"
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      role={mode === 'multiple' ? 'checkbox' : 'radio'}
      aria-checked={selected}
      aria-label={ariaLabel}
      aria-invalid={error}
      aria-describedby={error && errorMessage ? `error-${title}` : undefined}
      className={`relative w-full rounded-xl border-2 text-left transition-all duration-200 ${
        compact ? 'p-3' : 'p-4'
      } ${
        error
          ? 'border-status-error bg-status-error/5'
          : selected
            ? 'border-primary bg-primary/10'
            : 'border-border bg-card hover:border-muted-foreground/30'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'} focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
    >
      {/* 체크 아이콘 */}
      {selected && (
        <div
          data-testid="check-icon"
          className={`absolute bg-primary rounded-full flex items-center justify-center ${
            compact ? 'top-2 right-2 w-5 h-5' : 'top-3 right-3 w-6 h-6'
          }`}
        >
          <Check className={compact ? 'w-3 h-3 text-white' : 'w-4 h-4 text-white'} />
        </div>
      )}

      {/* 아이콘 */}
      {icon && (
        <div className={compact ? 'text-xl mb-1' : 'text-2xl mb-2'}>{icon}</div>
      )}

      {/* 타이틀 */}
      <h3 className={`font-medium ${compact ? 'text-sm' : ''} ${selected ? 'text-primary' : 'text-foreground'}`}>
        {title}
      </h3>

      {/* 설명 */}
      {description && (
        <p className={`mt-1 ${compact ? 'text-xs' : 'text-sm'} ${selected ? 'text-primary/80' : 'text-muted-foreground'}`}>
          {description}
        </p>
      )}
    </button>
  );
}
