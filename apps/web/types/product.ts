/**
 * Product DB v2 TypeScript 타입 정의
 * @description 화장품, 영양제, 운동기구, 건강식품 제품 타입
 * @version 2.0
 * @date 2025-12-04
 */

// ================================================
// 공통 타입
// ================================================

/** 가격대 */
export type PriceRange = 'budget' | 'mid' | 'premium';

// ================================================
// 화장품 (Cosmetic Products)
// ================================================

/** 화장품 카테고리 */
export type CosmeticCategory =
  // 스킨케어
  | 'cleanser' // 클렌저
  | 'toner' // 토너
  | 'serum' // 세럼
  | 'essence' // 에센스
  | 'moisturizer' // 수분크림
  | 'eye_cream' // 아이크림
  | 'sunscreen' // 선크림
  | 'mask' // 마스크팩
  // 메이크업
  | 'makeup' // 메이크업
  // 헤어케어 (H-1 모듈)
  | 'shampoo' // 샴푸
  | 'conditioner' // 컨디셔너/린스
  | 'hair-treatment' // 헤어 트리트먼트
  | 'scalp-care' // 두피 케어
  // 바디/기타
  | 'body_care' // 바디케어
  | 'lip_care' // 립케어
  | 'nail_care'; // 네일케어

/** 메이크업 서브카테고리 */
export type MakeupSubcategory =
  // 베이스
  | 'primer' // 프라이머
  | 'foundation' // 파운데이션
  | 'cushion' // 쿠션
  | 'concealer' // 컨실러
  | 'powder' // 파우더
  | 'setting-spray' // 세팅 스프레이
  // 컬러
  | 'blush' // 블러셔
  | 'contour' // 컨투어링
  | 'highlighter' // 하이라이터
  // 브로우
  | 'brow' // 브로우
  // 아이
  | 'eye' // 아이 (통합)
  | 'eyeshadow' // 아이섀도우
  | 'eyeliner' // 아이라이너
  | 'mascara' // 마스카라
  // 립
  | 'lip' // 립
  | 'lip-gloss' // 립글로스
  | 'lip-liner' // 립라이너
  // 기타
  | 'multi-palette' // 멀티 팔레트
  | 'brush'; // 브러시/도구

/** 피부 타입 */
export type SkinType = 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal';

/** 피부 고민 */
export type SkinConcern =
  | 'acne' // 여드름
  | 'aging' // 노화
  | 'whitening' // 미백
  | 'hydration' // 수분
  | 'pore' // 모공
  | 'redness'; // 홍조

/** 모발 타입 */
export type HairType = 'straight' | 'wavy' | 'curly' | 'coily';

/** 두피 타입 (SkinType 중 해당 값) */
export type ScalpType = 'dry' | 'oily' | 'sensitive' | 'normal';

/** 얼굴형 */
export type FaceShape = 'oval' | 'round' | 'square' | 'heart' | 'oblong';

/** 언더톤 */
export type Undertone = 'warm' | 'cool' | 'neutral';

/** 퍼스널 컬러 시즌 */
export type PersonalColorSeason = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

/** 화장품 제품 */
export interface CosmeticProduct {
  id: string;
  name: string;
  brand: string;
  category: CosmeticCategory;
  subcategory?: MakeupSubcategory | string;
  priceRange?: PriceRange;
  priceKrw?: number;

  // 피부 타입 적합도
  skinTypes?: SkinType[];
  concerns?: SkinConcern[];

  // 성분 정보
  keyIngredients?: string[];
  avoidIngredients?: string[];

  // 퍼스널 컬러 (메이크업용)
  personalColorSeasons?: PersonalColorSeason[];

  // 헤어케어 매칭 (H-1)
  hairTypes?: HairType[]; // 적합 모발 타입
  scalpTypes?: ScalpType[]; // 적합 두피 타입

  // 메이크업 매칭 (M-1)
  faceShapes?: FaceShape[]; // 적합 얼굴형
  undertones?: Undertone[]; // 적합 언더톤

  // 메타데이터
  imageUrl?: string;
  purchaseUrl?: string;
  affiliateUrl?: string;
  affiliateCommission?: number;
  rating?: number;
  reviewCount?: number;
  isActive?: boolean;

  createdAt?: string;
  updatedAt?: string;
}

/** 화장품 생성 입력 (id, timestamps 제외) */
export type CosmeticProductInput = Omit<CosmeticProduct, 'id' | 'createdAt' | 'updatedAt'>;

/** 화장품 필터 옵션 */
export interface CosmeticProductFilter {
  category?: CosmeticCategory;
  subcategory?: string;
  brand?: string;
  skinTypes?: SkinType[];
  concerns?: SkinConcern[];
  personalColorSeasons?: PersonalColorSeason[];
  hairTypes?: HairType[];
  scalpTypes?: ScalpType[];
  faceShapes?: FaceShape[];
  undertones?: Undertone[];
  priceRange?: PriceRange;
  minRating?: number;
}

// ================================================
// 영양제 (Supplement Products)
// ================================================

/** 영양제 카테고리 */
export type SupplementCategory =
  | 'vitamin' // 비타민
  | 'mineral' // 미네랄
  | 'protein' // 프로틴
  | 'omega' // 오메가
  | 'probiotic' // 프로바이오틱스
  | 'collagen' // 콜라겐
  | 'other'; // 기타

/** 영양제 효능 */
export type SupplementBenefit =
  | 'skin' // 피부
  | 'hair' // 모발
  | 'energy' // 에너지
  | 'immunity' // 면역
  | 'digestion' // 소화
  | 'sleep' // 수면
  | 'muscle' // 근육
  | 'bone'; // 뼈

/** 영양제 성분 */
export interface SupplementIngredient {
  name: string;
  amount: number;
  unit: string; // mg, g, IU, mcg, etc.
}

/** 영양제 제품 */
export interface SupplementProduct {
  id: string;
  name: string;
  brand: string;
  category: SupplementCategory;

  // 효능
  benefits?: SupplementBenefit[];

  // 성분 정보
  mainIngredients?: SupplementIngredient[];

  // 권장 대상
  targetConcerns?: string[];

  // 메타데이터
  priceKrw?: number;
  dosage?: string; // 예: '1일 1정'
  servingSize?: number; // 1회 섭취량
  totalServings?: number; // 총 제공량
  imageUrl?: string;
  purchaseUrl?: string;
  affiliateUrl?: string;
  affiliateCommission?: number;
  rating?: number;
  reviewCount?: number;

  // 주의사항
  warnings?: string[];

  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** 영양제 생성 입력 */
export type SupplementProductInput = Omit<SupplementProduct, 'id' | 'createdAt' | 'updatedAt'>;

/** 영양제 필터 옵션 */
export interface SupplementProductFilter {
  category?: SupplementCategory;
  brand?: string;
  benefits?: SupplementBenefit[];
  targetConcerns?: string[];
  maxPrice?: number;
  minRating?: number;
}

// ================================================
// Supabase 응답 변환 유틸리티 타입
// ================================================

/** Supabase cosmetic_products 테이블 row */
export interface CosmeticProductRow {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string | null;
  price_range: string | null;
  price_krw: number | null;
  skin_types: string[] | null;
  concerns: string[] | null;
  key_ingredients: string[] | null;
  avoid_ingredients: string[] | null;
  personal_color_seasons: string[] | null;
  hair_types: string[] | null;
  scalp_types: string[] | null;
  face_shapes: string[] | null;
  undertones: string[] | null;
  image_url: string | null;
  purchase_url: string | null;
  affiliate_url: string | null;
  affiliate_commission: number | null;
  rating: number | null;
  review_count: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Supabase supplement_products 테이블 row */
export interface SupplementProductRow {
  id: string;
  name: string;
  brand: string;
  category: string;
  benefits: string[] | null;
  main_ingredients: SupplementIngredient[] | null;
  target_concerns: string[] | null;
  price_krw: number | null;
  dosage: string | null;
  serving_size: number | null;
  total_servings: number | null;
  image_url: string | null;
  purchase_url: string | null;
  affiliate_url: string | null;
  affiliate_commission: number | null;
  rating: number | null;
  review_count: number | null;
  warnings: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ================================================
// 변환 함수 타입
// ================================================

/** DB row → 프론트엔드 타입 변환 */
export function toCosmeticProduct(row: CosmeticProductRow): CosmeticProduct {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category as CosmeticCategory,
    subcategory: row.subcategory ?? undefined,
    priceRange: row.price_range as PriceRange | undefined,
    priceKrw: row.price_krw ?? undefined,
    skinTypes: row.skin_types as SkinType[] | undefined,
    concerns: row.concerns as SkinConcern[] | undefined,
    keyIngredients: row.key_ingredients ?? undefined,
    avoidIngredients: row.avoid_ingredients ?? undefined,
    personalColorSeasons: row.personal_color_seasons as PersonalColorSeason[] | undefined,
    hairTypes: row.hair_types as HairType[] | undefined,
    scalpTypes: row.scalp_types as ScalpType[] | undefined,
    faceShapes: row.face_shapes as FaceShape[] | undefined,
    undertones: row.undertones as Undertone[] | undefined,
    imageUrl: row.image_url ?? undefined,
    purchaseUrl: row.purchase_url ?? undefined,
    affiliateUrl: row.affiliate_url ?? undefined,
    affiliateCommission: row.affiliate_commission ?? undefined,
    rating: row.rating ?? undefined,
    reviewCount: row.review_count ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** DB row → 프론트엔드 타입 변환 */
export function toSupplementProduct(row: SupplementProductRow): SupplementProduct {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category as SupplementCategory,
    benefits: row.benefits as SupplementBenefit[] | undefined,
    mainIngredients: row.main_ingredients ?? undefined,
    targetConcerns: row.target_concerns ?? undefined,
    priceKrw: row.price_krw ?? undefined,
    dosage: row.dosage ?? undefined,
    servingSize: row.serving_size ?? undefined,
    totalServings: row.total_servings ?? undefined,
    imageUrl: row.image_url ?? undefined,
    purchaseUrl: row.purchase_url ?? undefined,
    affiliateUrl: row.affiliate_url ?? undefined,
    affiliateCommission: row.affiliate_commission ?? undefined,
    rating: row.rating ?? undefined,
    reviewCount: row.review_count ?? undefined,
    warnings: row.warnings ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ================================================
// 운동 기구 (Workout Equipment) - v2
// ================================================

/** 운동 기구 카테고리 */
export type WorkoutEquipmentCategory =
  | 'dumbbell' // 덤벨
  | 'barbell' // 바벨
  | 'kettlebell' // 케틀벨
  | 'resistance_band' // 저항 밴드
  | 'pull_up_bar' // 풀업바/치닝바
  | 'yoga_mat' // 요가매트
  | 'foam_roller' // 폼롤러
  | 'jump_rope' // 줄넘기
  | 'ab_roller' // 복근 롤러
  | 'bench' // 벤치
  | 'rack' // 랙/스쿼트랙
  | 'cardio' // 유산소 기구
  | 'accessory' // 액세서리
  | 'wearable' // 웨어러블
  | 'other'; // 기타

/** 타겟 근육군 */
export type TargetMuscle =
  | 'chest' // 가슴
  | 'back' // 등
  | 'shoulders' // 어깨
  | 'arms' // 팔
  | 'legs' // 다리
  | 'core' // 코어
  | 'full_body'; // 전신

/** 운동 타입 */
export type ExerciseType =
  | 'strength' // 근력
  | 'cardio' // 유산소
  | 'flexibility' // 유연성
  | 'balance' // 균형
  | 'plyometric'; // 플라이오메트릭

/** 스킬 레벨 */
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'all';

/** 사용 장소 */
export type UseLocation = 'home' | 'gym' | 'outdoor' | 'all';

/** 운동 기구 제품 */
export interface WorkoutEquipment {
  id: string;
  name: string;
  brand: string;
  category: WorkoutEquipmentCategory;
  subcategory?: string;

  // 가격 정보
  priceKrw?: number;
  priceRange?: PriceRange;

  // 제품 스펙
  weightKg?: number;
  weightRange?: string;
  material?: string;
  size?: string;
  colorOptions?: string[];

  // 용도
  targetMuscles?: TargetMuscle[];
  exerciseTypes?: ExerciseType[];
  skillLevel?: SkillLevel;
  useLocation?: UseLocation;

  // 메타데이터
  imageUrl?: string;
  purchaseUrl?: string;
  affiliateUrl?: string;
  affiliateCommission?: number;
  rating?: number;
  reviewCount?: number;

  // 특징
  features?: string[];
  pros?: string[];
  cons?: string[];

  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** 운동 기구 생성 입력 */
export type WorkoutEquipmentInput = Omit<WorkoutEquipment, 'id' | 'createdAt' | 'updatedAt'>;

/** 운동 기구 필터 옵션 */
export interface WorkoutEquipmentFilter {
  category?: WorkoutEquipmentCategory;
  brand?: string;
  targetMuscles?: TargetMuscle[];
  exerciseTypes?: ExerciseType[];
  skillLevel?: SkillLevel;
  useLocation?: UseLocation;
  priceRange?: PriceRange;
  maxPrice?: number;
  minRating?: number;
}

/** Supabase workout_equipment 테이블 row */
export interface WorkoutEquipmentRow {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string | null;
  price_krw: number | null;
  price_range: string | null;
  weight_kg: number | null;
  weight_range: string | null;
  material: string | null;
  size: string | null;
  color_options: string[] | null;
  target_muscles: string[] | null;
  exercise_types: string[] | null;
  skill_level: string | null;
  use_location: string | null;
  image_url: string | null;
  purchase_url: string | null;
  affiliate_url: string | null;
  affiliate_commission: number | null;
  rating: number | null;
  review_count: number | null;
  features: string[] | null;
  pros: string[] | null;
  cons: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** DB row → 프론트엔드 타입 변환 */
export function toWorkoutEquipment(row: WorkoutEquipmentRow): WorkoutEquipment {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category as WorkoutEquipmentCategory,
    subcategory: row.subcategory ?? undefined,
    priceKrw: row.price_krw ?? undefined,
    priceRange: row.price_range as PriceRange | undefined,
    weightKg: row.weight_kg ?? undefined,
    weightRange: row.weight_range ?? undefined,
    material: row.material ?? undefined,
    size: row.size ?? undefined,
    colorOptions: row.color_options ?? undefined,
    targetMuscles: row.target_muscles as TargetMuscle[] | undefined,
    exerciseTypes: row.exercise_types as ExerciseType[] | undefined,
    skillLevel: row.skill_level as SkillLevel | undefined,
    useLocation: row.use_location as UseLocation | undefined,
    imageUrl: row.image_url ?? undefined,
    purchaseUrl: row.purchase_url ?? undefined,
    affiliateUrl: row.affiliate_url ?? undefined,
    affiliateCommission: row.affiliate_commission ?? undefined,
    rating: row.rating ?? undefined,
    reviewCount: row.review_count ?? undefined,
    features: row.features ?? undefined,
    pros: row.pros ?? undefined,
    cons: row.cons ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ================================================
// 건강식품 (Health Foods) - v2
// ================================================

/** 건강식품 카테고리 */
export type HealthFoodCategory =
  | 'protein_powder' // 프로틴 파우더
  | 'protein_bar' // 프로틴 바
  | 'meal_replacement' // 식사 대용식
  | 'energy_drink' // 에너지 음료
  | 'sports_drink' // 스포츠 음료
  | 'bcaa' // BCAA/아미노산
  | 'creatine' // 크레아틴
  | 'pre_workout' // 프리워크아웃
  | 'post_workout' // 포스트워크아웃
  | 'diet_food' // 다이어트 식품
  | 'healthy_snack' // 건강 스낵
  | 'superfood' // 슈퍼푸드
  | 'functional_food' // 기능성 식품
  | 'other'; // 기타

/** 식이 정보 */
export type DietaryInfo =
  | 'vegan'
  | 'vegetarian'
  | 'gluten_free'
  | 'lactose_free'
  | 'keto'
  | 'sugar_free'
  | 'organic'
  | 'non_gmo';

/** 건강식품 효능 */
export type HealthFoodBenefit =
  | 'muscle_gain' // 근육 증가
  | 'weight_loss' // 체중 감량
  | 'energy' // 에너지
  | 'recovery' // 회복
  | 'endurance' // 지구력
  | 'hydration' // 수분 공급
  | 'focus'; // 집중력

/** 섭취 시간 */
export type BestTime = 'pre_workout' | 'post_workout' | 'morning' | 'anytime';

/** 타겟 사용자 */
export type TargetUser = 'athletes' | 'beginners' | 'weight_loss' | 'muscle_gain' | 'general';

/** 추가 영양 성분 */
export interface AdditionalNutrient {
  name: string;
  amount: number;
  unit: string;
  dailyValuePercent?: number;
}

/** 건강식품 제품 */
export interface HealthFood {
  id: string;
  name: string;
  brand: string;
  category: HealthFoodCategory;
  subcategory?: string;

  // 가격 정보
  priceKrw?: number;
  pricePerServing?: number;

  // 영양 정보
  servingSize?: string;
  servingsPerContainer?: number;
  caloriesPerServing?: number;
  proteinG?: number;
  carbsG?: number;
  sugarG?: number;
  fatG?: number;
  fiberG?: number;
  sodiumMg?: number;
  additionalNutrients?: AdditionalNutrient[];

  // 특성
  flavorOptions?: string[];
  dietaryInfo?: DietaryInfo[];
  allergens?: string[];

  // 용도
  benefits?: HealthFoodBenefit[];
  bestTime?: BestTime;
  targetUsers?: TargetUser[];

  // 메타데이터
  imageUrl?: string;
  purchaseUrl?: string;
  affiliateUrl?: string;
  affiliateCommission?: number;
  rating?: number;
  reviewCount?: number;

  // 특징
  features?: string[];
  tasteRating?: number;
  mixabilityRating?: number;

  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** 건강식품 생성 입력 */
export type HealthFoodInput = Omit<HealthFood, 'id' | 'createdAt' | 'updatedAt'>;

/** 건강식품 필터 옵션 */
export interface HealthFoodFilter {
  category?: HealthFoodCategory;
  brand?: string;
  benefits?: HealthFoodBenefit[];
  dietaryInfo?: DietaryInfo[];
  targetUsers?: TargetUser[];
  maxPrice?: number;
  maxCalories?: number;
  minProtein?: number;
  minRating?: number;
}

/** Supabase health_foods 테이블 row */
export interface HealthFoodRow {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string | null;
  price_krw: number | null;
  price_per_serving: number | null;
  serving_size: string | null;
  servings_per_container: number | null;
  calories_per_serving: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  sugar_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sodium_mg: number | null;
  additional_nutrients: AdditionalNutrient[] | null;
  flavor_options: string[] | null;
  dietary_info: string[] | null;
  allergens: string[] | null;
  benefits: string[] | null;
  best_time: string | null;
  target_users: string[] | null;
  image_url: string | null;
  purchase_url: string | null;
  affiliate_url: string | null;
  affiliate_commission: number | null;
  rating: number | null;
  review_count: number | null;
  features: string[] | null;
  taste_rating: number | null;
  mixability_rating: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** DB row → 프론트엔드 타입 변환 */
export function toHealthFood(row: HealthFoodRow): HealthFood {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category as HealthFoodCategory,
    subcategory: row.subcategory ?? undefined,
    priceKrw: row.price_krw ?? undefined,
    pricePerServing: row.price_per_serving ?? undefined,
    servingSize: row.serving_size ?? undefined,
    servingsPerContainer: row.servings_per_container ?? undefined,
    caloriesPerServing: row.calories_per_serving ?? undefined,
    proteinG: row.protein_g ?? undefined,
    carbsG: row.carbs_g ?? undefined,
    sugarG: row.sugar_g ?? undefined,
    fatG: row.fat_g ?? undefined,
    fiberG: row.fiber_g ?? undefined,
    sodiumMg: row.sodium_mg ?? undefined,
    additionalNutrients: row.additional_nutrients ?? undefined,
    flavorOptions: row.flavor_options ?? undefined,
    dietaryInfo: row.dietary_info as DietaryInfo[] | undefined,
    allergens: row.allergens ?? undefined,
    benefits: row.benefits as HealthFoodBenefit[] | undefined,
    bestTime: row.best_time as BestTime | undefined,
    targetUsers: row.target_users as TargetUser[] | undefined,
    imageUrl: row.image_url ?? undefined,
    purchaseUrl: row.purchase_url ?? undefined,
    affiliateUrl: row.affiliate_url ?? undefined,
    affiliateCommission: row.affiliate_commission ?? undefined,
    rating: row.rating ?? undefined,
    reviewCount: row.review_count ?? undefined,
    features: row.features ?? undefined,
    tasteRating: row.taste_rating ?? undefined,
    mixabilityRating: row.mixability_rating ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ================================================
// 가격 히스토리 - v2
// ================================================

/** 제품 타입 */
export type ProductType = 'cosmetic' | 'supplement' | 'workout_equipment' | 'health_food';

/** 가격 히스토리 */
export interface ProductPriceHistory {
  id: string;
  productType: ProductType;
  productId: string;
  priceKrw: number;
  source?: string;
  recordedAt: string;
}

/** 가격 히스토리 입력 */
export interface ProductPriceHistoryInput {
  productType: ProductType;
  productId: string;
  priceKrw: number;
  source?: string;
}

// ================================================
// Product UI - 개인화 매칭 타입 (P-1)
// ================================================

/** 매칭 사유 타입 */
export type MatchReasonType =
  | 'skinType'
  | 'concern'
  | 'personalColor'
  | 'goal'
  | 'rating'
  | 'price' // 가격 접근성
  | 'brand' // 대중 브랜드
  | 'popularity' // 리뷰 인기도
  | 'hairType' // 모발 타입 매칭 (H-1)
  | 'scalpType' // 두피 타입 매칭 (H-1)
  | 'undertone' // 언더톤 매칭 (M-1)
  | 'faceShape'; // 얼굴형 매칭 (M-1)

/** 매칭 사유 */
export interface MatchReason {
  type: MatchReasonType;
  label: string;
  matched: boolean;
}

/** 개인화 매칭 결과를 포함한 제품 */
export interface ProductWithMatch<T> {
  product: T;
  matchScore: number; // 0-100
  matchReasons: MatchReason[];
}

/** 정렬 옵션 */
export type ProductSortBy =
  | 'recommended'
  | 'popular'
  | 'priceAsc'
  | 'priceDesc'
  | 'rating'
  | 'newest';

/** 통합 검색/정렬 옵션 */
export interface ProductSearchOptions {
  search?: string;
  sortBy?: ProductSortBy;
  page?: number;
  limit?: number;
}

/** 제품 카테고리 (UI 탭용) */
export type ProductCategory =
  | 'all'
  | 'skincare'
  | 'makeup'
  | 'haircare'
  | 'supplement'
  | 'equipment'
  | 'healthfood';

/** 제품 카테고리 정보 */
export interface ProductCategoryInfo {
  id: ProductCategory;
  label: string;
  description?: string;
}

/** 통합 제품 타입 (유니온) */
export type AnyProduct = CosmeticProduct | SupplementProduct | WorkoutEquipment | HealthFood;
