'use client';

import Link from 'next/link';
import { Trophy, Flame, Clock, Dumbbell, TrendingUp, Share2, Home, Droplets, Utensils, Loader2 } from 'lucide-react';
import type { WorkoutType } from '@/lib/workout/nutritionTips';
import { getQuickNutritionMessage, calculateProteinRecommendation } from '@/lib/workout/nutritionTips';
import { useShare } from '@/hooks/useShare';

interface SessionCompletionCardProps {
  totalExercises: number;
  completedExercises: number;
  totalSets: number;
  completedSets: number;
  totalTime: number;           // seconds
  caloriesBurned: number;
  totalVolume: number;         // kg
  currentStreak?: number;
  isNewRecord?: boolean;
  workoutType?: WorkoutType;   // P3-5.2: 영양 추천을 위한 운동 타입
  bodyWeightKg?: number;       // P3-5.2: 단백질 권장량 계산용
  onGoHome: () => void;
  onShare?: () => void;        // 외부 share 함수 (미사용 시 내부 useShare 사용)
  showShareButton?: boolean;   // 공유 버튼 표시 여부 (기본: true)
}

/**
 * 세션 완료 카드 컴포넌트
 * - 운동 완료 축하 메시지
 * - 통계 요약
 * - Streak 표시
 */
export function SessionCompletionCard({
  totalExercises,
  completedExercises,
  totalSets,
  completedSets,
  totalTime,
  caloriesBurned,
  totalVolume,
  currentStreak = 0,
  isNewRecord = false,
  workoutType = 'builder',
  bodyWeightKg = 60,
  onGoHome,
  onShare,
  showShareButton = true,
}: SessionCompletionCardProps) {
  // 내부 공유 기능 (ref 캡처 방식)
  const { ref: shareRef, share: internalShare, loading: isSharing } = useShare('이룸-운동기록');

  // 외부 onShare가 있으면 사용, 없으면 내부 share 사용
  const handleShare = onShare || internalShare;

  // P3-5.2: 영양 추천 메시지 생성
  const durationMinutes = Math.floor(totalTime / 60);
  const nutritionMessage = getQuickNutritionMessage(workoutType, durationMinutes, caloriesBurned);
  const proteinRec = calculateProteinRecommendation(workoutType, bodyWeightKg);
  // 시간 포맷팅 (mm:ss)
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}분 ${remainingSecs}초`;
  };

  // 완료율 계산
  const completionRate = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  const isFullCompletion = completedExercises === totalExercises && completedSets === totalSets;

  // 축하 메시지 결정
  const getCongratMessage = () => {
    if (isFullCompletion) return '완벽한 운동이었어요!';
    if (completionRate >= 80) return '거의 다 해냈어요!';
    if (completionRate >= 50) return '절반 이상 완료했어요!';
    return '오늘도 운동했어요!';
  };

  return (
    <div
      ref={shareRef}
      className="fixed inset-0 bg-gradient-to-b from-indigo-500 to-purple-600 z-50 flex flex-col"
      data-testid="session-completion-card"
    >
      {/* 축하 애니메이션 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* 트로피 아이콘 */}
        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <Trophy className="w-12 h-12 text-yellow-300" />
        </div>

        {/* 축하 메시지 */}
        <h1 className="text-3xl font-bold text-white mb-2">운동 완료!</h1>
        <p className="text-white/80 text-lg mb-8">{getCongratMessage()}</p>

        {/* Streak 표시 */}
        {currentStreak > 0 && (
          <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-8">
            <Flame className="w-5 h-5 text-orange-300" />
            <span className="text-white font-medium">{currentStreak}일 연속 운동 중!</span>
          </div>
        )}

        {/* 신기록 표시 */}
        {isNewRecord && (
          <div className="flex items-center gap-2 bg-yellow-400/20 px-4 py-2 rounded-full mb-8">
            <TrendingUp className="w-5 h-5 text-yellow-300" />
            <span className="text-yellow-200 font-medium">새로운 기록 달성!</span>
          </div>
        )}

        {/* 통계 그리드 */}
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* 운동 시간 */}
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <Clock className="w-6 h-6 text-blue-300 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{formatTime(totalTime)}</p>
              <p className="text-xs text-white/60">운동 시간</p>
            </div>

            {/* 소모 칼로리 */}
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <Flame className="w-6 h-6 text-orange-300 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{Math.round(caloriesBurned)}</p>
              <p className="text-xs text-white/60">kcal 소모</p>
            </div>

            {/* 완료 세트 */}
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <Dumbbell className="w-6 h-6 text-green-300 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {completedSets}/{totalSets}
              </p>
              <p className="text-xs text-white/60">세트 완료</p>
            </div>

            {/* 볼륨 */}
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <TrendingUp className="w-6 h-6 text-purple-300 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {totalVolume.toLocaleString()}
              </p>
              <p className="text-xs text-white/60">kg 볼륨</p>
            </div>
          </div>

          {/* 완료율 */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">달성률</span>
              <span className="text-white font-bold">{completionRate}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  completionRate === 100
                    ? 'bg-green-400'
                    : completionRate >= 80
                      ? 'bg-yellow-400'
                      : 'bg-white'
                }`}
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          {/* S-1 연동: 피부 관리 팁 */}
          <div
            className="mt-4 bg-cyan-500/20 rounded-xl p-4"
            data-testid="skin-care-tip"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-400/30 rounded-full flex items-center justify-center flex-shrink-0">
                <Droplets className="w-5 h-5 text-cyan-200" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">
                  땀을 많이 흘렸으니 세안 후 수분 보충 추천!
                </p>
                <Link
                  href="/analysis/skin"
                  className="text-cyan-200 text-xs hover:text-white transition-colors"
                >
                  피부 분석 받기 →
                </Link>
              </div>
            </div>
          </div>

          {/* N-1 연동: 영양 추천 (P3-5.2) */}
          <div
            className="mt-4 bg-orange-500/20 rounded-xl p-4"
            data-testid="nutrition-recommendation"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-400/30 rounded-full flex items-center justify-center flex-shrink-0">
                <Utensils className="w-5 h-5 text-orange-200" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">
                  {nutritionMessage.icon} {nutritionMessage.message}
                </p>
                <p className="text-orange-200 text-xs mt-1">
                  단백질 권장: {proteinRec.min}-{proteinRec.max}g
                </p>
                <Link
                  href="/nutrition"
                  className="text-orange-200 text-xs hover:text-white transition-colors"
                >
                  식단 분석 받기 →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      <div className="p-6 space-y-3">
        {showShareButton && (
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="w-full py-4 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isSharing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Share2 className="w-5 h-5" />
            )}
            {isSharing ? '준비 중...' : '기록 공유하기'}
          </button>
        )}
        <button
          onClick={onGoHome}
          className="w-full py-4 bg-card text-indigo-600 font-bold rounded-xl hover:bg-muted transition-colors flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          홈으로 돌아가기
        </button>
      </div>
    </div>
  );
}
