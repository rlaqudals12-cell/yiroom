/**
 * H-1 헤어스타일 추천 모듈
 *
 * 얼굴형 + 퍼스널컬러 기반 헤어스타일/컬러 추천
 *
 * @description 얼굴형별 어울리는 스타일, 헤어컬러 추천
 * @see docs/specs/SDD-HAIR-ANALYSIS.md
 */

import type {
  FaceShapeType,
  HairstyleRecommendation,
  HairColorRecommendation,
  HairLength,
  HairTexture,
} from './types';
import { FACE_SHAPE_STYLE_MAPPING } from './types';
import { classifyTexture } from './texture-classifier';
import { matchStyles } from './style-matcher';

// =============================================================================
// 헤어컬러 데이터베이스
// =============================================================================

/**
 * 시즌별 추천 헤어컬러
 */
const HAIR_COLOR_BY_SEASON: Record<string, HairColorRecommendation[]> = {
  spring: [
    {
      name: '골드 브라운',
      hexColor: '#B5651D',
      suitability: 90,
      seasonMatch: 'spring',
      tags: ['웜톤', '밝은'],
    },
    {
      name: '허니 블론드',
      hexColor: '#D4A76A',
      suitability: 85,
      seasonMatch: 'spring',
      tags: ['웜톤', '블론드'],
    },
    {
      name: '오렌지 브라운',
      hexColor: '#C87533',
      suitability: 80,
      seasonMatch: 'spring',
      tags: ['웜톤', '비비드'],
    },
    {
      name: '코랄 브라운',
      hexColor: '#CD5C5C',
      suitability: 75,
      seasonMatch: 'spring',
      tags: ['웜톤', '코랄'],
    },
  ],
  summer: [
    {
      name: '애쉬 브라운',
      hexColor: '#8B7355',
      suitability: 90,
      seasonMatch: 'summer',
      tags: ['쿨톤', '자연스러운'],
    },
    {
      name: '로즈 브라운',
      hexColor: '#9E7B7B',
      suitability: 85,
      seasonMatch: 'summer',
      tags: ['쿨톤', '로즈'],
    },
    {
      name: '라벤더 그레이',
      hexColor: '#9896A4',
      suitability: 80,
      seasonMatch: 'summer',
      tags: ['쿨톤', '라벤더'],
    },
    {
      name: '소프트 블랙',
      hexColor: '#3C3C3C',
      suitability: 75,
      seasonMatch: 'summer',
      tags: ['쿨톤', '다크'],
    },
  ],
  autumn: [
    {
      name: '다크 브라운',
      hexColor: '#5C4033',
      suitability: 90,
      seasonMatch: 'autumn',
      tags: ['웜톤', '딥'],
    },
    {
      name: '버건디',
      hexColor: '#800020',
      suitability: 85,
      seasonMatch: 'autumn',
      tags: ['웜톤', '버건디'],
    },
    {
      name: '초콜릿 브라운',
      hexColor: '#7B3F00',
      suitability: 85,
      seasonMatch: 'autumn',
      tags: ['웜톤', '초콜릿'],
    },
    {
      name: '오번',
      hexColor: '#A52A2A',
      suitability: 80,
      seasonMatch: 'autumn',
      tags: ['웜톤', '레드'],
    },
  ],
  winter: [
    {
      name: '블루 블랙',
      hexColor: '#1C1C28',
      suitability: 90,
      seasonMatch: 'winter',
      tags: ['쿨톤', '블랙'],
    },
    {
      name: '애쉬 블랙',
      hexColor: '#2F2F2F',
      suitability: 85,
      seasonMatch: 'winter',
      tags: ['쿨톤', '애쉬'],
    },
    {
      name: '버건디 블랙',
      hexColor: '#4A0000',
      suitability: 80,
      seasonMatch: 'winter',
      tags: ['쿨톤', '버건디'],
    },
    {
      name: '플래티넘 블론드',
      hexColor: '#E5E4E2',
      suitability: 75,
      seasonMatch: 'winter',
      tags: ['쿨톤', '플래티넘'],
    },
  ],
};

/**
 * 기본 헤어컬러 (시즌 미지정 시)
 */
const DEFAULT_HAIR_COLORS: HairColorRecommendation[] = [
  {
    name: '내추럴 브라운',
    hexColor: '#6B4423',
    suitability: 80,
    seasonMatch: 'all',
    tags: ['자연스러운'],
  },
  {
    name: '다크 브라운',
    hexColor: '#3D2314',
    suitability: 80,
    seasonMatch: 'all',
    tags: ['자연스러운'],
  },
  { name: '블랙', hexColor: '#1C1C1C', suitability: 75, seasonMatch: 'all', tags: ['클래식'] },
];

// =============================================================================
// 추천 함수
// =============================================================================

/**
 * 3-Factor 엔진 기반 헤어스타일 추천 호환 래퍼.
 *
 * 과거 구현은 한국어 문구를 substring으로 대조해 사각형 등에서 대량 동점이 발생했다.
 * 기존 호출 계약은 유지하되 판정은 matchStyles 정본에만 위임한다.
 */
export function recommendHairstyles(
  faceShape: FaceShapeType,
  options?: {
    preferredLength?: HairLength;
    currentTexture?: HairTexture;
    personalColorSeason?: string;
    maxResults?: number;
  }
): HairstyleRecommendation[] {
  const { preferredLength, currentTexture, personalColorSeason, maxResults = 5 } = options || {};
  return matchStyles(
    {
      faceShape,
      preferredLength,
      personalColorSeason,
      textureCode: currentTexture ? classifyTexture(currentTexture) : undefined,
    },
    maxResults
  );
}

/**
 * 퍼스널컬러 기반 헤어컬러 추천
 *
 * ⚠️ suitability는 "개인 적합도"가 아니라 **시즌 팔레트 안의 추천 순서**다.
 * 4시즌 모두 90/85/80/75 사다리를 공유하며 개인 모발색·상태를 반영하지 않으므로,
 * UI에서 % 로 표기하지 말고 순위(1·2·3…)로만 노출한다.
 * (개인 모발색 반영을 암시하던 미사용 currentColorLab 옵션은 제거됨)
 */
export function recommendHairColors(
  personalColorSeason?: string,
  options?: {
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
      tips.push('각진 인상을 완화하는 소프트한 스타일링을 추천해요.');
      break;
    case 'oblong':
      tips.push('사이드 볼륨을 위한 웨이브 스타일링을 추천해요.');
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
