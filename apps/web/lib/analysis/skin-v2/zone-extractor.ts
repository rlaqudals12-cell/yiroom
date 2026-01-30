/**
 * S-2 6존 영역 추출기
 * 얼굴 랜드마크 기반 피부 존 분리
 *
 * @description 6존 피부 영역 추출
 * @see docs/principles/skin-physiology.md
 */

import type {
  SkinZoneType,
  ZoneGroup,
  ZoneMetricsV2,
  ZoneAnalysisV2,
  SixZoneAnalysisV2,
} from './types';
import { ZONE_GROUP_MAPPING, ZONE_LABELS } from './types';

/** 얼굴 랜드마크 (간소화) */
export interface FaceLandmarks {
  /** 이마 중심 */
  foreheadCenter: { x: number; y: number };
  /** 코 끝 */
  noseTip: { x: number; y: number };
  /** 왼쪽 볼 중심 */
  leftCheekCenter: { x: number; y: number };
  /** 오른쪽 볼 중심 */
  rightCheekCenter: { x: number; y: number };
  /** 턱 중심 */
  chinCenter: { x: number; y: number };
  /** 왼쪽 눈 */
  leftEye: { x: number; y: number };
  /** 오른쪽 눈 */
  rightEye: { x: number; y: number };
  /** 입술 중심 */
  mouthCenter: { x: number; y: number };
  /** 얼굴 윤곽 박스 */
  faceBoundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/** 존 영역 (픽셀 좌표) */
export interface ZoneRegion {
  zone: SkinZoneType;
  /** 중심 좌표 */
  center: { x: number; y: number };
  /** 반경 (원형 영역) */
  radius: number;
  /** 바운딩 박스 */
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/** 존 추출 결과 */
export interface ZoneExtractionResult {
  zones: Record<SkinZoneType, ZoneRegion>;
  landmarks: FaceLandmarks;
  imageWidth: number;
  imageHeight: number;
}

/**
 * 얼굴 랜드마크에서 존 영역 계산
 */
export function extractZoneRegions(
  landmarks: FaceLandmarks,
  imageWidth: number,
  imageHeight: number
): ZoneExtractionResult {
  const { faceBoundingBox } = landmarks;
  const faceWidth = faceBoundingBox.width;
  const faceHeight = faceBoundingBox.height;

  // 존별 영역 계산 (얼굴 크기 대비 비율 기반)
  const zoneRadius = Math.min(faceWidth, faceHeight) * 0.12;

  const zones: Record<SkinZoneType, ZoneRegion> = {
    forehead: {
      zone: 'forehead',
      center: landmarks.foreheadCenter,
      radius: zoneRadius * 1.5,
      boundingBox: {
        x: landmarks.foreheadCenter.x - zoneRadius * 1.5,
        y: landmarks.foreheadCenter.y - zoneRadius,
        width: zoneRadius * 3,
        height: zoneRadius * 2,
      },
    },
    nose: {
      zone: 'nose',
      center: landmarks.noseTip,
      radius: zoneRadius * 0.8,
      boundingBox: {
        x: landmarks.noseTip.x - zoneRadius * 0.5,
        y: landmarks.noseTip.y - zoneRadius * 1.5,
        width: zoneRadius,
        height: zoneRadius * 2,
      },
    },
    leftCheek: {
      zone: 'leftCheek',
      center: landmarks.leftCheekCenter,
      radius: zoneRadius * 1.2,
      boundingBox: {
        x: landmarks.leftCheekCenter.x - zoneRadius * 1.2,
        y: landmarks.leftCheekCenter.y - zoneRadius * 1.2,
        width: zoneRadius * 2.4,
        height: zoneRadius * 2.4,
      },
    },
    rightCheek: {
      zone: 'rightCheek',
      center: landmarks.rightCheekCenter,
      radius: zoneRadius * 1.2,
      boundingBox: {
        x: landmarks.rightCheekCenter.x - zoneRadius * 1.2,
        y: landmarks.rightCheekCenter.y - zoneRadius * 1.2,
        width: zoneRadius * 2.4,
        height: zoneRadius * 2.4,
      },
    },
    chin: {
      zone: 'chin',
      center: landmarks.chinCenter,
      radius: zoneRadius,
      boundingBox: {
        x: landmarks.chinCenter.x - zoneRadius,
        y: landmarks.chinCenter.y - zoneRadius * 0.5,
        width: zoneRadius * 2,
        height: zoneRadius * 1.5,
      },
    },
    eyeArea: {
      zone: 'eyeArea',
      center: {
        x: (landmarks.leftEye.x + landmarks.rightEye.x) / 2,
        y: (landmarks.leftEye.y + landmarks.rightEye.y) / 2,
      },
      radius: zoneRadius * 0.6,
      boundingBox: {
        x: landmarks.leftEye.x - zoneRadius * 0.5,
        y: landmarks.leftEye.y - zoneRadius * 0.3,
        width: landmarks.rightEye.x - landmarks.leftEye.x + zoneRadius,
        height: zoneRadius * 0.6,
      },
    },
    lipArea: {
      zone: 'lipArea',
      center: landmarks.mouthCenter,
      radius: zoneRadius * 0.7,
      boundingBox: {
        x: landmarks.mouthCenter.x - zoneRadius * 0.8,
        y: landmarks.mouthCenter.y - zoneRadius * 0.4,
        width: zoneRadius * 1.6,
        height: zoneRadius * 0.8,
      },
    },
  };

  return {
    zones,
    landmarks,
    imageWidth,
    imageHeight,
  };
}

/**
 * T존-U존 차이 계산
 */
export function calculateTUZoneDifference(
  zones: Record<SkinZoneType, ZoneAnalysisV2>
): SixZoneAnalysisV2['tUzoneDifference'] {
  // T존: 이마, 코
  const tZoneOiliness = (zones.forehead.metrics.oiliness + zones.nose.metrics.oiliness) / 2;
  const tZoneHydration = (zones.forehead.metrics.hydration + zones.nose.metrics.hydration) / 2;

  // U존: 양볼, 턱
  const uZoneOiliness = (
    zones.leftCheek.metrics.oiliness +
    zones.rightCheek.metrics.oiliness +
    zones.chin.metrics.oiliness
  ) / 3;
  const uZoneHydration = (
    zones.leftCheek.metrics.hydration +
    zones.rightCheek.metrics.hydration +
    zones.chin.metrics.hydration
  ) / 3;

  const oilinessDiff = tZoneOiliness - uZoneOiliness;
  const hydrationDiff = tZoneHydration - uZoneHydration;

  // 복합성 판정: T존이 U존보다 유분 15% 이상 높으면 복합성
  const isCombiSkin = oilinessDiff > 15;

  return {
    oilinessDiff,
    hydrationDiff,
    isCombiSkin,
  };
}

/**
 * 존 그룹별 평균 점수 계산
 */
export function calculateGroupAverages(
  zones: Record<SkinZoneType, ZoneAnalysisV2>
): Record<ZoneGroup, number> {
  const groupScores: Record<ZoneGroup, number[]> = {
    tZone: [],
    uZone: [],
    eyeZone: [],
    lipZone: [],
  };

  for (const [zoneType, analysis] of Object.entries(zones) as [SkinZoneType, ZoneAnalysisV2][]) {
    const group = ZONE_GROUP_MAPPING[zoneType];
    groupScores[group].push(analysis.score);
  }

  const groupAverages: Record<ZoneGroup, number> = {
    tZone: 0,
    uZone: 0,
    eyeZone: 0,
    lipZone: 0,
  };

  for (const [group, scores] of Object.entries(groupScores) as [ZoneGroup, number[]][]) {
    groupAverages[group] = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;
  }

  return groupAverages;
}

/**
 * 6존 분석 결과 조합
 */
export function combineSixZoneAnalysis(
  zones: Record<SkinZoneType, ZoneAnalysisV2>
): SixZoneAnalysisV2 {
  return {
    zones,
    groupAverages: calculateGroupAverages(zones),
    tUzoneDifference: calculateTUZoneDifference(zones),
  };
}

/**
 * 존별 관심사(문제점) 분석
 */
export function analyzeZoneConcerns(metrics: ZoneMetricsV2): string[] {
  const concerns: string[] = [];

  if (metrics.hydration < 40) concerns.push('건조함');
  if (metrics.oiliness > 70) concerns.push('과다 유분');
  if (metrics.pores < 50) concerns.push('모공 확대');
  if (metrics.texture < 50) concerns.push('피부결 거침');
  if (metrics.pigmentation < 60) concerns.push('색소침착');
  if (metrics.sensitivity > 60) concerns.push('민감함');
  if (metrics.elasticity < 50) concerns.push('탄력 저하');

  return concerns;
}

/**
 * 존별 케어 추천 생성
 */
export function generateZoneRecommendations(
  zone: SkinZoneType,
  concerns: string[]
): string[] {
  const recommendations: string[] = [];
  const zoneLabel = ZONE_LABELS[zone];

  for (const concern of concerns) {
    switch (concern) {
      case '건조함':
        recommendations.push(`${zoneLabel} 부위에 보습 집중 케어`);
        recommendations.push('히알루론산 세럼 추천');
        break;
      case '과다 유분':
        recommendations.push(`${zoneLabel} 부위 유분 조절 토너 사용`);
        recommendations.push('나이아신아마이드 성분 추천');
        break;
      case '모공 확대':
        recommendations.push(`${zoneLabel} 부위 모공 관리 필요`);
        recommendations.push('BHA 성분 제품 추천');
        break;
      case '피부결 거침':
        recommendations.push(`${zoneLabel} 부위 각질 케어 필요`);
        recommendations.push('AHA/PHA 제품으로 부드러운 각질 제거');
        break;
      case '색소침착':
        recommendations.push(`${zoneLabel} 부위 브라이트닝 케어`);
        recommendations.push('비타민C 세럼 추천');
        break;
      case '민감함':
        recommendations.push(`${zoneLabel} 부위 진정 케어 필요`);
        recommendations.push('판테놀, 알란토인 성분 추천');
        break;
      case '탄력 저하':
        recommendations.push(`${zoneLabel} 부위 탄력 케어`);
        recommendations.push('펩타이드, 레티놀 성분 추천');
        break;
    }
  }

  return [...new Set(recommendations)]; // 중복 제거
}

/**
 * 종합 점수 계산
 */
export function calculateZoneScore(metrics: ZoneMetricsV2): number {
  // 가중치 기반 종합 점수
  const weights = {
    hydration: 0.2,
    oiliness: 0.1, // 역수 처리 (낮을수록 좋음은 아님, 균형이 중요)
    pores: 0.15,
    texture: 0.2,
    pigmentation: 0.15,
    sensitivity: 0.1, // 역수 처리 (낮을수록 좋음)
    elasticity: 0.1,
  };

  // 유분은 50에 가까울수록 좋음 (너무 높거나 낮으면 감점)
  const oilinessScore = 100 - Math.abs(metrics.oiliness - 50) * 2;
  // 민감도는 낮을수록 좋음
  const sensitivityScore = 100 - metrics.sensitivity;

  const score =
    metrics.hydration * weights.hydration +
    oilinessScore * weights.oiliness +
    metrics.pores * weights.pores +
    metrics.texture * weights.texture +
    metrics.pigmentation * weights.pigmentation +
    sensitivityScore * weights.sensitivity +
    metrics.elasticity * weights.elasticity;

  return Math.round(Math.max(0, Math.min(100, score)));
}
