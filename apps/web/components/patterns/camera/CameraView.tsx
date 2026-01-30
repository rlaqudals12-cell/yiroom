'use client';

import * as React from 'react';
import { ChevronLeft, Camera, RefreshCw } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * CameraView - AI 분석용 카메라 뷰
 *
 * 얼굴/체형 촬영을 위한 전체 화면 카메라 인터페이스
 * 가이드 오버레이 포함
 */

const cameraViewVariants = cva(
  'fixed inset-0 bg-background z-[500] flex flex-col animate-in slide-in-from-right duration-500',
  {
    variants: {
      variant: {
        default: '',
        compact: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface CameraViewProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cameraViewVariants> {
  title: string;
  onCapture: (data: string | null) => void;
  guideText?: string;
}

/**
 * CameraView 컴포넌트
 *
 * @example
 * <CameraView
 *   title="PC-1"
 *   onCapture={(data) => handleCapture(data)}
 *   guideText="가이드에 맞춰 얼굴을 고정해주세요"
 * />
 */
function CameraView({
  className,
  variant,
  title,
  onCapture,
  guideText = '가이드에 맞춰 얼굴을 고정해주세요',
  ...props
}: CameraViewProps): React.JSX.Element {
  return (
    <div
      data-slot="camera-view"
      data-testid="camera-view"
      className={cn(cameraViewVariants({ variant, className }))}
      {...props}
    >
      {/* 헤더 */}
      <div className="p-10 flex justify-between items-center">
        <button
          type="button"
          onClick={() => onCapture(null)}
          className="p-4 bg-card/50 rounded-2xl min-w-[48px] min-h-[48px] flex items-center justify-center hover:bg-card/70 transition-colors"
          aria-label="뒤로 가기"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>

        <span className="text-[11px] font-black tracking-[0.5em] text-muted-foreground uppercase">
          {title} Scanning
        </span>

        <div className="w-12 h-12" aria-hidden="true" />
      </div>

      {/* 카메라 영역 */}
      <div className="flex-1 px-10">
        <div className="w-full h-full rounded-[3rem] border-2 border-border relative overflow-hidden flex items-center justify-center bg-card/30">
          {/* 가이드 프레임 */}
          <div className="absolute inset-0 m-12 border-2 border-primary/30 border-dashed rounded-[2.5rem] animate-pulse" />

          {/* 카메라 아이콘 (실제 구현에서는 카메라 피드) */}
          <Camera className="w-16 h-16 text-muted-foreground/30" />

          {/* 가이드 텍스트 */}
          <div className="absolute bottom-10 text-center w-full px-8">
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
              {guideText}
            </p>
          </div>
        </div>
      </div>

      {/* 하단 컨트롤 */}
      <div className="p-16 pb-24 flex justify-around items-center">
        {/* 갤러리 버튼 */}
        <div className="w-14 h-14 bg-card/50 rounded-2xl border border-border" />

        {/* 셔터 버튼 */}
        <button
          type="button"
          onClick={() => onCapture('captured-image-data')}
          className="w-24 h-24 rounded-full border-4 border-foreground flex items-center justify-center p-2 group"
          aria-label="촬영"
        >
          <div className="w-full h-full bg-foreground rounded-full transition-transform group-active:scale-90" />
        </button>

        {/* 카메라 전환 버튼 */}
        <button
          type="button"
          className="w-14 h-14 bg-card/50 rounded-full flex items-center justify-center hover:bg-card/70 transition-colors"
          aria-label="카메라 전환"
        >
          <RefreshCw className="w-6 h-6 text-foreground" />
        </button>
      </div>
    </div>
  );
}

export { CameraView, cameraViewVariants };
