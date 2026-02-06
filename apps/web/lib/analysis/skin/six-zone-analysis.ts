/**
 * 6-Zone 피부 분석 모듈
 *
 * @module lib/analysis/skin/six-zone-analysis
 * @description S-2 고도화: 6개 영역별 세밀한 피부 분석
 * @see {@link docs/principles/skin-physiology.md} 6-Zone 정의
 *
 * 6-Zone 구성:
 * 1. 이마 (Forehead): 피지선 밀도 높음, T-zone
 * 2. 코 (Nose): 피지선 최고 밀도, T-zone
 * 3. 왼쪽 볼 (Left Cheek): U-zone, 건조 경향
 * 4. 오른쪽 볼 (Right Cheek): U-zone, 건조 경향
 * 5. 턱 (Chin): 혼합, 호르몬 영향
 * 6. 눈가 (Eye Area): 민감, 얇은 피부
 */

import type { LabColor } from '@/lib/color';
import { rgbToLab } from '@/lib/color';
import type {
  SkinZone,
  ZoneMetrics,
  SixZoneAnalysis,
  SixZoneFaceRegion,
  BoundingBox,
  PoreSize,
  ZoneConcern,
  SkinType,
} from './types';
import { ZONE_OILINESS_THRESHOLDS, ZONE_SENSITIVITY_THRESHOLDS } from './types';

// =============================================================================
// 영역 추출 함수
// =============================================================================

/**
 * ImageData에서 특정 존 영역의 픽셀 데이터 추출
 *
 * @param imageData - 전체 얼굴 이미지 데이터
 * @param faceRegion - 6-Zone 얼굴 영역 좌표
 * @param zone - 추출할 존
 * @returns 해당 존의 ImageData
 */
export function extractZoneRegion(
  imageData: ImageData,
  faceRegion: SixZoneFaceRegion,
  zone: SkinZone
): ImageData {
  const box = faceRegion[zone];
  return extractRegionAsImageData(imageData, box);
}

/**
 * BoundingBox 영역을 ImageData로 추출
 */
function extractRegionAsImageData(imageData: ImageData, box: BoundingBox): ImageData {
  const { width: imgWidth, data: srcData } = imageData;
  const { x, y, width, height } = box;

  // 경계 검사
  const safeX = Math.max(0, Math.min(x, imageData.width - 1));
  const safeY = Math.max(0, Math.min(y, imageData.height - 1));
  const safeWidth = Math.min(width, imageData.width - safeX);
  const safeHeight = Math.min(height, imageData.height - safeY);

  const regionData = new Uint8ClampedArray(safeWidth * safeHeight * 4);

  let destIndex = 0;
  for (let row = safeY; row < safeY + safeHeight; row++) {
    for (let col = safeX; col < safeX + safeWidth; col++) {
      const srcIndex = (row * imgWidth + col) * 4;
      regionData[destIndex++] = srcData[srcIndex]; // R
      regionData[destIndex++] = srcData[srcIndex + 1]; // G
      regionData[destIndex++] = srcData[srcIndex + 2]; // B
      regionData[destIndex++] = srcData[srcIndex + 3]; // A
    }
  }

  return {
    data: regionData,
    width: safeWidth,
    height: safeHeight,
    colorSpace: 'srgb',
  };
}

// =============================================================================
// 색상 변환 유틸리티
// =============================================================================

/**
 * 픽셀 데이터에서 평균 Lab 색상 계산
 */
function calculateAverageLabColor(data: Uint8ClampedArray): LabColor {
  let totalL = 0;
  let totalA = 0;
  let totalB = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const bVal = data[i + 2];

    const lab = rgbToLab(r, g, bVal);
    totalL += lab.L;
    totalA += lab.a;
    totalB += lab.b;
    count++;
  }

  if (count === 0) {
    return { L: 0, a: 0, b: 0 };
  }

  return {
    L: totalL / count,
    a: totalA / count,
    b: totalB / count,
  };
}

// =============================================================================
// 존별 분석 함수
// =============================================================================

/**
 * 유분도 추정 (Lab L* 기반)
 *
 * 높은 L* = 반사도 높음 = 유분 많음 (번들거림)
 * @see docs/principles/skin-physiology.md Section 2.3
 */
function estimateOiliness(labL: number, _zone: SkinZone): number {
  // L* 기준 유분도 추정 (피부 밝기와 반사도 상관관계)
  const baseOiliness = Math.round(((labL - 40) / 50) * 100);
  return Math.max(0, Math.min(100, baseOiliness));
}

/**
 * 수분도 추정 (Lab L* + b* 기반)
 *
 * @see docs/principles/skin-physiology.md Section 6.4
 */
function estimateHydration(labL: number, labB: number): number {
  const lFactor = Math.min(labL / 60, 1);
  const bFactor = Math.max(0, Math.min((labB + 10) / 30, 1));
  return Math.round(lFactor * bFactor * 100);
}

/**
 * 민감도 추정 (Lab a* 기반 붉은기)
 *
 * @see docs/principles/skin-physiology.md Section 10.1
 */
function estimateSensitivity(labA: number, zone: SkinZone): number {
  const thresholds = ZONE_SENSITIVITY_THRESHOLDS[zone];

  if (labA < thresholds.normal) {
    return Math.round((labA / thresholds.normal) * 30);
  }
  if (labA < thresholds.high) {
    return Math.round(
      30 + ((labA - thresholds.normal) / (thresholds.high - thresholds.normal)) * 40
    );
  }
  return Math.round(70 + Math.min(((labA - thresholds.high) / 10) * 30, 30));
}

/**
 * 모공 크기 추정 (텍스처 기반 간이 추정)
 *
 * @see docs/principles/skin-physiology.md Section 3.1
 */
function estimatePoreSize(data: Uint8ClampedArray, zone: SkinZone): PoreSize {
  const pixelCount = data.length / 4;
  if (pixelCount === 0) return 'medium';

  let sumBrightness = 0;
  let sumSqBrightness = 0;

  for (let i = 0; i < data.length; i += 4) {
    const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sumBrightness += brightness;
    sumSqBrightness += brightness * brightness;
  }

  const mean = sumBrightness / pixelCount;
  const variance = sumSqBrightness / pixelCount - mean * mean;
  const stdDev = Math.sqrt(variance);

  const zoneMultiplier = zone === 'forehead' || zone === 'nose' ? 1.2 : 1.0;
  const adjustedStdDev = stdDev * zoneMultiplier;

  if (adjustedStdDev < 15) return 'small';
  if (adjustedStdDev < 30) return 'medium';
  return 'large';
}
/**
 * 존별 고민 사항 식별
 */
function identifyConcerns(
  oiliness: number,
  hydration: number,
  sensitivity: number,
  poreSize: PoreSize,
  zone: SkinZone
): ZoneConcern[] {
  const concerns: ZoneConcern[] = [];
  const thresholds = ZONE_OILINESS_THRESHOLDS[zone];

  // 유분 관련
  if (oiliness > thresholds.oily) {
    concerns.push('oiliness');
    if (zone === 'forehead' || zone === 'nose') {
      concerns.push('blackheads');
    }
  }

  // 건조함
  if (hydration < 40) {
    concerns.push('dryness');
  }

  // 붉은기/민감도
  if (sensitivity > 50) {
    concerns.push('redness');
  }
  if (sensitivity > 70) {
    concerns.push('sensitivity');
  }

  // 모공
  if (poreSize === 'large') {
    concerns.push('pores');
  }

  // 눈가는 주름 우려
  if (zone === 'eyeArea' && hydration < 50) {
    concerns.push('wrinkles');
  }

  // 턱은 여드름 우려
  if (zone === 'chin' && oiliness > thresholds.oily) {
    concerns.push('acne');
  }

  return concerns;
}

/**
 * 단일 존 분석
 *
 * @param zoneData - 해당 존의 ImageData
 * @param zone - 존 식별자
 * @returns 존별 분석 메트릭
 */
export function analyzeZone(zoneData: ImageData, zone: SkinZone): ZoneMetrics {
  const { data, width, height } = zoneData;
  const pixelCount = width * height;

  const avgLabColor = calculateAverageLabColor(data);

  const oiliness = estimateOiliness(avgLabColor.L, zone);
  const hydration = estimateHydration(avgLabColor.L, avgLabColor.b);
  const sensitivity = estimateSensitivity(avgLabColor.a, zone);
  const poreSize = estimatePoreSize(data, zone);
  const concerns = identifyConcerns(oiliness, hydration, sensitivity, poreSize, zone);

  return {
    zone,
    oiliness,
    hydration,
    sensitivity,
    poreSize,
    concerns,
    avgLabColor,
    sampleCount: pixelCount,
  };
}
// =============================================================================
// 통합 분석 함수
// =============================================================================

/**
 * 6개 존 통합 분석
 *
 * @param imageData - 전체 얼굴 이미지 데이터
 * @param faceRegion - 6-Zone 얼굴 영역 좌표
 * @returns 6-Zone 통합 분석 결과
 */
export function analyzeSixZones(
  imageData: ImageData,
  faceRegion: SixZoneFaceRegion
): SixZoneAnalysis {
  const zones: SkinZone[] = ['forehead', 'nose', 'leftCheek', 'rightCheek', 'chin', 'eyeArea'];

  // 각 존 분석
  const zoneResults = {} as Record<SkinZone, ZoneMetrics>;
  for (const zone of zones) {
    const zoneData = extractZoneRegion(imageData, faceRegion, zone);
    zoneResults[zone] = analyzeZone(zoneData, zone);
  }

  // T-zone 평균 (이마 + 코)
  const tZoneAverage = {
    oiliness: Math.round((zoneResults.forehead.oiliness + zoneResults.nose.oiliness) / 2),
    hydration: Math.round((zoneResults.forehead.hydration + zoneResults.nose.hydration) / 2),
    sensitivity: Math.round((zoneResults.forehead.sensitivity + zoneResults.nose.sensitivity) / 2),
  };

  // U-zone 평균 (양 볼 + 턱)
  const uZoneAverage = {
    oiliness: Math.round(
      (zoneResults.leftCheek.oiliness +
        zoneResults.rightCheek.oiliness +
        zoneResults.chin.oiliness) /
        3
    ),
    hydration: Math.round(
      (zoneResults.leftCheek.hydration +
        zoneResults.rightCheek.hydration +
        zoneResults.chin.hydration) /
        3
    ),
    sensitivity: Math.round(
      (zoneResults.leftCheek.sensitivity +
        zoneResults.rightCheek.sensitivity +
        zoneResults.chin.sensitivity) /
        3
    ),
  };

  // 전체 피부 타입 결정
  const { skinType, rationale } = determineSkinTypeFrom6Zones({
    zones: zoneResults,
    tZoneAverage,
    uZoneAverage,
  });

  // 신뢰도 계산 (샘플 수 기반)
  const totalSamples = Object.values(zoneResults).reduce((sum, z) => sum + z.sampleCount, 0);
  const confidence = Math.min(100, Math.round((totalSamples / 10000) * 100));

  return {
    zones: zoneResults,
    tZoneAverage,
    uZoneAverage,
    overallSkinType: skinType,
    skinTypeRationale: rationale,
    confidence,
    analyzedAt: new Date().toISOString(),
  };
}
/**
 * 6-Zone 분석 결과로 피부 타입 결정
 *
 * @see docs/principles/skin-physiology.md Section 2.4
 *
 * 판정 로직:
 * - 건성: T-zone, U-zone 모두 유분 낮고 수분 낮음
 * - 지성: T-zone, U-zone 모두 유분 높음
 * - 복합성: T-zone 유분 높고 U-zone 유분 낮음/정상
 * - 민감성: 전체 민감도 높음 (평균 50 이상)
 * - 중성: 나머지 (균형 잡힌 상태)
 *
 * @param analysis - 6-Zone 분석 결과 (부분)
 * @returns 피부 타입과 판정 근거
 */
export function determineSkinTypeFrom6Zones(
  analysis: Pick<SixZoneAnalysis, 'zones' | 'tZoneAverage' | 'uZoneAverage'>
): { skinType: SkinType; rationale: string } {
  const { tZoneAverage, uZoneAverage, zones } = analysis;

  // 전체 민감도 평균
  const avgSensitivity = Math.round(
    Object.values(zones).reduce((sum, z) => sum + z.sensitivity, 0) / 6
  );

  // 민감성 피부 체크 (최우선)
  if (avgSensitivity >= 50) {
    return {
      skinType: 'sensitive',
      rationale:
        '전체 민감도 평균 ' +
        avgSensitivity +
        '점으로 민감성 피부로 분류. 붉은기와 자극 반응 주의 필요.',
    };
  }

  // T-zone vs U-zone 유분도 비교
  const tZoneOily = tZoneAverage.oiliness > 60;
  const tZoneDry = tZoneAverage.oiliness < 35;
  const uZoneOily = uZoneAverage.oiliness > 55;
  const uZoneDry = uZoneAverage.oiliness < 30;

  // 건성: 양쪽 다 건조
  if (tZoneDry && uZoneDry) {
    return {
      skinType: 'dry',
      rationale:
        'T-zone 유분도 ' +
        tZoneAverage.oiliness +
        '점, U-zone 유분도 ' +
        uZoneAverage.oiliness +
        '점으로 건성 피부로 분류. 보습 케어 필요.',
    };
  }

  // 지성: 양쪽 다 유분 많음
  if (tZoneOily && uZoneOily) {
    return {
      skinType: 'oily',
      rationale:
        'T-zone 유분도 ' +
        tZoneAverage.oiliness +
        '점, U-zone 유분도 ' +
        uZoneAverage.oiliness +
        '점으로 지성 피부로 분류. 유분 컨트롤 필요.',
    };
  }

  // 복합성: T-zone 유분 많고 U-zone 정상/건조
  if (tZoneOily && !uZoneOily) {
    return {
      skinType: 'combination',
      rationale:
        'T-zone 유분도 ' +
        tZoneAverage.oiliness +
        '점(높음), U-zone 유분도 ' +
        uZoneAverage.oiliness +
        '점으로 복합성 피부로 분류. 존별 맞춤 케어 필요.',
    };
  }

  // 중성: 균형 잡힌 상태
  return {
    skinType: 'normal',
    rationale:
      'T-zone 유분도 ' +
      tZoneAverage.oiliness +
      '점, U-zone 유분도 ' +
      uZoneAverage.oiliness +
      '점으로 중성(정상) 피부로 분류. 현재 상태 유지 권장.',
  };
}
