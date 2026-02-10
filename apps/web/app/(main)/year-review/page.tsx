'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Share2,
  Trophy,
  Flame,
  Dumbbell,
  Utensils,
  Droplets,
  TrendingUp,
  Calendar,
  Star,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { FadeInUp } from '@/components/animations';
import { cn } from '@/lib/utils';

/**
 * 연말 리뷰 페이지 - UX 리스트럭처링
 * - 올해의 기록 (운동 시간, 칼로리, 식사, 물)
 * - 월별 추이 차트
 * - 최고 기록
 * - 획득 배지
 * - 친구와 비교
 * - 공유 기능
 */

// 현재 연도
const currentYear = new Date().getFullYear();

// 올해의 기록
const yearlyStats = {
  totalWorkoutHours: 156,
  totalCaloriesBurned: 89400,
  mealRecords: 892,
  waterCups: 1456,
  workoutDays: 180,
  streakBest: 21,
};

// 월별 데이터
const monthlyData = [
  { month: '1월', workout: 12, calories: 6800 },
  { month: '2월', workout: 10, calories: 5900 },
  { month: '3월', workout: 14, calories: 8200 },
  { month: '4월', workout: 11, calories: 6500 },
  { month: '5월', workout: 15, calories: 9100 },
  { month: '6월', workout: 13, calories: 7800 },
  { month: '7월', workout: 16, calories: 9600 },
  { month: '8월', workout: 14, calories: 8400 },
  { month: '9월', workout: 12, calories: 7200 },
  { month: '10월', workout: 15, calories: 9000 },
  { month: '11월', workout: 13, calories: 7800 },
  { month: '12월', workout: 11, calories: 6600 },
];

// 최고 기록
const bestRecords = [
  { label: '가장 많이 운동한 달', value: '7월', detail: '16시간' },
  { label: '최장 연속 운동', value: '21일', detail: '4월 3일 ~ 4월 23일' },
  { label: '최고 소모 칼로리', value: '1,240 kcal', detail: '8월 15일' },
  { label: '최다 물 섭취', value: '12잔', detail: '7월 22일' },
];

// 획득 배지
const earnedBadges = [
  { id: '1', name: '첫 운동', icon: '🏃', earnedAt: '1월 2일' },
  { id: '2', name: '7일 연속', icon: '🔥', earnedAt: '1월 15일' },
  { id: '3', name: '21일 연속', icon: '💪', earnedAt: '4월 23일' },
  { id: '4', name: '100시간 달성', icon: '⏱️', earnedAt: '8월 10일' },
  { id: '5', name: '마스터', icon: '👑', earnedAt: '12월 20일' },
];

// 친구 비교
const friendComparison = {
  rank: 3,
  totalFriends: 12,
  aheadOf: '홍길동 (+12시간)',
  behindOf: '김철수 (-5시간)',
};

export default function YearReviewPage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const totalSlides = 5; // 통계, 차트, 최고기록, 배지, 친구비교

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleNext = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleShare = () => {
    if (typeof navigator.share === 'function') {
      navigator
        .share({
          title: `${currentYear} 연말 리뷰`,
          text: `올해 총 ${yearlyStats.totalWorkoutHours}시간 운동하고, ${yearlyStats.totalCaloriesBurned.toLocaleString()} kcal를 소모했어요!`,
          url: window.location.href,
        })
        .catch(() => {});
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 text-white"
      data-testid="year-review-page"
    >
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-black/20 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            {currentYear} 연말 리뷰
          </h1>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="공유"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 슬라이드 인디케이터 */}
      <div className="flex justify-center gap-2 py-4">
        {[...Array(totalSlides)].map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              i === currentSlide ? 'w-6 bg-white' : 'bg-white/40'
            )}
          />
        ))}
      </div>

      {/* 슬라이드 콘텐츠 */}
      <div className="px-4 pb-24">
        {/* 슬라이드 0: 올해의 기록 */}
        {currentSlide === 0 && (
          <FadeInUp>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">올해의 기록</h2>
              <p className="text-white/70">{currentYear}년 동안 정말 열심히 했어요!</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                <Dumbbell className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                <p className="text-3xl font-bold">{yearlyStats.totalWorkoutHours}</p>
                <p className="text-sm text-white/70">총 운동 시간</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                <Flame className="w-8 h-8 mx-auto mb-2 text-orange-400" />
                <p className="text-3xl font-bold">
                  {yearlyStats.totalCaloriesBurned.toLocaleString()}
                </p>
                <p className="text-sm text-white/70">소모 칼로리</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                <Utensils className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                <p className="text-3xl font-bold">{yearlyStats.mealRecords}</p>
                <p className="text-sm text-white/70">기록한 식사</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                <Droplets className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
                <p className="text-3xl font-bold">{yearlyStats.waterCups}</p>
                <p className="text-sm text-white/70">마신 물 (잔)</p>
              </div>
            </div>
            <div className="mt-6 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 rounded-2xl p-4 border border-yellow-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-yellow-400" />
                  <div>
                    <p className="font-medium">운동한 날</p>
                    <p className="text-sm text-white/70">{yearlyStats.workoutDays}일 / 365일</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-yellow-400">
                  {Math.round((yearlyStats.workoutDays / 365) * 100)}%
                </p>
              </div>
            </div>
          </FadeInUp>
        )}

        {/* 슬라이드 1: 월별 추이 */}
        {currentSlide === 1 && (
          <FadeInUp>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">월별 성장</h2>
              <p className="text-white/70">꾸준히 성장하고 있어요</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
              <h3 className="font-medium mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                월별 운동 시간
              </h3>
              <div className="flex items-end justify-between gap-1 h-40">
                {monthlyData.map((data) => {
                  const maxHours = Math.max(...monthlyData.map((d) => d.workout));
                  const height = (data.workout / maxHours) * 100;
                  return (
                    <div key={data.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-white/70">{data.workout}h</span>
                      <div
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-white/50">{data.month.slice(0, 2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </FadeInUp>
        )}

        {/* 슬라이드 2: 최고 기록 */}
        {currentSlide === 2 && (
          <FadeInUp>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">최고 기록</h2>
              <p className="text-white/70">이 순간들을 기억해요</p>
            </div>
            <div className="space-y-4">
              {bestRecords.map((record, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur rounded-2xl p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white/70">{record.label}</p>
                    <p className="text-xl font-bold">{record.value}</p>
                    <p className="text-xs text-white/50">{record.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeInUp>
        )}

        {/* 슬라이드 3: 획득 배지 */}
        {currentSlide === 3 && (
          <FadeInUp>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">획득한 배지</h2>
              <p className="text-white/70">총 {earnedBadges.length}개의 배지!</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {earnedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="bg-white/10 backdrop-blur rounded-2xl p-4 text-center"
                >
                  <span className="text-4xl block mb-2">{badge.icon}</span>
                  <p className="font-medium text-sm">{badge.name}</p>
                  <p className="text-xs text-white/50 mt-1">{badge.earnedAt}</p>
                </div>
              ))}
            </div>
          </FadeInUp>
        )}

        {/* 슬라이드 4: 친구와 비교 */}
        {currentSlide === 4 && (
          <FadeInUp>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">친구와 비교</h2>
              <p className="text-white/70">함께하면 더 즐거워요</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center mb-6">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
              <p className="text-5xl font-bold mb-2">{friendComparison.rank}위</p>
              <p className="text-white/70">{friendComparison.totalFriends}명의 친구 중</p>
            </div>
            <div className="space-y-3">
              <div className="bg-green-500/20 rounded-xl p-4 border border-green-500/30">
                <p className="text-sm text-green-400">앞서고 있어요</p>
                <p className="font-medium">{friendComparison.aheadOf}</p>
              </div>
              <div className="bg-amber-500/20 rounded-xl p-4 border border-amber-500/30">
                <p className="text-sm text-amber-400">조금만 더!</p>
                <p className="font-medium">{friendComparison.behindOf}</p>
              </div>
            </div>
            <button
              className="w-full mt-6 bg-white/20 hover:bg-white/30 py-4 rounded-xl font-medium transition-colors"
              onClick={() => router.push('/leaderboard')}
            >
              전체 순위 보기
            </button>
          </FadeInUp>
        )}
      </div>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={handlePrev}
            disabled={currentSlide === 0}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
              currentSlide === 0
                ? 'bg-white/5 text-white/30'
                : 'bg-white/20 text-white hover:bg-white/30'
            )}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleShare}
            className="px-8 py-3 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Share2 className="w-5 h-5" />
            공유하기
          </button>

          <button
            onClick={handleNext}
            disabled={currentSlide === totalSlides - 1}
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
              currentSlide === totalSlides - 1
                ? 'bg-white/5 text-white/30'
                : 'bg-white/20 text-white hover:bg-white/30'
            )}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
