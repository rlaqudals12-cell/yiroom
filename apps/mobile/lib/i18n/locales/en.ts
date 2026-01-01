/**
 * English translations
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
