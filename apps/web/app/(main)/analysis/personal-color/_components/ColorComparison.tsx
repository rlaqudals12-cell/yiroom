'use client';

import { useState, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  COLOR_COMPARISON_SETS,
  type ColorComparisonAnswer,
} from '@/lib/mock/personal-color';

interface ColorComparisonProps {
  imageUrl: string; // 사용자 얼굴 이미지 URL
  onComplete: (answers: ColorComparisonAnswer[]) => void;
  onBack?: () => void;
}

export default function ColorComparison({
  imageUrl,
  onComplete,
  onBack,
}: ColorComparisonProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<ColorComparisonAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const currentSet = COLOR_COMPARISON_SETS[currentIndex];
  const totalSets = COLOR_COMPARISON_SETS.length;
  const progress = ((currentIndex + 1) / totalSets) * 100;

  // 옵션 선택 핸들러
  const handleOptionSelect = useCallback((optionId: string) => {
    setSelectedOption(optionId);
  }, []);

  // 다음으로 이동
  const handleNext = useCallback(() => {
    if (!selectedOption) return;

    const newAnswer: ColorComparisonAnswer = {
      setId: currentSet.id,
      selectedOptionId: selectedOption,
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    if (currentIndex < totalSets - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      // 마지막 세트 완료
      onComplete(updatedAnswers);
    }
  }, [currentIndex, totalSets, selectedOption, currentSet.id, answers, onComplete]);

  // 이전으로 이동
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      // 이전 답변 복원
      const prevAnswer = answers[currentIndex - 1];
      setSelectedOption(prevAnswer?.selectedOptionId || null);
      setAnswers((prev) => prev.slice(0, -1));
    } else if (onBack) {
      onBack();
    }
  }, [currentIndex, answers, onBack]);

  return (
    <div data-testid="color-comparison" className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={handlePrev}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="이전"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-foreground">
            가상 드레이핑
          </h2>
          <p className="text-xs text-muted-foreground">
            {currentIndex + 1} / {totalSets}
          </p>
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-personal-color rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 질문 */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-foreground">
          {currentSet.question}
        </h3>
        <p className="text-sm text-muted-foreground">
          {currentSet.description}
        </p>
      </div>

      {/* 배경색 비교 카드 */}
      <div className="grid grid-cols-2 gap-4">
        {currentSet.options.map((option) => {
          const isSelected = selectedOption === option.id;
          return (
            <button
              key={option.id}
              onClick={() => handleOptionSelect(option.id)}
              className={`relative aspect-[3/4] rounded-2xl overflow-hidden transition-all duration-200 ${
                isSelected
                  ? 'ring-4 ring-module-personal-color ring-offset-2 scale-[1.02]'
                  : 'ring-1 ring-border hover:ring-2 hover:ring-muted-foreground'
              }`}
            >
              {/* 배경색 */}
              <div
                className="absolute inset-0"
                style={{ backgroundColor: option.hex }}
              />

              {/* 얼굴 이미지 (중앙 원형) */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3/4 aspect-square rounded-full overflow-hidden border-4 border-white/50 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="내 얼굴"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* 라벨 */}
              <div
                className={`absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full font-bold text-sm ${
                  isSelected
                    ? 'bg-module-personal-color text-white'
                    : 'bg-white/80 text-foreground'
                }`}
              >
                {option.label}
              </div>

              {/* 선택 체크 */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-8 h-8 bg-module-personal-color rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 안내 문구 */}
      <p className="text-center text-xs text-muted-foreground">
        피부가 더 밝고 건강해 보이는 쪽을 선택해주세요
      </p>

      {/* 다음 버튼 */}
      <Button
        onClick={handleNext}
        disabled={!selectedOption}
        className="w-full h-12 bg-gradient-personal-color hover:opacity-90 text-white font-medium disabled:opacity-50"
      >
        {currentIndex === totalSets - 1 ? '결과 보기' : '다음'}
      </Button>

      {/* 진행 상태 인디케이터 */}
      <div className="flex justify-center gap-2">
        {COLOR_COMPARISON_SETS.map((_, index) => {
          const hasAnswer = index < answers.length;
          const isCurrent = index === currentIndex;
          return (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                isCurrent
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
