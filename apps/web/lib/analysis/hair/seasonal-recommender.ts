/**
 * 계절별 헤어케어 추천 시스템
 *
 * 계절/날씨 환경에 따른 맞춤 헤어케어 가이드
 */

import type { TextureCode, TextureGroup } from './texture-classifier';

// =============================================================================
// 타입
// =============================================================================

/**
 * 계절
 */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/**
 * 계절 환경 요인
 */
export interface SeasonalContext {
  season: Season;
  /** 현재 습도 (0-100%) */
  humidity?: number;
  /** 현재 UV 지수 (0-11+) */
  uvIndex?: number;
  /** 현재 기온 (°C) */
  temperature?: number;
}

/**
 * 계절 환경 위험 요인
 */
export type SeasonalHazard =
  | 'uv-damage' // 자외선 손상
  | 'humidity-frizz' // 습기 부스스함
  | 'cold-dry' // 한랭 건조
  | 'static' // 정전기
  | 'sweat-oil' // 땀/유분
  | 'chlorine' // 수영장 염소
  | 'wind-tangle' // 바람 엉킴
  | 'pollen'; // 꽃가루/미세먼지

/**
 * 계절별 추천 세트
 */
export interface SeasonalRecommendation {
  season: Season;
  seasonLabel: string;
  hazards: SeasonalHazard[];
  hazardLabels: string[];
  /** 일반 관리 팁 */
  generalTips: string[];
  /** 텍스처별 특화 팁 */
  textureTips: string[];
  /** 추천 제품 카테고리 */
  productCategories: string[];
  /** 주의사항 */
  warnings: string[];
}

// =============================================================================
// 계절별 환경 데이터
// =============================================================================

const SEASON_LABELS: Record<Season, string> = {
  spring: '봄',
  summer: '여름',
  autumn: '가을',
  winter: '겨울',
};

const SEASON_HAZARDS: Record<Season, { hazard: SeasonalHazard; label: string }[]> = {
  spring: [
    { hazard: 'pollen', label: '꽃가루/미세먼지' },
    { hazard: 'wind-tangle', label: '봄바람 엉킴' },
    { hazard: 'humidity-frizz', label: '환절기 습도 변화' },
  ],
  summer: [
    { hazard: 'uv-damage', label: '자외선 손상' },
    { hazard: 'humidity-frizz', label: '높은 습도' },
    { hazard: 'sweat-oil', label: '땀/유분 증가' },
    { hazard: 'chlorine', label: '수영장 염소' },
  ],
  autumn: [
    { hazard: 'cold-dry', label: '건조한 날씨' },
    { hazard: 'static', label: '정전기 시작' },
    { hazard: 'wind-tangle', label: '가을 바람' },
  ],
  winter: [
    { hazard: 'cold-dry', label: '극도 건조' },
    { hazard: 'static', label: '심한 정전기' },
    { hazard: 'wind-tangle', label: '겨울 바람' },
  ],
};

// =============================================================================
// 계절별 기본 관리 팁
// =============================================================================

const SEASON_GENERAL_TIPS: Record<Season, string[]> = {
  spring: [
    '미세먼지가 많은 날은 외출 후 반드시 머리를 감아주세요.',
    '자외선 차단 헤어 스프레이를 사용하기 시작할 시기입니다.',
    '겨울 동안 손상된 모발을 위한 딥 트리트먼트를 주 1회 해주세요.',
    '꽃가루 시즌에는 실크 베개커버가 엉킴을 줄여줍니다.',
  ],
  summer: [
    'UV 차단 헤어 미스트를 외출 전 뿌려주세요.',
    '수영 후 반드시 깨끗한 물로 헹궈주세요.',
    '땀과 유분 관리를 위해 두피 딥클렌징을 주 2회 해주세요.',
    '열 스타일링은 최소화하고 자연 건조를 활용하세요.',
    '모자나 스카프로 직사광선을 피해주세요.',
  ],
  autumn: [
    '여름 손상을 회복하는 보습 집중 기간입니다.',
    '보습력이 높은 컨디셔너로 교체해주세요.',
    '정전기 방지 스프레이를 준비해두세요.',
    '헤어 오일로 모발 끝 관리를 시작하세요.',
  ],
  winter: [
    '실내 난방으로 인한 건조함에 주의하세요.',
    '정전기 방지를 위해 리브인 컨디셔너를 사용하세요.',
    '모자 착용 시 실크 라이닝이 마찰을 줄여줍니다.',
    '주 2회 딥 컨디셔닝 트리트먼트를 권장합니다.',
    '드라이어 사용 시 찬 바람으로 마무리하세요.',
  ],
};

// =============================================================================
// 텍스처 그룹별 계절 특화 팁
// =============================================================================

// 텍스처 그룹(1-4)에 따른 계절별 추가 팁
function getTextureSeasonTips(group: TextureGroup, season: Season): string[] {
  const tips: string[] = [];

  if (group === 1) {
    // 직모
    switch (season) {
      case 'summer':
        tips.push('직모는 땀에 쉽게 처지므로 볼륨 파우더를 활용하세요.');
        tips.push('경량 자외선 차단 스프레이가 무거움 없이 보호해줍니다.');
        break;
      case 'winter':
        tips.push('정전기가 심한 직모는 안티-스태틱 시트를 사용해보세요.');
        tips.push('너무 잦은 샴푸는 두피 유분을 더 자극할 수 있어요.');
        break;
      case 'spring':
        tips.push('미세먼지가 가는 직모에 잘 달라붙으므로 저녁 샴푸를 권장합니다.');
        break;
      case 'autumn':
        tips.push('건조해지기 시작하면 헤어 세럼으로 윤기를 더해주세요.');
        break;
    }
  } else if (group === 2) {
    // 웨이브
    switch (season) {
      case 'summer':
        tips.push('습기에 의한 프리즈를 안티-휴미디티 세럼으로 관리하세요.');
        tips.push('바다 소금 스프레이가 자연스러운 비치 웨이브를 연출해줍니다.');
        break;
      case 'winter':
        tips.push('건조한 실내에서 웨이브가 풀리기 쉬우니 컬 크림을 더해주세요.');
        break;
      case 'spring':
        tips.push('환절기 습도 변화에 웨이브 패턴이 불규칙해질 수 있어요.');
        break;
      case 'autumn':
        tips.push('가을은 웨이브 복원의 최적기입니다. 딥 컨디셔닝을 시작하세요.');
        break;
    }
  } else if (group === 3) {
    // 곱슬
    switch (season) {
      case 'summer':
        tips.push('높은 습도에서 곱슬이 부풀 수 있으므로 젤+오일 레이어링을 추천합니다.');
        tips.push('프로텍티브 스타일(브레이드, 번)로 손상을 최소화하세요.');
        break;
      case 'winter':
        tips.push('곱슬모는 겨울에 극도로 건조해집니다. LOC 메서드를 활용하세요.');
        tips.push('울 모자 대신 새틴 라이닝 모자를 선택하세요.');
        break;
      case 'spring':
        tips.push('봄 습도 상승에 맞춰 제품 양을 조절하세요.');
        break;
      case 'autumn':
        tips.push('여름 손상 회복을 위해 프로틴 트리트먼트를 주 1회 해주세요.');
        break;
    }
  } else {
    // 코일리
    switch (season) {
      case 'summer':
        tips.push('코일리 모발은 자외선에 더 취약합니다. UV 보호 오일을 사용하세요.');
        tips.push('워시앤고보다 프로텍티브 스타일이 여름 손상을 줄여줍니다.');
        break;
      case 'winter':
        tips.push('매 세척 시 프리푸(Pre-poo) 오일 트리트먼트를 필수로 해주세요.');
        tips.push('세척 횟수를 줄이고 코워시(Co-wash)를 활용하세요.');
        tips.push('셰어 버터 기반 제품으로 수분 실링을 강화하세요.');
        break;
      case 'spring':
        tips.push('겨울 동안의 건조 회복을 위해 핫 오일 트리트먼트를 시도하세요.');
        break;
      case 'autumn':
        tips.push('보습 제품을 여름용에서 겨울용(더 무거운)으로 전환하세요.');
        break;
    }
  }

  return tips;
}

// =============================================================================
// 추천 함수
// =============================================================================

/**
 * 현재 날짜 기반 계절 추정 (한국 기준)
 */
export function getCurrentSeason(date: Date = new Date()): Season {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/**
 * 계절별 헤어케어 추천 생성
 */
export function getSeasonalRecommendation(
  textureCode: TextureCode,
  context?: Partial<SeasonalContext>
): SeasonalRecommendation {
  const season = context?.season ?? getCurrentSeason();
  const group = parseInt(textureCode[0]) as TextureGroup;
  const hazardEntries = SEASON_HAZARDS[season];

  // 환경에 따라 hazard 우선순위 조정
  const hazards = hazardEntries.map((h) => h.hazard);
  const hazardLabels = hazardEntries.map((h) => h.label);

  // 일반 팁
  const generalTips = [...SEASON_GENERAL_TIPS[season]];

  // 환경 데이터 기반 추가 팁
  if (context?.humidity !== undefined) {
    if (context.humidity > 70) {
      generalTips.push('습도가 높습니다. 안티-프리즈 제품 사용을 권장합니다.');
    } else if (context.humidity < 30) {
      generalTips.push('습도가 매우 낮습니다. 보습 강화에 집중하세요.');
    }
  }
  if (context?.uvIndex !== undefined && context.uvIndex >= 6) {
    generalTips.push(`UV 지수가 ${context.uvIndex}로 높습니다. 모자 착용을 권장합니다.`);
  }

  // 텍스처별 팁
  const textureTips = getTextureSeasonTips(group, season);

  // 추천 제품 카테고리
  const productCategories = getSeasonalProducts(group, season);

  // 주의사항
  const warnings = getSeasonalWarnings(group, season);

  return {
    season,
    seasonLabel: SEASON_LABELS[season],
    hazards,
    hazardLabels,
    generalTips,
    textureTips,
    productCategories,
    warnings,
  };
}

/**
 * 계절별 추천 제품 카테고리
 */
function getSeasonalProducts(group: TextureGroup, season: Season): string[] {
  const products: string[] = [];

  // 계절 공통
  switch (season) {
    case 'summer':
      products.push('UV 차단 미스트', '두피 딥클렌저');
      break;
    case 'winter':
      products.push('딥 컨디셔닝 마스크', '정전기 방지 스프레이');
      break;
    case 'spring':
      products.push('두피 스케일링 제품', '가벼운 보습 트리트먼트');
      break;
    case 'autumn':
      products.push('리페어 트리트먼트', '헤어 오일');
      break;
  }

  // 텍스처별 추가
  if (group >= 3) {
    if (season === 'summer') products.push('컬 리프레셔 스프레이');
    if (season === 'winter') products.push('시어버터 크림', '실링 오일');
  }
  if (group === 1) {
    if (season === 'summer') products.push('볼륨 파우더');
    if (season === 'winter') products.push('안티-스태틱 시트');
  }

  return products;
}

/**
 * 계절별 주의사항
 */
function getSeasonalWarnings(group: TextureGroup, season: Season): string[] {
  const warnings: string[] = [];

  if (season === 'summer') {
    warnings.push('염색 모발은 자외선에 더 빨리 탈색됩니다.');
    if (group >= 3) {
      warnings.push(
        '수영장 염소가 곱슬/코일리 모발을 심하게 건조시킵니다. 수영 전 오일을 발라주세요.'
      );
    }
  }

  if (season === 'winter') {
    warnings.push('뜨거운 물로 감으면 두피 건조가 악화됩니다. 미온수를 사용하세요.');
    if (group >= 3) {
      warnings.push(
        '건조한 환경에서 빗질은 모발 끊어짐의 원인이 됩니다. 젖은 상태에서만 디탱글링하세요.'
      );
    }
  }

  return warnings;
}

/**
 * 4계절 전체 추천 요약 (연간 플랜용)
 */
export function getYearlyCarePlan(textureCode: TextureCode): SeasonalRecommendation[] {
  const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];
  return seasons.map((season) => getSeasonalRecommendation(textureCode, { season }));
}
