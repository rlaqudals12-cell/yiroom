'use client';

/**
 * Phase D: 빠른 질문 버튼 컴포넌트
 */

import { Button } from '@/components/ui/button';
import { SKIN_CONCERN_ICONS, type SkinConcern } from '@/types/skin-consultation';
import { QUICK_QUESTIONS } from '@/lib/mock/skin-consultation';

interface QuickQuestionsProps {
  onQuestionClick: (question: string, concern: SkinConcern) => void;
  disabled?: boolean;
}

export default function QuickQuestions({ onQuestionClick, disabled }: QuickQuestionsProps) {
  return (
    <div className="flex flex-wrap gap-2" data-testid="quick-questions">
      {QUICK_QUESTIONS.map((q) => (
        <Button
          key={q.concern}
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => onQuestionClick(q.question, q.concern)}
          disabled={disabled}
        >
          <span className="mr-1">{SKIN_CONCERN_ICONS[q.concern]}</span>
          {q.label}
        </Button>
      ))}
    </div>
  );
}
