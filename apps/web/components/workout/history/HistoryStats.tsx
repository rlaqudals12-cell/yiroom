'use client';

import { Activity, Flame, Clock, TrendingUp, Target } from 'lucide-react';

interface HistoryStatsProps {
  totalWorkouts: number;
  totalMinutes: number;
  totalCalories: number;
  totalVolume: number;
  completionRate: number;  // 0-100
}

/**
 * 기록 통계 요약 컴포넌트
 * - 총 운동 횟수, 시간, 칼로리, 볼륨
 * - 목표 달성률
 */
export function HistoryStats({
  totalWorkouts,
  totalMinutes,
  totalCalories,
  totalVolume,
  completionRate,
}: HistoryStatsProps) {
  // 시간 포맷팅
  const formatTotalTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}분`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
  };

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white" data-testid="history-stats">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5" />
        <h2 className="text-lg font-bold">이번 주 운동 현황</h2>
      </div>

      {/* 통계 그리드 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 운동 횟수 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-white/80" />
            <span className="text-sm text-white/80">운동 횟수</span>
          </div>
          <p className="text-2xl font-bold">{totalWorkouts}회</p>
        </div>

        {/* 운동 시간 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-white/80" />
            <span className="text-sm text-white/80">총 시간</span>
          </div>
          <p className="text-2xl font-bold">{formatTotalTime(totalMinutes)}</p>
        </div>

        {/* 소모 칼로리 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-white/80" />
            <span className="text-sm text-white/80">소모 칼로리</span>
          </div>
          <p className="text-2xl font-bold">{totalCalories.toLocaleString()}kcal</p>
        </div>

        {/* 볼륨 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-white/80" />
            <span className="text-sm text-white/80">총 볼륨</span>
          </div>
          <p className="text-2xl font-bold">{totalVolume.toLocaleString()}kg</p>
        </div>
      </div>

      {/* 목표 달성률 */}
      <div className="mt-6 pt-4 border-t border-white/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/80">목표 달성률</span>
          <span className="text-lg font-bold">{completionRate}%</span>
        </div>
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              completionRate >= 80
                ? 'bg-green-400'
                : completionRate >= 50
                  ? 'bg-yellow-400'
                  : 'bg-white'
            }`}
            style={{ width: `${completionRate}%` }}
          />
        </div>
        {completionRate >= 80 && (
          <p className="text-sm text-green-300 mt-2">목표 80% 달성!</p>
        )}
      </div>
    </div>
  );
}
