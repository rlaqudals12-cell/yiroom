'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * StepProgress 변형 정의
 *
 * 다단계 프로세스의 진행 상황을 표시하는 컴포넌트
 * - horizontal: 가로 배치 (기본)
 * - vertical: 세로 배치
 */
const stepProgressVariants = cva('flex', {
  variants: {
    orientation: {
      horizontal: 'flex-row items-center gap-2',
      vertical: 'flex-col items-start gap-4',
    },
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
    size: 'md',
  },
});

const stepIndicatorVariants = cva(
  'flex items-center justify-center rounded-full font-medium transition-all duration-300',
  {
    variants: {
      status: {
        completed:
          'bg-primary text-primary-foreground',
        current:
          'bg-primary/20 text-primary ring-2 ring-primary ring-offset-2 ring-offset-background',
        upcoming:
          'bg-muted text-muted-foreground',
      },
      size: {
        sm: 'size-6 text-xs',
        md: 'size-8 text-sm',
        lg: 'size-10 text-base',
      },
    },
    defaultVariants: {
      status: 'upcoming',
      size: 'md',
    },
  }
);

const stepConnectorVariants = cva('transition-all duration-300', {
  variants: {
    orientation: {
      horizontal: 'h-0.5 flex-1 min-w-8',
      vertical: 'w-0.5 min-h-8 ml-4',
    },
    completed: {
      true: 'bg-primary',
      false: 'bg-muted',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
    completed: false,
  },
});

export interface Step {
  /** 단계 ID (고유값) */
  id: string;
  /** 단계 라벨 */
  label: string;
  /** 단계 설명 (선택) */
  description?: string;
}

export interface StepProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof stepProgressVariants> {
  /** 단계 목록 */
  steps: Step[];
  /** 현재 단계 인덱스 (0-based) */
  currentStep: number;
  /** 단계 라벨 표시 여부 */
  showLabels?: boolean;
  /** 모듈별 색상 변형 */
  moduleColor?: 'skin' | 'body' | 'personalColor' | 'face' | 'hair' | 'workout' | 'nutrition';
}

/**
 * StepProgress - 단계별 진행 표시기
 *
 * 분석 플로우, 온보딩 등 다단계 프로세스에 사용
 *
 * @example
 * // 기본 사용
 * <StepProgress
 *   steps={[
 *     { id: 'upload', label: '사진 업로드' },
 *     { id: 'analyze', label: '분석 중' },
 *     { id: 'result', label: '결과' },
 *   ]}
 *   currentStep={1}
 * />
 *
 * // 세로 배치
 * <StepProgress
 *   steps={steps}
 *   currentStep={2}
 *   orientation="vertical"
 *   showLabels
 * />
 *
 * // 모듈 색상 적용
 * <StepProgress
 *   steps={steps}
 *   currentStep={0}
 *   moduleColor="skin"
 * />
 */
function StepProgress({
  className,
  orientation = 'horizontal',
  size = 'md',
  steps,
  currentStep,
  showLabels = true,
  moduleColor,
  ...props
}: StepProgressProps): React.JSX.Element {
  // 모듈별 색상 클래스 매핑
  const moduleColorClasses: Record<string, string> = {
    skin: 'text-module-skin [&_[data-completed=true]]:bg-module-skin [&_[data-current=true]]:ring-module-skin [&_[data-current=true]]:text-module-skin [&_[data-current=true]]:bg-module-skin/20',
    body: 'text-module-body [&_[data-completed=true]]:bg-module-body [&_[data-current=true]]:ring-module-body [&_[data-current=true]]:text-module-body [&_[data-current=true]]:bg-module-body/20',
    personalColor: 'text-module-personal-color [&_[data-completed=true]]:bg-module-personal-color [&_[data-current=true]]:ring-module-personal-color [&_[data-current=true]]:text-module-personal-color [&_[data-current=true]]:bg-module-personal-color/20',
    face: 'text-module-face [&_[data-completed=true]]:bg-module-face [&_[data-current=true]]:ring-module-face [&_[data-current=true]]:text-module-face [&_[data-current=true]]:bg-module-face/20',
    hair: 'text-module-hair [&_[data-completed=true]]:bg-module-hair [&_[data-current=true]]:ring-module-hair [&_[data-current=true]]:text-module-hair [&_[data-current=true]]:bg-module-hair/20',
    workout: 'text-module-workout [&_[data-completed=true]]:bg-module-workout [&_[data-current=true]]:ring-module-workout [&_[data-current=true]]:text-module-workout [&_[data-current=true]]:bg-module-workout/20',
    nutrition: 'text-module-nutrition [&_[data-completed=true]]:bg-module-nutrition [&_[data-current=true]]:ring-module-nutrition [&_[data-current=true]]:text-module-nutrition [&_[data-current=true]]:bg-module-nutrition/20',
  };

  const getStepStatus = (index: number): 'completed' | 'current' | 'upcoming' => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div
      data-slot="step-progress"
      data-testid="step-progress"
      className={cn(
        stepProgressVariants({ orientation, size }),
        moduleColor && moduleColorClasses[moduleColor],
        className
      )}
      role="progressbar"
      aria-valuenow={currentStep + 1}
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-label={`${steps.length}단계 중 ${currentStep + 1}단계`}
      {...props}
    >
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const isLast = index === steps.length - 1;
        const isCompleted = status === 'completed';
        const isCurrent = status === 'current';

        return (
          <React.Fragment key={step.id}>
            <div
              className={cn(
                'flex',
                orientation === 'horizontal'
                  ? 'flex-col items-center gap-1'
                  : 'flex-row items-start gap-3'
              )}
            >
              {/* 단계 인디케이터 */}
              <div
                className={cn(stepIndicatorVariants({ status, size }))}
                data-completed={isCompleted}
                data-current={isCurrent}
              >
                {isCompleted ? (
                  <Check
                    className={cn(
                      size === 'sm' && 'size-3',
                      size === 'md' && 'size-4',
                      size === 'lg' && 'size-5'
                    )}
                    aria-hidden="true"
                  />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* 라벨 */}
              {showLabels && (
                <div
                  className={cn(
                    'flex flex-col',
                    orientation === 'horizontal' && 'items-center text-center',
                    orientation === 'vertical' && 'items-start'
                  )}
                >
                  <span
                    className={cn(
                      'font-medium',
                      size === 'sm' && 'text-xs',
                      size === 'md' && 'text-sm',
                      size === 'lg' && 'text-base',
                      isCurrent && 'text-primary',
                      isCompleted && 'text-primary',
                      !isCurrent && !isCompleted && 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                  {step.description && orientation === 'vertical' && (
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {step.description}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 커넥터 (마지막 단계 제외) */}
            {!isLast && (
              <div
                className={cn(
                  stepConnectorVariants({
                    orientation,
                    completed: isCompleted,
                  }),
                  moduleColor && isCompleted && `bg-module-${moduleColor}`
                )}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export { StepProgress, stepProgressVariants, stepIndicatorVariants, stepConnectorVariants };
