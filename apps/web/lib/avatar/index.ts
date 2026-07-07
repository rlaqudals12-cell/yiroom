/**
 * 3D 체형 아바타 모듈 공개 API (Barrel Export)
 *
 * @module lib/avatar
 * @description body_analyses 행 → 결정론적 아바타 파라미터 → 절차적 파라메트릭 메시.
 *              AI 호출 없음, 에셋 없음, three 미의존 (렌더는 components/avatar/).
 *
 * @see docs/adr/ADR-110-3d-body-avatar-visualization.md
 * @see docs/specs/SDD-BODY-AVATAR-3D.md
 *
 * @example
 * import { deriveAvatarParams, buildAvatarGeometry } from '@/lib/avatar';
 *
 * const params = deriveAvatarParams(bodyRow);
 * const { positions, indices } = buildAvatarGeometry(params);
 */

export { deriveAvatarParams } from './params';
export { buildAvatarGeometry } from './geometry';
export type {
  AvatarBodyType,
  AvatarGeometryData,
  AvatarMorphs,
  AvatarParams,
  AvatarTier,
  BodyRowForAvatar,
} from './types';
