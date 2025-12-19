import React, { useState } from 'react';

// 스트릭 캘린더
const StreakCalendar = ({ year, month, completedDates }) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();
  
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  
  const isCompleted = (day) => completedDates.includes(day);
  const isToday = (day) => isCurrentMonth && day === todayDate;
  
  // 빈 칸 + 날짜 배열 생성
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      {/* 월 표시 */}
      <div className="flex items-center justify-between mb-4">
        <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
          ←
        </button>
        <h3 className="font-bold text-gray-800">{year}년 {monthNames[month]}</h3>
        <button className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
          →
        </button>
      </div>
      
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day, i) => (
          <div 
            key={i} 
            className={`text-center text-xs font-medium py-1 ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => (
          <div key={i} className="aspect-square flex items-center justify-center">
            {day && (
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${
                isToday(day)
                  ? 'bg-purple-500 text-white font-bold'
                  : isCompleted(day)
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100'
              }`}>
                {isCompleted(day) && !isToday(day) ? '✓' : day}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* 범례 */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-100 rounded-full" />
          <span>완료</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-purple-500 rounded-full" />
          <span>오늘</span>
        </div>
      </div>
    </div>
  );
};

// 주간 요약 카드
const WeeklySummaryCard = ({ data }) => (
  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-5 text-white">
    <h3 className="font-medium mb-4 opacity-90">이번 주 요약</h3>
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center">
        <p className="text-3xl font-bold">🔥 {data.calories}</p>
        <p className="text-xs opacity-80 mt-1">kcal 소모</p>
      </div>
      <div className="text-center">
        <p className="text-3xl font-bold">⏱️ {data.duration}</p>
        <p className="text-xs opacity-80 mt-1">분 운동</p>
      </div>
      <div className="text-center">
        <p className="text-3xl font-bold">💪 {data.sets}</p>
        <p className="text-xs opacity-80 mt-1">세트 완료</p>
      </div>
    </div>
    
    {/* 지난주 대비 */}
    <div className="mt-4 pt-4 border-t border-white/20">
      <div className="flex items-center justify-center gap-2">
        <span className={`text-sm ${data.change >= 0 ? 'text-green-300' : 'text-red-300'}`}>
          {data.change >= 0 ? '📈' : '📉'} 지난주 대비 {data.change >= 0 ? '+' : ''}{data.change}%
        </span>
      </div>
    </div>
  </div>
);

// 주간 막대 차트
const WeeklyBarChart = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.calories));
  const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
  
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <h3 className="font-bold text-gray-800 mb-4">주간 활동</h3>
      <div className="flex items-end justify-between h-32 gap-2">
        {data.map((day, i) => {
          const height = maxValue > 0 ? (day.calories / maxValue) * 100 : 0;
          const isToday = i === new Date().getDay() - 1;
          
          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div className="w-full h-24 flex items-end justify-center">
                <div 
                  className={`w-full max-w-8 rounded-t-lg transition-all ${
                    day.completed 
                      ? 'bg-gradient-to-t from-purple-500 to-indigo-400' 
                      : 'bg-gray-200'
                  }`}
                  style={{ height: `${Math.max(height, 10)}%` }}
                />
              </div>
              <span className={`text-xs mt-2 ${isToday ? 'font-bold text-purple-600' : 'text-gray-400'}`}>
                {dayNames[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 운동 히스토리 아이템
const HistoryItem = ({ session }) => {
  const ratingEmojis = ['', '😫', '😐', '🙂', '😊', '🤩'];
  
  const formatDate = (date) => {
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = dayNames[d.getDay()];
    return `${month}/${day} (${dayName})`;
  };
  
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center">
        <span className="text-2xl">{session.emoji}</span>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-semibold text-gray-800">{session.title}</h4>
          <span className="text-lg">{ratingEmojis[session.rating]}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{formatDate(session.date)}</span>
          <span>•</span>
          <span>🔥 {session.calories}kcal</span>
          <span>•</span>
          <span>⏱️ {session.duration}분</span>
        </div>
      </div>
    </div>
  );
};

// 스트릭 배지 (큰 버전)
const StreakBadgeLarge = ({ current, best }) => (
  <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-5 border border-orange-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-orange-600 mb-1">🔥 현재 스트릭</p>
        <p className="text-4xl font-bold text-orange-600">{current}일</p>
      </div>
      <div className="text-right">
        <p className="text-sm text-gray-500 mb-1">🏆 최고 기록</p>
        <p className="text-2xl font-bold text-gray-600">{best}일</p>
      </div>
    </div>
    
    {/* 프로그레스 */}
    <div className="mt-4">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>다음 보상까지</span>
        <span>{7 - (current % 7)}일 남음</span>
      </div>
      <div className="h-2 bg-orange-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full"
          style={{ width: `${(current % 7) / 7 * 100}%` }}
        />
      </div>
    </div>
  </div>
);

// 메인 기록/통계 페이지
export default function WorkoutHistory() {
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'
  
  // 샘플 데이터
  const completedDates = [1, 2, 3, 5, 6, 8, 9, 10, 11, 13, 15, 16, 17, 18];
  const currentStreak = 4;
  const bestStreak = 14;
  
  const weeklySummary = {
    calories: 750,
    duration: 135,
    sets: 45,
    change: 15,
  };
  
  const weeklyData = [
    { calories: 150, completed: true },
    { calories: 180, completed: true },
    { calories: 120, completed: true },
    { calories: 0, completed: false },
    { calories: 200, completed: true },
    { calories: 0, completed: false },
    { calories: 0, completed: false },
  ];
  
  const recentSessions = [
    {
      id: 1,
      emoji: '🏋️',
      title: '힙업 스쿼트',
      date: '2024-12-17',
      calories: 125,
      duration: 18,
      rating: 4,
    },
    {
      id: 2,
      emoji: '🧘',
      title: '전신 스트레칭',
      date: '2024-12-16',
      calories: 85,
      duration: 15,
      rating: 5,
    },
    {
      id: 3,
      emoji: '💪',
      title: '코어 강화 운동',
      date: '2024-12-15',
      calories: 150,
      duration: 20,
      rating: 3,
    },
    {
      id: 4,
      emoji: '🦵',
      title: '하체 집중 루틴',
      date: '2024-12-13',
      calories: 180,
      duration: 25,
      rating: 4,
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
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-500'
            }`}
          >
            주간
          </button>
          <button 
            onClick={() => setViewMode('month')}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              viewMode === 'month' 
                ? 'bg-white text-purple-600 shadow-sm' 
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
        
        {/* 캘린더 */}
        <StreakCalendar 
          year={2024} 
          month={11} 
          completedDates={completedDates}
        />
        
        {/* 주간 요약 */}
        <WeeklySummaryCard data={weeklySummary} />
        
        {/* 주간 차트 */}
        <WeeklyBarChart data={weeklyData} />
        
        {/* 최근 운동 */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">최근 운동</h2>
          <div className="space-y-3">
            {recentSessions.map(session => (
              <HistoryItem key={session.id} session={session} />
            ))}
          </div>
          
          <button className="w-full mt-4 py-3 text-purple-600 font-medium text-center">
            전체 기록 보기 →
          </button>
        </div>
      </div>
      
      {/* 바텀 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-around">
        {[
          { id: 'home', icon: '🏠', label: '홈' },
          { id: 'explore', icon: '🔍', label: '탐색' },
          { id: 'history', icon: '📊', label: '기록', active: true },
          { id: 'my', icon: '👤', label: 'MY' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`flex flex-col items-center py-1 px-4 rounded-lg ${
              tab.active ? 'text-purple-600' : 'text-gray-400'
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
