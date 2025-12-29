'use client';

/**
 * 추천 질문 컴포넌트
 */

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SuggestedQuestion } from '@/types/chat';

// 기본 추천 질문
const DEFAULT_QUESTIONS: SuggestedQuestion[] = [
  { id: 'q1', text: '내 피부 타입에 맞는 스킨케어 루틴은?', category: 'skin' },
  { id: 'q2', text: '나에게 어울리는 립 컬러 추천해줘', category: 'color' },
  { id: 'q3', text: '체형에 맞는 운동 추천해줘', category: 'body' },
  { id: 'q4', text: '하루 단백질 섭취량은 얼마가 적당할까?', category: 'nutrition' },
];

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
  questions?: SuggestedQuestion[];
}

export function SuggestedQuestions({
  onSelect,
  questions = DEFAULT_QUESTIONS,
}: SuggestedQuestionsProps) {
  return (
    <div data-testid="suggested-questions" className="p-4 border-t bg-muted/30">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">추천 질문</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((q) => (
          <Button
            key={q.id}
            variant="outline"
            size="sm"
            className="text-xs h-auto py-1.5 px-3"
            onClick={() => onSelect(q.text)}
          >
            {q.text}
          </Button>
        ))}
      </div>
    </div>
  );
}
