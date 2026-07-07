/**
 * 3D 체형 아바타 — 절차적 파라메트릭 메시 (AV-2)
 *
 * 타원 단면 로프팅(몸통) + 캡슐형 사지 + 구(머리)를 순수 수학으로 생성.
 * three 미의존 — 출력은 positions/indices 배열 (컴포넌트가 BufferGeometry로 변환,
 * 노멀은 클라이언트 computeVertexNormals()).
 *
 * 좌표계: 원점 = 발바닥 중앙, +y 위. 신장 ≈ 1.75 (무차원 — cm 아님, 원리 §0 의도적 제외).
 * 결정론: 동일 params → 동일 배열 (Math.random/Date 금지).
 *
 * @see docs/specs/SDD-BODY-AVATAR-3D.md §2.2
 * @see docs/principles/avatar-3d.md §2.3
 */

import type { AvatarGeometryData, AvatarMorphs, AvatarParams } from './types';

/** 단면 원주 분할 수 */
const RADIAL_SEGMENTS = 24;
/** 몸통 세로 링 수 */
const TORSO_RINGS = 26;
/** 인체 몸통 단면 전후/좌우 비 (원리 §2.3) */
const TORSO_DEPTH_RATIO = 0.62;
/** 사지 단면 전후/좌우 비 — 원형에 가깝게 */
const LIMB_DEPTH_RATIO = 0.92;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** 로프팅 링 정의 — y 높이, 좌우 반지름, 전후 반지름, 중심 x 오프셋 */
interface Ring {
  y: number;
  rx: number;
  rz: number;
  cx: number;
}

/** 정점/인덱스 누적 빌더 */
class MeshBuilder {
  private readonly positions: number[] = [];
  private readonly indices: number[] = [];

  private get vertexCount(): number {
    return this.positions.length / 3;
  }

  /**
   * 링 배열을 옆면 그리드로 잇고 위/아래를 중심 팬으로 닫는다 (닫힌 로프트).
   * 몸통·사지·머리 전부 이 하나의 프리미티브로 생성 (P4).
   */
  addLoft(rings: Ring[]): void {
    const base = this.vertexCount;

    // 링 정점
    for (const ring of rings) {
      for (let j = 0; j < RADIAL_SEGMENTS; j++) {
        const angle = (j / RADIAL_SEGMENTS) * Math.PI * 2;
        this.positions.push(ring.cx + ring.rx * Math.cos(angle), ring.y, ring.rz * Math.sin(angle));
      }
    }

    // 옆면 (링 i ↔ i+1)
    for (let i = 0; i < rings.length - 1; i++) {
      for (let j = 0; j < RADIAL_SEGMENTS; j++) {
        const jn = (j + 1) % RADIAL_SEGMENTS;
        const a = base + i * RADIAL_SEGMENTS + j;
        const b = base + i * RADIAL_SEGMENTS + jn;
        const c = base + (i + 1) * RADIAL_SEGMENTS + jn;
        const d = base + (i + 1) * RADIAL_SEGMENTS + j;
        // 바깥면 기준 CCW (+y 위 방향 로프트)
        this.indices.push(a, c, b, a, d, c);
      }
    }

    // 아래 캡 (첫 링) — 중심 팬
    const bottom = rings[0];
    const bottomCenter = this.vertexCount;
    this.positions.push(bottom.cx, bottom.y, 0);
    for (let j = 0; j < RADIAL_SEGMENTS; j++) {
      const jn = (j + 1) % RADIAL_SEGMENTS;
      this.indices.push(bottomCenter, base + j, base + jn);
    }

    // 위 캡 (마지막 링)
    const top = rings[rings.length - 1];
    const topBase = base + (rings.length - 1) * RADIAL_SEGMENTS;
    const topCenter = this.vertexCount;
    this.positions.push(top.cx, top.y, 0);
    for (let j = 0; j < RADIAL_SEGMENTS; j++) {
      const jn = (j + 1) % RADIAL_SEGMENTS;
      this.indices.push(topCenter, topBase + jn, topBase + j);
    }
  }

  build(): AvatarGeometryData {
    return {
      positions: new Float32Array(this.positions),
      indices: new Uint32Array(this.indices),
    };
  }
}

/** (y, 반지름) 제어점 — y 오름차순 */
interface ProfilePoint {
  y: number;
  r: number;
}

/**
 * 제어점 사이 Catmull-Rom 스타일 에르미트 보간 — 부드러운 실루엣.
 * 비균등 y 간격 지원 (기울기는 이웃 중앙차분).
 */
function sampleProfile(points: ProfilePoint[], y: number): number {
  if (y <= points[0].y) return points[0].r;
  const last = points[points.length - 1];
  if (y >= last.y) return last.r;

  let seg = 0;
  while (seg < points.length - 2 && y > points[seg + 1].y) seg++;

  const p1 = points[seg];
  const p2 = points[seg + 1];
  const p0 = points[Math.max(0, seg - 1)];
  const p3 = points[Math.min(points.length - 1, seg + 2)];

  const h = p2.y - p1.y;
  const t = (y - p1.y) / h;
  // 중앙차분 기울기 (Catmull-Rom)
  const m1 = ((p2.r - p0.r) / (p2.y - p0.y)) * h;
  const m2 = ((p3.r - p1.r) / (p3.y - p1.y)) * h;

  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * p1.r +
    (t3 - 2 * t2 + t) * m1 +
    (-2 * t3 + 3 * t2) * p2.r +
    (t3 - t2) * m2
  );
}

/** 몸통 세로 프로파일 — 모프가 제어점 반지름을 스케일 (원리 §2.3) */
function torsoProfile(m: AvatarMorphs): ProfilePoint[] {
  const shoulderScale = lerp(0.82, 1.22, m.shoulder);
  const waistScale = lerp(0.76, 1.2, m.waist);
  const hipScale = lerp(0.84, 1.24, m.hip);
  const frameScale = lerp(0.92, 1.1, m.frame);

  return [
    { y: 0.86, r: 0.148 * hipScale }, // 힙 하단
    { y: 0.94, r: 0.156 * hipScale }, // 힙 정점
    { y: 1.06, r: 0.118 * waistScale }, // 허리
    { y: 1.24, r: 0.144 * frameScale }, // 가슴 — 프레임 반영
    { y: 1.4, r: 0.168 * shoulderScale }, // 어깨
    { y: 1.47, r: 0.115 * shoulderScale }, // 어깨 상단(목 방향 수렴)
  ];
}

function addTorso(builder: MeshBuilder, m: AvatarMorphs): void {
  const profile = torsoProfile(m);
  const yMin = profile[0].y;
  const yMax = profile[profile.length - 1].y;
  const rings: Ring[] = [];
  for (let i = 0; i < TORSO_RINGS; i++) {
    const y = lerp(yMin, yMax, i / (TORSO_RINGS - 1));
    const rx = sampleProfile(profile, y);
    rings.push({ y, rx, rz: rx * TORSO_DEPTH_RATIO, cx: 0 });
  }
  builder.addLoft(rings);
}

/** 머리 — 모프 무관 구 (얼굴 디테일 없음, 스타일라이즈드 원칙) */
function addHead(builder: MeshBuilder): void {
  const cy = 1.62;
  const radius = 0.115;
  const LAT_RINGS = 10;
  const rings: Ring[] = [];
  for (let i = 0; i <= LAT_RINGS; i++) {
    const phi = (i / LAT_RINGS) * Math.PI; // 0(아래) → π(위)
    const y = cy - radius * Math.cos(phi);
    const r = Math.max(0.008, radius * Math.sin(phi));
    rings.push({ y, rx: r, rz: r, cx: 0 });
  }
  builder.addLoft(rings);
}

/** 목 — 몸통 상단과 머리 연결 */
function addNeck(builder: MeshBuilder): void {
  builder.addLoft([
    { y: 1.45, rx: 0.052, rz: 0.052, cx: 0 },
    { y: 1.54, rx: 0.046, rz: 0.046, cx: 0 },
  ]);
}

/**
 * 사지(캡슐 근사) — 축 방향 링 + 끝단 라운딩.
 * @param tilt 하단 x 방향 벌어짐 (A-포즈)
 */
function addLimb(
  builder: MeshBuilder,
  opts: { topY: number; bottomY: number; topX: number; tilt: number; topR: number; bottomR: number }
): void {
  const SEGMENTS = 9;
  const rings: Ring[] = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS; // 0=아래, 1=위
    const y = lerp(opts.bottomY, opts.topY, t);
    const cx = opts.topX + opts.tilt * (1 - t);
    let r = lerp(opts.bottomR, opts.topR, t);
    // 끝단 라운딩 (캡슐 느낌)
    if (i === 0 || i === SEGMENTS) r *= 0.45;
    else if (i === 1 || i === SEGMENTS - 1) r *= 0.88;
    rings.push({ y, rx: r, rz: r * LIMB_DEPTH_RATIO, cx });
  }
  builder.addLoft(rings);
}

function addArms(builder: MeshBuilder, m: AvatarMorphs): void {
  const shoulderScale = lerp(0.82, 1.22, m.shoulder);
  const armR = lerp(0.036, 0.052, m.frame);
  const topX = 0.168 * shoulderScale + armR * 0.55;
  for (const side of [-1, 1]) {
    addLimb(builder, {
      topY: 1.38,
      bottomY: 0.96,
      topX: side * topX,
      tilt: side * 0.055, // A-포즈: 아래로 갈수록 바깥
      topR: armR,
      bottomR: armR * 0.78,
    });
  }
}

function addLegs(builder: MeshBuilder, m: AvatarMorphs): void {
  const hipScale = lerp(0.84, 1.24, m.hip);
  const frameScale = lerp(0.85, 1.15, m.frame);
  const topX = 0.156 * hipScale * 0.5;
  for (const side of [-1, 1]) {
    addLimb(builder, {
      topY: 0.9,
      bottomY: 0.04,
      topX: side * topX,
      tilt: side * 0.012,
      topR: 0.068 * frameScale,
      bottomR: 0.038 * frameScale,
    });
  }
}

/**
 * 아바타 메시 생성 — 결정론적 순수 함수.
 * 정점 수 ≈ 2,300 (모바일 안전권 ≤ 5,000).
 */
export function buildAvatarGeometry(params: AvatarParams): AvatarGeometryData {
  const builder = new MeshBuilder();
  const m = params.morphs;

  addTorso(builder, m);
  addHead(builder);
  addNeck(builder);
  addArms(builder, m);
  addLegs(builder, m);

  return builder.build();
}
