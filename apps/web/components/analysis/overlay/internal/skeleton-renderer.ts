/**
 * B-1 + B-2: Canvas 스켈레톤 드로잉 + 비율 수치 라벨
 *
 * @description MediaPipe 33관절 기반 체형/자세 Canvas 렌더링
 * @see docs/specs/SDD-VISUAL-ENHANCEMENT.md §3.2, §3.3
 */

import type { Landmark33 } from '@/lib/analysis/body-v2/types';
import { OVERLAY_TOKENS } from './overlay-tokens';
import type { OverlayMode } from './overlay-tokens';

// 핵심 스켈레톤 연결선 (visibility > 0.5인 관절만 렌더링)
export const SKELETON_CONNECTIONS: [number, number][] = [
  // 어깨선 (핵심 - 기울기 측정)
  [11, 12],
  // 왼팔
  [11, 13],
  [13, 15],
  // 오른팔
  [12, 14],
  [14, 16],
  // 몸통
  [11, 23],
  [12, 24],
  // 골반선 (핵심 - 정렬 측정)
  [23, 24],
  // 왼다리
  [23, 25],
  [25, 27],
  // 오른다리
  [24, 26],
  [26, 28],
];

// 관절점 색상 (부위별)
const JOINT_COLORS: Record<string, string> = {
  shoulder: '#6366F1', // 인디고
  arm: '#8B5CF6', // 바이올렛
  torso: '#EC4899', // 핑크
  hip: '#F59E0B', // 앰버
  leg: '#10B981', // 에메랄드
};

// 관절 인덱스 → 부위 매핑
function getJointColor(idx: number): string {
  if (idx === 11 || idx === 12) return JOINT_COLORS.shoulder;
  if (idx >= 13 && idx <= 16) return JOINT_COLORS.arm;
  if (idx === 23 || idx === 24) return JOINT_COLORS.hip;
  if (idx >= 25 && idx <= 28) return JOINT_COLORS.leg;
  return JOINT_COLORS.torso;
}

export interface SkeletonRenderOptions {
  canvasWidth: number;
  canvasHeight: number;
  imageWidth: number;
  imageHeight: number;
  mode: OverlayMode;
  minVisibility?: number;
}

/**
 * 랜드마크 정규화 좌표 → Canvas 픽셀 좌표 변환
 * object-cover 스케일링 고려
 */
function toCanvasCoords(lm: Landmark33, opts: SkeletonRenderOptions): { x: number; y: number } {
  const scaleX = opts.canvasWidth / opts.imageWidth;
  const scaleY = opts.canvasHeight / opts.imageHeight;
  const scale = Math.max(scaleX, scaleY);

  const scaledW = opts.imageWidth * scale;
  const scaledH = opts.imageHeight * scale;
  const cropX = (scaledW - opts.canvasWidth) / 2;
  const cropY = (scaledH - opts.canvasHeight) / 2;

  return {
    x: lm.x * scaledW - cropX,
    y: lm.y * scaledH - cropY,
  };
}

/**
 * B-1: Canvas에 스켈레톤 라인 + 관절점 렌더링
 */
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark33[],
  opts: SkeletonRenderOptions
): void {
  const minVis = opts.minVisibility ?? 0.5;

  // 연결선 렌더링
  for (const [i, j] of SKELETON_CONNECTIONS) {
    const lm1 = landmarks[i];
    const lm2 = landmarks[j];
    if (!lm1 || !lm2) continue;
    if (lm1.visibility < minVis || lm2.visibility < minVis) continue;

    const p1 = toCanvasCoords(lm1, opts);
    const p2 = toCanvasCoords(lm2, opts);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.7)';
    ctx.lineWidth = OVERLAY_TOKENS.lineWidth.active;
    ctx.stroke();
  }

  // 관절점 렌더링
  const renderedIndices = new Set<number>();
  for (const [i, j] of SKELETON_CONNECTIONS) {
    renderedIndices.add(i);
    renderedIndices.add(j);
  }

  for (const idx of renderedIndices) {
    const lm = landmarks[idx];
    if (!lm || lm.visibility < minVis) continue;

    const p = toCanvasCoords(lm, opts);
    const color = getJointColor(idx);

    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export interface RatioLabel {
  text: string;
  x: number;
  y: number;
}

/**
 * B-2: 비율 수치 라벨 렌더링
 */
export function drawRatioLabels(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark33[],
  measurements: {
    shoulderWidth?: number;
    hipWidth?: number;
    shoulderTilt?: number;
  },
  opts: SkeletonRenderOptions
): RatioLabel[] {
  const labels: RatioLabel[] = [];
  const minVis = opts.minVisibility ?? 0.5;

  // 어깨 비율 라벨
  const lShoulder = landmarks[11];
  const rShoulder = landmarks[12];
  if (
    lShoulder &&
    rShoulder &&
    lShoulder.visibility >= minVis &&
    rShoulder.visibility >= minVis &&
    measurements.shoulderWidth !== undefined
  ) {
    const p1 = toCanvasCoords(lShoulder, opts);
    const p2 = toCanvasCoords(rShoulder, opts);
    const midX = (p1.x + p2.x) / 2;
    const midY = Math.min(p1.y, p2.y) - 16;

    const text = `어깨 ${measurements.shoulderWidth}`;
    drawLabel(ctx, text, midX, midY);
    labels.push({ text, x: midX, y: midY });

    // 기울기 표시
    if (measurements.shoulderTilt !== undefined && Math.abs(measurements.shoulderTilt) > 1) {
      const tiltText = `${measurements.shoulderTilt > 0 ? '+' : ''}${measurements.shoulderTilt.toFixed(1)}°`;
      drawLabel(ctx, tiltText, midX, midY - 16, '#F59E0B');
    }
  }

  // 골반 비율 라벨
  const lHip = landmarks[23];
  const rHip = landmarks[24];
  if (
    lHip &&
    rHip &&
    lHip.visibility >= minVis &&
    rHip.visibility >= minVis &&
    measurements.hipWidth !== undefined
  ) {
    const p1 = toCanvasCoords(lHip, opts);
    const p2 = toCanvasCoords(rHip, opts);
    const midX = (p1.x + p2.x) / 2;
    const midY = Math.max(p1.y, p2.y) + 20;

    const text = `골반 ${measurements.hipWidth}`;
    drawLabel(ctx, text, midX, midY);
    labels.push({ text, x: midX, y: midY });
  }

  return labels;
}

/** 라벨 그리기 헬퍼 */
function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = 'white'
): void {
  ctx.font = '11px sans-serif';
  const metrics = ctx.measureText(text);
  const padding = 4;
  const bgW = metrics.width + padding * 2;
  const bgH = 16;

  // 배경 라운드 사각형
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.roundRect(x - bgW / 2, y - bgH / 2, bgW, bgH, 4);
  ctx.fill();

  // 텍스트
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

/**
 * 자세 분석용: 기준선 vs 실제 정렬선 렌더링
 */
export function drawAlignmentLines(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark33[],
  view: 'front' | 'side',
  opts: SkeletonRenderOptions
): void {
  const minVis = opts.minVisibility ?? 0.5;
  const { canvasWidth, canvasHeight } = opts;

  if (view === 'front') {
    // 수직 기준선 (중앙)
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = 'rgba(156, 163, 175, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvasWidth / 2, 0);
    ctx.lineTo(canvasWidth / 2, canvasHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    // 어깨 수평선
    const ls = landmarks[11];
    const rs = landmarks[12];
    if (ls && rs && ls.visibility >= minVis && rs.visibility >= minVis) {
      const p1 = toCanvasCoords(ls, opts);
      const p2 = toCanvasCoords(rs, opts);
      const tilt = Math.abs(p1.y - p2.y);
      // 편차에 따른 색상: 작으면 초록, 크면 빨강
      const color = tilt < 5 ? '#10B981' : tilt < 15 ? '#F59E0B' : '#EF4444';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p1.x - 20, p1.y);
      ctx.lineTo(p2.x + 20, p2.y);
      ctx.stroke();
    }

    // 골반 수평선
    const lh = landmarks[23];
    const rh = landmarks[24];
    if (lh && rh && lh.visibility >= minVis && rh.visibility >= minVis) {
      const p1 = toCanvasCoords(lh, opts);
      const p2 = toCanvasCoords(rh, opts);
      const tilt = Math.abs(p1.y - p2.y);
      const color = tilt < 5 ? '#10B981' : tilt < 15 ? '#F59E0B' : '#EF4444';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p1.x - 20, p1.y);
      ctx.lineTo(p2.x + 20, p2.y);
      ctx.stroke();
    }
  } else {
    // 측면: 이상적 귀-어깨-골반-발목 수직선
    const ear = landmarks[7]; // LEFT_EAR
    const shoulder = landmarks[11];
    const hip = landmarks[23];
    const ankle = landmarks[27];

    // 이상적 수직선 (어깨 기준)
    if (shoulder && shoulder.visibility >= minVis) {
      const sp = toCanvasCoords(shoulder, opts);
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sp.x, 0);
      ctx.lineTo(sp.x, canvasHeight);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 실제 정렬선
    const points = [ear, shoulder, hip, ankle]
      .filter((lm) => lm && lm.visibility >= minVis)
      .map((lm) => toCanvasCoords(lm!, opts));

    if (points.length >= 2) {
      ctx.strokeStyle = '#6366F1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();

      // 각 포인트에 점 표시
      for (const p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#6366F1';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }
}
