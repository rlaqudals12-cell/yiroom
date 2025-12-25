/**
 * 연간 리포트 공유 타입 및 유틸리티
 * 클라이언트와 서버 모두에서 사용 가능
 */

/**
 * 연간 통계 타입
 */
export interface YearlyStats {
  // 기본 정보
  year: number;
  userId: string;

  // 운동 통계
  workout: {
    totalWorkouts: number;
    totalMinutes: number;
    totalCaloriesBurned: number;
    longestStreak: number;
    favoriteExercise?: string;
    mostActiveMonth?: number;
    workoutsPerMonth: number[];
  };

  // 영양 통계
  nutrition: {
    totalMeals: number;
    totalCalories: number;
    averageCaloriesPerDay: number;
    totalWaterMl: number;
    longestStreak: number;
    mostRecordedMonth?: number;
  };

  // 성취
  achievements: {
    totalBadges: number;
    currentLevel: number;
    levelUps: number;
    challengesCompleted: number;
    challengesJoined: number;
  };

  // 분석
  analyses: {
    personalColorAnalysis: boolean;
    skinAnalysis: boolean;
    bodyAnalysis: boolean;
    workoutAnalysis: boolean;
  };

  // 소셜
  social: {
    friendsCount: number;
    activitiesShared: number;
    likesReceived: number;
    commentsReceived: number;
  };

  // 웰니스
  wellness: {
    averageScore: number;
    bestScore: number;
    bestWeek?: string;
    scoreImprovement: number;
  };
}

/**
 * 월 이름 반환
 */
export function getMonthName(month: number): string {
  const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  return months[month - 1] || '';
}

/**
 * 연간 하이라이트 생성
 */
export function generateYearlyHighlights(stats: YearlyStats): string[] {
  const highlights: string[] = [];

  if (stats.workout.totalWorkouts > 0) {
    highlights.push(`총 ${stats.workout.totalWorkouts}회 운동을 완료했어요!`);
  }

  if (stats.workout.longestStreak > 7) {
    highlights.push(`${stats.workout.longestStreak}일 연속 운동 기록을 달성했어요!`);
  }

  if (stats.nutrition.totalMeals > 0) {
    highlights.push(`${stats.nutrition.totalMeals}번의 식사를 기록했어요!`);
  }

  if (stats.achievements.totalBadges > 0) {
    highlights.push(`${stats.achievements.totalBadges}개의 뱃지를 획득했어요!`);
  }

  if (stats.achievements.challengesCompleted > 0) {
    highlights.push(`${stats.achievements.challengesCompleted}개의 챌린지를 완료했어요!`);
  }

  if (stats.social.friendsCount > 0) {
    highlights.push(`${stats.social.friendsCount}명의 친구와 함께했어요!`);
  }

  if (stats.wellness.scoreImprovement > 0) {
    highlights.push(`웰니스 점수가 ${stats.wellness.scoreImprovement}점 상승했어요!`);
  }

  return highlights.slice(0, 5);
}
