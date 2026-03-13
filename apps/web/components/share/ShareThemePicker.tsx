'use client';

/**
 * 공유 카드 테마 + 포맷 선택기
 * - 포맷 토글: 정사각형(1:1) / 스토리(9:16)
 * - 5개 테마 프리뷰 (기본/미드나잇/선셋/포레스트/미니멀)
 * - 선택된 항목에 체크/활성 표시
 */

import { cn } from '@/lib/utils';
import { Check, Square, RectangleVertical } from 'lucide-react';
import { SHARE_THEME_OPTIONS } from './AnalysisShareCard';
import type { ShareCardTheme, ShareCardFormat } from './AnalysisShareCard';

interface ShareThemePickerProps {
  value: ShareCardTheme;
  onChange: (theme: ShareCardTheme) => void;
  format?: ShareCardFormat;
  onFormatChange?: (format: ShareCardFormat) => void;
  className?: string;
}

// 포맷 옵션 정의
const FORMAT_OPTIONS: Array<{ id: ShareCardFormat; label: string; Icon: typeof Square }> = [
  { id: '1:1', label: '정사각형', Icon: Square },
  { id: '9:16', label: '스토리', Icon: RectangleVertical },
];

export function ShareThemePicker({
  value,
  onChange,
  format = '1:1',
  onFormatChange,
  className,
}: ShareThemePickerProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)} data-testid="share-theme-picker">
      {/* 포맷 토글 */}
      {onFormatChange && (
        <div role="radiogroup" aria-label="공유 카드 형식" className="flex gap-2">
          {FORMAT_OPTIONS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => onFormatChange(id)}
              role="radio"
              aria-checked={format === id}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                format === id
                  ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-300'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* 테마 선택 */}
      <div className="flex gap-2" role="radiogroup" aria-label="공유 카드 테마 선택">
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
    </div>
  );
}
