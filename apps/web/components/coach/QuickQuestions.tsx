'use client';

import { cn } from '@/lib/utils';

interface QuickQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
  disabled?: boolean;
  variant?: 'default' | 'compact';
}

export function QuickQuestions({
  questions,
  onSelect,
  disabled = false,
  variant = 'default',
}: QuickQuestionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((question, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(question)}
          disabled={disabled}
          className={cn(
            'text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
            variant === 'default'
              ? 'px-4 py-2 text-sm bg-muted/50 hover:bg-primary/10 hover:text-primary rounded-full border border-border hover:border-primary/30'
              : 'px-3 py-1.5 text-xs bg-muted/30 hover:bg-primary/10 hover:text-primary rounded-full border border-transparent hover:border-primary/20'
          )}
        >
          {question}
        </button>
      ))}
    </div>
  );
}
