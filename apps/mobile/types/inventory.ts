/**
 * 인벤토리 시스템 타입 정의
 * Phase I-2: 내 인벤토리 (옷장, 뷰티, 운동장비, 영양제, 냉장고)
 */

// 카테고리
export type InventoryCategory =
  | 'closet' // 내 옷장
  | 'beauty' // 내 화장대
  | 'equipment' // 내 운동장비
  | 'supplement' // 내 영양제
  | 'pantry'; // 내 냉장고

// 의류 카테고리
export type ClothingCategory =
  | 'outer' // 아우터
  | 'top' // 상의
  | 'bottom' // 하의
  | 'dress' // 원피스
  | 'shoes' // 신발
  | 'bag' // 가방
  | 'accessory'; // 액세서리

// 의류 서브 카테고리
export const CLOTHING_SUB_CATEGORIES: Record<ClothingCategory, string[]> = {
  outer: ['코트', '자켓', '패딩', '가디건', '점퍼', '트렌치코트', '블레이저'],
  top: ['티셔츠', '셔츠', '블라우스', '니트', '맨투맨', '후드', '탱크탑'],
  bottom: ['청바지', '슬랙스', '스커트', '반바지', '레깅스', '면바지', '조거팬츠'],
  dress: ['원피스', '점프수트', '투피스'],
  shoes: ['스니커즈', '로퍼', '부츠', '샌들', '힐', '슬리퍼', '운동화'],
  bag: ['백팩', '토트백', '크로스백', '클러치', '숄더백', '에코백'],
  accessory: ['모자', '선글라스', '스카프', '벨트', '주얼리', '시계', '장갑'],
};

// 계절
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export const SEASON_LABELS: Record<Season, string> = {
  spring: '봄',
  summer: '여름',
  autumn: '가을',
  winter: '겨울',
};

// 상황/TPO
export type Occasion = 'casual' | 'formal' | 'workout' | 'date' | 'travel';

export const OCCASION_LABELS: Record<Occasion, string> = {
  casual: '캐주얼',
  formal: '포멀',
  workout: '운동',
  date: '데이트',
  travel: '여행',
};

// 패턴
export type Pattern =
  | 'solid'
  | 'stripe'
  | 'check'
  | 'floral'
  | 'dot'
  | 'geometric'
  | 'animal'
  | 'abstract';

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

// 소재
export type Material =
  | 'cotton'
  | 'wool'
  | 'polyester'
  | 'linen'
  | 'silk'
  | 'denim'
  | 'leather'
  | 'synthetic';

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

// 날씨 조건
export type WeatherCondition =
  | 'cold_dry' // 춥고 건조
  | 'cold_humid' // 춥고 습함
  | 'cool_dry' // 서늘하고 건조
  | 'cool_humid' // 서늘하고 습함
  | 'warm_dry' // 따뜻하고 건조
  | 'warm_humid' // 따뜻하고 습함
  | 'hot_dry' // 덥고 건조
  | 'hot_humid'; // 덥고 습함

// 의류 메타데이터
export interface ClothingMetadata {
  color: string[]; // 주요 색상 (HEX 또는 색상명)
  pattern?: Pattern;
  material?: Material;
  season: Season[];
  occasion: Occasion[];
  size?: string;
  purchaseDate?: string; // YYYY-MM-DD
  price?: number;
}

// 뷰티 메타데이터
export interface BeautyMetadata {
  productType: string; // 스킨케어, 메이크업, 헤어 등
  skinType?: string[]; // 건성, 지성, 복합성, 민감성
  ingredients?: string[];
  openedAt?: string; // 개봉일
  expiresInMonths?: number; // 개봉 후 사용기한 (개월)
  volume?: string; // 용량
}

// 운동장비 메타데이터
export interface EquipmentMetadata {
  exerciseType: string[]; // 운동 종류
  weight?: number; // 무게 (kg)
  condition: 'new' | 'good' | 'fair' | 'poor'; // 상태
  purchaseDate?: string;
}

// 영양제 메타데이터
export interface SupplementMetadata {
  dosage: string; // 복용량
  frequency: string; // 복용 빈도
  ingredients: string[];
  servingsPerContainer?: number; // 총 복용 횟수
  remainingServings?: number; // 남은 복용 횟수
}

// 식재료 메타데이터
export interface PantryMetadata {
  unit: string; // 단위 (g, ml, 개)
  quantity: number;
  storageType: 'refrigerator' | 'freezer' | 'room'; // 보관 방법
  purchaseDate?: string;
}

// 기본 인벤토리 아이템 (DB row)
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

// DB row to client 변환
export interface InventoryItemDB {
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

// 의류 아이템 (확장)
export interface ClothingItem extends Omit<InventoryItem, 'category' | 'metadata'> {
  category: 'closet';
  subCategory: ClothingCategory;
  metadata: ClothingMetadata;
}

// 저장된 코디 (DB row)
export interface SavedOutfit {
  id: string;
  clerkUserId: string;
  name: string | null;
  description: string | null;
  itemIds: string[];
  items?: ClothingItem[]; // 조인된 아이템 (조회 시)
  collageImageUrl: string | null;
  occasion: Occasion | null;
  season: Season[];
  weatherCondition: WeatherCondition | null;
  wearCount: number;
  lastWornAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// DB row to client 변환
export interface SavedOutfitDB {
  id: string;
  clerk_user_id: string;
  name: string | null;
  description: string | null;
  item_ids: string[];
  collage_image_url: string | null;
  occasion: Occasion | null;
  season: Season[];
  weather_condition: WeatherCondition | null;
  wear_count: number;
  last_worn_at: string | null;
  created_at: string;
  updated_at: string;
}

// API 요청/응답 타입

// 아이템 생성 요청
export interface CreateInventoryItemRequest {
  category: InventoryCategory;
  subCategory?: string;
  name: string;
  imageUrl: string;
  originalImageUrl?: string;
  brand?: string;
  tags?: string[];
  isFavorite?: boolean;
  expiryDate?: string;
  metadata?: Record<string, unknown>;
}

// 아이템 수정 요청
export interface UpdateInventoryItemRequest {
  name?: string;
  subCategory?: string;
  imageUrl?: string;
  brand?: string;
  tags?: string[];
  isFavorite?: boolean;
  expiryDate?: string;
  metadata?: Record<string, unknown>;
}

// 아이템 목록 조회 필터
export interface InventoryListFilter {
  category?: InventoryCategory;
  subCategory?: string;
  season?: Season;
  occasion?: Occasion;
  color?: string;
  isFavorite?: boolean;
  search?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'updatedAt' | 'useCount' | 'name';
  orderDir?: 'asc' | 'desc';
}

// 코디 생성 요청
export interface CreateOutfitRequest {
  name?: string;
  description?: string;
  itemIds: string[];
  collageImageUrl?: string;
  occasion?: Occasion;
  season?: Season[];
  weatherCondition?: WeatherCondition;
}

// 코디 수정 요청
export interface UpdateOutfitRequest {
  name?: string;
  description?: string;
  itemIds?: string[];
  collageImageUrl?: string;
  occasion?: Occasion;
  season?: Season[];
  weatherCondition?: WeatherCondition;
}

// 코디 추천 요청
export interface OutfitRecommendRequest {
  occasion?: Occasion;
  weather?: {
    temp: number;
    precipitation: number;
    uvi: number;
  };
  excludeItemIds?: string[];
  personalColor?: string; // 퍼스널컬러 톤
  bodyType?: string; // 체형 (S, W, N)
}

// 코디 추천 응답
export interface OutfitRecommendResponse {
  outfits: RecommendedOutfit[];
  missingItems: MissingItem[];
}

export interface RecommendedOutfit {
  items: ClothingItem[];
  reason: string;
  matchScore: number; // 0-100
}

export interface MissingItem {
  category: ClothingCategory;
  suggestion: string;
  reason: string;
}

// 옷장 통계
export interface ClosetStats {
  totalItems: number;
  categoryBreakdown: Record<ClothingCategory, number>;
  seasonBreakdown: Record<Season, number>;
  colorBreakdown: Record<string, number>;
  topWornItems: ClothingItem[];
  unwornItems: ClothingItem[]; // 3개월 이상 미착용
  avgCostPerWear: number;
}

// 변환 유틸리티
export function dbToClient(row: InventoryItemDB): InventoryItem {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    category: row.category,
    subCategory: row.sub_category,
    name: row.name,
    imageUrl: row.image_url,
    originalImageUrl: row.original_image_url,
    brand: row.brand,
    tags: row.tags,
    isFavorite: row.is_favorite,
    useCount: row.use_count,
    lastUsedAt: row.last_used_at,
    expiryDate: row.expiry_date,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function outfitDbToClient(row: SavedOutfitDB): SavedOutfit {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    name: row.name,
    description: row.description,
    itemIds: row.item_ids,
    collageImageUrl: row.collage_image_url,
    occasion: row.occasion,
    season: row.season as Season[],
    weatherCondition: row.weather_condition as WeatherCondition | null,
    wearCount: row.wear_count,
    lastWornAt: row.last_worn_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * InventoryItem을 ClothingItem으로 변환
 * closet 카테고리인 경우에만 사용
 */
export function toClothingItem(item: InventoryItem): ClothingItem {
  return {
    ...item,
    category: 'closet',
    subCategory: (item.subCategory || 'top') as ClothingCategory,
    metadata: {
      color: (item.metadata as Partial<ClothingMetadata>)?.color || [],
      season: (item.metadata as Partial<ClothingMetadata>)?.season || [],
      occasion: (item.metadata as Partial<ClothingMetadata>)?.occasion || [],
      pattern: (item.metadata as Partial<ClothingMetadata>)?.pattern,
      material: (item.metadata as Partial<ClothingMetadata>)?.material,
      size: (item.metadata as Partial<ClothingMetadata>)?.size,
      purchaseDate: (item.metadata as Partial<ClothingMetadata>)?.purchaseDate,
      price: (item.metadata as Partial<ClothingMetadata>)?.price,
    },
  };
}

/**
 * InventoryItem 배열을 ClothingItem 배열로 변환
 */
export function toClothingItems(items: InventoryItem[]): ClothingItem[] {
  return items.map(toClothingItem);
}

/**
 * metadata에서 ClothingMetadata로 안전하게 접근
 */
export function getClothingMetadata(
  metadata: Record<string, unknown>
): ClothingMetadata {
  const m = metadata as Partial<ClothingMetadata>;
  return {
    color: m.color || [],
    season: m.season || [],
    occasion: m.occasion || [],
    pattern: m.pattern,
    material: m.material,
    size: m.size,
    purchaseDate: m.purchaseDate,
    price: m.price,
  };
}
