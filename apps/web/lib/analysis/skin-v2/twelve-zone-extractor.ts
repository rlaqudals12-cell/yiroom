/**
 * S-2 12존 영역 추출기
 * 7존 기반 → 12 세부 존 확장 매핑
 *
 * @description 얼굴 랜드마크에서 12개 세부 존 영역을 계산합니다.
 * 기존 7존 시스템과 역호환되며, DetailedZoneId 타입 시스템과 통합됩니다.
 * @see types/skin-zones.ts - 12존 타입 정의
 * @see docs/principles/skin-physiology.md
 */

import type { DetailedZoneId } from '@/types/skin-zones';
import { DETAILED_ZONE_LABELS } from '@/types/skin-zones';
import type { FaceLandmarks } from './zone-extractor';
import type { ZoneMetricsV2 } from './types';

// =============================================================================
// 타입
// =============================================================================

/** 세부 존 영역 (픽셀 좌표) */
export interface DetailedZoneRegion {
  zoneId: DetailedZoneId;
  /** 한국어 라벨 */
  label: string;
  /** 중심 좌표 */
  center: { x: number; y: number };
  /** 반경 (원형 영역) */
  radius: number;
  /** 바운딩 박스 */
  boundingBox: { x: number; y: number; width: number; height: number };
}

/** 12존 추출 결과 */
export interface TwelveZoneExtractionResult {
  zones: Record<DetailedZoneId, DetailedZoneRegion>;
  landmarks: FaceLandmarks;
  imageWidth: number;
  imageHeight: number;
}

// =============================================================================
// 12존 추출 함수
// =============================================================================

/**
 * 얼굴 랜드마크에서 12개 세부 존 영역 계산
 *
 * 이마(3), 눈가(2), 볼(2), 코(2), 턱(3) = 12존
 */
export function extractTwelveZoneRegions(
  landmarks: FaceLandmarks,
  imageWidth: number,
  imageHeight: number
): TwelveZoneExtractionResult {
  const { faceBoundingBox } = landmarks;
  const faceWidth = faceBoundingBox.width;
  const faceHeight = faceBoundingBox.height;
  const baseRadius = Math.min(faceWidth, faceHeight) * 0.08;

  // 이마 좌우 오프셋 (얼굴 폭의 25%)
  const foreheadOffset = faceWidth * 0.25;
  // 코 세로 분할: 눈 높이~코끝 중간 = 콧등, 코끝 아래 = 코끝
  const noseMidY = (landmarks.leftEye.y + landmarks.noseTip.y) / 2;
  // 턱 좌우 오프셋
  const chinOffset = faceWidth * 0.22;
  // 턱 좌우 Y 위치: 볼 아래~턱 위 중간
  const jawlineY =
    (Math.max(landmarks.leftCheekCenter.y, landmarks.rightCheekCenter.y) + landmarks.chinCenter.y) /
    2;

  const zones: Record<DetailedZoneId, DetailedZoneRegion> = {
    // ─── 이마 영역 (3존) ───
    forehead_center: makeZone('forehead_center', landmarks.foreheadCenter, baseRadius * 1.3),
    forehead_left: makeZone(
      'forehead_left',
      {
        x: landmarks.foreheadCenter.x - foreheadOffset,
        y: landmarks.foreheadCenter.y + baseRadius * 0.3,
      },
      baseRadius * 1.0
    ),
    forehead_right: makeZone(
      'forehead_right',
      {
        x: landmarks.foreheadCenter.x + foreheadOffset,
        y: landmarks.foreheadCenter.y + baseRadius * 0.3,
      },
      baseRadius * 1.0
    ),

    // ─── 눈가 영역 (2존) ───
    eye_left: makeZone(
      'eye_left',
      {
        x: landmarks.leftEye.x,
        y: landmarks.leftEye.y + baseRadius * 0.3,
      },
      baseRadius * 0.8
    ),
    eye_right: makeZone(
      'eye_right',
      {
        x: landmarks.rightEye.x,
        y: landmarks.rightEye.y + baseRadius * 0.3,
      },
      baseRadius * 0.8
    ),

    // ─── 볼 영역 (2존) ───
    cheek_left: makeZone('cheek_left', landmarks.leftCheekCenter, baseRadius * 1.4),
    cheek_right: makeZone('cheek_right', landmarks.rightCheekCenter, baseRadius * 1.4),

    // ─── 코 영역 (2존) ───
    nose_bridge: makeZone(
      'nose_bridge',
      {
        x: landmarks.noseTip.x,
        y: noseMidY,
      },
      baseRadius * 0.7
    ),
    nose_tip: makeZone('nose_tip', landmarks.noseTip, baseRadius * 0.6),

    // ─── 턱 영역 (3존) ───
    chin_center: makeZone('chin_center', landmarks.chinCenter, baseRadius * 1.0),
    chin_left: makeZone(
      'chin_left',
      {
        x: landmarks.chinCenter.x - chinOffset,
        y: jawlineY,
      },
      baseRadius * 0.9
    ),
    chin_right: makeZone(
      'chin_right',
      {
        x: landmarks.chinCenter.x + chinOffset,
        y: jawlineY,
      },
      baseRadius * 0.9
    ),
  };

  return { zones, landmarks, imageWidth, imageHeight };
}

// =============================================================================
// 12존 관심사 및 추천 생성
// =============================================================================

/**
 * 12존 메트릭에서 관심사 감지
 */
export function analyzeDetailedZoneConcerns(
  zoneId: DetailedZoneId,
  metrics: ZoneMetricsV2
): string[] {
  const concerns: string[] = [];

  if (metrics.hydration < 40) concerns.push('건조함');
  if (metrics.oiliness > 70) concerns.push('과다 유분');
  if (metrics.pores < 50) concerns.push('모공 확대');
  if (metrics.texture < 50) concerns.push('피부결 거침');
  if (metrics.pigmentation < 60) concerns.push('색소침착');
  if (metrics.sensitivity > 60) concerns.push('민감함');
  if (metrics.elasticity < 50) concerns.push('탄력 저하');

  // 존별 특화 관심사
  if (zoneId.startsWith('eye_') && metrics.elasticity < 60) {
    concerns.push('눈가 잔주름');
  }
  if (zoneId === 'nose_tip' && metrics.oiliness > 60) {
    concerns.push('블랙헤드 위험');
  }
  if (zoneId.startsWith('chin_') && metrics.oiliness > 55) {
    concerns.push('턱 여드름 위험');
  }
  if (zoneId.startsWith('forehead_') && metrics.oiliness > 65) {
    concerns.push('이마 번들거림');
  }

  return concerns;
}

/**
 * 12존 케어 추천 생성
 */
export function generateDetailedZoneRecommendations(
  zoneId: DetailedZoneId,
  concerns: string[]
): string[] {
  const label = DETAILED_ZONE_LABELS[zoneId];
  const recommendations: string[] = [];

  for (const concern of concerns) {
    switch (concern) {
      case '건조함':
        recommendations.push(`${label} 보습 집중 케어 (히알루론산 세럼)`);
        break;
      case '과다 유분':
        recommendations.push(`${label} 유분 조절 (나이아신아마이드)`);
        break;
      case '모공 확대':
        recommendations.push(`${label} 모공 관리 (BHA 성분)`);
        break;
      case '피부결 거침':
        recommendations.push(`${label} 각질 케어 (AHA/PHA)`);
        break;
      case '색소침착':
        recommendations.push(`${label} 브라이트닝 (비타민C 세럼)`);
        break;
      case '민감함':
        recommendations.push(`${label} 진정 케어 (판테놀)`);
        break;
      case '탄력 저하':
        recommendations.push(`${label} 탄력 케어 (펩타이드)`);
        break;
      case '눈가 잔주름':
        recommendations.push('아이크림 사용 권장 (레티놀 + 펩타이드)');
        break;
      case '블랙헤드 위험':
        recommendations.push('주 1-2회 클레이 마스크 (코 부위)');
        break;
      case '턱 여드름 위험':
        recommendations.push('턱선 부위 살리실산 스팟 케어');
        break;
      case '이마 번들거림':
        recommendations.push('이마 부위 매트 프라이머 사용');
        break;
    }
  }

  return [...new Set(recommendations)].slice(0, 3);
}

// =============================================================================
// 내부 헬퍼
// =============================================================================

function makeZone(
  zoneId: DetailedZoneId,
  center: { x: number; y: number },
  radius: number
): DetailedZoneRegion {
  return {
    zoneId,
    label: DETAILED_ZONE_LABELS[zoneId],
    center,
    radius,
    boundingBox: {
      x: center.x - radius,
      y: center.y - radius,
      width: radius * 2,
      height: radius * 2,
    },
  };
}
