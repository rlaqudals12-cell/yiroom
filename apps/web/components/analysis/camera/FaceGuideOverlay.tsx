'use client';

/**
 * 얼굴 가이드 오버레이 컴포넌트
 * @description 카메라 촬영 시 얼굴 위치를 안내하는 SVG 가이드
 */

import { cn } from '@/lib/utils';
import type { FaceAngle } from '@/types/visual-analysis';

interface FaceGuideOverlayProps {
  /** 현재 촬영 각도 */
  angle: FaceAngle;
  /** 추가 클래스 */
  className?: string;
}

// 각도별 안내 문구
const ANGLE_MESSAGES: Record<FaceAngle, string> = {
  front: '정면을 바라봐주세요',
  left: '왼쪽으로 살짝 돌려주세요',
  right: '오른쪽으로 살짝 돌려주세요',
};

// 각도별 라벨
const ANGLE_LABELS: Record<FaceAngle, string> = {
  front: '정면',
  left: '좌측 45°',
  right: '우측 45°',
};

export function FaceGuideOverlay({ angle, className }: FaceGuideOverlayProps) {
  return (
    <div
      className={cn(
        'absolute inset-0 flex flex-col items-center justify-center pointer-events-none',
        className
      )}
      data-testid="face-guide-overlay"
    >
      {/* 얼굴 실루엣 가이드 */}
      <div className="relative w-64 h-80">
        <svg
          viewBox="0 0 200 260"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 외곽 가이드 영역 (반투명 배경) */}
          <defs>
            <mask id="face-mask">
              <rect width="200" height="260" fill="white" />
              <FaceSilhouette angle={angle} fill="black" />
            </mask>
          </defs>

          {/* 반투명 오버레이 (얼굴 영역 제외) */}
          <rect width="200" height="260" fill="rgba(0,0,0,0.5)" mask="url(#face-mask)" />

          {/* 얼굴 실루엣 테두리 */}
          <FaceSilhouette
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
      <p className="mt-6 text-white text-lg font-medium text-center bg-black/60 px-4 py-2 rounded-lg">
        {ANGLE_MESSAGES[angle]}
      </p>
    </div>
  );
}

// 얼굴 실루엣 SVG 패스
interface FaceSilhouetteProps {
  angle: FaceAngle;
  fill?: string;
  stroke?: string;
  strokeWidth?: string;
  strokeDasharray?: string;
  className?: string;
}

function FaceSilhouette({
  angle,
  fill = 'none',
  stroke,
  strokeWidth,
  strokeDasharray,
  className,
}: FaceSilhouetteProps) {
  // 각도별 얼굴 실루엣 패스
  const paths: Record<FaceAngle, string> = {
    // 정면 얼굴
    front: `
      M 100 20
      C 140 20, 170 60, 170 100
      C 170 140, 165 180, 150 210
      C 140 230, 120 245, 100 245
      C 80 245, 60 230, 50 210
      C 35 180, 30 140, 30 100
      C 30 60, 60 20, 100 20
      Z
    `,
    // 좌측 45도 (왼쪽 얼굴이 더 보임)
    left: `
      M 80 20
      C 50 25, 30 60, 30 100
      C 30 140, 35 180, 50 210
      C 60 230, 75 245, 95 245
      C 115 245, 135 230, 145 210
      C 155 185, 160 150, 160 115
      C 160 70, 135 30, 100 22
      C 90 20, 85 20, 80 20
      Z
    `,
    // 우측 45도 (오른쪽 얼굴이 더 보임)
    right: `
      M 120 20
      C 150 25, 170 60, 170 100
      C 170 140, 165 180, 150 210
      C 140 230, 125 245, 105 245
      C 85 245, 65 230, 55 210
      C 45 185, 40 150, 40 115
      C 40 70, 65 30, 100 22
      C 110 20, 115 20, 120 20
      Z
    `,
  };

  return (
    <path
      d={paths[angle]}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      className={className}
    />
  );
}

export default FaceGuideOverlay;
