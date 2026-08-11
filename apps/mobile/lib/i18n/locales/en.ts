/**
 * English translations
 *
 * ⚠️ 미배선 — en 지원 아님(ko 단독 선공개).
 * 왜: lib/i18n 모듈 자체를 화면에서 아무 곳도 호출하지 않는다(소비처 0).
 * 즉 이 사전은 현재 어떤 UI에도 반영되지 않으며, 앱 문구는 전부 한국어 하드코딩이다.
 * 이 파일을 근거로 "앱이 영어를 지원한다"고 판단하면 안 된다(스토어 리스팅 언어 포함).
 * 삭제하지 않는 이유: 향후 i18n 착수 시 재작성 비용을 아끼기 위한 보존.
 */

export default {
  // Common
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    cancel: 'Cancel',
    confirm: 'Confirm',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    done: 'Done',
    next: 'Next',
    back: 'Back',
    close: 'Close',
    search: 'Search',
    seeMore: 'See more',
    noData: 'No data available',
  },

  // Tabs
  tabs: {
    home: 'Home',
    workout: 'Workout',
    nutrition: 'Nutrition',
    profile: 'Profile',
  },

  // Home
  home: {
    greeting: 'Hello, {{name}}!',
    todayPlan: "Today's Plan",
    startWorkout: 'Start Workout',
    recordMeal: 'Record Meal',
    addWater: 'Add Water',
    streak: '{{count}} day streak',
    todaySummary: 'Today Summary',
    notifications: 'Notifications',
  },

  // Workout
  workout: {
    title: 'Workout',
    session: 'Workout Session',
    log: 'Workout Log',
    history: 'History',
    plan: 'Weekly Plan',
    exercise: 'Exercise',
    duration: 'Duration',
    calories: 'Calories Burned',
    sets: 'Sets',
    reps: 'Reps',
    rest: 'Rest',
    complete: 'Complete',
    skip: 'Skip',
    pause: 'Pause',
    resume: 'Resume',
    finish: 'Finish Workout',
    great: 'Great job!',
    caloriesBurned: '{{calories}}kcal burned',
    durationMinutes: '{{minutes}} min',
    setCount: '{{current}}/{{total}} sets',
  },

  // Nutrition
  nutrition: {
    title: 'Nutrition',
    dashboard: 'Nutrition Dashboard',
    record: 'Record Meal',
    camera: 'Take Photo',
    search: 'Search Food',
    water: 'Water Intake',
    meal: {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snack',
    },
    calories: 'Calories',
    carbs: 'Carbs',
    protein: 'Protein',
    fat: 'Fat',
    goal: 'Goal',
    remaining: 'Remaining',
    waterGoal: 'Water Goal',
    addWater: 'Add Water',
    waterUnit: 'ml',
  },

  // Analysis
  analysis: {
    title: 'Analysis',
    personalColor: 'Personal Color',
    skin: 'Skin Analysis',
    body: 'Body Analysis',
    takePhoto: 'Take Photo',
    analyzing: 'Analyzing...',
    result: 'Result',
    recommendations: 'Recommendations',
    retake: 'Retake',
  },

  // Products
  products: {
    title: 'Product Recommendations',
    forYou: 'For You',
    categories: {
      skincare: 'Skincare',
      makeup: 'Makeup',
      supplement: 'Supplements',
      equipment: 'Equipment',
    },
    matchScore: '{{score}}% Match',
    reviews: '{{count}} reviews',
    buyNow: 'Buy Now',
  },

  // Settings
  settings: {
    title: 'Settings',
    notifications: 'Notification Settings',
    goals: 'Goal Settings',
    widgets: 'Widget Settings',
    language: 'Language',
    darkMode: 'Dark Mode',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    support: 'Contact Support',
    version: 'Version',
    logout: 'Log Out',
  },

  // Profile
  profile: {
    title: 'Profile',
    editProfile: 'Edit Profile',
    achievements: 'Achievements',
    friends: 'Friends',
    challenges: 'Challenges',
    stats: 'Stats',
  },

  // Errors
  errors: {
    network: 'Please check your network connection',
    unknown: 'An unknown error occurred',
    permission: 'Permission required',
    camera: 'Camera access is required',
    photos: 'Photo library access is required',
  },

  // Onboarding
  onboarding: {
    welcome: 'Welcome to Yiroom',
    getStarted: 'Get Started',
    skip: 'Skip',
  },
} as const;
