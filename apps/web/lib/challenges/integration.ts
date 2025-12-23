/**
 * 챌린지 시스템 통합
 * - 운동/영양 기록 시 챌린지 진행 자동 업데이트
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ChallengeProgress,
  UserChallenge,
  UserChallengeRow,
} from '@/types/challenges';
import { userChallengeRowToUserChallenge, isChallengeCompleted, getDaysSinceStart } from './constants';

// ============================================================
// 챌린지 진행 업데이트 결과
// ============================================================

export interface ChallengeUpdateResult {
  updated: number;
  completed: number;
  completedChallenges: UserChallenge[];
  error?: string; // 에러 발생 시 메시지
}

// Combined 챌린지용 확장 진행 상황 (내부 사용)
interface CombinedProgress extends ChallengeProgress {
  workoutDayNumbers?: number[];
  nutritionDayNumbers?: number[];
}

// Combined 진행 상황 타입 가드
function isCombinedProgress(progress: ChallengeProgress): progress is CombinedProgress {
  return 'workoutDayNumbers' in progress || 'nutritionDayNumbers' in progress;
}

// 챌린지 진행 DB 업데이트 헬퍼
async function saveChallengeProgress(
  supabase: SupabaseClient,
  userChallengeId: string,
  newProgress: ChallengeProgress,
  isCompleted: boolean
): Promise<{ error: Error | null }> {
  const updateData = {
    progress: newProgress,
    updated_at: new Date().toISOString(),
    ...(isCompleted && {
      status: 'completed' as const,
      completed_at: new Date().toISOString(),
    }),
  };

  const { error } = await supabase
    .from('user_challenges')
    .update(updateData)
    .eq('id', userChallengeId);

  return { error: error ? new Error(error.message) : null };
}

// ============================================================
// 도메인별 챌린지 진행 업데이트
// ============================================================

/**
 * 특정 도메인(운동/영양)의 진행 중인 챌린지 업데이트
 * - 해당 도메인 또는 combined 챌린지를 찾아 진행 상황 업데이트
 * - 운동 완료 시 'workout' 도메인 전달
 * - 식단 기록 시 'nutrition' 도메인 전달
 */
export async function updateChallengesByDomain(
  supabase: SupabaseClient,
  clerkUserId: string,
  domain: 'workout' | 'nutrition',
  date?: string
): Promise<ChallengeUpdateResult> {
  const result: ChallengeUpdateResult = {
    updated: 0,
    completed: 0,
    completedChallenges: [],
  };

  const targetDate = date ? new Date(date) : new Date();

  try {
    // 1. 사용자의 진행 중인 챌린지 조회 (해당 도메인 또는 combined)
    const { data: userChallenges, error: fetchError } = await supabase
      .from('user_challenges')
      .select('*, challenges(*)')
      .eq('clerk_user_id', clerkUserId)
      .eq('status', 'in_progress');

    if (fetchError || !userChallenges) {
      console.error('[Challenges] Fetch active challenges error:', fetchError);
      return { ...result, error: 'Failed to fetch challenges' };
    }

    // 2. 도메인 필터링 (workout, nutrition, 또는 combined)
    const relevantChallenges = userChallenges.filter((uc: UserChallengeRow) => {
      const challenge = uc.challenges;
      if (!challenge) return false;
      return challenge.domain === domain || challenge.domain === 'combined';
    });

    if (relevantChallenges.length === 0) {
      return result;
    }

    // 3. 각 챌린지 업데이트
    for (const uc of relevantChallenges) {
      const userChallenge = userChallengeRowToUserChallenge(uc as UserChallengeRow);
      const challenge = userChallenge.challenge;

      if (!challenge) continue;

      // 챌린지 시작일로부터 오늘이 몇 일째인지 계산 (1-based)
      const dayNumber = getDaysSinceStart(userChallenge.startedAt, targetDate) + 1;

      // 챌린지 기간 초과 체크
      if (dayNumber > challenge.durationDays) {
        continue;
      }

      // 현재 진행 상황
      const currentProgress = userChallenge.progress;
      const completedDays = currentProgress.completedDays || [];

      // 이미 오늘 기록되었으면 스킵
      if (completedDays.includes(dayNumber)) {
        continue;
      }

      // Combined 챌린지의 경우 두 가지 모두 확인 필요
      if (challenge.domain === 'combined') {
        const updated = await updateCombinedChallenge(
          supabase,
          userChallenge,
          domain,
          dayNumber
        );
        if (updated) {
          result.updated++;
          if (updated.isCompleted) {
            result.completed++;
            result.completedChallenges.push(updated.userChallenge);
          }
        }
        continue;
      }

      // 단일 도메인 챌린지 업데이트
      const newCompletedDays = [...completedDays, dayNumber].sort((a, b) => a - b);
      const newProgress: ChallengeProgress = {
        ...currentProgress,
        currentDays: newCompletedDays.length,
        totalDays: challenge.durationDays,
        completedDays: newCompletedDays,
        completedCount: newCompletedDays.length,
        percentage: Math.round((newCompletedDays.length / challenge.durationDays) * 100),
      };

      // 완료 여부 확인
      const isCompleted = isChallengeCompleted(newProgress, challenge.target);

      // DB 업데이트 (헬퍼 함수 사용)
      const { error: updateError } = await saveChallengeProgress(
        supabase,
        userChallenge.id,
        newProgress,
        isCompleted
      );

      if (updateError) {
        console.error('[Challenges] Update challenge progress error:', updateError);
        continue;
      }

      result.updated++;

      if (isCompleted) {
        result.completed++;
        result.completedChallenges.push({
          ...userChallenge,
          status: 'completed',
          progress: newProgress,
        });
      }
    }

    return result;
  } catch (error) {
    console.error('[Challenges] Update challenges by domain error:', error);
    return result;
  }
}

// ============================================================
// Combined 챌린지 업데이트
// ============================================================

interface CombinedUpdateResult {
  userChallenge: UserChallenge;
  isCompleted: boolean;
}

/**
 * Combined 챌린지 업데이트
 * - 운동 + 영양 모두 완료해야 하루 카운트
 */
async function updateCombinedChallenge(
  supabase: SupabaseClient,
  userChallenge: UserChallenge,
  domain: 'workout' | 'nutrition',
  dayNumber: number
): Promise<CombinedUpdateResult | null> {
  const challenge = userChallenge.challenge;
  if (!challenge) return null;

  // 현재 진행 상황에서 오늘의 상태 확인 (타입 가드 사용)
  const currentProgress = userChallenge.progress;
  const completedDays = currentProgress.completedDays || [];

  // Combined용 추가 데이터 (도메인별 완료 날짜)
  const workoutDayNumbers = isCombinedProgress(currentProgress)
    ? currentProgress.workoutDayNumbers || []
    : [];
  const nutritionDayNumbers = isCombinedProgress(currentProgress)
    ? currentProgress.nutritionDayNumbers || []
    : [];

  // 해당 도메인에 오늘 추가
  let newWorkoutDayNumbers: number[];
  let newNutritionDayNumbers: number[];

  if (domain === 'workout' && !workoutDayNumbers.includes(dayNumber)) {
    newWorkoutDayNumbers = [...workoutDayNumbers, dayNumber].sort((a, b) => a - b);
    newNutritionDayNumbers = [...nutritionDayNumbers];
  } else if (domain === 'nutrition' && !nutritionDayNumbers.includes(dayNumber)) {
    newWorkoutDayNumbers = [...workoutDayNumbers];
    newNutritionDayNumbers = [...nutritionDayNumbers, dayNumber].sort((a, b) => a - b);
  } else {
    // 이미 기록됨
    return null;
  }

  // 양쪽 모두 완료된 날짜 계산
  const bothCompletedDays = newWorkoutDayNumbers.filter(d => newNutritionDayNumbers.includes(d));
  const newCompletedDays = Array.from(new Set([...completedDays, ...bothCompletedDays])).sort((a, b) => a - b);

  const newProgress: CombinedProgress = {
    ...currentProgress,
    currentDays: newCompletedDays.length,
    totalDays: challenge.durationDays,
    completedDays: newCompletedDays,
    completedCount: newCompletedDays.length,
    percentage: Math.round((newCompletedDays.length / challenge.durationDays) * 100),
    workoutDayNumbers: newWorkoutDayNumbers,
    nutritionDayNumbers: newNutritionDayNumbers,
  };

  // 완료 여부 확인
  const isCompleted = isChallengeCompleted(newProgress, challenge.target);

  // DB 업데이트 (헬퍼 함수 사용)
  const { error: updateError } = await saveChallengeProgress(
    supabase,
    userChallenge.id,
    newProgress,
    isCompleted
  );

  if (updateError) {
    console.error('[Challenges] Update combined challenge error:', updateError);
    return null;
  }

  return {
    userChallenge: {
      ...userChallenge,
      status: isCompleted ? 'completed' : 'in_progress',
      progress: newProgress,
    },
    isCompleted,
  };
}

// ============================================================
// 운동 완료 시 호출
// ============================================================

/**
 * 운동 완료 시 챌린지 업데이트
 */
export async function updateChallengesOnWorkout(
  supabase: SupabaseClient,
  clerkUserId: string,
  workoutDate?: string
): Promise<ChallengeUpdateResult> {
  return updateChallengesByDomain(supabase, clerkUserId, 'workout', workoutDate);
}

// ============================================================
// 영양 기록 시 호출
// ============================================================

/**
 * 식단 기록 시 챌린지 업데이트
 */
export async function updateChallengesOnNutrition(
  supabase: SupabaseClient,
  clerkUserId: string,
  recordDate?: string
): Promise<ChallengeUpdateResult> {
  return updateChallengesByDomain(supabase, clerkUserId, 'nutrition', recordDate);
}
