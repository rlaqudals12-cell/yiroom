/**
 * S-2 12존 추출기 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  extractTwelveZoneRegions,
  analyzeDetailedZoneConcerns,
  generateDetailedZoneRecommendations,
} from '@/lib/analysis/skin-v2/twelve-zone-extractor';
import type { FaceLandmarks } from '@/lib/analysis/skin-v2/zone-extractor';

// Mock 랜드마크
const mockLandmarks: FaceLandmarks = {
  foreheadCenter: { x: 250, y: 80 },
  leftEye: { x: 180, y: 150 },
  rightEye: { x: 320, y: 150 },
  noseTip: { x: 250, y: 220 },
  leftCheekCenter: { x: 150, y: 230 },
  rightCheekCenter: { x: 350, y: 230 },
  chinCenter: { x: 250, y: 350 },
  mouthCenter: { x: 250, y: 290 },
  faceBoundingBox: { x: 80, y: 40, width: 340, height: 380 },
};

describe('extractTwelveZoneRegions', () => {
  it('12개 존 영역을 반환한다', () => {
    const result = extractTwelveZoneRegions(mockLandmarks, 500, 500);
    expect(Object.keys(result.zones)).toHaveLength(12);
  });

  it('각 존에 필수 필드가 존재한다', () => {
    const result = extractTwelveZoneRegions(mockLandmarks, 500, 500);
    for (const zone of Object.values(result.zones)) {
      expect(zone.zoneId).toBeTruthy();
      expect(zone.label).toBeTruthy();
      expect(zone.center).toBeDefined();
      expect(zone.radius).toBeGreaterThan(0);
      expect(zone.boundingBox).toBeDefined();
    }
  });

  it('이마 3존이 좌-중-우로 분포한다', () => {
    const result = extractTwelveZoneRegions(mockLandmarks, 500, 500);
    const left = result.zones.forehead_left.center.x;
    const center = result.zones.forehead_center.center.x;
    const right = result.zones.forehead_right.center.x;
    expect(left).toBeLessThan(center);
    expect(center).toBeLessThan(right);
  });

  it('볼 좌우가 얼굴 양쪽에 위치한다', () => {
    const result = extractTwelveZoneRegions(mockLandmarks, 500, 500);
    expect(result.zones.cheek_left.center.x).toBeLessThan(result.zones.cheek_right.center.x);
  });

  it('코가 콧등-코끝 수직 분할이다', () => {
    const result = extractTwelveZoneRegions(mockLandmarks, 500, 500);
    expect(result.zones.nose_bridge.center.y).toBeLessThan(result.zones.nose_tip.center.y);
  });
});

describe('analyzeDetailedZoneConcerns', () => {
  it('건조한 존에 건조함이 감지된다', () => {
    const concerns = analyzeDetailedZoneConcerns('cheek_left', {
      hydration: 20,
      oiliness: 30,
      pores: 70,
      texture: 70,
      pigmentation: 70,
      sensitivity: 20,
      elasticity: 70,
    });
    expect(concerns).toContain('건조함');
  });

  it('눈가 탄력 저하 시 잔주름이 감지된다', () => {
    const concerns = analyzeDetailedZoneConcerns('eye_left', {
      hydration: 60,
      oiliness: 30,
      pores: 70,
      texture: 70,
      pigmentation: 70,
      sensitivity: 20,
      elasticity: 40,
    });
    expect(concerns).toContain('눈가 잔주름');
  });

  it('코끝 유분 과다 시 블랙헤드가 감지된다', () => {
    const concerns = analyzeDetailedZoneConcerns('nose_tip', {
      hydration: 60,
      oiliness: 75,
      pores: 70,
      texture: 70,
      pigmentation: 70,
      sensitivity: 20,
      elasticity: 70,
    });
    expect(concerns).toContain('블랙헤드 위험');
  });

  it('이마 유분 과다 시 번들거림이 감지된다', () => {
    const concerns = analyzeDetailedZoneConcerns('forehead_center', {
      hydration: 60,
      oiliness: 80,
      pores: 70,
      texture: 70,
      pigmentation: 70,
      sensitivity: 20,
      elasticity: 70,
    });
    expect(concerns).toContain('이마 번들거림');
  });

  it('정상 메트릭이면 관심사가 적다', () => {
    const concerns = analyzeDetailedZoneConcerns('cheek_right', {
      hydration: 70,
      oiliness: 50,
      pores: 70,
      texture: 70,
      pigmentation: 70,
      sensitivity: 20,
      elasticity: 70,
    });
    expect(concerns.length).toBeLessThanOrEqual(1);
  });
});

describe('generateDetailedZoneRecommendations', () => {
  it('관심사에 맞는 추천을 반환한다', () => {
    const recs = generateDetailedZoneRecommendations('cheek_left', ['건조함', '민감함']);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs.some((r) => r.includes('보습'))).toBe(true);
    expect(recs.some((r) => r.includes('진정'))).toBe(true);
  });

  it('관심사 없으면 빈 배열을 반환한다', () => {
    const recs = generateDetailedZoneRecommendations('chin_center', []);
    expect(recs).toHaveLength(0);
  });

  it('최대 3개까지만 반환한다', () => {
    const recs = generateDetailedZoneRecommendations('nose_tip', [
      '건조함',
      '과다 유분',
      '모공 확대',
      '피부결 거침',
      '색소침착',
    ]);
    expect(recs.length).toBeLessThanOrEqual(3);
  });
});
