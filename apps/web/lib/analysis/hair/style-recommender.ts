/**
 * H-1 헤어스타일 추천 모듈
 *
 * 얼굴형 + 퍼스널컬러 기반 헤어스타일/컬러 추천
 *
 * @description 얼굴형별 어울리는 스타일, 헤어컬러 추천
 * @see docs/specs/SDD-HAIR-ANALYSIS.md
 */

import type { LabColor } from '../personal-color-v2';
import type {
  FaceShapeType,
  HairstyleRecommendation,
  HairColorRecommendation,
  HairLength,
  HairTexture,
  FaceShapeAnalysis,
} from './types';
import { FACE_SHAPE_STYLE_MAPPING } from './types';

// =============================================================================
// 헤어스타일 데이터베이스
// =============================================================================

/**
 * 헤어스타일 카탈로그
 */
const HAIRSTYLE_CATALOG: HairstyleRecommendation[] = [
  // 숏 스타일
  {
    name: '픽시컷',
    description: '짧고 경쾌한 스타일로, 얼굴 윤곽을 강조합니다.',
    length: 'short',
    suitability: 0,
    tags: ['숏', '세련됨', '관리 용이'],
  },
  {
    name: '쇼트 보브',
    description: '턱선 위 길이의 클래식한 보브 스타일입니다.',
    length: 'short',
    suitability: 0,
    tags: ['숏', '클래식', '페미닌'],
  },
  {
    name: '레이어드 숏',
    description: '층이 있어 볼륨감을 주는 숏 스타일입니다.',
    length: 'short',
    suitability: 0,
    tags: ['숏', '볼륨', '내추럴'],
  },

  // 미디엄 스타일
  {
    name: '미디엄 레이어드',
    description: '어깨 정도 길이의 레이어드 컷으로, 다양한 스타일링이 가능합니다.',
    length: 'medium',
    suitability: 0,
    tags: ['미디엄', '레이어드', '버서타일'],
  },
  {
    name: '롭 (Long Bob)',
    description: '쇄골 정도 길이의 긴 보브 스타일입니다.',
    length: 'medium',
    suitability: 0,
    tags: ['미디엄', '보브', '세련됨'],
  },
  {
    name: '웨이브 미디엄',
    description: '자연스러운 웨이브가 있는 미디엄 길이 스타일입니다.',
    length: 'medium',
    suitability: 0,
    tags: ['미디엄', '웨이브', '페미닌'],
  },
  {
    name: '허쉬컷',
    description: '층을 많이 준 볼륨감 있는 미디엄 스타일입니다.',
    length: 'medium',
    suitability: 0,
    tags: ['미디엄', '볼륨', '트렌디'],
  },

  // 롱 스타일
  {
    name: '롱 레이어드',
    description: '긴 머리에 층을 주어 움직임을 살린 스타일입니다.',
    length: 'long',
    suitability: 0,
    tags: ['롱', '레이어드', '페미닌'],
  },
  {
    name: '롱 스트레이트',
    description: '긴 직모 스타일로, 깔끔하고 우아한 인상을 줍니다.',
    length: 'long',
    suitability: 0,
    tags: ['롱', '스트레이트', '우아함'],
  },
  {
    name: '롱 웨이브',
    description: '풍성한 웨이브가 있는 긴 머리 스타일입니다.',
    length: 'long',
    suitability: 0,
    tags: ['롱', '웨이브', '로맨틱'],
  },
  {
    name: '히메컷',
    description: '앞머리와 옆머리를 짧게, 뒤를 길게 자른 스타일입니다.',
    length: 'long',
    suitability: 0,
    tags: ['롱', '개성', '동양적'],
  },
];

// =============================================================================
// 헤어컬러 데이터베이스
// =============================================================================

/**
 * 시즌별 추천 헤어컬러
 */
const HAIR_COLOR_BY_SEASON: Record<string, HairColorRecommendation[]> = {
  spring: [
    { name: '골드 브라운', hexColor: '#B5651D', suitability: 90, seasonMatch: 'spring', tags: ['웜톤', '밝은'] },
    { name: '허니 블론드', hexColor: '#D4A76A', suitability: 85, seasonMatch: 'spring', tags: ['웜톤', '블론드'] },
    { name: '오렌지 브라운', hexColor: '#C87533', suitability: 80, seasonMatch: 'spring', tags: ['웜톤', '비비드'] },
    { name: '코랄 브라운', hexColor: '#CD5C5C', suitability: 75, seasonMatch: 'spring', tags: ['웜톤', '코랄'] },
  ],
  summer: [
    { name: '애쉬 브라운', hexColor: '#8B7355', suitability: 90, seasonMatch: 'summer', tags: ['쿨톤', '자연스러운'] },
    { name: '로즈 브라운', hexColor: '#9E7B7B', suitability: 85, seasonMatch: 'summer', tags: ['쿨톤', '로즈'] },
    { name: '라벤더 그레이', hexColor: '#9896A4', suitability: 80, seasonMatch: 'summer', tags: ['쿨톤', '라벤더'] },
    { name: '소프트 블랙', hexColor: '#3C3C3C', suitability: 75, seasonMatch: 'summer', tags: ['쿨톤', '다크'] },
  ],
  autumn: [
    { name: '다크 브라운', hexColor: '#5C4033', suitability: 90, seasonMatch: 'autumn', tags: ['웜톤', '딥'] },
    { name: '버건디', hexColor: '#800020', suitability: 85, seasonMatch: 'autumn', tags: ['웜톤', '버건디'] },
    { name: '초콜릿 브라운', hexColor: '#7B3F00', suitability: 85, seasonMatch: 'autumn', tags: ['웜톤', '초콜릿'] },
    { name: '오번', hexColor: '#A52A2A', suitability: 80, seasonMatch: 'autumn', tags: ['웜톤', '레드'] },
  ],
  winter: [
    { name: '블루 블랙', hexColor: '#1C1C28', suitability: 90, seasonMatch: 'winter', tags: ['쿨톤', '블랙'] },
    { name: '애쉬 블랙', hexColor: '#2F2F2F', suitability: 85, seasonMatch: 'winter', tags: ['쿨톤', '애쉬'] },
    { name: '버건디 블랙', hexColor: '#4A0000', suitability: 80, seasonMatch: 'winter', tags: ['쿨톤', '버건디'] },
    { name: '플래티넘 블론드', hexColor: '#E5E4E2', suitability: 75, seasonMatch: 'winter', tags: ['쿨톤', '플래티넘'] },
  ],
};

/**
 * 기본 헤어컬러 (시즌 미지정 시)
 */
const DEFAULT_HAIR_COLORS: HairColorRecommendation[] = [
  { name: '내추럴 브라운', hexColor: '#6B4423', suitability: 80, seasonMatch: 'all', tags: ['자연스러운'] },
  { name: '다크 브라운', hexColor: '#3D2314', suitability: 80, seasonMatch: 'all', tags: ['자연스러운'] },
  { name: '블랙', hexColor: '#1C1C1C', suitability: 75, seasonMatch: 'all', tags: ['클래식'] },
];

// =============================================================================
// 추천 함수
// =============================================================================

/**
 * 얼굴형 기반 헤어스타일 추천
 */
export function recommendHairstyles(
  faceShape: FaceShapeType,
  options?: {
    preferredLength?: HairLength;
    currentTexture?: HairTexture;
    maxResults?: number;
  }
): HairstyleRecommendation[] {
  const { preferredLength, currentTexture, maxResults = 5 } = options || {};

  const styleMapping = FACE_SHAPE_STYLE_MAPPING[faceShape];
  const recommendedKeywords = styleMapping.recommended;
  const avoidKeywords = styleMapping.avoid;

  // 스타일별 적합도 계산
  const scoredStyles = HAIRSTYLE_CATALOG.map(style => {
    let suitability = 50; // 기본 점수

    // 추천 키워드 매칭
    recommendedKeywords.forEach(keyword => {
      if (
        style.name.includes(keyword) ||
        style.description.includes(keyword) ||
        style.tags.some(tag => tag.includes(keyword))
      ) {
        suitability += 15;
      }
    });

    // 피해야 할 키워드 매칭
    avoidKeywords.forEach(keyword => {
      if (
        style.name.includes(keyword) ||
        style.description.includes(keyword) ||
        style.tags.some(tag => tag.includes(keyword))
      ) {
        suitability -= 20;
      }
    });

    // 선호 길이 보너스
    if (preferredLength && style.length === preferredLength) {
      suitability += 10;
    }

    // 질감 연계 보너스
    if (currentTexture) {
      if (currentTexture === 'wavy' && style.tags.includes('웨이브')) {
        suitability += 5;
      }
      if (currentTexture === 'curly' && style.tags.includes('볼륨')) {
        suitability += 5;
      }
    }

    // 얼굴형별 추가 보정
    suitability = adjustSuitabilityByFaceShape(suitability, faceShape, style);

    return {
      ...style,
      suitability: Math.max(0, Math.min(100, suitability)),
    };
  });

  // 적합도 순 정렬 및 상위 N개 반환
  return scoredStyles
    .sort((a, b) => b.suitability - a.suitability)
    .slice(0, maxResults);
}

/**
 * 얼굴형별 적합도 세부 조정
 */
function adjustSuitabilityByFaceShape(
  baseSuitability: number,
  faceShape: FaceShapeType,
  style: HairstyleRecommendation
): number {
  let adjusted = baseSuitability;

  switch (faceShape) {
    case 'oval':
      // 타원형은 대부분 어울림
      adjusted += 5;
      break;

    case 'round':
      // 둥근형: 세로 길이감 스타일 선호
      if (style.length === 'long' || style.tags.includes('레이어드')) {
        adjusted += 10;
      }
      if (style.tags.includes('볼') || style.length === 'short') {
        adjusted -= 5;
      }
      break;

    case 'square':
      // 사각형: 부드러운 라인 선호
      if (style.tags.includes('웨이브') || style.tags.includes('레이어드')) {
        adjusted += 10;
      }
      if (style.tags.includes('스트레이트') && style.length === 'short') {
        adjusted -= 10;
      }
      break;

    case 'heart':
      // 하트형: 볼륨을 아래에 주는 스타일
      if (style.length === 'medium' || style.length === 'long') {
        adjusted += 5;
      }
      if (style.tags.includes('보브') && style.length === 'medium') {
        adjusted += 10;
      }
      break;

    case 'oblong':
      // 긴 형: 가로 볼륨 스타일
      if (style.tags.includes('웨이브') || style.tags.includes('볼륨')) {
        adjusted += 10;
      }
      if (style.length === 'long' && style.tags.includes('스트레이트')) {
        adjusted -= 15;
      }
      break;

    case 'diamond':
      // 다이아몬드형: 이마/턱 볼륨 스타일
      if (style.tags.includes('보브') || style.tags.includes('프린지')) {
        adjusted += 10;
      }
      break;

    case 'rectangle':
      // 직사각형: 부드러운 웨이브
      if (style.tags.includes('웨이브') || style.tags.includes('레이어드')) {
        adjusted += 10;
      }
      if (style.length === 'long' && style.tags.includes('스트레이트')) {
        adjusted -= 10;
      }
      break;
  }

  return adjusted;
}

/**
 * 퍼스널컬러 기반 헤어컬러 추천
 */
export function recommendHairColors(
  personalColorSeason?: string,
  options?: {
    currentColorLab?: LabColor;
    maxResults?: number;
  }
): HairColorRecommendation[] {
  const { maxResults = 4 } = options || {};

  // 시즌별 컬러 가져오기
  let colors: HairColorRecommendation[];

  if (personalColorSeason && HAIR_COLOR_BY_SEASON[personalColorSeason]) {
    colors = HAIR_COLOR_BY_SEASON[personalColorSeason];
  } else {
    // 시즌 미지정 시 기본 컬러
    colors = DEFAULT_HAIR_COLORS;
  }

  return colors.slice(0, maxResults);
}

/**
 * 헤어케어 팁 생성
 */
export function generateCareTips(
  faceShape: FaceShapeType,
  hairInfo?: {
    texture?: HairTexture;
    scalpCondition?: string;
  }
): string[] {
  const tips: string[] = [];

  // 얼굴형 기반 팁
  switch (faceShape) {
    case 'round':
      tips.push('세로 볼륨을 살리는 스타일링 제품을 사용해보세요.');
      tips.push('정수리 볼륨을 위해 드라이 시 뿌리를 세워서 말려주세요.');
      break;
    case 'square':
      tips.push('부드러운 웨이브를 연출하는 컬링 아이론을 활용해보세요.');
      tips.push('각진 인상을 완화하는 소프트한 스타일링을 추천합니다.');
      break;
    case 'oblong':
      tips.push('사이드 볼륨을 위한 웨이브 스타일링을 추천합니다.');
      break;
    default:
      tips.push('본인의 얼굴형에 맞는 스타일을 유지해주세요.');
  }

  // 질감 기반 팁
  if (hairInfo?.texture) {
    switch (hairInfo.texture) {
      case 'straight':
        tips.push('직모는 볼륨 스프레이로 자연스러운 움직임을 더해보세요.');
        break;
      case 'wavy':
        tips.push('웨이브를 살리는 웨이브 크림이나 무스를 사용해보세요.');
        break;
      case 'curly':
        tips.push('곱슬기를 정돈하는 오일이나 세럼을 사용해보세요.');
        break;
    }
  }

  // 두피 상태 기반 팁
  if (hairInfo?.scalpCondition) {
    switch (hairInfo.scalpCondition) {
      case 'dry':
        tips.push('두피 보습을 위해 저자극 샴푸와 두피 에센스를 사용해보세요.');
        break;
      case 'oily':
        tips.push('매일 샴푸하고, 두피 딥클렌징을 주 1-2회 해주세요.');
        break;
      case 'sensitive':
        tips.push('향료/색소가 없는 저자극 헤어케어 제품을 선택해주세요.');
        break;
    }
  }

  // 기본 팁 추가
  tips.push('정기적인 트리밍으로 건강한 모발을 유지해주세요.');
  tips.push('열 스타일링 전에는 열 보호 스프레이를 사용해주세요.');

  return tips;
}

/**
 * 피해야 할 스타일 가져오기
 */
export function getStylesToAvoid(faceShape: FaceShapeType): string[] {
  return FACE_SHAPE_STYLE_MAPPING[faceShape].avoid;
}
