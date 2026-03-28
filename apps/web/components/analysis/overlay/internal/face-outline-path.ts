/**
 * A-8: 얼굴 윤곽선 SVG path 생성 (Catmull-Rom 스플라인)
 *
 * @description 턱라인(0-16) + 이마(17-26 오프셋) → 닫힌 SVG 곡선
 * @see docs/specs/SDD-VISUAL-ENHANCEMENT.md A-8
 */

interface Point {
  x: number;
  y: number;
}

// Catmull-Rom → Cubic Bezier 제어점 변환 (tension=0.5)
function catmullRomToBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t = 0.5
): { cp1: Point; cp2: Point } {
  const d = 6 / t;
  return {
    cp1: { x: p1.x + (p2.x - p0.x) / d, y: p1.y + (p2.y - p0.y) / d },
    cp2: { x: p2.x - (p3.x - p1.x) / d, y: p2.y - (p3.y - p1.y) / d },
  };
}

// 포인트 배열 → SVG Cubic Bezier path (닫힌 경로)
function toCatmullRomPath(points: Point[], closed = true): string {
  if (points.length < 3) return '';
  const n = points.length;
  let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    if (i === 0 && !closed) continue;
    if (!closed && i >= n - 1) break;

    const { cp1, cp2 } = catmullRomToBezier(p0, p1, p2, p3);
    path += ` C ${cp1.x.toFixed(1)} ${cp1.y.toFixed(1)}, ${cp2.x.toFixed(1)} ${cp2.y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  if (closed) path += ' Z';
  return path;
}

/**
 * face-api.js 68-point 랜드마크에서 얼굴 윤곽선 SVG path 생성
 * 턱라인(0-16) + 이마(눈썹 17-26을 위로 오프셋)를 부드럽게 연결
 */
export function generateFaceOutlinePath(landmarks: Point[]): string | null {
  if (landmarks.length < 27) return null;

  const jawline = landmarks.slice(0, 17);
  const rightEyebrow = landmarks.slice(17, 22);
  const leftEyebrow = landmarks.slice(22, 27);

  // 이마 오프셋: 눈썹~턱 거리의 28%
  const browCenter = {
    x: (landmarks[19].x + landmarks[24].x) / 2,
    y: (landmarks[19].y + landmarks[24].y) / 2,
  };
  const foreheadOffset = (landmarks[8].y - browCenter.y) * 0.28;

  // 이마 포인트: 눈썹을 위로 올려서 이마 경계 근사
  const foreheadPoints: Point[] = [
    ...leftEyebrow.map((p) => ({ x: p.x, y: p.y - foreheadOffset })).reverse(),
    ...rightEyebrow.map((p) => ({ x: p.x, y: p.y - foreheadOffset })).reverse(),
  ];

  return toCatmullRomPath([...jawline, ...foreheadPoints], true);
}

/** 턱라인만 (열린 경로) */
export function generateJawlinePath(landmarks: Point[]): string | null {
  if (landmarks.length < 17) return null;
  return toCatmullRomPath(landmarks.slice(0, 17), false);
}
