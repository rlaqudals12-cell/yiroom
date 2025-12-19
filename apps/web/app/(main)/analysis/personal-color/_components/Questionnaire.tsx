'use client';

import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ONBOARDING_QUESTIONS,
  type QuestionnaireAnswer,
} from '@/lib/mock/personal-color';

interface QuestionnaireProps {
  onComplete: (answers: QuestionnaireAnswer[]) => void;
}

export default function Questionnaire({ onComplete }: QuestionnaireProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswer[]>([]);

  const currentQuestion = ONBOARDING_QUESTIONS[currentIndex];
  const totalQuestions = ONBOARDING_QUESTIONS.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  // 현재 질문에 대한 답변 찾기
  const currentAnswer = answers.find(
    (a) => a.questionId === currentQuestion.id
  );

  // 옵션 선택 핸들러
  const handleOptionSelect = useCallback(
    (optionId: string) => {
      setAnswers((prev) => {
        const filtered = prev.filter(
          (a) => a.questionId !== currentQuestion.id
        );
        return [...filtered, { questionId: currentQuestion.id, optionId }];
      });
    },
    [currentQuestion.id]
  );

  // 다음 질문으로 이동
  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // 마지막 질문 완료
      onComplete(answers);
    }
  }, [currentIndex, totalQuestions, answers, onComplete]);

  // 이전 질문으로 이동
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  return (
    <div className="space-y-6">
      {/* 진행률 바 */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>
            질문 {currentIndex + 1} / {totalQuestions}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-personal-color rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 질문 카드 */}
      <div className="bg-card rounded-xl border p-6 min-h-[400px] flex flex-col">
        {/* 질문 */}
        <div className="mb-6">
          <span className="inline-block px-3 py-1 bg-module-personal-color/20 text-module-personal-color text-xs font-medium rounded-full mb-3">
            Q{currentQuestion.number}
            {currentQuestion.weight > 1 && ' (중요)'}
          </span>
          <h2 className="text-xl font-semibold text-foreground">
            {currentQuestion.question}
          </h2>
        </div>

        {/* 옵션 목록 */}
        <div className="flex-1 space-y-3">
          {currentQuestion.options.map((option) => {
            const isSelected = currentAnswer?.optionId === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-module-personal-color bg-module-personal-color-light'
                    : 'border-border hover:border-module-personal-color/50 hover:bg-muted'
                }`}
              >
                <span
                  className={`text-base ${
                    isSelected
                      ? 'text-module-personal-color-dark font-medium'
                      : 'text-foreground/80'
                  }`}
                >
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>

        {/* 네비게이션 버튼 */}
        <div className="flex gap-3 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex-1 h-12"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            이전
          </Button>
          <Button
            onClick={handleNext}
            disabled={!currentAnswer}
            className="flex-1 h-12 bg-gradient-personal-color hover:opacity-90"
          >
            {currentIndex === totalQuestions - 1 ? '완료' : '다음'}
            {currentIndex < totalQuestions - 1 && (
              <ChevronRight className="w-4 h-4 ml-1" />
            )}
          </Button>
        </div>
      </div>

      {/* 진행 상태 인디케이터 */}
      <div className="flex justify-center gap-1.5">
        {ONBOARDING_QUESTIONS.map((_, index) => {
          const hasAnswer = answers.some(
            (a) => a.questionId === ONBOARDING_QUESTIONS[index].id
          );
          return (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-6 bg-module-personal-color'
                  : hasAnswer
                    ? 'bg-module-personal-color/50'
                    : 'bg-muted'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
