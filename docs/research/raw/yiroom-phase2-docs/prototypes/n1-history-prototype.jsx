import React, { useState } from 'react';

// 주간 칼로리 막대 차트
const WeeklyCalorieChart = ({ data, targetCalories }) => {
  const maxValue = Math.max(...data.map(d => d.calories), targetCalories);
  const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
  
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800">주간 칼로리</h3>
        <span className="text-sm text-gray-500">목표: {targetCalories.toLocaleString()} kcal</span>
      </div>
      
      <div className="flex items-end justify-between h-36 gap-2">
        {data.map((day, i) => {
          const height = maxValue > 0 ? (day.calories / maxValue) * 100 : 0;
          const targetHeight = (targetCalories / maxValue) * 100;
          const isToday = i === new Date().getDay() - 1;
          const isOverTarget = day.calories > targetCalories;
          
          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="w-full h-28 flex items-end justify-center relative">
                {/* 목표선 */}
                <div 
                  className="absolute w-full border-t-2 border-dashed border-gray-300"
                  style={{ bottom: `${targetHeight}%` }}
                />
                {/* 바 */}
                <div 
                  className={`w-full max-w-8 rounded-t-lg transition-all ${
                    day.calories === 0 
                      ? 'bg-gray-100'
                      : isOverTarget 
                        ? 'bg-gradient-to-t from-orange-400 to-red-400' 
                        : 'bg-gradient-to-t from-green-400 to-emerald-400'
                  }`}
                  style={{ height: `${Math.max(height, 5)}%` }}
                />
              </div>
              <span className={`text-xs mt-2 ${isToday ? 'font-bold text-green-600' : 'text-gray-400'}`}>
                {dayNames[i]}
              </span>
              <span className="text-xs text-gray-400">
                {day.calories > 0 ? day.calories : '-'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 매크로 밸런스 파이 차트
const MacroBalancePie = ({ actual, target }) => {
  const total = actual.carbs + actual.protein + actual.fat;
  
  const calculatePercentage = (value) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };
  
  const carbsPercent = calculatePercentage(actual.carbs);
  const proteinPercent = calculatePercentage(actual.protein);
  const fatPercent = 100 - carbsPercent - proteinPercent;
  
  // SVG 파이 차트 계산
  const createPieSlice = (percentage, offset, color) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = (percentage / 100) * circumference;
    const strokeDashoffset = -(offset / 100) * circumference;
    
    return (
      <circle
        cx="80"
        cy="80"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="24"
        strokeDasharray={`${strokeDasharray} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        transform="rotate(-90 80 80)"
      />
    );
  };
  
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <h3 className="font-bold text-gray-800 mb-4">영양 밸런스</h3>
      
      <div className="flex items-center justify-center gap-8">
        {/* 파이 차트 */}
        <div className="relative">
          <svg width="160" height="160">
            {createPieSlice(carbsPercent, 0, '#4CD4A1')}
            {createPieSlice(proteinPercent, carbsPercent, '#FF6B9D')}
            {createPieSlice(fatPercent, carbsPercent + proteinPercent, '#FFB347')}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-800">{total}g</span>
            <span className="text-xs text-gray-500">총 섭취량</span>
          </div>
        </div>
        
        {/* 범례 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#4CD4A1]" />
            <span className="text-sm text-gray-600">탄수화물</span>
            <span className="text-sm font-bold text-gray-800 ml-auto">{carbsPercent}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF6B9D]" />
            <span className="text-sm text-gray-600">단백질</span>
            <span className="text-sm font-bold text-gray-800 ml-auto">{proteinPercent}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FFB347]" />
            <span className="text-sm text-gray-600">지방</span>
            <span className="text-sm font-bold text-gray-800 ml-auto">{fatPercent}%</span>
          </div>
        </div>
      </div>
      
      {/* 목표 대비 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-xl">
        <p className="text-sm text-gray-600 text-center">
          목표 비율: 탄 {target.carbs}% / 단 {target.protein}% / 지 {target.fat}%
        </p>
      </div>
    </div>
  );
};

// 자주 먹는 음식 TOP 5
const TopFoodsCard = ({ foods }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
    <h3 className="font-bold text-gray-800 mb-4">🥗 자주 먹은 음식 TOP 5</h3>
    <div className="space-y-3">
      {foods.map((food, index) => (
        <div key={index} className="flex items-center gap-3">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
            index === 0 ? 'bg-yellow-100 text-yellow-600' :
            index === 1 ? 'bg-gray-100 text-gray-600' :
            index === 2 ? 'bg-orange-100 text-orange-600' :
            'bg-gray-50 text-gray-400'
          }`}>
            {index + 1}
          </span>
          <span className="text-2xl">{food.emoji}</span>
          <span className="flex-1 text-gray-700">{food.name}</span>
          <span className="text-sm text-gray-400">{food.count}회</span>
        </div>
      ))}
    </div>
  </div>
);

// 주간 요약 카드
const WeeklySummaryCard = ({ data }) => (
  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-5 text-white">
    <h3 className="font-medium mb-4 opacity-90">이번 주 요약</h3>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-3xl font-bold">{data.avgCalories.toLocaleString()}</p>
        <p className="text-xs opacity-80 mt-1">평균 칼로리/일</p>
      </div>
      <div>
        <p className="text-3xl font-bold">{data.goalMetDays}/{data.totalDays}</p>
        <p className="text-xs opacity-80 mt-1">목표 달성일</p>
      </div>
    </div>
    
    {/* 달성률 */}
    <div className="mt-4 pt-4 border-t border-white/20">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="opacity-80">목표 달성률</span>
        <span className="font-bold">{Math.round((data.goalMetDays / data.totalDays) * 100)}%</span>
      </div>
      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
        <div 
          className="h-full bg-white rounded-full"
          style={{ width: `${(data.goalMetDays / data.totalDays) * 100}%` }}
        />
      </div>
    </div>
  </div>
);

// 일별 기록 아이템
const DailyLogItem = ({ log }) => {
  const formatDate = (date) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = dayNames[d.getDay()];
    return `${month}/${day} (${dayName})`;
  };
  
  const isGoalMet = log.calories <= log.targetCalories;
  
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-800">{formatDate(log.date)}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          isGoalMet ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
        }`}>
          {isGoalMet ? '목표 달성 ✓' : '초과'}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>🔥 {log.calories.toLocaleString()} kcal</span>
        <span>•</span>
        <span>아침 {log.breakfast} + 점심 {log.lunch} + 저녁 {log.dinner}</span>
      </div>
    </div>
  );
};

// 스트릭 배지
const StreakBadgeLarge = ({ current, best }) => (
  <div className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-2xl p-5 border border-green-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-green-600 mb-1">📝 현재 스트릭</p>
        <p className="text-4xl font-bold text-green-600">{current}일</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-500 mb-1">🏆 최고 기록</p>
        <p className="text-2xl font-bold text-gray-600">{best}일</p>
      </div>
    </div>
  </div>
);

// 메인 기록/통계 페이지
export default function NutritionHistory() {
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'
  
  // 샘플 데이터
  const targetCalories = 1800;
  const currentStreak = 5;
  const bestStreak = 12;
  
  const weeklyCalorieData = [
    { calories: 1650 },
    { calories: 1720 },
    { calories: 1800 },
    { calories: 1950 },
    { calories: 1780 },
    { calories: 0 },
    { calories: 0 },
  ];
  
  const macroActual = {
    carbs: 220,
    protein: 95,
    fat: 55,
  };
  
  const macroTarget = {
    carbs: 50,
    protein: 30,
    fat: 20,
  };
  
  const weeklySummary = {
    avgCalories: 1780,
    goalMetDays: 5,
    totalDays: 7,
  };
  
  const topFoods = [
    { emoji: '🍚', name: '공기밥', count: 12 },
    { emoji: '🥘', name: '김치찌개', count: 8 },
    { emoji: '🍗', name: '닭가슴살', count: 7 },
    { emoji: '🍳', name: '계란말이', count: 6 },
    { emoji: '🥛', name: '그릭요거트', count: 5 },
  ];
  
  const recentLogs = [
    {
      date: '2024-12-17',
      calories: 1720,
      targetCalories: 1800,
      breakfast: 285,
      lunch: 608,
      dinner: 827,
    },
    {
      date: '2024-12-16',
      calories: 1850,
      targetCalories: 1800,
      breakfast: 350,
      lunch: 720,
      dinner: 780,
    },
    {
      date: '2024-12-15',
      calories: 1650,
      targetCalories: 1800,
      breakfast: 280,
      lunch: 650,
      dinner: 720,
    },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-xl font-bold text-gray-800">기록</h1>
        <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
          <button 
            onClick={() => setViewMode('week')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              viewMode === 'week' 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-gray-500'
            }`}
          >
            주간
          </button>
          <button 
            onClick={() => setViewMode('month')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              viewMode === 'month' 
                ? 'bg-white text-green-600 shadow-sm' 
                : 'text-gray-500'
            }`}
          >
            월간
          </button>
        </div>
      </div>
      
      <div className="px-5 py-6 space-y-6">
        {/* 스트릭 배지 */}
        <StreakBadgeLarge current={currentStreak} best={bestStreak} />
        
        {/* 주간 요약 */}
        <WeeklySummaryCard data={weeklySummary} />
        
        {/* 주간 칼로리 차트 */}
        <WeeklyCalorieChart data={weeklyCalorieData} targetCalories={targetCalories} />
        
        {/* 영양 밸런스 */}
        <MacroBalancePie actual={macroActual} target={macroTarget} />
        
        {/* 자주 먹는 음식 */}
        <TopFoodsCard foods={topFoods} />
        
        {/* 최근 기록 */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">📝 최근 기록</h2>
          <div className="space-y-3">
            {recentLogs.map((log, index) => (
              <DailyLogItem key={index} log={log} />
            ))}
          </div>
          
          <button className="w-full mt-4 py-3 text-green-600 font-medium text-center">
            전체 기록 보기 →
          </button>
        </div>
      </div>
      
      {/* 바텀 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-around">
        {[
          { id: 'home', icon: '🏠', label: '홈' },
          { id: 'log', icon: '📷', label: '기록' },
          { id: 'history', icon: '📊', label: '통계', active: true },
          { id: 'my', icon: '👤', label: 'MY' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`flex flex-col items-center py-1 px-4 rounded-lg ${
              tab.active ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <span className="text-xl mb-0.5">{tab.icon}</span>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
