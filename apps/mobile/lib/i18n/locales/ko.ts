/**
 * 한국어 번역
 */

export default {
  // 공통
  common: {
    loading: '로딩 중...',
    error: '오류가 발생했습니다',
    retry: '다시 시도',
    cancel: '취소',
    confirm: '확인',
    save: '저장',
    delete: '삭제',
    edit: '수정',
    done: '완료',
    next: '다음',
    back: '뒤로',
    close: '닫기',
    search: '검색',
    seeMore: '더 보기',
    noData: '데이터가 없습니다',
  },

  // 탭
  tabs: {
    home: '홈',
    workout: '운동',
    nutrition: '영양',
    profile: '프로필',
  },

  // 홈
  home: {
    greeting: '안녕하세요, {{name}}님!',
    todayPlan: '오늘의 계획',
    startWorkout: '운동 시작',
    recordMeal: '식사 기록',
    addWater: '물 추가',
    streak: '{{count}}일 연속',
    todaySummary: '오늘 요약',
    notifications: '알림',
  },

  // 운동
  workout: {
    title: '운동',
    session: '운동 세션',
    log: '운동 기록',
    history: '기록 히스토리',
    plan: '주간 플랜',
    exercise: '운동 종류',
    duration: '운동 시간',
    calories: '소모 칼로리',
    sets: '세트',
    reps: '횟수',
    rest: '휴식',
    complete: '완료',
    skip: '건너뛰기',
    pause: '일시정지',
    resume: '계속하기',
    finish: '운동 종료',
    great: '잘했어요!',
    caloriesBurned: '{{calories}}kcal 소모',
    durationMinutes: '{{minutes}}분',
    setCount: '{{current}}/{{total}} 세트',
  },

  // 영양
  nutrition: {
    title: '영양',
    dashboard: '영양 대시보드',
    record: '식사 기록',
    camera: '사진 촬영',
    search: '음식 검색',
    water: '물 섭취',
    meal: {
      breakfast: '아침',
      lunch: '점심',
      dinner: '저녁',
      snack: '간식',
    },
    calories: '칼로리',
    carbs: '탄수화물',
    protein: '단백질',
    fat: '지방',
    goal: '목표',
    remaining: '남은 칼로리',
    waterGoal: '물 목표',
    addWater: '물 추가',
    waterUnit: 'ml',
  },

  // 분석
  analysis: {
    title: '분석',
    personalColor: '퍼스널 컬러',
    skin: '피부 분석',
    body: '체형 분석',
    takePhoto: '사진 촬영',
    analyzing: '분석 중...',
    result: '결과',
    recommendations: '추천',
    retake: '다시 촬영',
  },

  // 제품
  products: {
    title: '제품 추천',
    forYou: '나를 위한 추천',
    categories: {
      skincare: '스킨케어',
      makeup: '메이크업',
      supplement: '영양제',
      equipment: '운동 기구',
    },
    matchScore: '매칭 {{score}}%',
    reviews: '리뷰 {{count}}개',
    buyNow: '구매하러 가기',
  },

  // 설정
  settings: {
    title: '설정',
    notifications: '알림 설정',
    goals: '목표 설정',
    widgets: '위젯 설정',
    language: '언어',
    darkMode: '다크 모드',
    privacy: '개인정보 처리방침',
    terms: '이용약관',
    support: '문의하기',
    version: '버전',
    logout: '로그아웃',
  },

  // 프로필
  profile: {
    title: '프로필',
    editProfile: '프로필 수정',
    achievements: '업적',
    friends: '친구',
    challenges: '도전',
    stats: '통계',
  },

  // 에러
  errors: {
    network: '네트워크 연결을 확인해주세요',
    unknown: '알 수 없는 오류가 발생했습니다',
    permission: '권한이 필요합니다',
    camera: '카메라 접근 권한이 필요합니다',
    photos: '사진 접근 권한이 필요합니다',
  },

  // 온보딩
  onboarding: {
    welcome: '이룸에 오신 것을 환영합니다',
    getStarted: '시작하기',
    skip: '건너뛰기',
  },
} as const;
