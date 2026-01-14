/**
 * 테스트용 Mock 데이터
 */

// =============================================================================
// 사용자 Mock
// =============================================================================
export const mockUser = {
  id: 'test_user_123',
  clerkUserId: 'clerk_test_123',
  firstName: '테스트',
  lastName: '사용자',
  fullName: '테스트 사용자',
  email: 'test@example.com',
  imageUrl: 'https://example.com/avatar.png',
  createdAt: new Date().toISOString(),
};

// =============================================================================
// 분석 결과 Mock
// =============================================================================
export const mockPersonalColorAnalysis = {
  id: 'pc_123',
  seasonType: 'spring' as const,
  subType: 'bright',
  colors: {
    bestColors: ['#FFB6C1', '#FFA07A', '#FFD700'],
    avoidColors: ['#000080', '#4B0082'],
  },
  analyzedAt: new Date().toISOString(),
};

export const mockSkinAnalysis = {
  id: 'skin_123',
  skinType: 'combination' as const,
  concerns: ['pores', 'oiliness', 'dryness'],
  hydrationLevel: 65,
  oilLevel: 45,
  sensitivity: 30,
  analyzedAt: new Date().toISOString(),
};

export const mockBodyAnalysis = {
  id: 'body_123',
  bodyType: 'mesomorph' as const,
  height: 175,
  weight: 70,
  bmi: 22.9,
  bodyFatPercentage: 18,
  analyzedAt: new Date().toISOString(),
};

export const mockWorkoutAnalysis = {
  id: 'workout_123',
  workoutType: 'strength' as const,
  fitnessLevel: 'intermediate' as const,
  goals: ['muscle_gain', 'strength'],
  analyzedAt: new Date().toISOString(),
};

// =============================================================================
// 제품 Mock
// =============================================================================
export const mockCosmeticProduct = {
  id: 'cosmetic_123',
  name: '히알루론산 세럼',
  brand: '테스트 브랜드',
  category: 'serum',
  priceKrw: 35000,
  imageUrl: 'https://example.com/product.jpg',
  rating: 4.5,
  reviewCount: 128,
  skinTypes: ['dry', 'combination'],
  concerns: ['hydration', 'anti-aging'],
  keyIngredients: ['Hyaluronic Acid', 'Niacinamide'],
  matchScore: 85,
};

export const mockSupplementProduct = {
  id: 'supplement_123',
  name: '비타민 D3 5000IU',
  brand: '테스트 영양제',
  category: 'vitamin',
  priceKrw: 25000,
  imageUrl: 'https://example.com/supplement.jpg',
  rating: 4.7,
  reviewCount: 256,
  benefits: ['bone_health', 'immunity'],
  mainIngredients: [{ name: 'Vitamin D3', amount: 5000, unit: 'IU' }],
  dosage: '하루 1정',
  matchScore: 90,
};

export const mockEquipmentProduct = {
  id: 'equipment_123',
  name: '덤벨 세트 20kg',
  brand: '테스트 운동기구',
  category: 'dumbbell',
  priceKrw: 89000,
  imageUrl: 'https://example.com/equipment.jpg',
  rating: 4.3,
  reviewCount: 64,
  workoutTypes: ['strength', 'home'],
  matchScore: 78,
};

// =============================================================================
// 리뷰 Mock
// =============================================================================
export const mockReview = {
  id: 'review_123',
  productId: 'cosmetic_123',
  productType: 'cosmetic' as const,
  userId: 'test_user_123',
  userName: '테스트 사용자',
  userImageUrl: 'https://example.com/avatar.png',
  rating: 5,
  title: '정말 좋아요!',
  content: '피부가 촉촉해지고 효과가 좋습니다. 추천해요!',
  helpfulCount: 12,
  isHelpful: false,
  verifiedPurchase: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockReviews = [
  mockReview,
  {
    ...mockReview,
    id: 'review_124',
    rating: 4,
    title: '괜찮아요',
    content: '효과는 있지만 가격이 좀 비싸요.',
    helpfulCount: 5,
  },
  {
    ...mockReview,
    id: 'review_125',
    rating: 3,
    title: '보통이에요',
    content: '기대했던 것보다는 효과가 적어요.',
    helpfulCount: 2,
  },
];

// =============================================================================
// 운동 Mock
// =============================================================================
export const mockExercise = {
  id: 'exercise_123',
  name: '벤치 프레스',
  category: 'chest',
  equipment: ['barbell', 'bench'],
  sets: 4,
  reps: 10,
  weight: 60,
  restTime: 90,
  instructions: [
    '벤치에 누워 바벨을 어깨 너비로 잡습니다.',
    '바벨을 가슴까지 천천히 내립니다.',
    '가슴 근육을 사용해 바벨을 밀어올립니다.',
  ],
};

export const mockWorkoutPlan = {
  id: 'plan_123',
  name: '주 4회 상체 운동',
  workoutType: 'strength',
  frequency: '3-4',
  exercises: [
    mockExercise,
    { ...mockExercise, id: 'exercise_124', name: '덤벨 플라이' },
    { ...mockExercise, id: 'exercise_125', name: '푸시업', category: 'chest' },
  ],
};

// =============================================================================
// 영양 Mock
// =============================================================================
export const mockMealRecord = {
  id: 'meal_123',
  userId: 'test_user_123',
  mealType: 'lunch' as const,
  foods: [
    { name: '현미밥', calories: 200, protein: 4, carbs: 45, fat: 1 },
    { name: '닭가슴살', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    { name: '샐러드', calories: 50, protein: 2, carbs: 8, fat: 1 },
  ],
  totalCalories: 415,
  totalProtein: 37,
  totalCarbs: 53,
  totalFat: 5.6,
  imageUrl: 'https://example.com/meal.jpg',
  recordedAt: new Date().toISOString(),
};

export const mockDailyNutrition = {
  date: new Date().toISOString().split('T')[0],
  totalCalories: 1850,
  totalProtein: 120,
  totalCarbs: 200,
  totalFat: 55,
  targetCalories: 2000,
  targetProtein: 130,
  targetCarbs: 250,
  targetFat: 60,
  waterIntake: 2000,
  waterTarget: 2500,
};

// =============================================================================
// 알림 Mock
// =============================================================================
export const mockNotification = {
  id: 'notif_123',
  type: 'water_reminder' as const,
  title: '물 마시기 알림',
  body: '물을 마실 시간이에요! 💧',
  data: { targetAmount: 250 },
  read: false,
  createdAt: new Date().toISOString(),
};

// =============================================================================
// 챌린지 Mock
// =============================================================================
export const mockChallenge = {
  id: 'challenge_123',
  title: '30일 물 2L 마시기',
  description: '매일 물 2L를 마시고 건강해지세요!',
  type: 'water' as const,
  duration: 30,
  targetValue: 2000,
  unit: 'ml',
  participants: 1234,
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  progress: 40,
  isJoined: true,
};

// =============================================================================
// 위젯 Mock
// =============================================================================
export const mockWidgetConfig = {
  id: 'widget_123',
  type: 'daily_summary' as const,
  title: '오늘의 요약',
  enabled: true,
  position: 0,
  settings: {
    showCalories: true,
    showWater: true,
    showWorkout: true,
  },
};
