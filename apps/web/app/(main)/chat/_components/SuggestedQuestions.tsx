'use client';

/**
 * 추천 질문 컴포넌트
 */

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SuggestedQuestion } from '@/types/chat';

// 기본 추천 질문
const DEFAULT_QUESTIONS: SuggestedQuestion[] = [
  // ADR-098: 시각 정체성 5축 질문만 (운동/영양 제거)
  { id: 'q1', text: '내 피부 타입에 맞는 스킨케어 루틴은?', category: 'skin' },
  { id: 'q2', text: '나에게 어울리는 립 컬러 추천해줘', category: 'color' },
  { id: 'q3', text: '내 체형에 어울리는 코디 스타일 알려줘', category: 'body' },
  { id: 'q4', text: '내 퍼스널 컬러에 맞는 메이크업은?', category: 'color' },
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
