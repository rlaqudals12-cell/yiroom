/**
 * PC-2: 퍼스널컬러 v2 Mock 데이터
 *
 * @module lib/analysis/personal-color-v2/mock
 * @description AI 분석 실패 시 Fallback용 Mock 데이터
 * @see docs/specs/SDD-PERSONAL-COLOR-v2.md
 */

import type {
  LabColor,
  TwelveTone,
  TonePalette,
  PersonalColorV2Result,
  TwelveToneClassificationResult,
} from './types';
import { TWELVE_TONE_REFERENCE_LAB, TWELVE_TONE_LABELS } from './types';
import { selectByKey } from '@/lib/utils/conditional-helpers';
import { createSeededRandom, DEFAULT_SEED } from '@/lib/utils/seeded-random';

// ============================================
// 톤별 추천 팔레트
// ============================================

/**
 * 12톤별 컬러 팔레트 정의
 *
 * 각 톤에 대해:
 * - mainColors: 주요 추천 컬러 6개
 * - accentColors: 포인트 컬러 4개
 * - avoidColors: 피해야 할 컬러 4개
 * - lipColors: 립 추천 컬러 4개
 * - eyeshadowColors: 아이섀도 추천 4개
 * - blushColors: 블러쉬 추천 4개
 */
export const TONE_PALETTES: Record<TwelveTone, TonePalette> = {
  'light-spring': {
    tone: 'light-spring',
    mainColors: ['#FFEFD5', '#FFD1DC', '#FFFACD', '#E0FFFF', '#FFF0F5', '#F0FFF0'],
    accentColors: ['#FF69B4', '#FFB6C1', '#98FB98', '#87CEEB'],
    avoidColors: ['#2F4F4F', '#191970', '#8B0000', '#2E2E2E'],
    lipColors: ['#FF6B6B', '#FF8E8E', '#E57373', '#FFAB91'],
    eyeshadowColors: ['#FFE4E1', '#FFF0F5', '#E8D5B7', '#C5E1A5'],
    blushColors: ['#FFCDD2', '#F8BBD9', '#FFE0B2', '#FFCCBC'],
  },
  'true-spring': {
    tone: 'true-spring',
    mainColors: ['#FF7F50', '#FFD700', '#32CD32', '#FF6347', '#FFA500', '#ADFF2F'],
    accentColors: ['#FF4500', '#00FF00', '#FFD700', '#FF69B4'],
    avoidColors: ['#000080', '#4B0082', '#2F4F4F', '#800000'],
    lipColors: ['#FF6347', '#FF7F50', '#E9967A', '#F08080'],
    eyeshadowColors: ['#FFDAB9', '#FFE4B5', '#DEB887', '#F4A460'],
    blushColors: ['#FFA07A', '#FFCBA4', '#F4A460', '#DEB887'],
  },
  'bright-spring': {
    tone: 'bright-spring',
    mainColors: ['#FF1493', '#00FF7F', '#FFD700', '#FF4500', '#00CED1', '#FF69B4'],
    accentColors: ['#FF00FF', '#00FF00', '#FFFF00', '#FF6347'],
    avoidColors: ['#696969', '#708090', '#2F4F4F', '#556B2F'],
    lipColors: ['#FF1493', '#FF69B4', '#FF6B6B', '#DC143C'],
    eyeshadowColors: ['#FFD700', '#00CED1', '#FF69B4', '#98FB98'],
    blushColors: ['#FF69B4', '#FF6B6B', '#FFA07A', '#FF7F50'],
  },
  'light-summer': {
    tone: 'light-summer',
    mainColors: ['#E6E6FA', '#B0C4DE', '#DDA0DD', '#ADD8E6', '#FFC0CB', '#E0FFFF'],
    accentColors: ['#9370DB', '#87CEEB', '#DDA0DD', '#BC8F8F'],
    avoidColors: ['#FF4500', '#FFD700', '#32CD32', '#8B4513'],
    lipColors: ['#DB7093', '#BC8F8F', '#C08081', '#D8BFD8'],
    eyeshadowColors: ['#E6E6FA', '#D8BFD8', '#B0C4DE', '#C0C0C0'],
    blushColors: ['#FFC0CB', '#E6B8AF', '#D7BDE2', '#FADBD8'],
  },
  'true-summer': {
    tone: 'true-summer',
    mainColors: ['#708090', '#778899', '#B0C4DE', '#6A5ACD', '#7B68EE', '#9370DB'],
    accentColors: ['#4169E1', '#6A5ACD', '#8A2BE2', '#DA70D6'],
    avoidColors: ['#FF8C00', '#FFD700', '#228B22', '#8B4513'],
    lipColors: ['#C08081', '#A0758A', '#9370DB', '#BC8F8F'],
    eyeshadowColors: ['#778899', '#B0C4DE', '#9370DB', '#A9A9A9'],
    blushColors: ['#BC8F8F', '#D8BFD8', '#C9B8D4', '#DCDCDC'],
  },
  'muted-summer': {
    tone: 'muted-summer',
    mainColors: ['#A9A9A9', '#808080', '#696969', '#778899', '#B0C4DE', '#C0C0C0'],
    accentColors: ['#6B8E23', '#708090', '#9370DB', '#8FBC8F'],
    avoidColors: ['#FF0000', '#FFD700', '#FF4500', '#00FF00'],
    lipColors: ['#BC8F8F', '#A0858A', '#8B7D7D', '#C9A0A0'],
    eyeshadowColors: ['#A9A9A9', '#808080', '#B0C4DE', '#C0C0C0'],
    blushColors: ['#BC8F8F', '#C0C0C0', '#B8B8B8', '#DCDCDC'],
  },
  'muted-autumn': {
    tone: 'muted-autumn',
    mainColors: ['#D2B48C', '#BC8F8F', '#8B7355', '#9C8A61', '#A67B5B', '#C4A77D'],
    accentColors: ['#CD853F', '#8B4513', '#6B8E23', '#556B2F'],
    avoidColors: ['#FF1493', '#00BFFF', '#FF00FF', '#7B68EE'],
    lipColors: ['#A0522D', '#8B4513', '#CD853F', '#BC8F8F'],
    eyeshadowColors: ['#D2B48C', '#C4A77D', '#8B7355', '#A67B5B'],
    blushColors: ['#D2B48C', '#BC8F8F', '#C4A77D', '#DEB887'],
  },
  'true-autumn': {
    tone: 'true-autumn',
    mainColors: ['#FF8C00', '#D2691E', '#CD853F', '#8B4513', '#A0522D', '#DAA520'],
    accentColors: ['#FF4500', '#228B22', '#B8860B', '#8B0000'],
    avoidColors: ['#FF69B4', '#00CED1', '#9370DB', '#4169E1'],
    lipColors: ['#A0522D', '#CD853F', '#8B4513', '#D2691E'],
    eyeshadowColors: ['#CD853F', '#D2691E', '#8B4513', '#A0522D'],
    blushColors: ['#CD853F', '#D2691E', '#DEB887', '#F4A460'],
  },
  'deep-autumn': {
    tone: 'deep-autumn',
    mainColors: ['#8B4513', '#A0522D', '#654321', '#5C4033', '#6B4423', '#8B0000'],
    accentColors: ['#B8860B', '#556B2F', '#8B0000', '#4B3621'],
    avoidColors: ['#FFC0CB', '#E6E6FA', '#87CEEB', '#98FB98'],
    lipColors: ['#8B0000', '#A0522D', '#800000', '#654321'],
    eyeshadowColors: ['#8B4513', '#654321', '#5C4033', '#4B3621'],
    blushColors: ['#A0522D', '#CD853F', '#8B4513', '#BC8F8F'],
  },
  'deep-winter': {
    tone: 'deep-winter',
    mainColors: ['#191970', '#000080', '#2F4F4F', '#4B0082', '#800000', '#2E2E2E'],
    accentColors: ['#8B0000', '#006400', '#4B0082', '#2F4F4F'],
    avoidColors: ['#FFD700', '#FFA500', '#F0E68C', '#FAFAD2'],
    lipColors: ['#8B0000', '#800000', '#4B0082', '#2F4F4F'],
    eyeshadowColors: ['#2F4F4F', '#191970', '#4B0082', '#2E2E2E'],
    blushColors: ['#8B4513', '#A0522D', '#696969', '#808080'],
  },
  'true-winter': {
    tone: 'true-winter',
    mainColors: ['#000000', '#FFFFFF', '#FF0000', '#0000FF', '#FF00FF', '#00FFFF'],
    accentColors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'],
    avoidColors: ['#D2B48C', '#DEB887', '#F5DEB3', '#FFEFD5'],
    lipColors: ['#FF0000', '#DC143C', '#C71585', '#8B008B'],
    eyeshadowColors: ['#000000', '#808080', '#C0C0C0', '#4B0082'],
    blushColors: ['#FF69B4', '#FF1493', '#C71585', '#DB7093'],
  },
  'bright-winter': {
    tone: 'bright-winter',
    mainColors: ['#FF00FF', '#00FFFF', '#FF1493', '#00FF00', '#0000FF', '#FFFF00'],
    accentColors: ['#FF0000', '#00FF00', '#FF00FF', '#FFFF00'],
    avoidColors: ['#8B4513', '#A0522D', '#BC8F8F', '#D2B48C'],
    lipColors: ['#FF1493', '#FF00FF', '#DC143C', '#C71585'],
    eyeshadowColors: ['#FF00FF', '#00FFFF', '#FFD700', '#FF1493'],
    blushColors: ['#FF69B4', '#FF1493', '#FF6B6B', '#FF7F50'],
  },
};

// ============================================
// Mock 결과 생성 함수
//
// 재현성 계약: 폴백 Mock은 시드(사용자·이미지 지문)로부터 결정론적으로 생성한다.
// Math.random() 금지 — 같은 사진을 재분석할 때마다 시즌·서브타입이 널뛰면
// "퍼스널컬러 = 나의 고정된 속성"이라는 제품 계약 자체가 깨진다.
// 시드 미지정 시 고정 기본 시드로 항상 동일한 결과(무작위 아님).
// ============================================

/**
 * 12톤 가중 추첨 (시드 기반 결정론)
 *
 * 한국인에게 흔한 톤에 가중치 부여:
 * - muted-summer, true-autumn, true-spring: 높은 확률
 * - deep-winter, bright-winter: 낮은 확률
 *
 * 왜 가중치를 유지하는가: 폴백이 특정 시즌으로 고정되면 Mock 사용자 전원이
 * 같은 시즌으로 몰려 분포가 왜곡된다. 시드 PRNG로 같은 가중 추첨을 돌린다.
 *
 * @param rng - 시드 기반 난수 생성기
 * @returns 가중 추첨된 12톤
 */
function selectWeightedTone(rng: () => number): TwelveTone {
  const weightedTones: Array<{ tone: TwelveTone; weight: number }> = [
    { tone: 'light-spring', weight: 8 },
    { tone: 'true-spring', weight: 12 },
    { tone: 'bright-spring', weight: 6 },
    { tone: 'light-summer', weight: 10 },
    { tone: 'true-summer', weight: 10 },
    { tone: 'muted-summer', weight: 12 },
    { tone: 'muted-autumn', weight: 10 },
    { tone: 'true-autumn', weight: 12 },
    { tone: 'deep-autumn', weight: 6 },
    { tone: 'deep-winter', weight: 4 },
    { tone: 'true-winter', weight: 5 },
    { tone: 'bright-winter', weight: 5 },
  ];

  const totalWeight = weightedTones.reduce((sum, t) => sum + t.weight, 0);
  let random = rng() * totalWeight;

  for (const { tone, weight } of weightedTones) {
    random -= weight;
    if (random <= 0) return tone;
  }

  return 'true-spring'; // fallback
}

/**
 * Mock Lab 값 생성
 *
 * 레퍼런스 Lab에 약간의 편차 추가 (시드 기반 결정론)
 *
 * @param tone - 12톤 타입
 * @param rng - 시드 기반 난수 생성기
 * @returns Mock Lab 값
 */
function generateMockLab(tone: TwelveTone, rng: () => number): LabColor {
  const ref = TWELVE_TONE_REFERENCE_LAB[tone];
  // ±3 범위의 편차 (시드 결정론)
  const variance = () => (rng() - 0.5) * 6;

  return {
    L: Math.max(0, Math.min(100, ref.L + variance())),
    a: ref.a + variance(),
    b: ref.b + variance(),
  };
}

/**
 * Mock 톤 점수 생성
 *
 * 선택된 톤에 가장 높은 점수, 인접 톤에 중간 점수
 *
 * @param selectedTone - 선택된 톤
 * @param rng - 시드 기반 난수 생성기
 * @returns 톤별 점수
 */
function generateMockToneScores(
  selectedTone: TwelveTone,
  rng: () => number
): Record<TwelveTone, number> {
  const tones = Object.keys(TWELVE_TONE_REFERENCE_LAB) as TwelveTone[];
  const scores: Partial<Record<TwelveTone, number>> = {};

  // 시즌별 그룹화
  const seasonGroups: Record<string, TwelveTone[]> = {
    spring: ['light-spring', 'true-spring', 'bright-spring'],
    summer: ['light-summer', 'true-summer', 'muted-summer'],
    autumn: ['muted-autumn', 'true-autumn', 'deep-autumn'],
    winter: ['deep-winter', 'true-winter', 'bright-winter'],
  };

  // 선택된 톤의 시즌 찾기
  let selectedSeason = '';
  for (const [season, tonesInSeason] of Object.entries(seasonGroups)) {
    if (tonesInSeason.includes(selectedTone)) {
      selectedSeason = season;
      break;
    }
  }

  for (const tone of tones) {
    let score: number;

    if (tone === selectedTone) {
      // 선택된 톤: 85-95점
      score = 85 + rng() * 10;
    } else if (seasonGroups[selectedSeason]?.includes(tone)) {
      // 같은 시즌 내 다른 톤: 55-75점
      score = 55 + rng() * 20;
    } else {
      // 다른 시즌: 20-50점
      score = 20 + rng() * 30;
    }

    scores[tone] = Math.round(score * 10) / 10;
  }

  return scores as Record<TwelveTone, number>;
}

/**
 * Mock 분류 결과 생성
 *
 * 같은 시드 → 항상 같은 톤·시즌·서브타입·confidence·Lab (재현성 계약).
 * 항목별로 파생 시드를 쓰는 이유: preferredTone을 지정해도 confidence·점수가
 * 흔들리지 않도록 난수 시퀀스를 항목마다 독립시킨다.
 *
 * @param options - 생성 옵션 (seed 미지정 시 고정 기본 시드)
 * @returns Mock 분류 결과
 */
export function generateMockClassification(options?: {
  preferredTone?: TwelveTone;
  seed?: string;
}): TwelveToneClassificationResult {
  const baseSeed = options?.seed ?? DEFAULT_SEED;
  const tone = options?.preferredTone ?? selectWeightedTone(createSeededRandom(`${baseSeed}:tone`));
  const parts = tone.split('-');
  const subtype = parts[0] as 'light' | 'true' | 'bright' | 'muted' | 'deep';
  const season = parts[1] as 'spring' | 'summer' | 'autumn' | 'winter';

  // 언더톤 결정: 시즌별 매핑
  const undertone = selectByKey(
    season,
    {
      spring: 'warm' as const,
      autumn: 'warm' as const,
      summer: 'cool' as const,
      winter: 'cool' as const,
    },
    'neutral' as const
  )!;

  return {
    tone,
    season,
    subtype,
    undertone,
    confidence: 75 + Math.round(createSeededRandom(`${baseSeed}:confidence`)() * 15), // 75-90
    toneScores: generateMockToneScores(tone, createSeededRandom(`${baseSeed}:scores`)),
    measuredLab: generateMockLab(tone, createSeededRandom(`${baseSeed}:lab`)),
  };
}

/**
 * Mock PersonalColorV2Result 생성 (전체 결과)
 *
 * AI 분석 실패 시 Fallback으로 사용
 *
 * @param options - 생성 옵션 (seed 미지정 시 고정 기본 시드)
 * @returns Mock 분석 결과
 *
 * @example
 * // 같은 사용자·같은 사진이면 항상 같은 결과
 * const mockResult = generateMockResult({ seed: buildFallbackSeed(userId, 'personal-color', img) });
 */
export function generateMockResult(options?: {
  preferredTone?: TwelveTone;
  includeDetailedAnalysis?: boolean;
  seed?: string;
}): PersonalColorV2Result {
  const baseSeed = options?.seed ?? DEFAULT_SEED;
  const classification = generateMockClassification({
    preferredTone: options?.preferredTone,
    seed: baseSeed,
  });

  const palette = TONE_PALETTES[classification.tone];

  // 레코드 ID는 재현 대상이 아니다 — 저장 레코드마다 고유해야 하므로 UUID 사용
  // (분석 내용은 시드 결정론, 식별자는 고유: 두 계약이 서로 다른 층위).
  const result: PersonalColorV2Result = {
    id: `mock_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
    classification,
    palette,
    stylingRecommendations: {
      clothing: palette.mainColors.slice(0, 4),
      metals: selectByKey(
        classification.undertone,
        {
          warm: ['gold', 'rose-gold'],
          cool: ['silver'],
          neutral: ['gold', 'silver'],
        },
        ['gold', 'silver']
      )!,
      jewelry: palette.accentColors.slice(0, 2),
    },
    analyzedAt: new Date().toISOString(),
    usedFallback: true,
  };

  // 상세 분석 포함 옵션
  if (options?.includeDetailedAnalysis) {
    // 모발·눈동자 Lab도 같은 시드에서 결정론적으로 — 재분석 때마다 흔들리면
    // 대비(contrast) 해석이 회차마다 달라진다.
    const detailRng = createSeededRandom(`${baseSeed}:detail`);
    result.detailedAnalysis = {
      skinToneLab: classification.measuredLab,
      hairColorLab: {
        L: 30 + detailRng() * 20,
        a: 2 + detailRng() * 4,
        b: 5 + detailRng() * 10,
      },
      eyeColorLab: {
        L: 25 + detailRng() * 15,
        a: 1 + detailRng() * 3,
        b: 3 + detailRng() * 7,
      },
      // contrastLevel(퍼스널 대비)은 모발-피부 명도 실측값 — Mock 폴백에서는 지어내지 않고
      // 생략한다(ADR-116 결정 2, FORCE_MOCK_AI 경로). 서브타입으로 추정하던 하드코딩 제거.
      saturationLevel: selectByKey(
        classification.subtype,
        {
          bright: 'bright' as const,
          muted: 'muted' as const,
          light: 'medium' as const,
          deep: 'medium' as const,
          true: 'medium' as const,
        },
        'medium' as const
      )!,
      valueLevel: selectByKey(
        classification.subtype,
        {
          light: 'light' as const,
          deep: 'deep' as const,
          bright: 'medium' as const,
          muted: 'medium' as const,
          true: 'medium' as const,
        },
        'medium' as const
      )!,
    };
  }

  return result;
}

/**
 * 특정 톤의 팔레트 조회
 *
 * @param tone - 12톤 타입
 * @returns 해당 톤의 팔레트
 */
export function getTonePalette(tone: TwelveTone): TonePalette {
  return { ...TONE_PALETTES[tone] };
}

/**
 * 톤 한국어 라벨 조회
 *
 * @param tone - 12톤 타입
 * @returns 한국어 라벨
 */
export function getToneLabel(tone: TwelveTone): string {
  return TWELVE_TONE_LABELS[tone];
}
