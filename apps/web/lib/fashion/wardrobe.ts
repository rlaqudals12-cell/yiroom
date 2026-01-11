/**
 * 옷장 연동 시스템
 * @description K-2 패션 확장: 사용자 옷장 기반 코디 추천
 */

import type { PersonalColorSeason } from '@/types/product';

// 의류 카테고리
export type ClothingCategory =
  | 'top' // 상의
  | 'bottom' // 하의
  | 'outer' // 아우터
  | 'dress' // 원피스
  | 'shoes' // 신발
  | 'bag' // 가방
  | 'accessory'; // 악세서리

// 의류 색상
export interface ClothingColor {
  name: string;
  hex: string;
  season?: PersonalColorSeason; // 어울리는 시즌
}

// 옷장 아이템
export interface WardrobeItem {
  id: string;
  name: string;
  category: ClothingCategory;
  color: ClothingColor;
  imageUrl?: string;
  brand?: string;
  tags?: string[]; // 캐주얼, 포멀, 스포티 등
  addedAt: Date;
}

// 코디 조합
export interface OutfitCombination {
  id: string;
  name: string;
  items: WardrobeItem[];
  occasion: string; // 데일리, 출근, 데이트 등
  matchScore: number; // 0-100
  matchReason: string;
  seasonCompatibility: PersonalColorSeason[];
}

// 코디 추천 결과
export interface OutfitRecommendationResult {
  outfits: OutfitCombination[];
  unmatchedItems: WardrobeItem[]; // 조합에 포함되지 않은 아이템
  tips: string[];
}

// 색상 조화 규칙
const COLOR_HARMONY_RULES: Record<string, string[]> = {
  // 무채색은 모든 색과 조화
  '#000000': ['*'], // 블랙
  '#FFFFFF': ['*'], // 화이트
  '#808080': ['*'], // 그레이
  '#F5F5DC': ['*'], // 베이지
  '#000080': ['*'], // 네이비

  // 웜톤 색상 조합
  '#FF6B6B': ['#FFE66D', '#4ECDC4', '#F5F5DC'], // 코랄
  '#FFE66D': ['#FF6B6B', '#95E1D3', '#F5F5DC'], // 머스타드
  '#D4A574': ['#8B4513', '#F5F5DC', '#2F4F4F'], // 카멜

  // 쿨톤 색상 조합
  '#E6E6FA': ['#B0C4DE', '#708090', '#F5F5F5'], // 라벤더
  '#B0C4DE': ['#E6E6FA', '#2F4F4F', '#F5F5F5'], // 라이트 블루
  '#708090': ['#E6E6FA', '#B0C4DE', '#000000'], // 슬레이트 그레이
};

// 시즌별 추천 색상
const SEASON_COLORS: Record<PersonalColorSeason, string[]> = {
  Spring: ['#FF6B6B', '#FFE66D', '#F88379', '#FFDAB9', '#98FB98'],
  Summer: ['#E6E6FA', '#B0C4DE', '#DDA0DD', '#F0F8FF', '#E0FFFF'],
  Autumn: ['#D4A574', '#8B4513', '#CD853F', '#556B2F', '#B8860B'],
  Winter: ['#000000', '#FFFFFF', '#DC143C', '#4169E1', '#800080'],
};

/**
 * 두 색상이 조화로운지 확인
 */
function isColorHarmony(hex1: string, hex2: string): boolean {
  const upperHex1 = hex1.toUpperCase();
  const upperHex2 = hex2.toUpperCase();

  // 같은 색은 조화
  if (upperHex1 === upperHex2) return true;

  // 무채색 체크
  const neutralColors = ['#000000', '#FFFFFF', '#808080', '#F5F5DC', '#000080'];
  if (neutralColors.includes(upperHex1) || neutralColors.includes(upperHex2)) {
    return true;
  }

  // 조화 규칙 체크
  const rules = COLOR_HARMONY_RULES[upperHex1];
  if (rules) {
    return rules.includes('*') || rules.includes(upperHex2);
  }

  // 기본: 비슷한 색상군이면 조화
  return isSimilarColorFamily(upperHex1, upperHex2);
}

/**
 * 비슷한 색상군인지 확인 (간단한 휴리스틱)
 */
function isSimilarColorFamily(hex1: string, hex2: string): boolean {
  // RGB로 변환
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);

  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);

  // 색상 거리 계산 (간단한 유클리드 거리)
  const distance = Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));

  // 거리가 150 이하면 비슷한 색상군
  return distance < 150;
}

/**
 * 아이템이 시즌에 맞는지 확인
 */
function isSeasonCompatible(item: WardrobeItem, season: PersonalColorSeason): boolean {
  // 아이템에 시즌이 지정되어 있으면 확인
  if (item.color.season) {
    return item.color.season === season;
  }

  // 시즌별 추천 색상과 비교
  const seasonColors = SEASON_COLORS[season];
  return seasonColors.some((sc) => isSimilarColorFamily(item.color.hex, sc));
}

/**
 * 옷장에서 코디 조합 생성
 */
export function generateOutfitCombinations(
  wardrobe: WardrobeItem[],
  options?: {
    userSeason?: PersonalColorSeason;
    occasion?: string;
    maxOutfits?: number;
  }
): OutfitRecommendationResult {
  const { userSeason, occasion, maxOutfits = 5 } = options || {};

  const tops = wardrobe.filter((i) => i.category === 'top');
  const bottoms = wardrobe.filter((i) => i.category === 'bottom');
  const outers = wardrobe.filter((i) => i.category === 'outer');
  const dresses = wardrobe.filter((i) => i.category === 'dress');
  const shoes = wardrobe.filter((i) => i.category === 'shoes');

  const outfits: OutfitCombination[] = [];
  const usedItems = new Set<string>();

  // 상의 + 하의 조합
  for (const top of tops) {
    for (const bottom of bottoms) {
      if (!isColorHarmony(top.color.hex, bottom.color.hex)) continue;

      let score = 70;
      const reasons: string[] = [];

      // 시즌 호환성 보너스
      if (userSeason) {
        const topMatch = isSeasonCompatible(top, userSeason);
        const bottomMatch = isSeasonCompatible(bottom, userSeason);
        if (topMatch && bottomMatch) {
          score += 20;
          reasons.push('퍼스널컬러와 완벽 매치');
        } else if (topMatch || bottomMatch) {
          score += 10;
          reasons.push('퍼스널컬러와 부분 매치');
        }
      }

      // 태그 매칭 보너스
      if (occasion && top.tags?.includes(occasion) && bottom.tags?.includes(occasion)) {
        score += 10;
        reasons.push(`${occasion} 룩에 적합`);
      }

      const items = [top, bottom];

      // 아우터 추가 (선택적)
      const matchingOuter = outers.find(
        (o) =>
          isColorHarmony(o.color.hex, top.color.hex) &&
          isColorHarmony(o.color.hex, bottom.color.hex)
      );
      if (matchingOuter) {
        items.push(matchingOuter);
        score += 5;
      }

      // 신발 추가 (선택적)
      const matchingShoes = shoes.find(
        (s) =>
          isColorHarmony(s.color.hex, top.color.hex) ||
          isColorHarmony(s.color.hex, bottom.color.hex)
      );
      if (matchingShoes) {
        items.push(matchingShoes);
        score += 5;
      }

      items.forEach((i) => usedItems.add(i.id));

      outfits.push({
        id: `outfit-${outfits.length + 1}`,
        name: `${top.name} + ${bottom.name}`,
        items,
        occasion: occasion || '데일리',
        matchScore: Math.min(score, 100),
        matchReason: reasons.length > 0 ? reasons.join(', ') : '색상 조화 좋음',
        seasonCompatibility: userSeason ? [userSeason] : [],
      });
    }
  }

  // 원피스 조합
  for (const dress of dresses) {
    let score = 75;
    const reasons: string[] = ['원피스 단독 코디'];
    const items: WardrobeItem[] = [dress];

    if (userSeason && isSeasonCompatible(dress, userSeason)) {
      score += 15;
      reasons.push('퍼스널컬러 매치');
    }

    const matchingShoes = shoes.find((s) => isColorHarmony(s.color.hex, dress.color.hex));
    if (matchingShoes) {
      items.push(matchingShoes);
      score += 5;
    }

    items.forEach((i) => usedItems.add(i.id));

    outfits.push({
      id: `outfit-${outfits.length + 1}`,
      name: dress.name,
      items,
      occasion: occasion || '데일리',
      matchScore: Math.min(score, 100),
      matchReason: reasons.join(', '),
      seasonCompatibility: userSeason ? [userSeason] : [],
    });
  }

  // 점수순 정렬
  outfits.sort((a, b) => b.matchScore - a.matchScore);

  // 사용되지 않은 아이템
  const unmatchedItems = wardrobe.filter((i) => !usedItems.has(i.id));

  // 팁 생성
  const tips: string[] = [];
  if (unmatchedItems.length > 0) {
    tips.push(`${unmatchedItems.length}개 아이템이 조합에 포함되지 않았어요`);
  }
  if (tops.length === 0 || bottoms.length === 0) {
    tips.push('상의와 하의를 추가하면 더 많은 코디를 추천받을 수 있어요');
  }
  if (userSeason) {
    tips.push(`${userSeason} 시즌에 맞는 색상 위주로 추천했어요`);
  }

  return {
    outfits: outfits.slice(0, maxOutfits),
    unmatchedItems,
    tips,
  };
}

// 샘플 옷장 데이터 (테스트/데모용)
export const SAMPLE_WARDROBE: WardrobeItem[] = [
  {
    id: 'w1',
    name: '화이트 티셔츠',
    category: 'top',
    color: { name: '화이트', hex: '#FFFFFF' },
    tags: ['캐주얼', '데일리'],
    addedAt: new Date(),
  },
  {
    id: 'w2',
    name: '네이비 셔츠',
    category: 'top',
    color: { name: '네이비', hex: '#000080' },
    tags: ['비즈니스', '포멀'],
    addedAt: new Date(),
  },
  {
    id: 'w3',
    name: '코랄 니트',
    category: 'top',
    color: { name: '코랄', hex: '#FF6B6B', season: 'Spring' },
    tags: ['캐주얼', '데이트'],
    addedAt: new Date(),
  },
  {
    id: 'w4',
    name: '블랙 슬랙스',
    category: 'bottom',
    color: { name: '블랙', hex: '#000000' },
    tags: ['비즈니스', '포멀'],
    addedAt: new Date(),
  },
  {
    id: 'w5',
    name: '베이지 치노',
    category: 'bottom',
    color: { name: '베이지', hex: '#F5F5DC' },
    tags: ['캐주얼', '데일리'],
    addedAt: new Date(),
  },
  {
    id: 'w6',
    name: '데님 진',
    category: 'bottom',
    color: { name: '인디고', hex: '#4B0082' },
    tags: ['캐주얼', '데일리'],
    addedAt: new Date(),
  },
  {
    id: 'w7',
    name: '베이지 트렌치코트',
    category: 'outer',
    color: { name: '베이지', hex: '#F5F5DC' },
    tags: ['비즈니스', '포멀'],
    addedAt: new Date(),
  },
  {
    id: 'w8',
    name: '화이트 스니커즈',
    category: 'shoes',
    color: { name: '화이트', hex: '#FFFFFF' },
    tags: ['캐주얼', '데일리'],
    addedAt: new Date(),
  },
  {
    id: 'w9',
    name: '블랙 로퍼',
    category: 'shoes',
    color: { name: '블랙', hex: '#000000' },
    tags: ['비즈니스', '포멀'],
    addedAt: new Date(),
  },
  {
    id: 'w10',
    name: '플로럴 원피스',
    category: 'dress',
    color: { name: '피치', hex: '#FFDAB9', season: 'Spring' },
    tags: ['데이트', '캐주얼'],
    addedAt: new Date(),
  },
];
