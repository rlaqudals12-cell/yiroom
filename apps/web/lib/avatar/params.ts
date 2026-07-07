/**
 * 3D 체형 아바타 — 파라미터 도출 (AV-1)
 *
 * body_analyses 행 → 모프 가중치. 결정론적 순수 함수 (Math.random/Date 금지).
 * 도출 우선순위: body_ratios(full) → ratio(ratio) → 구 V1 점수 프록시(ratio) → 프리셋(preset).
 *
 * @see docs/specs/SDD-BODY-AVATAR-3D.md §2.1
 * @see docs/principles/avatar-3d.md §2.1
 */

import type { AvatarBodyType, AvatarMorphs, AvatarParams, BodyRowForAvatar } from './types';

/**
 * S/W/N 타입 프리셋 모프 (원리 §2.1 — 시각 검증 기반 튜닝값)
 * S(스트레이트): 상체 존재감·직선 / W(웨이브): 하체 중심·곡선 / N(내추럴): 골격감·프레임
 */
const PRESET_MORPHS: Record<AvatarBodyType, AvatarMorphs> = {
  S: { shoulder: 0.62, waist: 0.48, hip: 0.52, frame: 0.55 },
  W: { shoulder: 0.42, waist: 0.38, hip: 0.64, frame: 0.42 },
  N: { shoulder: 0.58, waist: 0.52, hip: 0.5, frame: 0.68 },
};

// 어깨/허리 비율 정규화 경계 — body-v2 BODY_SHAPE_THRESHOLDS(역삼각형 1.1)가 중앙권에 오도록
const SHOULDER_RATIO_MIN = 0.95;
const SHOULDER_RATIO_MAX = 1.45;
// 허리/힙 비율 경계 — 모래시계 기준(0.75)이 상위권에 오도록
const WAIST_HIP_RATIO_MIN = 0.65;
const WAIST_HIP_RATIO_MAX = 1.05;

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/** DECIMAL(string 가능) 파싱 + 비정상 측정값 거부(→ 상위 tier 강등) */
function parseRatio(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'number' ? value : Number.parseFloat(value);
  if (!Number.isFinite(n) || n < 0.5 || n > 2.5) return null;
  return n;
}

/** body_type 정규화 — 'S'/'W'/'N' 또는 풀네임(straight/wave/natural) 첫 글자. 실패 시 'S' */
function normalizeBodyType(raw: string | null | undefined): AvatarBodyType {
  const c = raw?.trim().charAt(0).toUpperCase();
  if (c === 'S' || c === 'W' || c === 'N') return c;
  return 'S';
}

function shoulderMorphFromRatio(r: number): number {
  return clamp01((r - SHOULDER_RATIO_MIN) / (SHOULDER_RATIO_MAX - SHOULDER_RATIO_MIN));
}

/** 어깨/허리 비율의 이면 — 어깨가 상대적으로 넓을수록 허리는 상대적으로 슬림 */
function waistMorphFromShoulderRatio(r: number): number {
  return clamp01(0.85 - 0.7 * shoulderMorphFromRatio(r));
}

/** 허리/힙 비율이 낮을수록(허리 잘록) 힙 모프 큼 */
function hipMorphFromWaistHipRatio(r: number): number {
  return clamp01((WAIST_HIP_RATIO_MAX - r) / (WAIST_HIP_RATIO_MAX - WAIST_HIP_RATIO_MIN));
}

/**
 * 프리셋 50% + 실측 유도 50% — 타입 성격을 유지하면서 측정을 반영.
 * 단조성 보존: 유도값이 단조면 블렌드도 단조.
 */
function blendWithPreset(preset: AvatarMorphs, derived: AvatarMorphs): AvatarMorphs {
  return {
    shoulder: 0.5 * preset.shoulder + 0.5 * derived.shoulder,
    waist: 0.5 * preset.waist + 0.5 * derived.waist,
    hip: 0.5 * preset.hip + 0.5 * derived.hip,
    frame: preset.frame, // 골격감은 S/W/N의 본질 — 비율로 덮지 않음
  };
}

/**
 * 분석 행 → 아바타 파라미터 (결정론).
 * prod 7행의 3가지 형태(최신 통합=ratio만 / 구 V1=점수만 / 이론상 빈 행) 전부 안전.
 */
export function deriveAvatarParams(row: BodyRowForAvatar): AvatarParams {
  const bodyType = normalizeBodyType(row.body_type);
  const preset = PRESET_MORPHS[bodyType];

  // Tier full — body_ratios JSONB (MediaPipe 측정 전체)
  const stwFull = parseRatio(row.body_ratios?.shoulderToWaistRatio);
  if (stwFull !== null) {
    const wth = parseRatio(row.body_ratios?.waistToHipRatio);
    const morphs = blendWithPreset(preset, {
      shoulder: shoulderMorphFromRatio(stwFull),
      waist: waistMorphFromShoulderRatio(stwFull),
      hip: wth !== null ? hipMorphFromWaistHipRatio(wth) : preset.hip,
      frame: preset.frame,
    });
    return { bodyType, morphs, tier: 'full' };
  }

  // Tier ratio — 통합 경로가 저장한 어깨/허리 비율 1개
  const ratio = parseRatio(row.ratio);
  if (ratio !== null) {
    const morphs = blendWithPreset(preset, {
      shoulder: shoulderMorphFromRatio(ratio),
      waist: waistMorphFromShoulderRatio(ratio),
      hip: preset.hip,
      frame: preset.frame,
    });
    return { bodyType, morphs, tier: 'ratio' };
  }

  // 구 V1 행 — 어깨/허리/힙 0-100 점수의 비를 비율 프록시로 (시각화 근사, 신뢰 주장 아님)
  if (
    typeof row.shoulder === 'number' &&
    typeof row.waist === 'number' &&
    typeof row.hip === 'number' &&
    row.waist > 0 &&
    row.hip > 0
  ) {
    const stwProxy = parseRatio(row.shoulder / row.waist);
    const wthProxy = parseRatio(row.waist / row.hip);
    if (stwProxy !== null) {
      const morphs = blendWithPreset(preset, {
        shoulder: shoulderMorphFromRatio(stwProxy),
        waist: waistMorphFromShoulderRatio(stwProxy),
        hip: wthProxy !== null ? hipMorphFromWaistHipRatio(wthProxy) : preset.hip,
        frame: preset.frame,
      });
      return { bodyType, morphs, tier: 'ratio' };
    }
  }

  // Tier preset — 타입만
  return { bodyType, morphs: { ...preset }, tier: 'preset' };
}
