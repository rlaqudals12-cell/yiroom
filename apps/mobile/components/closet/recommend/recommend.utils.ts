import { resolveClothingCategory } from '@/lib/inventory/clothingCategory';
import type { ClothingCategory, InventoryItem, Season } from '@/lib/inventory/types';
import type {
  BodyType3,
  OutfitSuggestion,
  PersonalColorSeason,
} from '@/lib/inventory/useClosetMatcher';

export const BODY_TYPE_LABELS: Record<BodyType3, string> = {
  S: '스트레이트',
  W: '웨이브',
  N: '내추럴',
};

// 미진단·미매핑 값을 기본 체형으로 지어내지 않는다.
export function mapBodyType(dbBodyType: string | undefined): BodyType3 | null {
  const mapping: Record<string, BodyType3> = {
    hourglass: 'S',
    rectangle: 'S',
    inverted_triangle: 'S',
    pear: 'W',
    apple: 'N',
  };
  return mapping[dbBodyType ?? ''] ?? null;
}

export function mapSeason(dbSeason: string | undefined): PersonalColorSeason | null {
  const mapping: Record<string, PersonalColorSeason> = {
    spring: 'Spring',
    Spring: 'Spring',
    summer: 'Summer',
    Summer: 'Summer',
    autumn: 'Autumn',
    Autumn: 'Autumn',
    winter: 'Winter',
    Winter: 'Winter',
  };
  return mapping[dbSeason ?? ''] ?? null;
}

export function getOutfitItemIds(outfit: OutfitSuggestion | null): string[] {
  if (!outfit) return [];

  return [
    outfit.top,
    outfit.bottom,
    outfit.dress,
    outfit.outer,
    outfit.shoes,
    outfit.bag,
    outfit.accessory,
  ].flatMap((match) => (match ? [match.item.id] : []));
}

export function getNoOutfitHint(items: InventoryItem[]): string {
  const has = (category: ClothingCategory): boolean =>
    items.some((item) => resolveClothingCategory(item) === category);
  const hasTop = has('top');
  const hasBottom = has('bottom');

  if (hasTop && !hasBottom) return '하의 또는 원피스를 추가하면 코디를 만들 수 있어요';
  if (!hasTop && hasBottom) return '상의 또는 원피스를 추가하면 코디를 만들 수 있어요';
  if (!hasTop && !hasBottom) return '상의·하의 또는 원피스를 추가하면 코디를 만들 수 있어요';
  return '옷장 아이템의 카테고리를 확인해주세요';
}

export function getCurrentSeasons(month = new Date().getMonth()): Season[] {
  if (month >= 2 && month <= 4) return ['spring'];
  if (month >= 5 && month <= 7) return ['summer'];
  if (month >= 8 && month <= 10) return ['autumn'];
  return ['winter'];
}
