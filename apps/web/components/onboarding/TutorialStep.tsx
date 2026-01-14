'use client';

import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { TutorialStep as TutorialStepType } from '@/hooks/useOnboardingTutorial';

interface TutorialStepProps {
  step: TutorialStepType;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

/**
 * 튜토리얼 개별 스텝 컴포넌트
 * - 타겟 요소 하이라이트
 * - 위치에 따른 팝오버 배치
 * - 진행 표시기
 */
export function TutorialStep({
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}: TutorialStepProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === totalSteps - 1;

  // 타겟 요소 찾기 및 위치 계산
  useEffect(() => {
    const calculatePosition = () => {
      if (!step.targetSelector) {
        // 타겟이 없으면 화면 중앙에 배치
        setPosition({
          top: window.innerHeight / 2 - 150,
          left: window.innerWidth / 2 - 160,
        });
        setTargetRect(null);
        return;
      }

      const targetElement = document.querySelector(step.targetSelector);
      if (!targetElement) {
        // 타겟을 찾지 못하면 중앙 배치
        setPosition({
          top: window.innerHeight / 2 - 150,
          left: window.innerWidth / 2 - 160,
        });
        setTargetRect(null);
        return;
      }

      const rect = targetElement.getBoundingClientRect();
      setTargetRect(rect);

      const cardWidth = 320;
      const cardHeight = 200;
      const margin = 16;

      let top = 0;
      let left = 0;

      switch (step.position) {
        case 'top':
          top = rect.top - cardHeight - margin;
          left = rect.left + rect.width / 2 - cardWidth / 2;
          break;
        case 'bottom':
          top = rect.bottom + margin;
          left = rect.left + rect.width / 2 - cardWidth / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - cardHeight / 2;
          left = rect.left - cardWidth - margin;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - cardHeight / 2;
          left = rect.right + margin;
          break;
        default:
          top = rect.bottom + margin;
          left = rect.left + rect.width / 2 - cardWidth / 2;
      }

      // 화면 경계 보정
      top = Math.max(margin, Math.min(top, window.innerHeight - cardHeight - margin));
      left = Math.max(margin, Math.min(left, window.innerWidth - cardWidth - margin));

      setPosition({ top, left });
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition);

    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition);
    };
  }, [step.targetSelector, step.position]);

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black/60 z-[100]"
        data-testid="tutorial-overlay"
        onClick={onSkip}
      />

      {/* 스포트라이트 (타겟 요소 하이라이트) */}
      {targetRect && (
        <div
          className="fixed z-[101] rounded-lg ring-4 ring-primary ring-offset-4 ring-offset-background pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
          data-testid="tutorial-spotlight"
        />
      )}

      {/* 튜토리얼 카드 */}
      <Card
        ref={cardRef}
        className={cn(
          'fixed z-[102] w-80 shadow-xl animate-in fade-in-0 slide-in-from-bottom-4 duration-300',
          'border-primary/20'
        )}
        style={{
          top: position.top,
          left: position.left,
        }}
        data-testid="tutorial-step-card"
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-base font-semibold">{step.title}</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mr-2 -mt-1"
              onClick={onSkip}
              aria-label="튜토리얼 닫기"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
        </CardContent>

        <CardFooter className="flex items-center justify-between pt-2 border-t">
          {/* 진행률 */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  i === stepIndex ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>

          {/* 네비게이션 버튼 */}
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button variant="ghost" size="sm" onClick={onPrev} className="h-8 px-2">
                <ChevronLeft className="h-4 w-4 mr-1" />
                이전
              </Button>
            )}

            {/* 건너뛰기: 마지막 스텝 제외 모든 스텝에서 표시 */}
            {!isLastStep && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="h-8 px-2 text-muted-foreground"
              >
                건너뛰기
              </Button>
            )}

            {isLastStep ? (
              <Button size="sm" onClick={onComplete} className="h-8">
                시작하기
              </Button>
            ) : (
              <Button size="sm" onClick={onNext} className="h-8">
                다음
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
