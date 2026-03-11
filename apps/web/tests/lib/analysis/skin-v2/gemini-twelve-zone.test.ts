/**
 * 12존 Gemini 프롬프트 모듈 테스트 (T4.5.4)
 */

import { describe, it, expect } from 'vitest';
import {
  TWELVE_ZONE_SYSTEM_PROMPT,
  buildTwelveZoneUserPrompt,
  parseTwelveZoneResponse,
} from '@/lib/analysis/skin-v2/gemini-twelve-zone';
import type { DetailedZoneId } from '@/types/skin-zones';

// 12존 전체 ID 목록
const ALL_ZONE_IDS: DetailedZoneId[] = [
  'forehead_center',
  'forehead_left',
  'forehead_right',
  'eye_left',
  'eye_right',
  'cheek_left',
  'cheek_right',
  'nose_bridge',
  'nose_tip',
  'chin_center',
  'chin_left',
  'chin_right',
];

// 유효한 12존 응답 생성 헬퍼
function createValidResponse(overrides?: Record<string, unknown>): string {
  const zones: Record<string, Record<string, number>> = {};
  for (const zoneId of ALL_ZONE_IDS) {
    zones[zoneId] = {
      hydration: 65,
      oiliness: 40,
      pores: 70,
      texture: 75,
      pigmentation: 80,
      sensitivity: 25,
      elasticity: 72,
    };
  }

  const response = {
    zones,
    overallSkinType: 'combination',
    imageQuality: {
      analysisReliability: 'high',
      lightingCondition: 'natural',
      makeupDetected: false,
    },
    ...overrides,
  };

  return JSON.stringify(response);
}

// ============================================
// 시스템 프롬프트 테스트
// ============================================

describe('TWELVE_ZONE_SYSTEM_PROMPT', () => {
  it('비어 있지 않아야 함', () => {
    expect(TWELVE_ZONE_SYSTEM_PROMPT).toBeTruthy();
    expect(TWELVE_ZONE_SYSTEM_PROMPT.length).toBeGreaterThan(100);
  });

  it('12개 존 이름을 모두 포함해야 함', () => {
    for (const zoneId of ALL_ZONE_IDS) {
      expect(TWELVE_ZONE_SYSTEM_PROMPT).toContain(zoneId);
    }
  });

  it('7개 메트릭 이름을 모두 포함해야 함', () => {
    const metrics = [
      'hydration',
      'oiliness',
      'pores',
      'texture',
      'pigmentation',
      'sensitivity',
      'elasticity',
    ];
    for (const metric of metrics) {
      expect(TWELVE_ZONE_SYSTEM_PROMPT).toContain(metric);
    }
  });
});

// ============================================
// 유저 프롬프트 빌더 테스트
// ============================================

describe('buildTwelveZoneUserPrompt', () => {
  it('이미지 플레이스홀더를 포함해야 함', () => {
    const prompt = buildTwelveZoneUserPrompt('data:image/jpeg;base64,/9j/abc123');
    expect(prompt).toContain('[IMAGE:');
    expect(prompt).toContain('data:image/jpeg;ba');
  });

  it('12개 존 이름을 모두 포함해야 함', () => {
    const prompt = buildTwelveZoneUserPrompt('test-image-base64');
    for (const zoneId of ALL_ZONE_IDS) {
      expect(prompt).toContain(zoneId);
    }
  });

  it('JSON 출력 형식 지시를 포함해야 함', () => {
    const prompt = buildTwelveZoneUserPrompt('test');
    expect(prompt).toContain('overallSkinType');
    expect(prompt).toContain('imageQuality');
  });
});

// ============================================
// 응답 파싱 테스트
// ============================================

describe('parseTwelveZoneResponse', () => {
  it('유효한 응답을 정상 파싱해야 함', () => {
    const result = parseTwelveZoneResponse(createValidResponse());

    expect(result.parseSuccess).toBe(true);
    expect(result.skinType).toBe('combination');
    expect(result.imageQuality.analysisReliability).toBe('high');
    expect(result.imageQuality.lightingCondition).toBe('natural');
    expect(result.imageQuality.makeupDetected).toBe(false);

    // 12존 모두 존재
    for (const zoneId of ALL_ZONE_IDS) {
      expect(result.zones[zoneId]).toBeDefined();
      expect(result.zones[zoneId].hydration).toBe(65);
      expect(result.zones[zoneId].oiliness).toBe(40);
    }
  });

  it('코드 블록으로 감싼 JSON도 파싱해야 함', () => {
    const wrapped = '```json\n' + createValidResponse() + '\n```';
    const result = parseTwelveZoneResponse(wrapped);

    expect(result.parseSuccess).toBe(true);
    expect(result.skinType).toBe('combination');
  });

  it('누락된 존에 기본값(50)을 적용해야 함', () => {
    // 3개 존만 포함
    const partialZones: Record<string, Record<string, number>> = {
      forehead_center: {
        hydration: 80,
        oiliness: 30,
        pores: 60,
        texture: 70,
        pigmentation: 85,
        sensitivity: 20,
        elasticity: 75,
      },
      eye_left: {
        hydration: 55,
        oiliness: 20,
        pores: 65,
        texture: 60,
        pigmentation: 70,
        sensitivity: 15,
        elasticity: 50,
      },
      chin_center: {
        hydration: 70,
        oiliness: 50,
        pores: 55,
        texture: 65,
        pigmentation: 75,
        sensitivity: 30,
        elasticity: 60,
      },
    };

    const response = JSON.stringify({
      zones: partialZones,
      overallSkinType: 'dry',
      imageQuality: {
        analysisReliability: 'medium',
        lightingCondition: 'artificial',
        makeupDetected: true,
      },
    });

    const result = parseTwelveZoneResponse(response);

    expect(result.parseSuccess).toBe(true);

    // 존재하는 존 — 원래 값
    expect(result.zones.forehead_center.hydration).toBe(80);
    expect(result.zones.eye_left.hydration).toBe(55);

    // 누락된 존 — 기본값 50
    expect(result.zones.forehead_left.hydration).toBe(50);
    expect(result.zones.cheek_right.oiliness).toBe(50);
    expect(result.zones.nose_bridge.elasticity).toBe(50);
  });

  it('범위 밖 값을 0-100으로 클램핑해야 함', () => {
    const zones: Record<string, Record<string, number>> = {};
    for (const zoneId of ALL_ZONE_IDS) {
      zones[zoneId] = {
        hydration: 150, // 초과 → 100
        oiliness: -20, // 미만 → 0
        pores: 200, // 초과 → 100
        texture: 50,
        pigmentation: -100, // 미만 → 0
        sensitivity: 300, // 초과 → 100
        elasticity: 75,
      };
    }

    const response = JSON.stringify({
      zones,
      overallSkinType: 'oily',
      imageQuality: {
        analysisReliability: 'high',
        lightingCondition: 'natural',
        makeupDetected: false,
      },
    });

    const result = parseTwelveZoneResponse(response);

    expect(result.parseSuccess).toBe(true);
    expect(result.zones.forehead_center.hydration).toBe(100);
    expect(result.zones.forehead_center.oiliness).toBe(0);
    expect(result.zones.forehead_center.pores).toBe(100);
    expect(result.zones.forehead_center.pigmentation).toBe(0);
    expect(result.zones.forehead_center.sensitivity).toBe(100);
    expect(result.zones.forehead_center.elasticity).toBe(75);
  });

  it('유효하지 않은 JSON에 실패 결과를 반환해야 함', () => {
    const result = parseTwelveZoneResponse('이것은 JSON이 아닙니다 { broken');

    expect(result.parseSuccess).toBe(false);
    expect(result.skinType).toBe('normal');
    expect(result.imageQuality.analysisReliability).toBe('low');

    // 12존 모두 기본값
    for (const zoneId of ALL_ZONE_IDS) {
      expect(result.zones[zoneId].hydration).toBe(50);
    }
  });

  it('빈 문자열에 실패 결과를 반환해야 함', () => {
    const result = parseTwelveZoneResponse('');

    expect(result.parseSuccess).toBe(false);
    expect(result.skinType).toBe('normal');
  });

  it('빈 공백 문자열에 실패 결과를 반환해야 함', () => {
    const result = parseTwelveZoneResponse('   \n\t  ');

    expect(result.parseSuccess).toBe(false);
  });

  it('유효하지 않은 skinType에 normal 기본값을 적용해야 함', () => {
    const response = createValidResponse({ overallSkinType: 'unknown_type' });
    const result = parseTwelveZoneResponse(response);

    expect(result.parseSuccess).toBe(true);
    expect(result.skinType).toBe('normal');
  });

  it('유효하지 않은 imageQuality에 기본값을 적용해야 함', () => {
    const response = createValidResponse({
      imageQuality: {
        analysisReliability: 'invalid',
        lightingCondition: 'unknown',
        makeupDetected: 'yes',
      },
    });
    const result = parseTwelveZoneResponse(response);

    expect(result.parseSuccess).toBe(true);
    expect(result.imageQuality.analysisReliability).toBe('low');
    expect(result.imageQuality.lightingCondition).toBe('mixed');
    expect(result.imageQuality.makeupDetected).toBe(false);
  });

  it('imageQuality 누락 시 기본값을 적용해야 함', () => {
    const response = createValidResponse({ imageQuality: undefined });
    const result = parseTwelveZoneResponse(response);

    expect(result.parseSuccess).toBe(true);
    expect(result.imageQuality.analysisReliability).toBe('low');
    expect(result.imageQuality.lightingCondition).toBe('mixed');
    expect(result.imageQuality.makeupDetected).toBe(false);
  });

  it('메트릭에 숫자가 아닌 값이 들어오면 기본값(50)을 적용해야 함', () => {
    const zones: Record<string, Record<string, unknown>> = {};
    for (const zoneId of ALL_ZONE_IDS) {
      zones[zoneId] = {
        hydration: 'high', // 문자열 → 50
        oiliness: null, // null → 50
        pores: undefined, // undefined → 50
        texture: true, // boolean → 50
        pigmentation: 80, // 정상
        sensitivity: {}, // 객체 → 50
        elasticity: 70, // 정상
      };
    }

    const response = JSON.stringify({
      zones,
      overallSkinType: 'sensitive',
      imageQuality: {
        analysisReliability: 'medium',
        lightingCondition: 'mixed',
        makeupDetected: false,
      },
    });

    const result = parseTwelveZoneResponse(response);

    expect(result.parseSuccess).toBe(true);
    expect(result.zones.forehead_center.hydration).toBe(50);
    expect(result.zones.forehead_center.oiliness).toBe(50);
    expect(result.zones.forehead_center.pores).toBe(50);
    expect(result.zones.forehead_center.texture).toBe(50);
    expect(result.zones.forehead_center.pigmentation).toBe(80);
    expect(result.zones.forehead_center.sensitivity).toBe(50);
    expect(result.zones.forehead_center.elasticity).toBe(70);
  });

  it('zones가 null인 응답에 모든 존 기본값을 적용해야 함', () => {
    const response = JSON.stringify({
      zones: null,
      overallSkinType: 'dry',
      imageQuality: {
        analysisReliability: 'low',
        lightingCondition: 'artificial',
        makeupDetected: false,
      },
    });

    const result = parseTwelveZoneResponse(response);

    expect(result.parseSuccess).toBe(true);
    expect(result.skinType).toBe('dry');

    for (const zoneId of ALL_ZONE_IDS) {
      expect(result.zones[zoneId].hydration).toBe(50);
      expect(result.zones[zoneId].elasticity).toBe(50);
    }
  });

  it('모든 5가지 skinType을 정상 인식해야 함', () => {
    const types = ['dry', 'oily', 'combination', 'normal', 'sensitive'] as const;

    for (const skinType of types) {
      const response = createValidResponse({ overallSkinType: skinType });
      const result = parseTwelveZoneResponse(response);
      expect(result.skinType).toBe(skinType);
    }
  });
});
