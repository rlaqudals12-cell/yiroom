/**
 * N-1 영양/식단 모듈 타입 정의
 */

// 퍼스널 컬러 시즌 (PC-1 연동)
export type PersonalColorSeason = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

// 체형 타입 (C-1 연동)
export type BodyType = 'X' | 'A' | 'V' | 'H' | 'O' | 'Y' | 'I' | '8';

// 성별
export type Gender = 'male' | 'female';

// 활동 수준
export type ActivityLevel =
  | 'sedentary'    // 비활동적 (1.2)
  | 'light'        // 가벼운 활동 (1.375)
  | 'moderate'     // 보통 활동 (1.55)
  | 'active'       // 활동적 (1.725)
  | 'very_active'; // 매우 활동적 (1.9)

// 영양 목표
export type NutritionGoal =
  | 'weight_loss'  // 체중 감량
  | 'maintain'     // 체중 유지
  | 'muscle'       // 근육 증가
  | 'skin'         // 피부 개선 (S-1 연동)
  | 'health';      // 건강 관리

// 식사 스타일 (Step 3 - 스펙 기준)
export type MealStyle =
  | 'korean'       // 한식 위주 (밥, 국, 반찬)
  | 'salad'        // 샐러드/가벼운 식사 (저탄고단)
  | 'western'      // 양식/파스타/빵 (서양식)
  | 'lunchbox'     // 도시락/간편식 (편의점, 도시락)
  | 'delivery'     // 배달/외식 많이 (외식 위주)
  | 'any';         // 다양하게 (특정 선호 없음)

// 식이요법 선호 (향후 고급 설정용으로 유지)
export type DietPreference =
  | 'balanced'     // 균형 식단
  | 'low_carb'     // 저탄수화물
  | 'high_protein' // 고단백
  | 'vegetarian'   // 채식
  | 'vegan'        // 완전 채식
  | 'keto'         // 키토
  | 'mediterranean'; // 지중해식

// 요리 스킬 수준
export type CookingSkill =
  | 'beginner'     // 초보 (간단한 요리만)
  | 'intermediate' // 중급 (대부분 요리 가능)
  | 'advanced'     // 고급 (복잡한 요리도 가능)
  | 'none';        // 요리 안 함 (완제품/배달만)

// 예산 수준
export type BudgetLevel =
  | 'economy'      // 경제적 (저렴하게)
  | 'moderate'     // 적당
  | 'premium'      // 프리미엄 (비용 무관)
  | 'any';         // 상관없음 (제한 없음)

// 알레르기/기피 음식 카테고리
export type AllergyType =
  | 'dairy'        // 유제품
  | 'eggs'         // 달걀
  | 'nuts'         // 견과류
  | 'seafood'      // 해산물
  | 'gluten'       // 글루텐
  | 'soy'          // 대두
  | 'pork'         // 돼지고기
  | 'beef'         // 소고기
  | 'spicy'        // 매운 음식
  | 'raw';         // 날 음식

// 신호등 색상
export type TrafficLight = 'green' | 'yellow' | 'red';

// C-1 체형 데이터 (연동용)
export interface BodyTypeData {
  type: BodyType;
  proportions: {
    shoulder: number;
    waist: number;
    hip: number;
  };
  height?: number;
  weight?: number;
}

// 단식 유형
export type FastingType = '16:8' | '18:6' | '20:4' | 'custom';

// 영양 설정 (온보딩 결과)
export interface NutritionSettings {
  id?: string;
  userId: string;
  goal: NutritionGoal;
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
  activityLevel: ActivityLevel;
  mealStyle: MealStyle;           // Step 3: 식사 스타일
  cookingSkill: CookingSkill;
  budget: BudgetLevel;
  allergies: AllergyType[];
  dislikedFoods: string[];
  mealCount: number; // 하루 식사 횟수 (2-6)
  proteinTarget?: number;         // 단백질 목표 (g)
  carbsTarget?: number;           // 탄수화물 목표 (g)
  fatTarget?: number;             // 지방 목표 (g)
  // 간헐적 단식 설정 (Task 2.16)
  fastingEnabled?: boolean;       // 간헐적 단식 활성화 여부
  fastingType?: FastingType | null; // 단식 유형 (16:8, 18:6, 20:4, custom)
  fastingStartTime?: string | null; // 단식 시작 시간 (HH:mm)
  eatingWindowHours?: number | null; // 식사 가능 시간 (1~23)
  createdAt?: string;
  updatedAt?: string;
}

// BMR/TDEE 계산 입력
export interface BMRInput {
  gender: Gender;
  weight: number;  // kg
  height: number;  // cm
  age: number;     // years
  activityLevel: ActivityLevel;
}

// BMR/TDEE 계산 결과
export interface BMRResult {
  bmr: number;           // 기초대사량
  tdee: number;          // 총 에너지 소비량
  dailyCalorieTarget: number; // 목표별 일일 칼로리
  proteinTarget: number;      // 단백질 목표 (g)
  carbsTarget: number;        // 탄수화물 목표 (g)
  fatTarget: number;          // 지방 목표 (g)
}

// 온보딩 입력 데이터
export interface NutritionInputData {
  // Step 1: 목표
  goal: NutritionGoal | null;

  // Step 2: 기본 정보
  gender: Gender | null;
  birthDate: string | null;
  height: number | null;
  weight: number | null;
  activityLevel: ActivityLevel | null;

  // Step 3: 식사 스타일
  mealStyle: MealStyle | null;

  // Step 4: 요리 스킬
  cookingSkill: CookingSkill | null;

  // Step 5: 예산
  budget: BudgetLevel | null;

  // Step 6: 알레르기/기피
  allergies: AllergyType[];
  dislikedFoods: string[];

  // Step 7: 식사 횟수
  mealCount: number;

  // 계산값 (Step 7에서 계산)
  bmr: number | null;
  tdee: number | null;
  dailyCalorieTarget: number | null;
  proteinTarget: number | null;
  carbsTarget: number | null;
  fatTarget: number | null;

  // 연동 데이터
  bodyTypeData: BodyTypeData | null;
  personalColor: PersonalColorSeason | null;
}

// 음식 데이터
export interface Food {
  id: string;
  name: string;
  nameEn?: string;
  category: string;
  servingSize: string;
  servingGrams?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;      // 당류 (g)
  sodium?: number;     // 나트륨 (mg)
  trafficLight: TrafficLight;
  isKorean?: boolean;  // 한국 음식 여부
  tags?: string[];     // 태그 배열 (low_carb, high_protein 등)
  createdAt?: string;  // 생성일
}

// 기록 방식
export type RecordType = 'photo' | 'search' | 'barcode' | 'manual';

// AI 신뢰도
export type AIConfidence = 'high' | 'medium' | 'low';

// 식사 기록
export interface MealRecord {
  id: string;
  userId: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  mealTime?: string;
  recordType: RecordType;
  foods: {
    foodId?: string;
    name: string;
    portion?: string;
    servings: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    trafficLight?: TrafficLight;
    aiConfidence?: number;
  }[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalSodium?: number;
  totalSugar?: number;
  // AI 분석 결과 (photo 기록 시)
  aiRecognizedFood?: string;
  aiConfidence?: AIConfidence;
  aiRawResponse?: Record<string, unknown>;
  userConfirmed: boolean;
  imageUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// 일일 영양 요약
export interface DailyNutritionSummary {
  id?: string;
  userId: string;
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalSodium?: number;
  totalSugar?: number;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  mealCount: number;
  waterIntake: number; // ml
  streakDays?: number; // 연속 기록일
  // 신호등 비율 (%)
  greenRatio?: number;
  yellowRatio?: number;
  redRatio?: number;
  // 달성률 (%)
  caloriePercent?: number;
  proteinPercent?: number;
  carbsPercent?: number;
  fatPercent?: number;
  waterPercent?: number;
  // AI 인사이트
  aiInsights?: AIInsight[];
  isComplete?: boolean;
  mealRecordIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// AI 인사이트 타입
export interface AIInsight {
  type: 'balance' | 'progress' | 'streak' | 'comparison' | 'tip';
  message: string;
  createdAt: string;
}

// ============================================
// Sprint 2: AI 분석 타입
// ============================================

// 식사 타입
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// AI 음식 분석 결과 (Gemini Vision)
export interface GeminiFoodAnalysisResult {
  foods: AnalyzedFood[];
  totalCalories: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  mealType?: MealType;
  insight?: string;
  analyzedAt?: string;
}

// 분석된 음식 항목
export interface AnalyzedFood {
  name: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  trafficLight: TrafficLight;
  confidence: number; // 0-1 범위
  foodId?: string; // foods 테이블 매칭 시
}

// 음식 분석 입력
export interface FoodAnalysisInput {
  imageBase64: string;
  mealType?: MealType;
  date?: string;
}

// 식사 추천 입력
export interface MealSuggestionInput {
  goal: NutritionGoal;
  tdee: number;
  consumedCalories: number;
  remainingCalories: number;
  allergies: AllergyType[];
  dislikedFoods: string[];
  cookingSkill: CookingSkill;
  budget: BudgetLevel;
  mealType: MealType;
  preferences?: string[];
}

// 식사 추천 결과
export interface MealSuggestion {
  meals: SuggestedMeal[];
  totalCalories: number;
  nutritionBalance: {
    protein: number;
    carbs: number;
    fat: number;
  };
  tips: string[];
}

// 추천된 식사
export interface SuggestedMeal {
  name: string;
  estimatedCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  trafficLight: TrafficLight;
  reason: string;
  difficulty: 'easy' | 'medium' | 'hard';
  cookingTime?: number; // 분
  ingredients?: string[];
}

// ============================================
// Sprint 2: 기록 타입
// ============================================

// 음료 종류
export type DrinkType = 'water' | 'tea' | 'coffee' | 'juice' | 'soda' | 'other';

// 수분 섭취 기록
export interface WaterRecord {
  id: string;
  userId: string;
  date: string;
  time?: string;
  amountMl: number;
  drinkType: DrinkType;
  hydrationFactor: number; // 물=1.0, 커피=0.8, 주스=0.7 등
  effectiveMl?: number; // amountMl * hydrationFactor
  notes?: string;
  createdAt: string;
}

// 즐겨찾기 카테고리
export type FavoriteCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'any';

// 즐겨찾기 음식
export interface FavoriteFood {
  id: string;
  userId: string;
  foodId?: string;
  foodName: string;
  customName?: string; // 사용자 지정 별칭
  category?: FavoriteCategory;
  defaultServing: number; // 기본 섭취량 배수 (1.0 = 1인분)
  useCount: number;
  lastUsedAt: string;
  customPortion?: string;
  customCalories?: number;
  notes?: string;
  addedAt: string;
}

// 프리미엄 보상
export interface PremiumReward {
  type: string;
  claimedAt: string;
}

// 영양 Streak
export interface NutritionStreak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastRecordDate?: string;
  streakStartDate?: string;
  badgesEarned: NutritionBadge[];
  milestonesReached: NutritionMilestone[];
  premiumRewardsClaimed: PremiumReward[];
  totalDaysLogged: number;
  totalMealsLogged: number;
  createdAt: string;
  updatedAt: string;
}

// 영양 배지
export interface NutritionBadge {
  badgeId: string;
  badgeName: string;
  badgeIcon: string;
  earnedAt: string;
}

// 영양 마일스톤
export interface NutritionMilestone {
  milestoneId: string;
  milestoneName: string;
  targetValue: number;
  achievedAt: string;
}

// ============================================
// Sprint 2: API 응답 타입
// ============================================

// 음식 분석 API 응답
export interface FoodAnalysisResponse {
  success: boolean;
  data?: MealRecord;
  result?: GeminiFoodAnalysisResult;
  usedMock?: boolean;
  error?: string;
}

// 식단 목록 API 응답
export interface MealsListResponse {
  success: boolean;
  data: MealRecord[];
  summary?: DailyNutritionSummary;
  error?: string;
}

// 수분 섭취 API 응답
export interface WaterRecordsResponse {
  success: boolean;
  data: WaterRecord[];
  totalMl: number;
  targetMl: number;
  error?: string;
}
