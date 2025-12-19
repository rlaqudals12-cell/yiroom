import React, { useState } from 'react';

// 이룸 컬러 팔레트
const colors = {
  primary: '#7C3AED', // 퍼플
  primaryLight: '#A78BFA',
  secondary: '#4CD4A1', // 민트 그린
  coral: '#FF6B6B',
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
};

// 원형 프로그레스 링
const ProgressRing = ({ progress, size = 160, strokeWidth = 12, children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        {/* 진행 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
};

// 스트릭 배지
const StreakBadge = ({ days }) => (
  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-100 to-red-100 rounded-full">
    <span className="text-lg">🔥</span>
    <span className="text-sm font-semibold text-orange-600">{days}일 연속 달성 중!</span>
  </div>
);

// 운동 추천 카드
const WorkoutCard = ({ workout, onStart }) => {
  const matchColor = workout.matchScore >= 80 ? colors.success : 
                     workout.matchScore >= 60 ? colors.warning : colors.coral;
  
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      {/* 이미지 영역 */}
      <div className="h-32 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
        <span className="text-5xl">{workout.emoji}</span>
      </div>
      
      {/* 콘텐츠 영역 */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-gray-800">{workout.title}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: `${matchColor}20`, color: matchColor }}>
            ✨ {workout.matchScore}% 매칭
          </span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <span>⏱️ {workout.duration}분</span>
          <span>•</span>
          <span>{workout.difficulty}</span>
          <span>•</span>
          <span>{workout.equipment}</span>
        </div>
        
        {workout.reason && (
          <p className="text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded-lg mb-3">
            "{workout.reason}"
          </p>
        )}
        
        <button 
          onClick={onStart}
          className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          시작하기
        </button>
      </div>
    </div>
  );
};

// 바텀 네비게이션
const BottomNav = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', icon: '🏠', label: '홈' },
    { id: 'explore', icon: '🔍', label: '탐색' },
    { id: 'history', icon: '📊', label: '기록' },
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
export default function WorkoutDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  
  // 샘플 데이터
  const userData = {
    name: '민지',
    bodyType: 'Y',
    completedToday: 3,
    totalToday: 4,
    streak: 3,
  };
  
  const progress = (userData.completedToday / userData.totalToday) * 100;
  
  const recommendedWorkouts = [
    {
      id: 1,
      emoji: '🏋️',
      title: '힙업 스쿼트',
      matchScore: 92,
      duration: 15,
      difficulty: '초급',
      equipment: '맨몸',
      reason: 'Y체형 하체 밸런스에 효과적',
    },
    {
      id: 2,
      emoji: '🧘',
      title: '어깨 스트레칭',
      matchScore: 88,
      duration: 10,
      difficulty: '초급',
      equipment: '맨몸',
      reason: null,
    },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">이룸</span>
          </div>
          <span className="font-bold text-gray-800">운동</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            🔔
          </button>
          <button className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-white font-bold">
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
            {userData.bodyType}체형에 맞는 운동을 준비했어요
          </p>
        </div>
        
        {/* 프로그레스 카드 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
          <div className="flex flex-col items-center">
            <ProgressRing progress={progress}>
              <span className="text-3xl font-bold text-gray-800">{Math.round(progress)}%</span>
              <span className="text-sm text-gray-500">{userData.completedToday}/{userData.totalToday} 완료</span>
            </ProgressRing>
            <p className="mt-4 text-gray-600 font-medium">오늘의 운동 목표</p>
          </div>
        </div>
        
        {/* 스트릭 배지 */}
        <div className="flex justify-center mb-6">
          <StreakBadge days={userData.streak} />
        </div>
        
        {/* 추천 운동 섹션 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">✨ 오늘의 추천 운동</h2>
          </div>
          
          <div className="space-y-4">
            {recommendedWorkouts.map(workout => (
              <WorkoutCard 
                key={workout.id} 
                workout={workout}
                onStart={() => alert(`${workout.title} 시작!`)}
              />
            ))}
          </div>
        </div>
        
        {/* 전체 보기 버튼 */}
        <button className="w-full py-3 text-purple-600 font-semibold text-center">
          전체 운동 보기 →
        </button>
      </div>
      
      {/* 바텀 네비게이션 */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
