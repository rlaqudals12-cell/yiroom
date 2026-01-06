'use client';

import { cn } from '@/lib/utils';

interface MoodSelectorProps {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const MOOD_OPTIONS = [
  { value: 1, emoji: '😢', label: '매우 안좋음' },
  { value: 2, emoji: '😔', label: '안좋음' },
  { value: 3, emoji: '😐', label: '보통' },
  { value: 4, emoji: '🙂', label: '좋음' },
  { value: 5, emoji: '😊', label: '매우 좋음' },
];

export function MoodSelector({ value, onChange, disabled }: MoodSelectorProps) {
  return (
    <div className="flex justify-between gap-2" data-testid="mood-selector">
      {MOOD_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          disabled={disabled}
          className={cn(
            'flex flex-col items-center gap-1 p-3 rounded-xl transition-all',
            'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary',
            value === option.value
              ? 'bg-primary/10 ring-2 ring-primary scale-110'
              : 'bg-card border border-border'
          )}
          aria-label={option.label}
          aria-pressed={value === option.value}
        >
          <span className="text-2xl">{option.emoji}</span>
          <span className="text-xs text-muted-foreground">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

export default MoodSelector;
