/**
 * Visual Skin Report 컴포넌트 모듈
 *
 * @description Visual Report P1 (VR-1~3)
 * @see SDD-VISUAL-SKIN-REPORT.md
 */

// VR-1: 6존 얼굴 맵
export { FaceZoneMap, type FaceZoneMapProps, type SkinZone, type ZoneInfo, type ZoneScore } from './FaceZoneMap';

// VR-2: 바이탈리티 점수
export { SkinVitalityScore, type SkinVitalityScoreProps, type VitalityGrade } from './SkinVitalityScore';

// VR-3: 존 상세 카드
export { ZoneDetailCard, type ZoneDetailCardProps, type ZoneDetail } from './ZoneDetailCard';
