/**
 * H-1 스타일 매칭 엔진
 *
 * 얼굴형 + 헤어 텍스처 + 퍼스널컬러 시즌을 통합하여
 * 최적의 헤어스타일 Top-5를 추천하는 다차원 매칭 엔진
 *
 * @description 3-Factor 스타일 매칭: faceShape × texture × personalColor
 * @see docs/specs/SDD-HAIR-ANALYSIS.md
 */

import type { FaceShapeType, HairLength, HairstyleRecommendation } from './types';
import { FACE_SHAPE_STYLE_MAPPING } from './types';
import type { TextureCode, TextureGroup } from './texture-classifier';
import { getTextureInfo } from './texture-classifier';

// =============================================================================
// 타입
// =============================================================================

/**
 * 스타일 매칭 입력
 */
export interface StyleMatchInput {
  faceShape: FaceShapeType;
  textureCode?: TextureCode;
  personalColorSeason?: string;
  preferredLength?: HairLength;
  /** 보너스 가중치 조정 (0-1, 기본 0.5) */
  adventureLevel?: number;
}

/**
 * 매칭 점수 분해
 */
export interface MatchScoreBreakdown {
  /** 얼굴형 적합도 (0-40) */
  faceShapeScore: number;
  /** 텍스처 호환성 (0-30) */
  textureScore: number;
  /** 퍼스널컬러 조화도 (0-20) */
  colorSeasonScore: number;
  /** 길이 선호도 보너스 (0-10) */
  lengthBonus: number;
}

/**
 * 스타일 매칭 결과
 */
export interface StyleMatchResult extends HairstyleRecommendation {
  /** 종합 매칭 점수 (0-100) */
  matchScore: number;
  /** 점수 분해 */
  breakdown: MatchScoreBreakdown;
  /** 매칭 이유 (한국어) */
  matchReasons: string[];
}

// =============================================================================
// 스타일 카탈로그 (매칭 전용)
// =============================================================================

interface StyleEntry {
  name: string;
  description: string;
  length: HairLength;
  tags: string[];
  /** 텍스처 그룹별 호환성 (1-4 → 0-10) */
  textureAffinity: Record<TextureGroup, number>;
  /** 퍼스널컬러 시즌별 분위기 매칭 (0-10) */
  seasonAffinity: Record<string, number>;
}

// 얼굴형-스타일 매칭은 FACE_SHAPE_STYLE_MAPPING 상수를 활용하되,
// 텍스처/시즌 가중치를 추가한 확장 카탈로그
const STYLE_CATALOG: StyleEntry[] = [
  // 숏
  {
    name: '픽시컷',
    description: '짧고 경쾌한 스타일로, 얼굴 윤곽을 강조해요.',
    length: 'short',
    tags: ['숏', '세련됨', '관리 용이'],
    textureAffinity: { 1: 9, 2: 7, 3: 5, 4: 4 },
    seasonAffinity: { spring: 7, summer: 8, autumn: 6, winter: 9 },
  },
  {
    name: '텍스처드 숏',
    description: '자연스러운 텍스처를 살린 움직임 있는 숏 스타일입니다.',
    length: 'short',
    tags: ['숏', '내추럴', '볼륨'],
    textureAffinity: { 1: 7, 2: 9, 3: 8, 4: 6 },
    seasonAffinity: { spring: 8, summer: 7, autumn: 7, winter: 6 },
  },
  {
    name: '쇼트 보브',
    description: '턱선 위 길이의 클래식한 보브 스타일입니다.',
    length: 'short',
    tags: ['숏', '클래식', '페미닌', '보브'],
    textureAffinity: { 1: 9, 2: 8, 3: 6, 4: 4 },
    seasonAffinity: { spring: 7, summer: 8, autumn: 8, winter: 7 },
  },
  {
    name: '내추럴 컬 숏',
    description: '자연 곱슬을 살린 숏 스타일입니다.',
    length: 'short',
    tags: ['숏', '볼륨', '웨이브'],
    textureAffinity: { 1: 3, 2: 7, 3: 9, 4: 8 },
    seasonAffinity: { spring: 8, summer: 7, autumn: 6, winter: 5 },
  },
  {
    name: '레이어드 숏',
    description: '층이 있어 볼륨감을 주는 숏 스타일입니다.',
    length: 'short',
    tags: ['숏', '볼륨', '내추럴', '레이어드'],
    textureAffinity: { 1: 7, 2: 8, 3: 7, 4: 5 },
    seasonAffinity: { spring: 7, summer: 7, autumn: 7, winter: 7 },
  },
  // 미디엄
  {
    name: '미디엄 레이어드',
    description: '어깨 정도 길이의 레이어드 컷으로, 다양한 스타일링이 가능해요.',
    length: 'medium',
    tags: ['미디엄', '레이어드', '버서타일'],
    textureAffinity: { 1: 8, 2: 9, 3: 7, 4: 5 },
    seasonAffinity: { spring: 8, summer: 7, autumn: 8, winter: 7 },
  },
  {
    name: '롭 (Long Bob)',
    description: '쇄골 정도 길이의 긴 보브 스타일입니다.',
    length: 'medium',
    tags: ['미디엄', '보브', '세련됨'],
    textureAffinity: { 1: 9, 2: 8, 3: 6, 4: 4 },
    seasonAffinity: { spring: 7, summer: 9, autumn: 8, winter: 8 },
  },
  {
    name: '웨이브 미디엄',
    description: '자연스러운 웨이브가 있는 미디엄 길이 스타일입니다.',
    length: 'medium',
    tags: ['미디엄', '웨이브', '페미닌'],
    textureAffinity: { 1: 5, 2: 9, 3: 8, 4: 6 },
    seasonAffinity: { spring: 9, summer: 7, autumn: 8, winter: 6 },
  },
  {
    name: '허쉬컷',
    description: '층을 많이 준 볼륨감 있는 미디엄 스타일입니다.',
    length: 'medium',
    tags: ['미디엄', '볼륨', '트렌디', '레이어드'],
    textureAffinity: { 1: 6, 2: 8, 3: 9, 4: 7 },
    seasonAffinity: { spring: 8, summer: 7, autumn: 9, winter: 7 },
  },
  {
    name: '커튼 뱅 미디엄',
    description: '이마 양옆으로 갈라지는 커튼 뱅과 미디엄 길이의 조합입니다.',
    length: 'medium',
    tags: ['미디엄', '프린지', '페미닌'],
    textureAffinity: { 1: 8, 2: 8, 3: 6, 4: 4 },
    seasonAffinity: { spring: 9, summer: 8, autumn: 7, winter: 7 },
  },
  {
    name: '울프컷',
    description: '멀렛에서 영감을 받은 레이어드 스타일입니다.',
    length: 'medium',
    tags: ['미디엄', '트렌디', '레이어드'],
    textureAffinity: { 1: 6, 2: 8, 3: 8, 4: 6 },
    seasonAffinity: { spring: 7, summer: 6, autumn: 9, winter: 8 },
  },
  // 롱
  {
    name: '롱 레이어드',
    description: '긴 머리에 층을 주어 움직임을 살린 스타일입니다.',
    length: 'long',
    tags: ['롱', '레이어드', '페미닌'],
    textureAffinity: { 1: 8, 2: 9, 3: 7, 4: 5 },
    seasonAffinity: { spring: 8, summer: 7, autumn: 8, winter: 7 },
  },
  {
    name: '롱 웨이브',
    description: '풍성한 웨이브가 있는 긴 머리 스타일입니다.',
    length: 'long',
    tags: ['롱', '웨이브', '로맨틱'],
    textureAffinity: { 1: 4, 2: 9, 3: 9, 4: 7 },
    seasonAffinity: { spring: 9, summer: 7, autumn: 8, winter: 6 },
  },
  {
    name: '머메이드 웨이브',
    description: '인어공주처럼 큰 물결의 웨이브 롱 스타일입니다.',
    length: 'long',
    tags: ['롱', '웨이브', '로맨틱'],
    textureAffinity: { 1: 3, 2: 8, 3: 9, 4: 7 },
    seasonAffinity: { spring: 9, summer: 8, autumn: 6, winter: 6 },
  },
  {
    name: '롱 스트레이트',
    description: '긴 직모 스타일로, 깔끔하고 우아한 인상을 줍니다.',
    length: 'long',
    tags: ['롱', '스트레이트', '우아함'],
    textureAffinity: { 1: 10, 2: 6, 3: 3, 4: 2 },
    seasonAffinity: { spring: 6, summer: 8, autumn: 7, winter: 9 },
  },
  {
    name: '커튼 뱅 롱',
    description: '얼굴을 부드럽게 감싸는 커튼 뱅과 롱 헤어의 조합입니다.',
    length: 'long',
    tags: ['롱', '프린지', '페미닌'],
    textureAffinity: { 1: 8, 2: 8, 3: 6, 4: 4 },
    seasonAffinity: { spring: 9, summer: 8, autumn: 7, winter: 7 },
  },
  {
    name: '글래머 컬',
    description: '크고 풍성한 컬이 돋보이는 화려한 롱 스타일입니다.',
    length: 'long',
    tags: ['롱', '웨이브', '볼륨', '포멀'],
    textureAffinity: { 1: 3, 2: 7, 3: 9, 4: 8 },
    seasonAffinity: { spring: 7, summer: 6, autumn: 9, winter: 8 },
  },
  {
    name: '보헤미안 웨이브',
    description: '자유분방한 감성의 불규칙 웨이브 롱 스타일입니다.',
    length: 'long',
    tags: ['롱', '웨이브', '캐주얼'],
    textureAffinity: { 1: 3, 2: 8, 3: 9, 4: 8 },
    seasonAffinity: { spring: 8, summer: 8, autumn: 9, winter: 5 },
  },
];

// =============================================================================
// 시즌별 스타일 분위기 키워드 매핑
// =============================================================================

const SEASON_STYLE_AFFINITY: Record<string, { keywords: string[]; description: string }> = {
  spring: {
    keywords: ['페미닌', '내추럴', '캐주얼', '웨이브', '프린지'],
    description: '봄 웜톤에 맞는 부드럽고 밝은 분위기',
  },
  summer: {
    keywords: ['세련됨', '모던', '클래식', '보브', '깔끔'],
    description: '여름 쿨톤에 맞는 시원하고 세련된 분위기',
  },
  autumn: {
    keywords: ['볼륨', '레이어드', '트렌디', '레트로', '개성'],
    description: '가을 웜톤에 맞는 풍성하고 깊은 분위기',
  },
  winter: {
    keywords: ['포멀', '세련됨', '미니멀', '스트레이트', '클린'],
    description: '겨울 쿨톤에 맞는 강렬하고 깔끔한 분위기',
  },
};

// =============================================================================
// 매칭 엔진
// =============================================================================

/**
 * 3-Factor 스타일 매칭
 *
 * 얼굴형(40%) + 텍스처(30%) + 퍼스널컬러(20%) + 길이 보너스(10%)
 * 를 통합하여 최적 스타일 Top-N을 산출
 */
export function matchStyles(input: StyleMatchInput, maxResults: number = 5): StyleMatchResult[] {
  const { faceShape, textureCode, personalColorSeason, preferredLength } = input;

  // 텍스처 그룹 (없으면 2=웨이브 기본값)
  const textureGroup: TextureGroup = textureCode ? (parseInt(textureCode[0]) as TextureGroup) : 2;

  const textureInfo = textureCode ? getTextureInfo(textureCode) : null;

  const results = STYLE_CATALOG.map((style) => {
    // 1. 얼굴형 적합도 (0-40점)
    const faceShapeScore = calculateFaceShapeScore(faceShape, style);

    // 2. 텍스처 호환성 (0-30점)
    const textureScore = calculateTextureScore(textureGroup, style, textureInfo);

    // 3. 퍼스널컬러 조화도 (0-20점)
    const colorSeasonScore = calculateColorSeasonScore(personalColorSeason, style);

    // 4. 길이 선호도 보너스 (0-10점)
    const lengthBonus = preferredLength && style.length === preferredLength ? 10 : 0;

    const matchScore = Math.min(
      100,
      Math.round(faceShapeScore + textureScore + colorSeasonScore + lengthBonus)
    );

    // 매칭 이유 생성
    const matchReasons = generateMatchReasons(faceShape, textureInfo, personalColorSeason, {
      faceShapeScore,
      textureScore,
      colorSeasonScore,
      lengthBonus,
    });

    return {
      name: style.name,
      description: style.description,
      length: style.length,
      suitability: matchScore,
      tags: style.tags,
      matchScore,
      breakdown: { faceShapeScore, textureScore, colorSeasonScore, lengthBonus },
      matchReasons,
    };
  });

  // 점수 높은 순 정렬
  return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, maxResults);
}

// =============================================================================
// 점수 계산 내부 함수
// =============================================================================

/**
 * 얼굴형 적합도 (0-40)
 *
 * FACE_SHAPE_STYLE_MAPPING 키워드 매칭 + 얼굴형별 세부 보정
 */
function calculateFaceShapeScore(faceShape: FaceShapeType, style: StyleEntry): number {
  let score = 20; // 기본 점수

  const mapping = FACE_SHAPE_STYLE_MAPPING[faceShape];

  // 추천 키워드 매칭: 키워드 당 +5 (최대 +20)
  let keywordBonus = 0;
  mapping.recommended.forEach((keyword) => {
    if (
      style.name.includes(keyword) ||
      style.description.includes(keyword) ||
      style.tags.some((tag) => tag.includes(keyword))
    ) {
      keywordBonus += 5;
    }
  });
  score += Math.min(20, keywordBonus);

  // 피해야 할 키워드: 키워드 당 -8
  mapping.avoid.forEach((keyword) => {
    if (
      style.name.includes(keyword) ||
      style.description.includes(keyword) ||
      style.tags.some((tag) => tag.includes(keyword))
    ) {
      score -= 8;
    }
  });

  // 얼굴형별 길이 보정
  if (faceShape === 'round' && style.length === 'long') score += 3;
  if (faceShape === 'oblong' && style.length === 'medium') score += 3;
  if (faceShape === 'oval') score += 3; // 타원형은 전반적으로 높은 호환성

  return Math.max(0, Math.min(40, score));
}

/**
 * 텍스처 호환성 (0-30)
 *
 * 스타일 카탈로그의 textureAffinity 테이블 활용
 */
function calculateTextureScore(
  group: TextureGroup,
  style: StyleEntry,
  textureInfo: ReturnType<typeof getTextureInfo> | null
): number {
  // affinity 점수 (0-10 → 0-25)
  const affinity = style.textureAffinity[group] || 5;
  let score = (affinity / 10) * 25;

  // 텍스처별 추가 보정
  if (textureInfo) {
    // 관리 난이도가 높은 텍스처는 관리 용이한 스타일에 보너스
    if (textureInfo.maintenanceLevel >= 4 && style.tags.includes('관리 용이')) {
      score += 5;
    }
    // 볼륨 특성과 스타일 매칭
    if (textureInfo.volumeCharacteristic === 'flat' && style.tags.includes('볼륨')) {
      score += 3;
    }
    if (textureInfo.volumeCharacteristic === 'maximum' && style.tags.includes('내추럴')) {
      score += 3;
    }
  }

  return Math.max(0, Math.min(30, Math.round(score)));
}

/**
 * 퍼스널컬러 조화도 (0-20)
 *
 * 시즌별 스타일 분위기 키워드 매칭 + seasonAffinity 점수
 */
function calculateColorSeasonScore(season: string | undefined, style: StyleEntry): number {
  if (!season) return 10; // 시즌 미지정 시 중립 점수

  // affinity 기반 점수 (0-10 → 0-12)
  const affinity = style.seasonAffinity[season] || 5;
  let score = (affinity / 10) * 12;

  // 시즌 키워드 매칭 (0-8)
  const seasonInfo = SEASON_STYLE_AFFINITY[season];
  if (seasonInfo) {
    let keywordMatch = 0;
    seasonInfo.keywords.forEach((keyword) => {
      if (style.tags.some((tag) => tag.includes(keyword))) {
        keywordMatch += 2;
      }
    });
    score += Math.min(8, keywordMatch);
  }

  return Math.max(0, Math.min(20, Math.round(score)));
}

/**
 * 매칭 이유 생성
 */
function generateMatchReasons(
  faceShape: FaceShapeType,
  textureInfo: ReturnType<typeof getTextureInfo> | null,
  season: string | undefined,
  breakdown: MatchScoreBreakdown
): string[] {
  const reasons: string[] = [];

  // 얼굴형 이유
  if (breakdown.faceShapeScore >= 30) {
    const labels: Record<FaceShapeType, string> = {
      oval: '타원형',
      round: '둥근형',
      square: '사각형',
      heart: '하트형',
      oblong: '긴 형',
      diamond: '다이아몬드형',
      rectangle: '직사각형',
    };
    reasons.push(`${labels[faceShape]} 얼굴형에 잘 어울리는 스타일이에요`);
  }

  // 텍스처 이유
  if (textureInfo && breakdown.textureScore >= 20) {
    reasons.push(`${textureInfo.label}(${textureInfo.code}) 모발에 자연스럽게 어울려요`);
  }

  // 시즌 이유
  if (season && breakdown.colorSeasonScore >= 15) {
    const seasonLabels: Record<string, string> = {
      spring: '봄 웜톤',
      summer: '여름 쿨톤',
      autumn: '가을 웜톤',
      winter: '겨울 쿨톤',
    };
    reasons.push(`${seasonLabels[season] || season} 분위기와 잘 어울려요`);
  }

  // 길이 보너스
  if (breakdown.lengthBonus > 0) {
    reasons.push('선호하는 길이와 일치해요');
  }

  // 이유가 없으면 기본 이유
  if (reasons.length === 0) {
    reasons.push('전반적으로 무난하게 어울리는 스타일이에요');
  }

  return reasons;
}

/**
 * 스타일 카탈로그 크기 (테스트/UI용)
 */
export function getStyleCatalogSize(): number {
  return STYLE_CATALOG.length;
}
