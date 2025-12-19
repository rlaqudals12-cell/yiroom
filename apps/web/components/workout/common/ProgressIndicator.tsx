'use client';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  /** 색상 테마 (기본: primary - 모듈별 색상 지원) */
  color?: 'primary' | 'workout' | 'nutrition' | 'skin' | 'body' | 'personal-color';
}

// 모듈별 색상 테마 클래스 매핑 (CSS 변수 사용)
const colorClasses = {
  primary: 'bg-primary',
  workout: 'bg-module-workout',
  nutrition: 'bg-module-nutrition',
  skin: 'bg-module-skin',
  body: 'bg-module-body',
  'personal-color': 'bg-module-personal-color',
} as const;

export default function ProgressIndicator({
  currentStep,
  totalSteps,
  color = 'primary',
}: ProgressIndicatorProps) {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full">
      {/* 단계 텍스트 */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-foreground">
          {currentStep}/{totalSteps} 단계
        </span>
        <span className="text-sm text-muted-foreground">
          {Math.round(percentage)}%
        </span>
      </div>

      {/* 프로그레스 바 */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={0}
          aria-valuemax={totalSteps}
          className={`h-full ${colorClasses[color]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
