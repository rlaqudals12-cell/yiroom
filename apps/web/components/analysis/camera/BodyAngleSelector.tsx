'use client';

/**
 * 체형 분석 각도 선택 컴포넌트
 * @description 다각도 촬영에서 측면/후면 사진 추가 선택 UI
 */

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowRight, RotateCcw, SkipForward, Check } from 'lucide-react';
import type { BodyAngle } from './BodyGuideOverlay';

interface BodyAngleSelectorProps {
  /** 이미 촬영된 각도 목록 */
  capturedAngles: BodyAngle[];
  /** 각도 선택 핸들러 */
  onSelectAngle: (angle: BodyAngle) => void;
  /** 건너뛰기 핸들러 */
  onSkip: () => void;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 추가 클래스 */
  className?: string;
}

export function BodyAngleSelector({
  capturedAngles,
  onSelectAngle,
  onSkip,
  disabled = false,
  className,
}: BodyAngleSelectorProps) {
  const hasFront = capturedAngles.includes('front');
  const hasSide = capturedAngles.includes('side');
  const hasBack = capturedAngles.includes('back');

  // 모든 추가 사진이 촬영됨
  const allCaptured = hasFront && hasSide && hasBack;

  if (allCaptured) {
    return (
      <div className={cn('text-center', className)} data-testid="body-angle-selector">
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
    <div className={cn('space-y-4', className)} data-testid="body-angle-selector">
      {/* 안내 문구 */}
      <p className="text-center text-muted-foreground text-sm">
        정확도를 높이려면 다른 각도 사진도 추가해주세요
      </p>

      {/* 각도 선택 버튼 */}
      <div className="flex flex-col gap-3">
        {/* 측면 버튼 */}
        <Button
          variant={hasSide ? 'secondary' : 'outline'}
          size="lg"
          onClick={() => onSelectAngle('side')}
          disabled={disabled || hasSide}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            {hasSide ? (
              <>
                <Check className="w-4 h-4" />
                측면 촬영 완료
              </>
            ) : (
              '측면 추가 촬영'
            )}
          </div>
          {!hasSide && <ArrowRight className="w-4 h-4" />}
        </Button>

        {/* 후면 버튼 */}
        <Button
          variant={hasBack ? 'secondary' : 'outline'}
          size="lg"
          onClick={() => onSelectAngle('back')}
          disabled={disabled || hasBack}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            {hasBack ? (
              <>
                <Check className="w-4 h-4" />
                후면 촬영 완료
              </>
            ) : (
              '후면 추가 촬영'
            )}
          </div>
          {!hasBack && <ArrowRight className="w-4 h-4" />}
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
      <div className="flex justify-center gap-4">
        <StatusDot captured={hasFront} label="정면" />
        <StatusDot captured={hasSide} label="측면" />
        <StatusDot captured={hasBack} label="후면" />
      </div>

      {/* 정확도 안내 */}
      <p className="text-center text-xs text-muted-foreground">
        {capturedAngles.length === 1 && '정면만: 기본 분석'}
        {capturedAngles.length === 2 && '2장: 정확도 약 15% 향상'}
        {capturedAngles.length === 3 && '3장: 최고 정확도 (약 25% 향상)'}
      </p>
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

export default BodyAngleSelector;
