'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ============================================
// 타입 정의
// ============================================

export interface PostureMeasurements {
  headForwardAngle: number;
  shoulderDifference: number;
  pelvicTilt: 'anterior' | 'posterior' | 'neutral';
  spineCurvature: 'lordosis' | 'flatback' | 'normal';
}

export interface PostureSimulatorProps {
  imageUrl: string;
  measurements: PostureMeasurements;
  showGuides: boolean;
  className?: string;
}

// ============================================
// 상수
// ============================================

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;

// 색상 정의
const COLORS = {
  VERTICAL_LINE: '#22c55e', // 녹색 수직 기준선
  HEAD_ANGLE: '#ef4444', // 빨간색 머리 전방 각도
  SHOULDER_LINE: '#3b82f6', // 파란색 어깨 수평선
  PELVIS_LINE: '#f59e0b', // 주황색 골반선
  SPINE_LINE: '#8b5cf6', // 보라색 척추선
} as const;

// ============================================
// 메인 컴포넌트
// ============================================

/**
 * 자세 시뮬레이터 컴포넌트
 *
 * 기능:
 * - Canvas에 사용자 이미지 표시
 * - 자세 가이드 오버레이 (showGuides=true)
 * - "교정 전" / "교정 후 예상" 토글
 *
 * SPEC 참조: SPEC-PHASE-L-M.md §3.1.3
 */
export default function PostureSimulator({
  imageUrl,
  measurements,
  showGuides,
  className,
}: PostureSimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<'before' | 'after'>('before');

  // 이미지 로드
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      imageRef.current = img;
      setIsImageLoaded(true);
    };

    img.onerror = () => {
      console.error('[PostureSimulator] Failed to load image:', imageUrl);
    };
  }, [imageUrl]);

  // Canvas 그리기
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;

    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 크기 설정
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // 이미지 그리기 (Canvas에 맞춤)
    const imgAspect = img.width / img.height;
    const canvasAspect = CANVAS_WIDTH / CANVAS_HEIGHT;

    let drawWidth = CANVAS_WIDTH;
    let drawHeight = CANVAS_HEIGHT;
    let offsetX = 0;
    let offsetY = 0;

    if (imgAspect > canvasAspect) {
      // 이미지가 더 넓음
      drawWidth = CANVAS_WIDTH;
      drawHeight = CANVAS_WIDTH / imgAspect;
      offsetY = (CANVAS_HEIGHT - drawHeight) / 2;
    } else {
      // 이미지가 더 높음
      drawHeight = CANVAS_HEIGHT;
      drawWidth = CANVAS_HEIGHT * imgAspect;
      offsetX = (CANVAS_WIDTH - drawWidth) / 2;
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    // 가이드 그리기
    if (showGuides) {
      drawGuides(ctx, measurements, viewMode);
    }
  }, [measurements, showGuides, viewMode]);

  // 이미지 로드 시 Canvas 그리기
  useEffect(() => {
    if (isImageLoaded) {
      drawCanvas();
    }
  }, [isImageLoaded, drawCanvas]);

  // 토글 핸들러
  const handleToggleView = (mode: 'before' | 'after') => {
    setViewMode(mode);
  };

  return (
    <div className={cn('relative', className)} data-testid="posture-simulator">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg border shadow-sm bg-muted"
        style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
      />

      {/* 로딩 상태 */}
      {!isImageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 토글 버튼 */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <Button
          size="sm"
          variant={viewMode === 'before' ? 'default' : 'outline'}
          onClick={() => handleToggleView('before')}
        >
          교정 전
        </Button>
        <Button
          size="sm"
          variant={viewMode === 'after' ? 'default' : 'outline'}
          onClick={() => handleToggleView('after')}
        >
          교정 후 예상
        </Button>
      </div>

      {/* 범례 */}
      {showGuides && isImageLoaded && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs font-medium mb-2 text-foreground">가이드 라인</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5" style={{ backgroundColor: 'var(--posture-good)' }} />
              <span className="text-muted-foreground">수직 기준선</span>
            </div>
            {measurements.headForwardAngle > 15 && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5" style={{ backgroundColor: 'var(--posture-bad)' }} />
                <span className="text-muted-foreground">머리 전방 각도</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5" style={{ backgroundColor: 'var(--posture-neutral)' }} />
              <span className="text-muted-foreground">어깨 수평선</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5" style={{ backgroundColor: 'var(--posture-warning)' }} />
              <span className="text-muted-foreground">골반선</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// 헬퍼 함수
// ============================================

/**
 * 가이드 라인 그리기
 */
function drawGuides(
  ctx: CanvasRenderingContext2D,
  measurements: PostureMeasurements,
  viewMode: 'before' | 'after'
) {
  const { headForwardAngle, shoulderDifference, pelvicTilt } = measurements;

  // "교정 후 예상" 모드에서는 각도/차이 감소
  const isAfter = viewMode === 'after';
  const headAngle = isAfter ? Math.max(0, headForwardAngle - 10) : headForwardAngle;
  const shoulderDiff = isAfter ? shoulderDifference * 0.3 : shoulderDifference;

  // 1. 수직 기준선 (녹색 점선)
  ctx.save();
  ctx.strokeStyle = COLORS.VERTICAL_LINE;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH / 2, 0);
  ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
  ctx.stroke();
  ctx.restore();

  // 2. 머리 전방 각도 표시 (15도 이상일 때 빨간색)
  if (headAngle > 15) {
    ctx.save();
    ctx.strokeStyle = COLORS.HEAD_ANGLE;
    ctx.lineWidth = 3;
    ctx.setLineDash([]);

    // 머리 위치 추정 (상단 1/4 지점)
    const headY = CANVAS_HEIGHT * 0.2;
    const headX = CANVAS_WIDTH / 2;

    // 각도 호 그리기
    const angleRad = (headAngle * Math.PI) / 180;
    const arcRadius = 60;

    ctx.beginPath();
    ctx.arc(headX, headY, arcRadius, -Math.PI / 2, -Math.PI / 2 + angleRad, false);
    ctx.stroke();

    // 각도 화살표
    ctx.beginPath();
    ctx.moveTo(headX, headY);
    ctx.lineTo(
      headX + arcRadius * Math.sin(angleRad),
      headY + arcRadius * (1 - Math.cos(angleRad))
    );
    ctx.stroke();

    // 각도 텍스트
    ctx.fillStyle = COLORS.HEAD_ANGLE;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`${Math.round(headAngle)}°`, headX + arcRadius + 10, headY - 10);

    ctx.restore();
  }

  // 3. 어깨 수평선 (파란색)
  ctx.save();
  ctx.strokeStyle = COLORS.SHOULDER_LINE;
  ctx.lineWidth = 2;
  ctx.setLineDash([]);

  // 어깨 위치 추정 (상단 1/3 지점)
  const shoulderY = CANVAS_HEIGHT * 0.35;
  const leftShoulderX = CANVAS_WIDTH * 0.3;
  const rightShoulderX = CANVAS_WIDTH * 0.7;

  // 좌우 어깨 높이 차이 반영
  const leftShoulderY = shoulderY - shoulderDiff * 2;
  const rightShoulderY = shoulderY + shoulderDiff * 2;

  ctx.beginPath();
  ctx.moveTo(leftShoulderX, leftShoulderY);
  ctx.lineTo(rightShoulderX, rightShoulderY);
  ctx.stroke();

  // 어깨 포인트
  ctx.fillStyle = COLORS.SHOULDER_LINE;
  ctx.beginPath();
  ctx.arc(leftShoulderX, leftShoulderY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(rightShoulderX, rightShoulderY, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // 4. 골반선 (주황색)
  ctx.save();
  ctx.strokeStyle = COLORS.PELVIS_LINE;
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);

  // 골반 위치 추정 (중앙 약간 아래)
  const pelvisY = CANVAS_HEIGHT * 0.6;

  // 골반 기울기 반영
  let pelvisTiltAngle = 0;
  if (pelvicTilt === 'anterior') {
    pelvisTiltAngle = isAfter ? -3 : -8; // 전방 경사
  } else if (pelvicTilt === 'posterior') {
    pelvisTiltAngle = isAfter ? 3 : 8; // 후방 경사
  }

  const pelvisTiltRad = (pelvisTiltAngle * Math.PI) / 180;
  const pelvisHalfWidth = 80;

  const leftPelvisX = CANVAS_WIDTH / 2 - pelvisHalfWidth;
  const rightPelvisX = CANVAS_WIDTH / 2 + pelvisHalfWidth;
  const leftPelvisY = pelvisY + pelvisHalfWidth * Math.tan(pelvisTiltRad);
  const rightPelvisY = pelvisY - pelvisHalfWidth * Math.tan(pelvisTiltRad);

  ctx.beginPath();
  ctx.moveTo(leftPelvisX, leftPelvisY);
  ctx.lineTo(rightPelvisX, rightPelvisY);
  ctx.stroke();

  ctx.restore();

  // 5. 척추 곡선 (보라색 - 간단한 표시)
  ctx.save();
  ctx.strokeStyle = COLORS.SPINE_LINE;
  ctx.lineWidth = 2;
  ctx.setLineDash([]);

  const spineX = CANVAS_WIDTH / 2;
  const spineTopY = CANVAS_HEIGHT * 0.25;
  const spineBottomY = CANVAS_HEIGHT * 0.65;

  ctx.beginPath();
  ctx.moveTo(spineX, spineTopY);

  // 척추 곡률에 따라 곡선 그리기
  const midY = (spineTopY + spineBottomY) / 2;
  let curveOffset = 0;

  if (measurements.spineCurvature === 'lordosis') {
    curveOffset = isAfter ? 15 : 30; // 과전만 - 앞으로 휨
  } else if (measurements.spineCurvature === 'flatback') {
    curveOffset = isAfter ? -5 : -15; // 일자 - 뒤로 평평
  }

  ctx.quadraticCurveTo(spineX + curveOffset, midY, spineX, spineBottomY);
  ctx.stroke();

  ctx.restore();
}
