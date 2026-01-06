'use client';

/**
 * 각도 선택 컴포넌트
 * @description 다각도 촬영에서 좌/우 사진 추가 선택 UI
 */

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, SkipForward, Check } from 'lucide-react';
import type { FaceAngle } from '@/types/visual-analysis';

interface AngleSelectorProps {
  /** 이미 촬영된 각도 목록 */
  capturedAngles: FaceAngle[];
  /** 각도 선택 핸들러 */
  onSelectAngle: (angle: FaceAngle) => void;
  /** 건너뛰기 핸들러 */
  onSkip: () => void;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 추가 클래스 */
  className?: string;
}

export function AngleSelector({
  capturedAngles,
  onSelectAngle,
  onSkip,
  disabled = false,
  className,
}: AngleSelectorProps) {
  const hasLeft = capturedAngles.includes('left');
  const hasRight = capturedAngles.includes('right');

  // 모든 추가 사진이 촬영됨
  const allCaptured = hasLeft && hasRight;

  if (allCaptured) {
    return (
      <div className={cn('text-center', className)} data-testid="angle-selector">
        <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
          <Check className="w-5 h-5" />
          <span className="font-medium">모든 사진이 준비되었어요</span>
        </div>
        <Button onClick={onSkip} className="w-full">
          분석 시작하기
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)} data-testid="angle-selector">
      {/* 안내 문구 */}
      <p className="text-center text-muted-foreground text-sm">
        정확도를 높이려면 좌/우 사진도 추가해주세요
      </p>

      {/* 각도 선택 버튼 */}
      <div className="flex gap-3 justify-center">
        <Button
          variant={hasLeft ? 'secondary' : 'outline'}
          size="lg"
          onClick={() => onSelectAngle('left')}
          disabled={disabled || hasLeft}
          className="flex-1 max-w-[140px]"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {hasLeft ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              좌측 완료
            </>
          ) : (
            '좌측 추가'
          )}
        </Button>

        <Button
          variant={hasRight ? 'secondary' : 'outline'}
          size="lg"
          onClick={() => onSelectAngle('right')}
          disabled={disabled || hasRight}
          className="flex-1 max-w-[140px]"
        >
          {hasRight ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              우측 완료
            </>
          ) : (
            '우측 추가'
          )}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* 건너뛰기 버튼 */}
      <Button
        variant="ghost"
        onClick={onSkip}
        disabled={disabled}
        className="w-full text-muted-foreground"
      >
        <SkipForward className="w-4 h-4 mr-2" />
        건너뛰고 분석하기
      </Button>

      {/* 촬영 현황 */}
      <div className="flex justify-center gap-2">
        <StatusDot captured={true} label="정면" />
        <StatusDot captured={hasLeft} label="좌측" />
        <StatusDot captured={hasRight} label="우측" />
      </div>
    </div>
  );
}

// 촬영 상태 표시 점
function StatusDot({ captured, label }: { captured: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className={cn('w-2 h-2 rounded-full', captured ? 'bg-green-500' : 'bg-gray-300')} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export default AngleSelector;
