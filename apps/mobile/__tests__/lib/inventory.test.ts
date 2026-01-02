/**
 * 인벤토리 모듈 테스트
 * 순수 타입, 상수, 변환 함수만 테스트 (훅 제외)
 */

import {
  // 타입
  type InventoryCategory,
  type ClothingCategory,
  type Season,
  type Occasion,
  type Pattern,
  type Material,
  type InventoryItem,
  type ClothingItem,
  type SavedOutfit,
  type InventoryItemRow,
  type SavedOutfitRow,
  type ClothingMetadata,
  // 상수
  CATEGORY_LABELS,
  CLOTHING_CATEGORY_LABELS,
  SEASON_LABELS,
  OCCASION_LABELS,
  PATTERN_LABELS,
  MATERIAL_LABELS,
  CLOTHING_SUB_CATEGORIES,
  // 함수
  rowToInventoryItem,
  rowToSavedOutfit,
  toClothingItem,
  toClothingItems,
} from '../../lib/inventory/types';

// ============================================================
// 타입 테스트
// ============================================================

describe('InventoryCategory 타입', () => {
  it('모든 카테고리 값이 유효해야 함', () => {
    const categories: InventoryCategory[] = [
      'closet',
      'beauty',
      'equipment',
      'supplement',
      'pantry',
    ];

    expect(categories).toHaveLength(5);
    categories.forEach((cat) => {
      expect(CATEGORY_LABELS[cat]).toBeDefined();
    });
  });
});

describe('ClothingCategory 타입', () => {
  it('모든 의류 카테고리 값이 유효해야 함', () => {
    const categories: ClothingCategory[] = [
      'outer',
      'top',
      'bottom',
      'dress',
      'shoes',
      'bag',
      'accessory',
    ];

    expect(categories).toHaveLength(7);
    categories.forEach((cat) => {
      expect(CLOTHING_CATEGORY_LABELS[cat]).toBeDefined();
    });
  });
});

describe('Season 타입', () => {
  it('모든 시즌 값이 유효해야 함', () => {
    const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];

    expect(seasons).toHaveLength(4);
    seasons.forEach((season) => {
      expect(SEASON_LABELS[season]).toBeDefined();
    });
  });
});

describe('Occasion 타입', () => {
  it('모든 상황 값이 유효해야 함', () => {
    const occasions: Occasion[] = [
      'casual',
      'formal',
      'workout',
      'date',
      'travel',
    ];

    expect(occasions).toHaveLength(5);
    occasions.forEach((occasion) => {
      expect(OCCASION_LABELS[occasion]).toBeDefined();
    });
  });
});

describe('Pattern 타입', () => {
  it('모든 패턴 값이 유효해야 함', () => {
    const patterns: Pattern[] = [
      'solid',
      'stripe',
      'check',
      'floral',
      'dot',
      'geometric',
      'animal',
      'abstract',
    ];

    expect(patterns).toHaveLength(8);
    patterns.forEach((pattern) => {
      expect(PATTERN_LABELS[pattern]).toBeDefined();
    });
  });
});

describe('Material 타입', () => {
  it('모든 소재 값이 유효해야 함', () => {
    const materials: Material[] = [
      'cotton',
      'wool',
      'polyester',
      'linen',
      'silk',
      'denim',
      'leather',
      'synthetic',
    ];

    expect(materials).toHaveLength(8);
    materials.forEach((material) => {
      expect(MATERIAL_LABELS[material]).toBeDefined();
    });
  });
});

// ============================================================
// 상수 테스트
// ============================================================

describe('CATEGORY_LABELS', () => {
  it('모든 카테고리에 한글 라벨이 있어야 함', () => {
    expect(CATEGORY_LABELS.closet).toBe('내 옷장');
    expect(CATEGORY_LABELS.beauty).toBe('내 화장대');
    expect(CATEGORY_LABELS.equipment).toBe('내 운동장비');
    expect(CATEGORY_LABELS.supplement).toBe('내 영양제');
    expect(CATEGORY_LABELS.pantry).toBe('내 냉장고');
  });
});

describe('CLOTHING_CATEGORY_LABELS', () => {
  it('모든 의류 카테고리에 한글 라벨이 있어야 함', () => {
    expect(CLOTHING_CATEGORY_LABELS.outer).toBe('아우터');
    expect(CLOTHING_CATEGORY_LABELS.top).toBe('상의');
    expect(CLOTHING_CATEGORY_LABELS.bottom).toBe('하의');
    expect(CLOTHING_CATEGORY_LABELS.dress).toBe('원피스');
    expect(CLOTHING_CATEGORY_LABELS.shoes).toBe('신발');
    expect(CLOTHING_CATEGORY_LABELS.bag).toBe('가방');
    expect(CLOTHING_CATEGORY_LABELS.accessory).toBe('액세서리');
  });
});

describe('SEASON_LABELS', () => {
  it('모든 시즌에 한글 라벨이 있어야 함', () => {
    expect(SEASON_LABELS.spring).toBe('봄');
    expect(SEASON_LABELS.summer).toBe('여름');
    expect(SEASON_LABELS.autumn).toBe('가을');
    expect(SEASON_LABELS.winter).toBe('겨울');
  });
});

describe('OCCASION_LABELS', () => {
  it('모든 상황에 한글 라벨이 있어야 함', () => {
    expect(OCCASION_LABELS.casual).toBe('캐주얼');
    expect(OCCASION_LABELS.formal).toBe('포멀');
    expect(OCCASION_LABELS.workout).toBe('운동');
    expect(OCCASION_LABELS.date).toBe('데이트');
    expect(OCCASION_LABELS.travel).toBe('여행');
  });
});

describe('PATTERN_LABELS', () => {
  it('모든 패턴에 한글 라벨이 있어야 함', () => {
    expect(PATTERN_LABELS.solid).toBe('무지');
    expect(PATTERN_LABELS.stripe).toBe('스트라이프');
    expect(PATTERN_LABELS.check).toBe('체크');
    expect(PATTERN_LABELS.floral).toBe('플로럴');
    expect(PATTERN_LABELS.dot).toBe('도트');
    expect(PATTERN_LABELS.geometric).toBe('기하학');
    expect(PATTERN_LABELS.animal).toBe('애니멀');
    expect(PATTERN_LABELS.abstract).toBe('추상');
  });
});

describe('MATERIAL_LABELS', () => {
  it('모든 소재에 한글 라벨이 있어야 함', () => {
    expect(MATERIAL_LABELS.cotton).toBe('면');
    expect(MATERIAL_LABELS.wool).toBe('울');
    expect(MATERIAL_LABELS.polyester).toBe('폴리에스터');
    expect(MATERIAL_LABELS.linen).toBe('린넨');
    expect(MATERIAL_LABELS.silk).toBe('실크');
    expect(MATERIAL_LABELS.denim).toBe('데님');
    expect(MATERIAL_LABELS.leather).toBe('가죽');
    expect(MATERIAL_LABELS.synthetic).toBe('합성');
  });
});

describe('CLOTHING_SUB_CATEGORIES', () => {
  it('모든 카테고리에 서브카테고리가 있어야 함', () => {
    expect(CLOTHING_SUB_CATEGORIES.outer).toContain('코트');
    expect(CLOTHING_SUB_CATEGORIES.top).toContain('티셔츠');
    expect(CLOTHING_SUB_CATEGORIES.bottom).toContain('청바지');
    expect(CLOTHING_SUB_CATEGORIES.dress).toContain('원피스');
    expect(CLOTHING_SUB_CATEGORIES.shoes).toContain('스니커즈');
    expect(CLOTHING_SUB_CATEGORIES.bag).toContain('백팩');
    expect(CLOTHING_SUB_CATEGORIES.accessory).toContain('모자');
  });

  it('서브카테고리가 비어있지 않아야 함', () => {
    Object.values(CLOTHING_SUB_CATEGORIES).forEach((subCategories) => {
      expect(subCategories.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================
// 변환 함수 테스트
// ============================================================

describe('rowToInventoryItem', () => {
  const mockRow: InventoryItemRow = {
    id: 'item-123',
    clerk_user_id: 'user-456',
    category: 'closet',
    sub_category: 'top',
    name: '흰색 티셔츠',
    image_url: 'https://example.com/image.jpg',
    original_image_url: 'https://example.com/original.jpg',
    brand: '나이키',
    tags: ['캐주얼', '여름'],
    is_favorite: true,
    use_count: 5,
    last_used_at: '2024-01-01T00:00:00Z',
    expiry_date: null,
    metadata: { color: ['white'], season: ['summer'] },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  };

  it('DB Row를 InventoryItem으로 변환해야 함', () => {
    const item = rowToInventoryItem(mockRow);

    expect(item.id).toBe('item-123');
    expect(item.clerkUserId).toBe('user-456');
    expect(item.category).toBe('closet');
    expect(item.subCategory).toBe('top');
    expect(item.name).toBe('흰색 티셔츠');
    expect(item.imageUrl).toBe('https://example.com/image.jpg');
    expect(item.brand).toBe('나이키');
    expect(item.tags).toEqual(['캐주얼', '여름']);
    expect(item.isFavorite).toBe(true);
    expect(item.useCount).toBe(5);
  });

  it('null 값을 올바르게 처리해야 함', () => {
    const rowWithNulls: InventoryItemRow = {
      ...mockRow,
      tags: null as unknown as string[],
      metadata: null as unknown as Record<string, unknown>,
    };

    const item = rowToInventoryItem(rowWithNulls);

    expect(item.tags).toEqual([]);
    expect(item.metadata).toEqual({});
  });
});

describe('rowToSavedOutfit', () => {
  const mockRow: SavedOutfitRow = {
    id: 'outfit-123',
    clerk_user_id: 'user-456',
    name: '출근 룩',
    description: '월요일 출근용',
    item_ids: ['item-1', 'item-2', 'item-3'],
    collage_image_url: 'https://example.com/collage.jpg',
    occasion: 'formal',
    season: ['spring', 'autumn'],
    wear_count: 10,
    last_worn_at: '2024-01-15T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-16T00:00:00Z',
  };

  it('DB Row를 SavedOutfit으로 변환해야 함', () => {
    const outfit = rowToSavedOutfit(mockRow);

    expect(outfit.id).toBe('outfit-123');
    expect(outfit.clerkUserId).toBe('user-456');
    expect(outfit.name).toBe('출근 룩');
    expect(outfit.itemIds).toEqual(['item-1', 'item-2', 'item-3']);
    expect(outfit.occasion).toBe('formal');
    expect(outfit.season).toEqual(['spring', 'autumn']);
    expect(outfit.wearCount).toBe(10);
  });

  it('null 값을 올바르게 처리해야 함', () => {
    const rowWithNulls: SavedOutfitRow = {
      ...mockRow,
      item_ids: null as unknown as string[],
      season: null as unknown as string[],
    };

    const outfit = rowToSavedOutfit(rowWithNulls);

    expect(outfit.itemIds).toEqual([]);
    expect(outfit.season).toEqual([]);
  });
});

describe('toClothingItem', () => {
  const mockInventoryItem: InventoryItem = {
    id: 'item-123',
    clerkUserId: 'user-456',
    category: 'closet',
    subCategory: 'top',
    name: '흰색 티셔츠',
    imageUrl: 'https://example.com/image.jpg',
    originalImageUrl: null,
    brand: '나이키',
    tags: [],
    isFavorite: false,
    useCount: 0,
    lastUsedAt: null,
    expiryDate: null,
    metadata: {
      color: ['white'],
      pattern: 'solid',
      material: 'cotton',
      season: ['summer'],
      occasion: ['casual'],
      size: 'M',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  it('InventoryItem을 ClothingItem으로 변환해야 함', () => {
    const clothingItem = toClothingItem(mockInventoryItem);

    expect(clothingItem.category).toBe('closet');
    expect(clothingItem.subCategory).toBe('top');
    expect(clothingItem.metadata.color).toEqual(['white']);
    expect(clothingItem.metadata.pattern).toBe('solid');
    expect(clothingItem.metadata.material).toBe('cotton');
    expect(clothingItem.metadata.season).toEqual(['summer']);
    expect(clothingItem.metadata.occasion).toEqual(['casual']);
    expect(clothingItem.metadata.size).toBe('M');
  });

  it('메타데이터가 없어도 기본값으로 변환해야 함', () => {
    const itemWithoutMetadata: InventoryItem = {
      ...mockInventoryItem,
      metadata: {},
    };

    const clothingItem = toClothingItem(itemWithoutMetadata);

    expect(clothingItem.metadata.color).toEqual([]);
    expect(clothingItem.metadata.season).toEqual([]);
    expect(clothingItem.metadata.occasion).toEqual([]);
  });

  it('subCategory가 없으면 top으로 기본 설정해야 함', () => {
    const itemWithoutSubCategory: InventoryItem = {
      ...mockInventoryItem,
      subCategory: null,
    };

    const clothingItem = toClothingItem(itemWithoutSubCategory);

    expect(clothingItem.subCategory).toBe('top');
  });
});

describe('toClothingItems', () => {
  const mockItems: InventoryItem[] = [
    {
      id: 'item-1',
      clerkUserId: 'user-456',
      category: 'closet',
      subCategory: 'top',
      name: '티셔츠',
      imageUrl: '',
      originalImageUrl: null,
      brand: null,
      tags: [],
      isFavorite: false,
      useCount: 0,
      lastUsedAt: null,
      expiryDate: null,
      metadata: {},
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'item-2',
      clerkUserId: 'user-456',
      category: 'beauty',
      subCategory: null,
      name: '립스틱',
      imageUrl: '',
      originalImageUrl: null,
      brand: null,
      tags: [],
      isFavorite: false,
      useCount: 0,
      lastUsedAt: null,
      expiryDate: null,
      metadata: {},
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'item-3',
      clerkUserId: 'user-456',
      category: 'closet',
      subCategory: 'bottom',
      name: '청바지',
      imageUrl: '',
      originalImageUrl: null,
      brand: null,
      tags: [],
      isFavorite: false,
      useCount: 0,
      lastUsedAt: null,
      expiryDate: null,
      metadata: {},
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  it('closet 카테고리만 필터링하여 ClothingItem으로 변환해야 함', () => {
    const clothingItems = toClothingItems(mockItems);

    expect(clothingItems).toHaveLength(2);
    expect(clothingItems[0].id).toBe('item-1');
    expect(clothingItems[1].id).toBe('item-3');
  });

  it('closet 아이템이 없으면 빈 배열을 반환해야 함', () => {
    const nonClosetItems: InventoryItem[] = [
      { ...mockItems[1] }, // beauty
    ];

    const clothingItems = toClothingItems(nonClosetItems);

    expect(clothingItems).toHaveLength(0);
  });
});

// ============================================================
// 인터페이스 구조 테스트
// ============================================================

describe('InventoryItem 인터페이스', () => {
  it('필수 필드를 포함해야 함', () => {
    const item: InventoryItem = {
      id: 'test-id',
      clerkUserId: 'test-user',
      category: 'closet',
      subCategory: 'top',
      name: '테스트 아이템',
      imageUrl: 'https://example.com/image.jpg',
      originalImageUrl: null,
      brand: null,
      tags: [],
      isFavorite: false,
      useCount: 0,
      lastUsedAt: null,
      expiryDate: null,
      metadata: {},
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    expect(item.id).toBeDefined();
    expect(item.clerkUserId).toBeDefined();
    expect(item.category).toBeDefined();
    expect(item.name).toBeDefined();
    expect(item.imageUrl).toBeDefined();
  });
});

describe('ClothingMetadata 인터페이스', () => {
  it('의류 메타데이터 구조가 올바라야 함', () => {
    const metadata: ClothingMetadata = {
      color: ['black', 'white'],
      pattern: 'stripe',
      material: 'cotton',
      season: ['spring', 'autumn'],
      occasion: ['casual', 'date'],
      size: 'M',
      purchaseDate: '2024-01-01',
      price: 50000,
    };

    expect(metadata.color).toContain('black');
    expect(metadata.pattern).toBe('stripe');
    expect(metadata.material).toBe('cotton');
    expect(metadata.season).toContain('spring');
    expect(metadata.occasion).toContain('casual');
  });
});

describe('SavedOutfit 인터페이스', () => {
  it('저장된 코디 구조가 올바라야 함', () => {
    const outfit: SavedOutfit = {
      id: 'outfit-123',
      clerkUserId: 'user-456',
      name: '데일리 룩',
      description: '편한 데일리 코디',
      itemIds: ['item-1', 'item-2'],
      collageImageUrl: null,
      occasion: 'casual',
      season: ['spring', 'summer'],
      wearCount: 5,
      lastWornAt: '2024-01-15T00:00:00Z',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
    };

    expect(outfit.id).toBeDefined();
    expect(outfit.itemIds).toHaveLength(2);
    expect(outfit.occasion).toBe('casual');
    expect(outfit.wearCount).toBe(5);
  });
});
