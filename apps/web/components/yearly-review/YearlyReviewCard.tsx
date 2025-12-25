'use client';

import { forwardRef } from 'react';
import { Sparkles, Activity, Utensils, Award, Heart } from 'lucide-react';
import type { YearlyStats } from '@/lib/reports/yearlyTypes';
import { generateYearlyHighlights } from '@/lib/reports/yearlyTypes';

interface YearlyReviewCardProps {
  stats: YearlyStats;
  userName?: string;
}

/**
 * 공유 가능한 연말 리뷰 카드
 * ref를 전달받아 이미지 캡처에 사용
 */
export const YearlyReviewCard = forwardRef<HTMLDivElement, YearlyReviewCardProps>(
  function YearlyReviewCard({ stats, userName }, ref) {
    const highlights = generateYearlyHighlights(stats);

    // 분석 완료 개수
    const analysisCount = [
      stats.analyses.personalColorAnalysis,
      stats.analyses.skinAnalysis,
      stats.analyses.bodyAnalysis,
      stats.analyses.workoutAnalysis,
    ].filter(Boolean).length;

    return (
      <div
        ref={ref}
        className="w-full max-w-md mx-auto bg-gradient-to-br from-violet-600 via-purple-600 to-pink-600 p-6 rounded-2xl text-white shadow-xl"
        data-testid="yearly-review-card"
      >
        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-yellow-300" />
            <span className="text-lg font-bold text-yellow-300">{stats.year}</span>
            <Sparkles className="w-6 h-6 text-yellow-300" />
          </div>
          <h2 className="text-2xl font-bold mb-1">
            {userName ? `${userName}님의` : '나의'} 연말 리뷰
          </h2>
          <p className="text-white/80 text-sm">이룸과 함께한 한 해</p>
        </div>

        {/* 주요 통계 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatBox
            icon={<Activity className="w-5 h-5" />}
            value={stats.workout.totalWorkouts}
            unit="회"
            label="운동"
            bgColor="bg-orange-500/30"
          />
          <StatBox
            icon={<Utensils className="w-5 h-5" />}
            value={stats.nutrition.totalMeals}
            unit="회"
            label="식단 기록"
            bgColor="bg-green-500/30"
          />
          <StatBox
            icon={<Award className="w-5 h-5" />}
            value={stats.achievements.totalBadges}
            unit="개"
            label="뱃지"
            bgColor="bg-yellow-500/30"
          />
          <StatBox
            icon={<Heart className="w-5 h-5" />}
            value={stats.wellness.averageScore}
            unit="점"
            label="웰니스"
            bgColor="bg-pink-500/30"
          />
        </div>

        {/* 하이라이트 */}
        {highlights.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
            <h3 className="font-semibold mb-2 text-sm">올해의 하이라이트</h3>
            <ul className="space-y-1.5">
              {highlights.map((highlight, index) => (
                <li key={index} className="text-sm text-white/90 flex items-start gap-2">
                  <span className="text-yellow-300 flex-shrink-0">✨</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 레벨 & 분석 */}
        <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="text-center flex-1">
            <p className="text-3xl font-bold text-yellow-300">Lv.{stats.achievements.currentLevel}</p>
            <p className="text-xs text-white/70">현재 레벨</p>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center flex-1">
            <p className="text-3xl font-bold text-cyan-300">{analysisCount}/4</p>
            <p className="text-xs text-white/70">AI 분석</p>
          </div>
          <div className="w-px h-10 bg-white/20" />
          <div className="text-center flex-1">
            <p className="text-3xl font-bold text-pink-300">{stats.social.friendsCount}</p>
            <p className="text-xs text-white/70">친구</p>
          </div>
        </div>

        {/* 푸터 */}
        <div className="text-center mt-6">
          <p className="text-xs text-white/60">이룸 | 온전한 나를 찾아가는 여정</p>
        </div>
      </div>
    );
  }
);

interface StatBoxProps {
  icon: React.ReactNode;
  value: number;
  unit: string;
  label: string;
  bgColor: string;
}

function StatBox({ icon, value, unit, label, bgColor }: StatBoxProps) {
  return (
    <div className={`${bgColor} backdrop-blur-sm rounded-xl p-3 text-center`}>
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
        <span className="text-xl font-bold">{value.toLocaleString('ko-KR')}</span>
        <span className="text-sm">{unit}</span>
      </div>
      <p className="text-xs text-white/70">{label}</p>
    </div>
  );
}
