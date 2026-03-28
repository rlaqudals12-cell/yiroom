/**
 * A-1: 12존 SVG 경로→좌표 변환 함수
 *
 * @description face-api.js 68-point 랜드마크 기반 12존 타원 좌표 계산.
 * 랜드마크 감지 실패 시 V1 정적 좌표로 폴백.
 * @see docs/specs/SDD-VISUAL-ENHANCEMENT.md A-1
 */

import type { DetailedZoneId } from '@/types/skin-zones';

/** 타원 좌표 */
export interface ZoneEllipseCoord {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

interface LandmarkPoint {
  x: number;
  y: number;
}
interface ImageSize {
  width: number;
  height: number;
}

// V1 정적 좌표 (viewBox 0-100 정규화)
const STATIC_ZONE_POSITIONS: Record<DetailedZoneId, ZoneEllipseCoord> = {
  forehead_center: { cx: 50, cy: 18, rx: 12, ry: 8 },
  forehead_left: { cx: 32, cy: 20, rx: 10, ry: 7 },
  forehead_right: { cx: 68, cy: 20, rx: 10, ry: 7 },
  eye_left: { cx: 35, cy: 35, rx: 8, ry: 5 },
  eye_right: { cx: 65, cy: 35, rx: 8, ry: 5 },
  nose_bridge: { cx: 50, cy: 38, rx: 5, ry: 8 },
  nose_tip: { cx: 50, cy: 50, rx: 6, ry: 5 },
  cheek_left: { cx: 28, cy: 52, rx: 12, ry: 10 },
  cheek_right: { cx: 72, cy: 52, rx: 12, ry: 10 },
  chin_center: { cx: 50, cy: 75, rx: 10, ry: 7 },
  chin_left: { cx: 38, cy: 70, rx: 8, ry: 6 },
  chin_right: { cx: 62, cy: 70, rx: 8, ry: 6 },
};

function averagePoint(landmarks: LandmarkPoint[], indices: number[]): LandmarkPoint {
  let sumX = 0,
    sumY = 0,
    count = 0;
  for (const idx of indices) {
    if (idx < landmarks.length) {
      sumX += landmarks[idx].x;
      sumY += landmarks[idx].y;
      count++;
    }
  }
  return count === 0 ? { x: 0, y: 0 } : { x: sumX / count, y: sumY / count };
}

function pointDistance(a: LandmarkPoint, b: LandmarkPoint): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// 존별 랜드마크 설정 (dlib 68-point)
const ZONE_CONFIG: Record<
  DetailedZoneId,
  {
    indices: number[];
    yOffset?: number;
    rxRatio: number;
    ryRatio: number;
  }
> = {
  forehead_center: { indices: [19, 20, 23, 24], yOffset: -0.12, rxRatio: 0.14, ryRatio: 0.08 },
  forehead_left: { indices: [17, 18, 19], yOffset: -0.1, rxRatio: 0.1, ryRatio: 0.07 },
  forehead_right: { indices: [24, 25, 26], yOffset: -0.1, rxRatio: 0.1, ryRatio: 0.07 },
  eye_left: { indices: [42, 43, 44, 45, 46, 47], yOffset: 0.02, rxRatio: 0.09, ryRatio: 0.05 },
  eye_right: { indices: [36, 37, 38, 39, 40, 41], yOffset: 0.02, rxRatio: 0.09, ryRatio: 0.05 },
  nose_bridge: { indices: [27, 28, 29], rxRatio: 0.05, ryRatio: 0.08 },
  nose_tip: { indices: [30, 31, 32, 33, 34, 35], rxRatio: 0.06, ryRatio: 0.05 },
  cheek_left: { indices: [1, 2, 3, 4], yOffset: -0.05, rxRatio: 0.12, ryRatio: 0.1 },
  cheek_right: { indices: [13, 14, 15, 12], yOffset: -0.05, rxRatio: 0.12, ryRatio: 0.1 },
  chin_center: { indices: [8, 9, 7, 57], yOffset: 0.03, rxRatio: 0.1, ryRatio: 0.07 },
  chin_left: { indices: [5, 6, 7], rxRatio: 0.08, ryRatio: 0.06 },
  chin_right: { indices: [9, 10, 11], rxRatio: 0.08, ryRatio: 0.06 },
};

/**
 * 랜드마크 기반 12존 타원 좌표 계산 (null이면 V1 정적 좌표 폴백)
 */
export function mapLandmarksToZoneCoordinates(
  landmarks: LandmarkPoint[] | null,
  imageSize: ImageSize
): Record<DetailedZoneId, ZoneEllipseCoord> {
  if (!landmarks || landmarks.length < 68) {
    return mapStaticCoordinates(imageSize);
  }

  const faceWidth = pointDistance(landmarks[0], landmarks[16]);
  const faceHeight = pointDistance(averagePoint(landmarks, [19, 24]), landmarks[8]) * 1.3;

  const result = {} as Record<DetailedZoneId, ZoneEllipseCoord>;
  for (const [zoneId, config] of Object.entries(ZONE_CONFIG) as [
    DetailedZoneId,
    (typeof ZONE_CONFIG)[DetailedZoneId],
  ][]) {
    const anchor = averagePoint(landmarks, config.indices);
    const yOff = (config.yOffset ?? 0) * faceHeight;
    result[zoneId] = {
      cx: anchor.x,
      cy: anchor.y + yOff,
      rx: faceWidth * config.rxRatio,
      ry: faceHeight * config.ryRatio,
    };
  }
  return result;
}

function mapStaticCoordinates(imageSize: ImageSize): Record<DetailedZoneId, ZoneEllipseCoord> {
  const result = {} as Record<DetailedZoneId, ZoneEllipseCoord>;
  for (const [zoneId, pos] of Object.entries(STATIC_ZONE_POSITIONS) as [
    DetailedZoneId,
    ZoneEllipseCoord,
  ][]) {
    result[zoneId] = {
      cx: (pos.cx / 100) * imageSize.width,
      cy: (pos.cy / 100) * imageSize.height,
      rx: (pos.rx / 100) * imageSize.width,
      ry: (pos.ry / 100) * imageSize.height,
    };
  }
  return result;
}

/** 스케일 적용 */
export function scaleCoordinates(
  coords: Record<DetailedZoneId, ZoneEllipseCoord>,
  scale: number
): Record<DetailedZoneId, ZoneEllipseCoord> {
  const result = {} as Record<DetailedZoneId, ZoneEllipseCoord>;
  for (const [zoneId, c] of Object.entries(coords) as [DetailedZoneId, ZoneEllipseCoord][]) {
    result[zoneId] = { cx: c.cx * scale, cy: c.cy * scale, rx: c.rx * scale, ry: c.ry * scale };
  }
  return result;
}
