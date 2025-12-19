import React, { useState } from 'react';

// 이룸 통합 홈 대시보드
// Phase 1 완료 후 W-1/N-1 모듈을 통합한 메인 화면

// 미니 원형 프로그레스
const MiniProgressRing = ({ progress, size = 48, color = '#7C3AED' }) => {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{ color }}>{progress}%</span>
      </div>
    </div>
  );
};

// 오늘의 요약 카드
const TodaySummaryCard = ({ workout, nutrition }) => (
  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
    <h2 className="font-bold text-gray-800 mb-4">📊 오늘의 요약</h2>
    
    <div className="grid grid-cols-2 gap-4">
      {/* 운동 */}
      <div className="bg-purple-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-purple-700">💪 운동</span>
          <MiniProgressRing progress={workout.progress} color="#7C3AED" />
        </div>
        <p className="text-2xl font-bold text-purple-700">{workout.completed}/{workout.total}</p>
        <p className="text-xs text-purple-500">세트 완료</p>
        {workout.streak > 0 && (
          <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full inline-block">
            🔥 {workout.streak}일 연속
          </div>
        )}
      </div>
      
      {/* 영양 */}
      <div className="bg-green-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-green-700">🥗 영양</span>
          <MiniProgressRing progress={nutrition.progress} color="#10B981" />
        </div>
        <p className="text-2xl font-bold text-green-700">{nutrition.consumed.toLocaleString()}</p>
        <p className="text-xs text-green-500">/ {nutrition.target.toLocaleString()} kcal</p>
        {nutrition.streak > 0 && (
          <div className="mt-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full inline-block">
            📝 {nutrition.streak}일 연속
          </div>
        )}
      </div>
    </div>
  </div>
);

// 체형 인사이트 카드
const BodyTypeInsightCard = ({ bodyType, insight }) => (
  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-5 text-white">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
        <span className="text-lg">✨</span>
      </div>
      <div>
        <p className="text-sm opacity-80">오늘의 {bodyType}체형 팁</p>
        <p className="font-bold">{insight.title}</p>
      </div>
    </div>
    <p className="text-sm opacity-90 leading-relaxed">{insight.description}</p>
  </div>
);

// 빠른 액션 버튼
const QuickActionButton = ({ emoji, label, color, onClick }) => (
  <button 
    onClick={onClick}
    className="flex-1 py-4 rounded-xl font-medium transition-all hover:scale-105 active:scale-95"
    style={{ backgroundColor: `${color}15`, color }}
  >
    <span className="text-2xl block mb-1">{emoji}</span>
    <span className="text-sm">{label}</span>
  </button>
);

// 추천 운동 미니 카드
const WorkoutMiniCard = ({ workout, onStart }) => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
      <span className="text-2xl">{workout.emoji}</span>
    </div>
    <div className="flex-1">
      <h4 className="font-semibold text-gray-800">{workout.title}</h4>
      <p className="text-xs text-gray-500">{workout.duration}분 • {workout.difficulty}</p>
    </div>
    <div className="text-right">
      <span className="text-xs text-green-600 font-medium">{workout.matchScore}% 매칭</span>
      <button 
        onClick={onStart}
        className="mt-1 px-3 py-1 bg-purple-500 text-white text-xs rounded-lg hover:bg-purple-600"
      >
        시작
      </button>
    </div>
  </div>
);

// 추천 음식 미니 카드
const FoodMiniCard = ({ food, onAdd }) => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
      <span className="text-2xl">{food.emoji}</span>
    </div>
    <div className="flex-1">
      <h4 className="font-semibold text-gray-800">{food.name}</h4>
      <p className="text-xs text-gray-500">{food.calories}kcal • {food.reason}</p>
    </div>
    <button 
      onClick={onAdd}
      className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600"
    >
      추가
    </button>
  </div>
);

// 끼니 퀵 로그
const MealQuickLog = ({ meals }) => {
  const mealConfig = {
    breakfast: { icon: '🌅', label: '아침' },
    lunch: { icon: '☀️', label: '점심' },
    dinner: { icon: '🌙', label: '저녁' },
    snack: { icon: '🍪', label: '간식' },
  };
  
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800">🍽️ 오늘의 식단</h3>
        <button className="text-sm text-green-600 font-medium">전체 보기</button>
      </div>
      <div className="flex gap-2">
        {Object.entries(mealConfig).map(([type, config]) => {
          const meal = meals.find(m => m.type === type);
          const hasLog = meal && meal.calories > 0;
          
          return (
            <button 
              key={type}
              className={`flex-1 py-3 rounded-xl text-center transition-all ${
                hasLog 
                  ? 'bg-green-50 border-2 border-green-200' 
                  : 'bg-gray-50 border-2 border-dashed border-gray-200 hover:border-green-300'
              }`}
            >
              <span className="text-lg block">{config.icon}</span>
              <span className={`text-xs ${hasLog ? 'text-green-600' : 'text-gray-400'}`}>
                {hasLog ? `${meal.calories}` : '+ 기록'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// 주간 캘린더 미니
const WeeklyMiniCalendar = ({ data }) => {
  const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;
  
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800">📅 이번 주</h3>
        <span className="text-sm text-gray-500">12월 3주차</span>
      </div>
      <div className="flex justify-between">
        {dayNames.map((day, i) => {
          const dayData = data[i];
          const isToday = i === todayIndex;
          
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className={`text-xs ${isToday ? 'font-bold text-purple-600' : 'text-gray-400'}`}>
                {day}
              </span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isToday 
                  ? 'bg-purple-500 text-white' 
                  : dayData?.workout && dayData?.nutrition
                    ? 'bg-green-100 text-green-600'
                    : dayData?.workout || dayData?.nutrition
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-gray-100 text-gray-400'
              }`}>
                {dayData?.workout && dayData?.nutrition ? '✓' : 
                 dayData?.workout ? '💪' : 
                 dayData?.nutrition ? '🥗' : '·'}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 범례 */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-400 rounded-full" /> 모두 완료
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 bg-yellow-400 rounded-full" /> 일부 완료
        </span>
      </div>
    </div>
  );
};

// 포인트 & 레벨 배지
const PointsBadge = ({ points, level }) => (
  <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-full">
    <span className="text-sm">⭐</span>
    <span className="text-sm font-bold text-yellow-700">{points.toLocaleString()}P</span>
    <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">Lv.{level}</span>
  </div>
);

// 바텀 네비게이션
const BottomNav = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', icon: '🏠', label: '홈' },
    { id: 'workout', icon: '💪', label: '운동' },
    { id: 'nutrition', icon: '🥗', label: '영양' },
    { id: 'my', icon: '👤', label: 'MY' },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-around">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex flex-col items-center py-1 px-4 rounded-lg transition-colors ${
            activeTab === tab.id ? 'text-purple-600' : 'text-gray-400'
          }`}
        >
          <span className="text-xl mb-0.5">{tab.icon}</span>
          <span className="text-xs font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

// 메인 통합 대시보드
export default function IntegratedHomeDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  
  // 샘플 데이터
  const userData = {
    name: '민지',
    bodyType: 'Y',
    points: 1250,
    level: 3,
  };
  
  const todayWorkout = {
    completed: 2,
    total: 4,
    progress: 50,
    streak: 4,
  };
  
  const todayNutrition = {
    consumed: 1250,
    target: 1800,
    progress: 69,
    streak: 5,
  };
  
  const bodyTypeInsight = {
    title: '하체 운동 집중의 날',
    description: 'Y체형은 상체보다 하체 볼륨을 키우면 전체적인 균형이 좋아져요. 오늘 추천 운동으로 힙업 효과를 노려보세요!',
  };
  
  const recommendedWorkout = {
    emoji: '🏋️',
    title: '힙업 스쿼트',
    duration: 15,
    difficulty: '초급',
    matchScore: 92,
  };
  
  const recommendedFood = {
    emoji: '🥗',
    name: '닭가슴살 샐러드',
    calories: 285,
    reason: '단백질 보충',
  };
  
  const meals = [
    { type: 'breakfast', calories: 285 },
    { type: 'lunch', calories: 520 },
    { type: 'dinner', calories: 0 },
    { type: 'snack', calories: 0 },
  ];
  
  const weeklyData = [
    { workout: true, nutrition: true },
    { workout: true, nutrition: true },
    { workout: true, nutrition: false },
    { workout: false, nutrition: true },
    { workout: false, nutrition: false }, // 오늘 (진행 중)
    { workout: false, nutrition: false },
    { workout: false, nutrition: false },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-lg font-bold">이룸</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PointsBadge points={userData.points} level={userData.level} />
          <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            🔔
          </button>
        </div>
      </div>
      
      {/* 메인 콘텐츠 */}
      <div className="px-5 py-6 space-y-5">
        {/* 인사 */}
        <div>
          <h1 className="text-xl font-bold text-gray-800">
            안녕하세요, {userData.name}님! 👋
          </h1>
          <p className="text-gray-500">{userData.bodyType}체형에 맞춘 오늘의 웰니스</p>
        </div>
        
        {/* 오늘의 요약 */}
        <TodaySummaryCard workout={todayWorkout} nutrition={todayNutrition} />
        
        {/* 빠른 액션 */}
        <div className="flex gap-3">
          <QuickActionButton 
            emoji="🏋️" 
            label="운동 시작" 
            color="#7C3AED"
            onClick={() => setActiveTab('workout')}
          />
          <QuickActionButton 
            emoji="📷" 
            label="식단 기록" 
            color="#10B981"
            onClick={() => setActiveTab('nutrition')}
          />
        </div>
        
        {/* 체형 인사이트 */}
        <BodyTypeInsightCard bodyType={userData.bodyType} insight={bodyTypeInsight} />
        
        {/* 끼니 퀵 로그 */}
        <MealQuickLog meals={meals} />
        
        {/* 추천 섹션 */}
        <div>
          <h2 className="font-bold text-gray-800 mb-3">✨ 오늘의 추천</h2>
          <div className="space-y-3">
            <WorkoutMiniCard 
              workout={recommendedWorkout}
              onStart={() => alert('운동 시작')}
            />
            <FoodMiniCard 
              food={recommendedFood}
              onAdd={() => alert('음식 추가')}
            />
          </div>
        </div>
        
        {/* 주간 캘린더 */}
        <WeeklyMiniCalendar data={weeklyData} />
      </div>
      
      {/* 바텀 네비게이션 */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
