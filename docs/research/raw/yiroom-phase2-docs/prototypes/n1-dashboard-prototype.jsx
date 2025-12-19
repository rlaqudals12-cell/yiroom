import React, { useState } from 'react';

// 이룸 컬러 팔레트
const colors = {
  primary: '#7C3AED',
  secondary: '#4CD4A1',
  coral: '#FF6B6B',
  carbs: '#4CD4A1', // 민트 (탄수화물)
  protein: '#FF6B9D', // 핑크 (단백질)
  fat: '#FFB347', // 오렌지 (지방)
};

// 칼로리 원형 게이지
const CalorieRing = ({ consumed, target, burned = 0 }) => {
  const remaining = target - consumed + burned;
  const progress = Math.min((consumed / target) * 100, 100);
  const size = 180;
  const strokeWidth = 14;
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
          stroke="url(#calorieGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <defs>
          <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.secondary} />
            <stop offset="100%" stopColor={colors.primary} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-gray-800">{remaining.toLocaleString()}</span>
        <span className="text-sm text-gray-500">kcal 남음</span>
      </div>
    </div>
  );
};

// 매크로 진행 바
const MacroBar = ({ type, current, target, color }) => {
  const percentage = Math.min((current / target) * 100, 100);
  const labels = {
    carbs: '탄수화물',
    protein: '단백질',
    fat: '지방',
  };
  
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-16">{labels[type]}</span>
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm text-gray-600 w-20 text-right">
        {current}/{target}g
      </span>
    </div>
  );
};

// 끼니 카드
const MealCard = ({ meal, onAdd }) => {
  const icons = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍪',
  };
  const labels = {
    breakfast: '아침',
    lunch: '점심',
    dinner: '저녁',
    snack: '간식',
  };
  
  const hasFood = meal.foods && meal.foods.length > 0;
  
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icons[meal.type]}</span>
          <div>
            <h3 className="font-semibold text-gray-800">{labels[meal.type]}</h3>
            {hasFood ? (
              <p className="text-sm text-gray-500">
                {meal.foods.map(f => f.name).join(', ')}
              </p>
            ) : (
              <p className="text-sm text-gray-400">아직 기록 없음</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasFood && (
            <span className="text-sm font-medium text-gray-600">
              {meal.calories} kcal
            </span>
          )}
          <button 
            onClick={onAdd}
            className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold hover:bg-purple-200 transition-colors"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

// 추천 음식 카드
const FoodRecommendCard = ({ food, onAdd }) => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
      <span className="text-3xl">{food.emoji}</span>
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-gray-800">{food.name}</h3>
      <p className="text-sm text-green-600 mb-1">🟢 {food.reason}</p>
      <p className="text-xs text-gray-500">
        {food.calories}kcal • P:{food.protein}g
      </p>
    </div>
    <button 
      onClick={onAdd}
      className="px-3 py-1.5 bg-purple-100 text-purple-600 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
    >
      추가
    </button>
  </div>
);

// 스트릭 배지
const StreakBadge = ({ days }) => (
  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full">
    <span className="text-lg">📝</span>
    <span className="text-sm font-semibold text-green-600">{days}일 연속 기록 중!</span>
  </div>
);

// 바텀 네비게이션
const BottomNav = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', icon: '🏠', label: '홈' },
    { id: 'log', icon: '📷', label: '기록' },
    { id: 'explore', icon: '🔍', label: '탐색' },
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

// 메인 대시보드
export default function NutritionDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  
  // 샘플 데이터
  const userData = {
    name: '민지',
    streak: 5,
  };
  
  const nutritionData = {
    target: {
      calories: 1800,
      carbs: 180,
      protein: 80,
      fat: 60,
    },
    consumed: {
      calories: 550,
      carbs: 65,
      protein: 28,
      fat: 15,
    },
    burned: 0,
  };
  
  const meals = [
    {
      type: 'breakfast',
      calories: 285,
      foods: [{ name: '그릭요거트' }, { name: '바나나' }],
    },
    {
      type: 'lunch',
      calories: 265,
      foods: [{ name: '샐러드' }],
    },
    {
      type: 'dinner',
      calories: 0,
      foods: [],
    },
    {
      type: 'snack',
      calories: 0,
      foods: [],
    },
  ];
  
  const recommendedFood = {
    emoji: '🥗',
    name: '닭가슴살 샐러드',
    reason: '단백질 보충에 딱!',
    calories: 285,
    protein: 35,
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">이룸</span>
          </div>
          <span className="font-bold text-gray-800">영양</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            🔔
          </button>
          <button className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center text-white font-bold">
            {userData.name[0]}
          </button>
        </div>
      </div>
      
      {/* 메인 콘텐츠 */}
      <div className="px-5 py-6">
        {/* 인사 섹션 */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-800 mb-1">
            안녕하세요, {userData.name}님! 👋
          </h1>
          <p className="text-gray-500">
            오늘도 건강한 식단 함께해요
          </p>
        </div>
        
        {/* 칼로리 카드 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
          <div className="flex flex-col items-center mb-6">
            <CalorieRing 
              consumed={nutritionData.consumed.calories}
              target={nutritionData.target.calories}
              burned={nutritionData.burned}
            />
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <span>섭취 {nutritionData.consumed.calories}</span>
              <span>•</span>
              <span>운동 {nutritionData.burned}</span>
              <span>•</span>
              <span>잔여 {nutritionData.target.calories - nutritionData.consumed.calories}</span>
            </div>
          </div>
          
          {/* 매크로 진행 바 */}
          <div className="space-y-3">
            <MacroBar 
              type="carbs" 
              current={nutritionData.consumed.carbs} 
              target={nutritionData.target.carbs}
              color={colors.carbs}
            />
            <MacroBar 
              type="protein" 
              current={nutritionData.consumed.protein} 
              target={nutritionData.target.protein}
              color={colors.protein}
            />
            <MacroBar 
              type="fat" 
              current={nutritionData.consumed.fat} 
              target={nutritionData.target.fat}
              color={colors.fat}
            />
          </div>
        </div>
        
        {/* 스트릭 배지 */}
        <div className="flex justify-center mb-6">
          <StreakBadge days={userData.streak} />
        </div>
        
        {/* 오늘의 식단 */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📝 오늘의 식단</h2>
          <div className="space-y-3">
            {meals.map((meal, index) => (
              <MealCard 
                key={index}
                meal={meal}
                onAdd={() => alert(`${meal.type} 기록하기`)}
              />
            ))}
          </div>
        </div>
        
        {/* 추천 음식 */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">✨ 오늘의 추천 음식</h2>
          <FoodRecommendCard 
            food={recommendedFood}
            onAdd={() => alert('음식 추가!')}
          />
        </div>
      </div>
      
      {/* 플로팅 기록 버튼 */}
      <button 
        className="fixed bottom-24 right-5 w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg flex items-center justify-center text-white text-2xl hover:opacity-90 transition-opacity"
        onClick={() => alert('식단 기록하기')}
      >
        📷
      </button>
      
      {/* 바텀 네비게이션 */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
