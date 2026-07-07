/**
 * 3D 체형 아바타 — 공개 타입
 *
 * @see docs/specs/SDD-BODY-AVATAR-3D.md
 * @see docs/principles/avatar-3d.md
 * @see docs/adr/ADR-110-3d-body-avatar-visualization.md
 */

/** 골격 체형 (ADR-108 taxonomy — body_analyses.body_type) */
export type AvatarBodyType = 'S' | 'W' | 'N';

/** 데이터 밀도 계층: preset=타입만 / ratio=비율 보정 / full=body_ratios 전체 */
export type AvatarTier = 'preset' | 'ratio' | 'full';

/** 모프 가중치 (각 0-1) — 절차적 메시의 제어점 반지름 스케일 입력 */
export interface AvatarMorphs {
  /** 어깨 폭 */
  shoulder: number;
  /** 허리 폭 — 클수록 굵음 */
  waist: number;
  /** 힙 폭 */
  hip: number;
  /** 골격감/프레임 — 사지·가슴 굵기 */
  frame: number;
}

/** 아바타 파라미터 — 분석 행에서 결정론적으로 도출 (AI 호출 없음) */
export interface AvatarParams {
  bodyType: AvatarBodyType;
  morphs: AvatarMorphs;
  tier: AvatarTier;
}

/**
 * body_analyses 행 중 아바타에 필요한 부분집합.
 * 컬럼 실재는 prod 실쿼리로 검증됨 (2026-07-08, ADR-110 Context).
 * ratio는 Postgres DECIMAL이라 supabase-js가 string으로 반환할 수 있음.
 */
export interface BodyRowForAvatar {
  body_type: string | null;
  ratio: number | string | null;
  /** 구 V1 행: 0-100 점수 (폭 아님 — 비율 프록시로만 사용) */
  shoulder: number | null;
  waist: number | null;
  hip: number | null;
  /** 신규 JSONB (20260708 마이그) — MediaPipe BodyRatios 전체 */
  body_ratios?: Record<string, number> | null;
}

/** 절차적 메시 출력 — three 미의존 (컴포넌트에서 BufferGeometry로 변환) */
export interface AvatarGeometryData {
  /** xyz 연속 배열 */
  positions: Float32Array;
  indices: Uint32Array;
}
