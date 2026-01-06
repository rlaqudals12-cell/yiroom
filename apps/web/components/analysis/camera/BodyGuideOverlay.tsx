'use client';

/**
 * 전신 촬영 가이드 오버레이 컴포넌트
 * @description 체형 분석을 위한 전신 촬영 시 위치를 안내하는 SVG 가이드
 */

import { cn } from '@/lib/utils';

/** 체형 촬영 각도 */
export type BodyAngle = 'front' | 'side' | 'back';

interface BodyGuideOverlayProps {
  /** 현재 촬영 각도 */
  angle: BodyAngle;
  /** 추가 클래스 */
  className?: string;
}

// 각도별 안내 문구
const ANGLE_MESSAGES: Record<BodyAngle, string> = {
  front: '정면을 바라봐주세요',
  side: '옆모습을 보여주세요',
  back: '뒷모습을 보여주세요',
};

// 각도별 라벨
const ANGLE_LABELS: Record<BodyAngle, string> = {
  front: '정면',
  side: '측면',
  back: '후면',
};

// 각도별 촬영 팁
const ANGLE_TIPS: Record<BodyAngle, string> = {
  front: '전신이 프레임 안에 들어오도록 해주세요',
  side: '어깨와 골반 라인이 보이도록 해주세요',
  back: '어깨와 허리 라인이 보이도록 해주세요',
};

export function BodyGuideOverlay({ angle, className }: BodyGuideOverlayProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center pointer-events-none',
        className
      )}
      data-testid="body-guide-overlay"
    >
      {/* 전신 실루엣 가이드 */}
      <div className="relative w-48 h-96">
        <svg
          viewBox="0 0 120 250"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 외곽 가이드 영역 (반투명 배경) */}
          <defs>
            <mask id="body-mask">
              <rect width="120" height="250" fill="white" />
              <BodySilhouette angle={angle} fill="black" />
            </mask>
          </defs>

          {/* 반투명 오버레이 (몸 영역 제외) */}
          <rect width="120" height="250" fill="rgba(0,0,0,0.5)" mask="url(#body-mask)" />

          {/* 전신 실루엣 테두리 */}
          <BodySilhouette
            angle={angle}
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeDasharray="8 4"
            className="animate-pulse"
          />
        </svg>

        {/* 각도 라벨 */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full">
          <span className="text-white text-sm font-medium">{ANGLE_LABELS[angle]}</span>
        </div>
      </div>

      {/* 안내 문구 */}
      <p className="mt-4 text-white text-lg font-medium text-center bg-black/60 px-4 py-2 rounded-lg">
        {ANGLE_MESSAGES[angle]}
      </p>

      {/* 촬영 팁 */}
      <p className="mt-2 text-white/80 text-sm text-center bg-black/40 px-3 py-1 rounded-lg">
        {ANGLE_TIPS[angle]}
      </p>
    </div>
  );
}

// 전신 실루엣 SVG 패스
interface BodySilhouetteProps {
  angle: BodyAngle;
  fill?: string;
  stroke?: string;
  strokeWidth?: string;
  strokeDasharray?: string;
  className?: string;
}

function BodySilhouette({
  angle,
  fill = 'none',
  stroke,
  strokeWidth,
  strokeDasharray,
  className,
}: BodySilhouetteProps) {
  // 각도별 전신 실루엣 패스 - 정면만 사용 (측면/후면도 정면 기반)
  const basePath = `
    M 60 15
    C 68 15, 75 20, 75 28
    C 75 36, 68 42, 60 42
    C 52 42, 45 36, 45 28
    C 45 20, 52 15, 60 15
    M 60 42
    L 60 50
    M 40 55
    C 42 52, 50 48, 60 48
    C 70 48, 78 52, 80 55
    L 95 75
    L 88 78
    L 75 62
    L 75 95
    C 78 98, 80 110, 80 125
    C 80 140, 78 155, 78 170
    C 78 185, 80 200, 80 215
    L 80 235
    L 70 235
    L 70 170
    L 65 120
    L 60 95
    L 55 120
    L 50 170
    L 50 235
    L 40 235
    L 40 215
    C 40 200, 42 185, 42 170
    C 42 155, 40 140, 40 125
    C 40 110, 42 98, 45 95
    L 45 62
    L 32 78
    L 25 75
    L 40 55
    Z
  `;

  // 현재는 모든 각도에 동일한 실루엣 사용 (추후 각도별 실루엣 추가 가능)
  void angle;

  return (
    <path
      d={basePath}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      className={className}
    />
  );
}

export default BodyGuideOverlay;
