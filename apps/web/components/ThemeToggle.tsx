'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  /** 컴팩트 모드 (아이콘만 표시) */
  compact?: boolean;
  className?: string;
}

/**
 * 다크모드 토글 컴포넌트
 * - light/dark/system 3가지 모드 지원
 * - 로컬스토리지에 설정 저장
 * - 시스템 테마 자동 감지
 */
export function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const themes = [
    { value: 'light' as const, icon: Sun, label: '라이트' },
    { value: 'dark' as const, icon: Moon, label: '다크' },
    { value: 'system' as const, icon: Monitor, label: '시스템' },
  ];

  if (compact) {
    // 컴팩트 모드: 현재 테마 아이콘만 표시, 클릭 시 순환
    const currentIndex = themes.findIndex((t) => t.value === theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun;

    return (
      <button
        onClick={() => setTheme(themes[nextIndex].value)}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          className
        )}
        aria-label={`현재 테마: ${themes[currentIndex].label}. 클릭하여 ${themes[nextIndex].label} 모드로 변경`}
      >
        <CurrentIcon className="w-5 h-5 text-foreground" />
      </button>
    );
  }

  // 풀 모드: 3개 버튼 표시
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 p-1 rounded-xl bg-muted',
        className
      )}
      role="radiogroup"
      aria-label="테마 선택"
    >
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          role="radio"
          aria-checked={theme === value}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
            theme === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

export default ThemeToggle;
