'use client';

/**
 * 공유 카드 테마 선택기
 * - 5개 테마 프리뷰 (기본/미드나잇/선셋/포레스트/미니멀)
 * - 선택된 테마에 체크 표시
 */

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { SHARE_THEME_OPTIONS } from './AnalysisShareCard';
import type { ShareCardTheme } from './AnalysisShareCard';

interface ShareThemePickerProps {
  value: ShareCardTheme;
  onChange: (theme: ShareCardTheme) => void;
  className?: string;
}

export function ShareThemePicker({ value, onChange, className }: ShareThemePickerProps) {
  return (
    <div
      className={cn('flex gap-2', className)}
      role="radiogroup"
      aria-label="공유 카드 테마 선택"
      data-testid="share-theme-picker"
    >
      {SHARE_THEME_OPTIONS.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          role="radio"
          aria-checked={value === option.id}
          aria-label={option.name}
          className={cn(
            'relative w-10 h-10 rounded-lg transition-all',
            option.preview,
            value === option.id
              ? 'ring-2 ring-violet-500 ring-offset-2 scale-110'
              : 'hover:scale-105 opacity-70 hover:opacity-100'
          )}
        >
          {value === option.id && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Check className="w-4 h-4 text-white drop-shadow-md" />
            </div>
          )}
          <span className="sr-only">{option.name}</span>
        </button>
      ))}
    </div>
  );
}
