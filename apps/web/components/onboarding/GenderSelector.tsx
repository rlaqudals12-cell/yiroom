'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  GenderPreference,
  StylePreference,
  UserGenderProfile,
  createDefaultGenderProfile,
} from '@/lib/content/gender-adaptive';

interface GenderOption {
  value: GenderPreference;
  label: string;
  description: string;
  icon: string;
}

interface StyleOption {
  value: StylePreference;
  label: string;
  description: string;
}

const GENDER_OPTIONS: GenderOption[] = [
  {
    value: 'female',
    label: '여성',
    description: '여성 맞춤 스타일링',
    icon: '👩',
  },
  {
    value: 'male',
    label: '남성',
    description: '남성 맞춤 스타일링',
    icon: '👨',
  },
  {
    value: 'neutral',
    label: '선택 안함',
    description: '모든 스타일 보기',
    icon: '🌟',
  },
];

const STYLE_OPTIONS: StyleOption[] = [
  {
    value: 'feminine',
    label: '페미닌',
    description: '우아하고 부드러운 스타일',
  },
  {
    value: 'masculine',
    label: '매스큘린',
    description: '깔끔하고 세련된 스타일',
  },
  {
    value: 'unisex',
    label: '유니섹스',
    description: '성별 구분 없는 스타일',
  },
];

interface GenderSelectorProps {
  /** 초기 프로필 값 */
  initialProfile?: Partial<UserGenderProfile>;
  /** 성별 선택 시 콜백 */
  onSelect?: (profile: UserGenderProfile) => void;
  /** 스타일 선호도도 선택하게 할지 여부 */
  includeStylePreference?: boolean;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 커스텀 className */
  className?: string;
}

/**
 * 성별 선택 컴포넌트
 *
 * K-1 성별 중립화: 사용자가 성별 및 스타일 선호도를 선택하여
 * 개인화된 콘텐츠를 받을 수 있도록 함
 *
 * @example
 * ```tsx
 * <GenderSelector
 *   includeStylePreference
 * />
 * ```
 */
export function GenderSelector({
  initialProfile,
  onSelect,
  includeStylePreference = false,
  disabled = false,
  className,
}: GenderSelectorProps) {
  const [selectedGender, setSelectedGender] = useState<GenderPreference | null>(
    initialProfile?.gender ?? null
  );
  const [selectedStyle, setSelectedStyle] = useState<StylePreference | null>(
    initialProfile?.stylePreference ?? null
  );

  // 성별 선택 핸들러
  const handleGenderSelect = useCallback(
    (gender: GenderPreference) => {
      setSelectedGender(gender);

      // 스타일 선호도 자동 설정 (성별에 맞는 기본값)
      const defaultProfile = createDefaultGenderProfile(gender);
      setSelectedStyle(defaultProfile.stylePreference);

      // 스타일 선호도 선택이 필요 없으면 즉시 콜백
      if (!includeStylePreference) {
        onSelect?.(defaultProfile);
      }
    },
    [includeStylePreference, onSelect]
  );

  // 스타일 선호도 선택 핸들러
  const handleStyleSelect = useCallback(
    (style: StylePreference) => {
      setSelectedStyle(style);

      if (selectedGender) {
        onSelect?.({
          gender: selectedGender,
          stylePreference: style,
        });
      }
    },
    [selectedGender, onSelect]
  );

  // 확인 버튼 핸들러
  const handleConfirm = useCallback(() => {
    if (selectedGender && selectedStyle) {
      onSelect?.({
        gender: selectedGender,
        stylePreference: selectedStyle,
      });
    }
  }, [selectedGender, selectedStyle, onSelect]);

  return (
    <div className={cn('space-y-6', className)} data-testid="gender-selector">
      {/* 성별 선택 */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-foreground">성별 선택</h3>
        <p className="text-sm text-muted-foreground">맞춤 스타일링을 위해 성별을 선택해주세요</p>
        <div className="grid grid-cols-3 gap-3">
          {GENDER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleGenderSelect(option.value)}
              disabled={disabled}
              className={cn(
                'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all',
                'hover:border-primary/50 hover:bg-primary/5',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                selectedGender === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-background'
              )}
              data-testid={`gender-option-${option.value}`}
              aria-pressed={selectedGender === option.value}
              aria-label={`${option.label} 선택`}
            >
              <span className="text-3xl mb-2" role="img" aria-hidden="true">
                {option.icon}
              </span>
              <span className="font-medium text-foreground">{option.label}</span>
              <span className="text-xs text-muted-foreground mt-1 text-center">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 스타일 선호도 선택 (옵션) */}
      {includeStylePreference && selectedGender && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h3 className="text-lg font-medium text-foreground">스타일 선호도</h3>
          <p className="text-sm text-muted-foreground">선호하는 스타일을 선택해주세요</p>
          <div className="grid grid-cols-3 gap-3">
            {STYLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleStyleSelect(option.value)}
                disabled={disabled}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all',
                  'hover:border-primary/50 hover:bg-primary/5',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  selectedStyle === option.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-background'
                )}
                data-testid={`style-option-${option.value}`}
                aria-pressed={selectedStyle === option.value}
                aria-label={`${option.label} 스타일 선택`}
              >
                <span className="font-medium text-foreground">{option.label}</span>
                <span className="text-xs text-muted-foreground mt-1 text-center">
                  {option.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 확인 버튼 (스타일 선호도 선택 시에만 표시) */}
      {includeStylePreference && selectedGender && selectedStyle && (
        <div className="pt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Button
            onClick={handleConfirm}
            disabled={disabled}
            className="w-full"
            size="lg"
            data-testid="gender-selector-confirm"
          >
            선택 완료
          </Button>
        </div>
      )}
    </div>
  );
}

export { GENDER_OPTIONS, STYLE_OPTIONS };
export type { GenderSelectorProps };
