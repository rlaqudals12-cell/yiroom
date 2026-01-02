/**
 * 인벤토리 시스템 타입, 상수, 순수 함수
 * 훅 의존성 없이 테스트 가능
 */

// ============================================================
// 카테고리 타입
// ============================================================

export type InventoryCategory =
  | 'closet'
  | 'beauty'
  | 'equipment'
  | 'supplement'
  | 'pantry';

export type ClothingCategory =
  | 'outer'
  | 'top'
  | 'bottom'
  | 'dress'
  | 'shoes'
  | 'bag'
  | 'accessory';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type Occasion = 'casual' | 'formal' | 'workout' | 'date' | 'travel';

export type Pattern =
  | 'solid'
  | 'stripe'
  | 'check'
  | 'floral'
  | 'dot'
  | 'geometric'
  | 'animal'
  | 'abstract';

export type Material =
  | 'cotton'
  | 'wool'
  | 'polyester'
  | 'linen'
  | 'silk'
  | 'denim'
  | 'leather'
  | 'synthetic';

// ============================================================
// 상수 정의
// ============================================================

export const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  closet: '내 옷장',
  beauty: '내 화장대',
  equipment: '내 운동장비',
  supplement: '내 영양제',
  pantry: '내 냉장고',
};

export const CLOTHING_CATEGORY_LABELS: Record<ClothingCategory, string> = {
  outer: '아우터',
  top: '상의',
  bottom: '하의',
  dress: '원피스',
  shoes: '신발',
  bag: '가방',
  accessory: '액세서리',
};

export const SEASON_LABELS: Record<Season, string> = {
  spring: '봄',
  summer: '여름',
  autumn: '가을',
  winter: '겨울',
};

export const OCCASION_LABELS: Record<Occasion, string> = {
  casual: '캐주얼',
  formal: '포멀',
  workout: '운동',
  date: '데이트',
  travel: '여행',
};

export const PATTERN_LABELS: Record<Pattern, string> = {
  solid: '무지',
  stripe: '스트라이프',
  check: '체크',
  floral: '플로럴',
  dot: '도트',
  geometric: '기하학',
  animal: '애니멀',
  abstract: '추상',
};

export const MATERIAL_LABELS: Record<Material, string> = {
  cotton: '면',
  wool: '울',
  polyester: '폴리에스터',
  linen: '린넨',
  silk: '실크',
  denim: '데님',
  leather: '가죽',
  synthetic: '합성',
};

export const CLOTHING_SUB_CATEGORIES: Record<ClothingCategory, string[]> = {
  outer: ['코트', '자켓', '패딩', '가디건', '점퍼', '트렌치코트', '블레이저'],
  top: ['티셔츠', '셔츠', '블라우스', '니트', '맨투맨', '후드', '탱크탑'],
  bottom: [
    '청바지',
    '슬랙스',
    '스커트',
    '반바지',
    '레깅스',
    '면바지',
    '조거팬츠',
  ],
  dress: ['원피스', '점프수트', '투피스'],
  shoes: ['스니커즈', '로퍼', '부츠', '샌들', '힐', '슬리퍼', '운동화'],
  bag: ['백팩', '토트백', '크로스백', '클러치', '숄더백', '에코백'],
  accessory: ['모자', '선글라스', '스카프', '벨트', '주얼리', '시계', '장갑'],
};

// ============================================================
// 메타데이터 타입
// ============================================================

export interface ClothingMetadata {
  color: string[];
  pattern?: Pattern;
  material?: Material;
  season: Season[];
  occasion: Occasion[];
  size?: string;
  purchaseDate?: string;
  price?: number;
}

export interface BeautyMetadata {
  productType: string;
  skinType?: string[];
  ingredients?: string[];
  openedAt?: string;
  expiresInMonths?: number;
  volume?: string;
}

export interface EquipmentMetadata {
  exerciseType: string[];
  weight?: number;
  condition: 'new' | 'good' | 'fair' | 'poor';
  purchaseDate?: string;
}

export interface SupplementMetadata {
  dosage: string;
  frequency: string;
  ingredients: string[];
  servingsPerContainer?: number;
  remainingServings?: number;
}

export interface PantryMetadata {
  unit: string;
  quantity: number;
  storageType: 'refrigerator' | 'freezer' | 'room';
  purchaseDate?: string;
}

// ============================================================
// 엔티티 타입
// ============================================================

export interface InventoryItem {
  id: string;
  clerkUserId: string;
  category: InventoryCategory;
  subCategory: string | null;
  name: string;
  imageUrl: string;
  originalImageUrl: string | null;
  brand: string | null;
  tags: string[];
  isFavorite: boolean;
  useCount: number;
  lastUsedAt: string | null;
  expiryDate: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ClothingItem extends Omit<
  InventoryItem,
  'category' | 'metadata'
> {
  category: 'closet';
  subCategory: ClothingCategory;
  metadata: ClothingMetadata;
}

export interface SavedOutfit {
  id: string;
  clerkUserId: string;
  name: string | null;
  description: string | null;
  itemIds: string[];
  items?: ClothingItem[];
  collageImageUrl: string | null;
  occasion: Occasion | null;
  season: Season[];
  wearCount: number;
  lastWornAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// DB Row 타입
// ============================================================

export interface InventoryItemRow {
  id: string;
  clerk_user_id: string;
  category: InventoryCategory;
  sub_category: string | null;
  name: string;
  image_url: string;
  original_image_url: string | null;
  brand: string | null;
  tags: string[];
  is_favorite: boolean;
  use_count: number;
  last_used_at: string | null;
  expiry_date: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SavedOutfitRow {
  id: string;
  clerk_user_id: string;
  name: string | null;
  description: string | null;
  item_ids: string[];
  collage_image_url: string | null;
  occasion: string | null;
  season: string[];
  wear_count: number;
  last_worn_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// 변환 유틸리티
// ============================================================

export function rowToInventoryItem(row: InventoryItemRow): InventoryItem {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    category: row.category,
    subCategory: row.sub_category,
    name: row.name,
    imageUrl: row.image_url,
    originalImageUrl: row.original_image_url,
    brand: row.brand,
    tags: row.tags || [],
    isFavorite: row.is_favorite,
    useCount: row.use_count,
    lastUsedAt: row.last_used_at,
    expiryDate: row.expiry_date,
    metadata: row.metadata || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function rowToSavedOutfit(row: SavedOutfitRow): SavedOutfit {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    name: row.name,
    description: row.description,
    itemIds: row.item_ids || [],
    collageImageUrl: row.collage_image_url,
    occasion: row.occasion as Occasion | null,
    season: (row.season || []) as Season[],
    wearCount: row.wear_count,
    lastWornAt: row.last_worn_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toClothingItem(item: InventoryItem): ClothingItem {
  const meta = item.metadata as Partial<ClothingMetadata>;
  return {
    ...item,
    category: 'closet',
    subCategory: (item.subCategory || 'top') as ClothingCategory,
    metadata: {
      color: meta.color || [],
      season: meta.season || [],
      occasion: meta.occasion || [],
      pattern: meta.pattern,
      material: meta.material,
      size: meta.size,
      purchaseDate: meta.purchaseDate,
      price: meta.price,
    },
  };
}

export function toClothingItems(items: InventoryItem[]): ClothingItem[] {
  return items.filter((item) => item.category === 'closet').map(toClothingItem);
}
