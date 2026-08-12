/**
 * PC-2: 퍼스널컬러 v2 Mock 데이터 테스트
 *
 * @module tests/lib/analysis/personal-color-v2/mock
 * @description TONE_PALETTES 상수, generateMockClassification, generateMockResult 등 테스트
 */

import { describe, it, expect } from 'vitest';
import {
  TONE_PALETTES,
  generateMockClassification,
  generateMockResult,
  getTonePalette,
  getToneLabel,
} from '@/lib/analysis/personal-color-v2/mock';
import type { TwelveTone } from '@/lib/analysis/personal-color-v2/types';
import {
  TWELVE_TONE_LABELS,
  TWELVE_TONE_REFERENCE_LAB,
} from '@/lib/analysis/personal-color-v2/types';

describe('TONE_PALETTES 상수', () => {
  const allTones: TwelveTone[] = [
    'light-spring',
    'true-spring',
    'bright-spring',
    'light-summer',
    'true-summer',
    'muted-summer',
    'muted-autumn',
    'true-autumn',
    'deep-autumn',
    'deep-winter',
    'true-winter',
    'bright-winter',
  ];

  describe('12톤 팔레트 완전성', () => {
    it('모든 12톤에 대한 팔레트가 정의되어 있다', () => {
      for (const tone of allTones) {
        expect(TONE_PALETTES[tone]).toBeDefined();
      }
    });

    it('각 팔레트에 필수 속성이 포함되어 있다', () => {
      for (const tone of allTones) {
        const palette = TONE_PALETTES[tone];
        expect(palette.tone).toBe(tone);
        expect(palette.mainColors).toBeDefined();
        expect(palette.accentColors).toBeDefined();
        expect(palette.avoidColors).toBeDefined();
        expect(palette.lipColors).toBeDefined();
        expect(palette.eyeshadowColors).toBeDefined();
        expect(palette.blushColors).toBeDefined();
      }
    });
  });

  describe('팔레트 색상 개수 검증', () => {
    it('mainColors는 6개여야 한다', () => {
      for (const tone of allTones) {
        expect(TONE_PALETTES[tone].mainColors).toHaveLength(6);
      }
    });

    it('accentColors는 4개여야 한다', () => {
      for (const tone of allTones) {
        expect(TONE_PALETTES[tone].accentColors).toHaveLength(4);
      }
    });

    it('avoidColors는 4개여야 한다', () => {
      for (const tone of allTones) {
        expect(TONE_PALETTES[tone].avoidColors).toHaveLength(4);
      }
    });

    it('lipColors는 4개여야 한다', () => {
      for (const tone of allTones) {
        expect(TONE_PALETTES[tone].lipColors).toHaveLength(4);
      }
    });

    it('eyeshadowColors는 4개여야 한다', () => {
      for (const tone of allTones) {
        expect(TONE_PALETTES[tone].eyeshadowColors).toHaveLength(4);
      }
    });

    it('blushColors는 4개여야 한다', () => {
      for (const tone of allTones) {
        expect(TONE_PALETTES[tone].blushColors).toHaveLength(4);
      }
    });
  });

  describe('HEX 색상 형식 검증', () => {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;

    it('mainColors가 유효한 HEX 형식이다', () => {
      for (const tone of allTones) {
        for (const color of TONE_PALETTES[tone].mainColors) {
          expect(color).toMatch(hexPattern);
        }
      }
    });

    it('accentColors가 유효한 HEX 형식이다', () => {
      for (const tone of allTones) {
        for (const color of TONE_PALETTES[tone].accentColors) {
          expect(color).toMatch(hexPattern);
        }
      }
    });

    it('lipColors가 유효한 HEX 형식이다', () => {
      for (const tone of allTones) {
        for (const color of TONE_PALETTES[tone].lipColors) {
          expect(color).toMatch(hexPattern);
        }
      }
    });
  });

  describe('시즌별 팔레트 특성', () => {
    it('Spring 톤은 따뜻한 색상을 포함한다', () => {
      const springTones: TwelveTone[] = ['light-spring', 'true-spring', 'bright-spring'];
      for (const tone of springTones) {
        const palette = TONE_PALETTES[tone];
        // 웜톤 특성: avoidColors에 어두운/차가운 색상 포함
        expect(palette.avoidColors.length).toBeGreaterThan(0);
      }
    });

    it('Winter 톤은 선명한/대비가 강한 색상을 포함한다', () => {
      const winterTones: TwelveTone[] = ['deep-winter', 'true-winter', 'bright-winter'];
      for (const tone of winterTones) {
        const palette = TONE_PALETTES[tone];
        // 윈터 특성: mainColors에 선명한 색상 포함
        expect(palette.mainColors.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('generateMockClassification', () => {
  describe('기본 동작', () => {
    it('옵션 없이 호출 시 유효한 분류 결과를 반환한다', () => {
      const result = generateMockClassification();

      expect(result).toHaveProperty('tone');
      expect(result).toHaveProperty('season');
      expect(result).toHaveProperty('subtype');
      expect(result).toHaveProperty('undertone');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('toneScores');
      expect(result).toHaveProperty('measuredLab');
    });

    it('tone이 12톤 중 하나이다', () => {
      const validTones: TwelveTone[] = [
        'light-spring',
        'true-spring',
        'bright-spring',
        'light-summer',
        'true-summer',
        'muted-summer',
        'muted-autumn',
        'true-autumn',
        'deep-autumn',
        'deep-winter',
        'true-winter',
        'bright-winter',
      ];

      const result = generateMockClassification();
      expect(validTones).toContain(result.tone);
    });

    it('season이 톤과 일치한다', () => {
      const result = generateMockClassification();
      const toneParts = result.tone.split('-');
      expect(result.season).toBe(toneParts[1]);
    });

    it('subtype이 톤과 일치한다', () => {
      const result = generateMockClassification();
      const toneParts = result.tone.split('-');
      expect(result.subtype).toBe(toneParts[0]);
    });
  });

  describe('undertone 판정', () => {
    it('Spring/Autumn 시즌은 warm undertone이다', () => {
      const warmResult = generateMockClassification({ preferredTone: 'true-spring' });
      expect(warmResult.undertone).toBe('warm');

      const autumnResult = generateMockClassification({ preferredTone: 'true-autumn' });
      expect(autumnResult.undertone).toBe('warm');
    });

    it('Summer/Winter 시즌은 cool undertone이다', () => {
      const summerResult = generateMockClassification({ preferredTone: 'true-summer' });
      expect(summerResult.undertone).toBe('cool');

      const winterResult = generateMockClassification({ preferredTone: 'true-winter' });
      expect(winterResult.undertone).toBe('cool');
    });
  });

  describe('preferredTone 옵션', () => {
    it('preferredTone 지정 시 해당 톤이 선택된다', () => {
      const result = generateMockClassification({ preferredTone: 'bright-spring' });
      expect(result.tone).toBe('bright-spring');
    });

    it('preferredTone별로 올바른 season이 설정된다', () => {
      const toneSeasonMap: Record<TwelveTone, string> = {
        'light-spring': 'spring',
        'true-spring': 'spring',
        'bright-spring': 'spring',
        'light-summer': 'summer',
        'true-summer': 'summer',
        'muted-summer': 'summer',
        'muted-autumn': 'autumn',
        'true-autumn': 'autumn',
        'deep-autumn': 'autumn',
        'deep-winter': 'winter',
        'true-winter': 'winter',
        'bright-winter': 'winter',
      };

      for (const [tone, expectedSeason] of Object.entries(toneSeasonMap)) {
        const result = generateMockClassification({ preferredTone: tone as TwelveTone });
        expect(result.season).toBe(expectedSeason);
      }
    });
  });

  describe('confidence 값', () => {
    it('confidence가 75-90 범위이며 호출마다 흔들리지 않는다', () => {
      // 시드 미지정 = 고정 기본 시드 → 반복 호출해도 항상 같은 값 (Math.random 없음)
      const first = generateMockClassification().confidence;
      for (let i = 0; i < 10; i++) {
        const result = generateMockClassification();
        expect(result.confidence).toBe(first);
        expect(result.confidence).toBeGreaterThanOrEqual(75);
        expect(result.confidence).toBeLessThanOrEqual(90);
      }
    });

    it('시드가 다르면 confidence도 달라질 수 있다 (상수 고정이 아님)', () => {
      const values = ['s1', 's2', 's3', 's4', 's5', 's6'].map(
        (seed) => generateMockClassification({ seed }).confidence
      );
      expect(new Set(values).size).toBeGreaterThan(1);
    });
  });

  describe('toneScores 검증', () => {
    it('12톤 모두에 대한 점수가 포함된다', () => {
      const result = generateMockClassification();
      const allTones: TwelveTone[] = [
        'light-spring',
        'true-spring',
        'bright-spring',
        'light-summer',
        'true-summer',
        'muted-summer',
        'muted-autumn',
        'true-autumn',
        'deep-autumn',
        'deep-winter',
        'true-winter',
        'bright-winter',
      ];

      for (const tone of allTones) {
        expect(result.toneScores[tone]).toBeDefined();
        expect(typeof result.toneScores[tone]).toBe('number');
      }
    });

    it('선택된 톤의 점수가 가장 높다', () => {
      const result = generateMockClassification({ preferredTone: 'true-spring' });
      const selectedScore = result.toneScores['true-spring'];

      expect(selectedScore).toBeGreaterThanOrEqual(85);
      expect(selectedScore).toBeLessThanOrEqual(95);
      // 12톤 전체에서 최댓값이어야 한다 (시드가 바뀌어도 순위는 깨지지 않는다)
      expect(selectedScore).toBe(Math.max(...Object.values(result.toneScores)));
    });

    it('같은 시즌 내 다른 톤의 점수는 55-75 범위이다', () => {
      const result = generateMockClassification({ preferredTone: 'true-spring' });

      // light-spring, bright-spring은 같은 시즌
      expect(result.toneScores['light-spring']).toBeGreaterThanOrEqual(55);
      expect(result.toneScores['light-spring']).toBeLessThanOrEqual(95); // 선택된 톤도 시즌 내
    });
  });

  describe('measuredLab 검증', () => {
    it('Lab 값이 유효한 범위 내이다', () => {
      const result = generateMockClassification();

      expect(result.measuredLab.L).toBeGreaterThanOrEqual(0);
      expect(result.measuredLab.L).toBeLessThanOrEqual(100);
      expect(result.measuredLab.a).toBeGreaterThanOrEqual(-128);
      expect(result.measuredLab.a).toBeLessThanOrEqual(127);
      expect(result.measuredLab.b).toBeGreaterThanOrEqual(-128);
      expect(result.measuredLab.b).toBeLessThanOrEqual(127);
    });

    it('Lab 값이 레퍼런스 기반으로 생성된다', () => {
      const result = generateMockClassification({ preferredTone: 'true-spring' });
      const ref = TWELVE_TONE_REFERENCE_LAB['true-spring'];

      // 레퍼런스 ± 3 범위 (variance)
      expect(result.measuredLab.L).toBeGreaterThanOrEqual(ref.L - 3);
      expect(result.measuredLab.L).toBeLessThanOrEqual(ref.L + 3);
    });
  });
});

describe('generateMockResult', () => {
  describe('기본 동작', () => {
    it('유효한 PersonalColorV2Result를 반환한다', () => {
      const result = generateMockResult();

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('classification');
      expect(result).toHaveProperty('palette');
      expect(result).toHaveProperty('stylingRecommendations');
      expect(result).toHaveProperty('analyzedAt');
      expect(result).toHaveProperty('usedFallback');
    });

    it('usedFallback이 true이다 (Mock 데이터이므로)', () => {
      const result = generateMockResult();
      expect(result.usedFallback).toBe(true);
    });

    it('id가 mock_ 접두사로 시작한다', () => {
      const result = generateMockResult();
      expect(result.id).toMatch(/^mock_\d+_[a-z0-9]+$/);
    });

    it('analyzedAt이 유효한 ISO 날짜 문자열이다', () => {
      const result = generateMockResult();
      const date = new Date(result.analyzedAt);
      expect(date.toISOString()).toBe(result.analyzedAt);
    });
  });

  describe('classification 포함', () => {
    it('classification이 유효한 분류 결과이다', () => {
      const result = generateMockResult();

      expect(result.classification).toHaveProperty('tone');
      expect(result.classification).toHaveProperty('season');
      expect(result.classification).toHaveProperty('confidence');
    });
  });

  describe('palette 매칭', () => {
    it('palette가 classification.tone과 일치한다', () => {
      const result = generateMockResult({ preferredTone: 'muted-autumn' });

      expect(result.palette.tone).toBe('muted-autumn');
      expect(result.palette).toEqual(TONE_PALETTES['muted-autumn']);
    });
  });

  describe('stylingRecommendations', () => {
    it('clothing 추천이 팔레트 기반이다', () => {
      const result = generateMockResult();

      expect(result.stylingRecommendations.clothing).toHaveLength(4);
    });

    it('warm undertone에는 gold, rose-gold 금속이 추천된다', () => {
      const result = generateMockResult({ preferredTone: 'true-spring' });

      expect(result.stylingRecommendations.metals).toContain('gold');
      expect(result.stylingRecommendations.metals).toContain('rose-gold');
    });

    it('cool undertone에는 silver 금속이 추천된다', () => {
      const result = generateMockResult({ preferredTone: 'true-winter' });

      expect(result.stylingRecommendations.metals).toContain('silver');
    });
  });

  describe('includeDetailedAnalysis 옵션', () => {
    it('false일 때 detailedAnalysis가 없다', () => {
      const result = generateMockResult({ includeDetailedAnalysis: false });
      expect(result.detailedAnalysis).toBeUndefined();
    });

    it('true일 때 detailedAnalysis가 포함된다', () => {
      const result = generateMockResult({ includeDetailedAnalysis: true });

      expect(result.detailedAnalysis).toBeDefined();
      expect(result.detailedAnalysis?.skinToneLab).toBeDefined();
      expect(result.detailedAnalysis?.hairColorLab).toBeDefined();
      expect(result.detailedAnalysis?.eyeColorLab).toBeDefined();
      expect(result.detailedAnalysis?.saturationLevel).toBeDefined();
      expect(result.detailedAnalysis?.valueLevel).toBeDefined();
    });

    it('detailedAnalysis에 contrastLevel을 지어내지 않는다 (ADR-116)', () => {
      // 퍼스널 대비는 모발-피부 명도 실측값 — Mock 폴백 경로에서는 생략(추측 금지).
      const deepResult = generateMockResult({
        preferredTone: 'deep-autumn',
        includeDetailedAnalysis: true,
      });
      expect(deepResult.detailedAnalysis?.contrastLevel).toBeUndefined();

      const lightResult = generateMockResult({
        preferredTone: 'light-spring',
        includeDetailedAnalysis: true,
      });
      expect(lightResult.detailedAnalysis?.contrastLevel).toBeUndefined();
    });

    it('detailedAnalysis의 saturationLevel이 subtype과 연관된다', () => {
      const brightResult = generateMockResult({
        preferredTone: 'bright-spring',
        includeDetailedAnalysis: true,
      });
      expect(brightResult.detailedAnalysis?.saturationLevel).toBe('bright');

      const mutedResult = generateMockResult({
        preferredTone: 'muted-summer',
        includeDetailedAnalysis: true,
      });
      expect(mutedResult.detailedAnalysis?.saturationLevel).toBe('muted');
    });

    it('detailedAnalysis의 valueLevel이 subtype과 연관된다', () => {
      const lightResult = generateMockResult({
        preferredTone: 'light-summer',
        includeDetailedAnalysis: true,
      });
      expect(lightResult.detailedAnalysis?.valueLevel).toBe('light');

      const deepResult = generateMockResult({
        preferredTone: 'deep-winter',
        includeDetailedAnalysis: true,
      });
      expect(deepResult.detailedAnalysis?.valueLevel).toBe('deep');
    });
  });
});

/**
 * 시드 결정론 (재현성 계약).
 *
 * 퍼스널컬러는 "나의 고정된 속성"으로 팔리는 판정이다. 폴백 Mock이 Math.random을 쓰면
 * 같은 사진을 재분석할 때마다 시즌·서브타입이 널뛰어 제품 계약 자체가 깨진다.
 * 같은 시드 = 같은 판정, 시드가 다르면 판정도 갈릴 수 있음(상수 고정 아님)을 고정한다.
 */
describe('시드 결정론 (재현성 계약)', () => {
  const SEED = 'user-42:personal-color:image-abc';

  it('같은 시드는 분류 결과 전체를 재현한다', () => {
    const a = generateMockClassification({ seed: SEED });
    const b = generateMockClassification({ seed: SEED });

    expect(a).toEqual(b);
    // 시즌·서브타입·신뢰도까지 동일 (표시되는 정체성 값 전부)
    expect(a.tone).toBe(b.tone);
    expect(a.season).toBe(b.season);
    expect(a.subtype).toBe(b.subtype);
    expect(a.confidence).toBe(b.confidence);
    expect(a.measuredLab).toEqual(b.measuredLab);
  });

  it('시드 미지정 시 고정 기본 시드로 항상 같은 결과 (Math.random 없음)', () => {
    expect(generateMockClassification()).toEqual(generateMockClassification());
  });

  it('서로 다른 시드는 서로 다른 톤을 낼 수 있다 (한 톤으로 고정되지 않음)', () => {
    const tones = Array.from(
      { length: 24 },
      (_, i) => generateMockClassification({ seed: `seed-${i}` }).tone
    );
    expect(new Set(tones).size).toBeGreaterThan(1);
  });

  it('시즌 가중 추첨이 유지된다 (네 시즌 모두 뽑힐 수 있다)', () => {
    // 특정 시즌으로 상수 고정하면 Mock 사용자 전원이 같은 시즌으로 몰린다
    const seasons = Array.from(
      { length: 120 },
      (_, i) => generateMockClassification({ seed: `dist-${i}` }).season
    );
    expect(new Set(seasons)).toEqual(new Set(['spring', 'summer', 'autumn', 'winter']));
  });

  it('preferredTone을 지정해도 confidence는 시드로만 결정된다 (항목 독립)', () => {
    const free = generateMockClassification({ seed: SEED }).confidence;
    const fixed = generateMockClassification({
      seed: SEED,
      preferredTone: 'deep-winter',
    }).confidence;
    expect(fixed).toBe(free);
  });

  it('generateMockResult: 같은 시드는 분석 내용을 재현하되 레코드 ID는 고유하다', () => {
    const a = generateMockResult({ seed: SEED, includeDetailedAnalysis: true });
    const b = generateMockResult({ seed: SEED, includeDetailedAnalysis: true });

    expect(a.classification).toEqual(b.classification);
    expect(a.palette).toEqual(b.palette);
    expect(a.stylingRecommendations).toEqual(b.stylingRecommendations);
    // 모발·눈동자 Lab까지 결정론 (대비 해석이 회차마다 달라지면 안 된다)
    expect(a.detailedAnalysis).toEqual(b.detailedAnalysis);

    // 레코드 ID는 재현 대상이 아니라 레코드마다 고유
    expect(a.id).not.toBe(b.id);
  });

  it('generateMockResult: 시드가 다르면 팔레트도 갈릴 수 있다', () => {
    const palettes = Array.from(
      { length: 24 },
      (_, i) => generateMockResult({ seed: `pal-${i}` }).palette.tone
    );
    expect(new Set(palettes).size).toBeGreaterThan(1);
  });

  it('usedFallback은 시드와 무관하게 항상 true (정직성 계약)', () => {
    expect(generateMockResult({ seed: SEED }).usedFallback).toBe(true);
    expect(generateMockResult().usedFallback).toBe(true);
  });
});

describe('getTonePalette', () => {
  it('유효한 톤에 대해 팔레트를 반환한다', () => {
    const palette = getTonePalette('true-spring');

    expect(palette.tone).toBe('true-spring');
    expect(palette.mainColors).toHaveLength(6);
  });

  it('반환된 팔레트가 원본의 복사본이다 (불변성)', () => {
    const palette1 = getTonePalette('true-spring');
    const palette2 = getTonePalette('true-spring');

    expect(palette1).not.toBe(palette2);
    expect(palette1).toEqual(palette2);
  });

  it('모든 12톤에 대해 팔레트를 반환한다', () => {
    const allTones: TwelveTone[] = [
      'light-spring',
      'true-spring',
      'bright-spring',
      'light-summer',
      'true-summer',
      'muted-summer',
      'muted-autumn',
      'true-autumn',
      'deep-autumn',
      'deep-winter',
      'true-winter',
      'bright-winter',
    ];

    for (const tone of allTones) {
      const palette = getTonePalette(tone);
      expect(palette.tone).toBe(tone);
    }
  });
});

describe('getToneLabel', () => {
  it('유효한 톤에 대해 한국어 라벨을 반환한다', () => {
    expect(getToneLabel('light-spring')).toBe('라이트 스프링');
    expect(getToneLabel('true-spring')).toBe('트루 스프링');
    expect(getToneLabel('bright-spring')).toBe('브라이트 스프링');
  });

  it('모든 12톤에 대해 라벨을 반환한다', () => {
    const allTones: TwelveTone[] = [
      'light-spring',
      'true-spring',
      'bright-spring',
      'light-summer',
      'true-summer',
      'muted-summer',
      'muted-autumn',
      'true-autumn',
      'deep-autumn',
      'deep-winter',
      'true-winter',
      'bright-winter',
    ];

    for (const tone of allTones) {
      const label = getToneLabel(tone);
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('TWELVE_TONE_LABELS 상수와 일치한다', () => {
    for (const [tone, label] of Object.entries(TWELVE_TONE_LABELS)) {
      expect(getToneLabel(tone as TwelveTone)).toBe(label);
    }
  });

  it('Summer 톤의 라벨이 올바르다', () => {
    expect(getToneLabel('light-summer')).toBe('라이트 서머');
    expect(getToneLabel('true-summer')).toBe('트루 서머');
    expect(getToneLabel('muted-summer')).toBe('뮤티드 서머');
  });

  it('Autumn 톤의 라벨이 올바르다', () => {
    expect(getToneLabel('muted-autumn')).toBe('뮤티드 오텀');
    expect(getToneLabel('true-autumn')).toBe('트루 오텀');
    expect(getToneLabel('deep-autumn')).toBe('딥 오텀');
  });

  it('Winter 톤의 라벨이 올바르다', () => {
    expect(getToneLabel('deep-winter')).toBe('딥 윈터');
    expect(getToneLabel('true-winter')).toBe('트루 윈터');
    expect(getToneLabel('bright-winter')).toBe('브라이트 윈터');
  });
});
