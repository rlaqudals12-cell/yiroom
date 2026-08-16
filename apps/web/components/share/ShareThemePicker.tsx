'use client';

/**
 * 공유 카드 테마 + 포맷 선택기
 * - 포맷 토글: 정사각형(1:1) / 스토리(9:16)
 * - 5개 테마 프리뷰 (기본/미드나잇/선셋/포레스트/미니멀)
 * - 선택된 항목에 체크/활성 표시
 * - 사진 옵트인(기본 OFF): 켜야만 프로필 사진이 카드에 담긴다
 */

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Check, Square, RectangleVertical } from 'lucide-react';
import { SHARE_THEME_OPTIONS } from './AnalysisShareCard';
import type { ShareCardTheme, ShareCardFormat } from './AnalysisShareCard';

interface ShareThemePickerProps {
  value: ShareCardTheme;
  onChange: (theme: ShareCardTheme) => void;
  format?: ShareCardFormat;
  onFormatChange?: (format: ShareCardFormat) => void;
  /** 사진 포함 여부 — 기본 OFF. onPhotoOptInChange가 있어야 체크박스가 노출된다 */
  photoOptIn?: boolean;
  onPhotoOptInChange?: (optIn: boolean) => void;
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
  photoOptIn = false,
  onPhotoOptInChange,
  className,
}: ShareThemePickerProps) {
  const t = useTranslations('share');

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
                // 다크 계약 — 하드코딩 팔레트 금지, 테마 토큰만 사용
                format === id
                  ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
                ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
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

      {/* 사진 옵트인 — 기본 OFF. 얼굴이 담긴 이미지의 공유 여부는 사용자가 명시적으로 결정한다
          (통합 리포트 PersonaShareSection과 동일 계약) */}
      {onPhotoOptInChange && (
        <div className="max-w-[220px]">
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={photoOptIn}
              onChange={(e) => onPhotoOptInChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
              data-testid="share-photo-optin"
            />
            <span className="text-xs text-foreground">{t('photoOptIn')}</span>
          </label>
          <p className="mt-1.5 text-[11px] text-muted-foreground">{t('photoOptInNotice')}</p>
        </div>
      )}
    </div>
  );
}
