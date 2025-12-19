import React, { useState, useEffect } from 'react';

// 운동 실행 화면 (운동 중)
const ExerciseScreen = ({ exercise, currentSet, totalSets, onComplete, onExit }) => {
  const [reps, setReps] = useState(exercise.targetReps);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const progress = (currentSet / totalSets) * 100;
  
  const handleCompleteSet = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      onComplete(reps);
    }, 500);
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4">
        <button 
          onClick={onExit}
          className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center"
        >
          ✕
        </button>
        <div className="text-center">
          <p className="text-gray-400 text-sm">세트 {currentSet}/{totalSets}</p>
        </div>
        <button className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
          ⏸️
        </button>
      </div>
      
      {/* 프로그레스 바 */}
      <div className="px-5 mb-6">
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      {/* 운동 이름 */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold">{exercise.name}</h1>
      </div>
      
      {/* 운동 애니메이션 영역 */}
      <div className="flex-1 flex items-center justify-center px-5">
        <div className={`w-64 h-64 rounded-3xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center transition-transform duration-300 ${isAnimating ? 'scale-110' : ''}`}>
          <span className="text-8xl">{exercise.emoji}</span>
        </div>
      </div>
      
      {/* 반복 카운터 */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-6">
          <button 
            onClick={() => setReps(Math.max(0, reps - 1))}
            className="w-14 h-14 rounded-full bg-gray-800 text-2xl font-bold hover:bg-gray-700 transition-colors"
          >
            -
          </button>
          <div className="text-center">
            <span className="text-6xl font-bold">{reps}</span>
            <span className="text-2xl text-gray-400 ml-1">/{exercise.targetReps}</span>
            <p className="text-gray-400 mt-1">반복</p>
          </div>
          <button 
            onClick={() => setReps(reps + 1)}
            className="w-14 h-14 rounded-full bg-gray-800 text-2xl font-bold hover:bg-gray-700 transition-colors"
          >
            +
          </button>
        </div>
      </div>
      
      {/* 이전 기록 */}
      {exercise.previousRecord && (
        <div className="text-center mb-6">
          <p className="text-gray-400 text-sm">
            이전 기록: {exercise.previousRecord.reps}회 × {exercise.previousRecord.sets}세트
          </p>
        </div>
      )}
      
      {/* 팁 */}
      <div className="mx-5 mb-6 p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
        <p className="text-purple-300 text-sm">
          💡 <span className="font-medium">팁:</span> {exercise.tip}
        </p>
      </div>
      
      {/* 세트 완료 버튼 */}
      <div className="px-5 pb-8">
        <button 
          onClick={handleCompleteSet}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl font-bold text-lg hover:opacity-90 transition-opacity"
        >
          ✓ 세트 완료
        </button>
      </div>
    </div>
  );
};

// 휴식 화면
const RestScreen = ({ nextExercise, restTime, onSkip, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(restTime);
  
  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }
    
    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const progress = ((restTime - timeLeft) / restTime) * 100;
  
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4">
        <button className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
          ✕
        </button>
        <div className="text-center">
          <p className="text-gray-400 text-sm">휴식 시간</p>
        </div>
        <button 
          onClick={onSkip}
          className="px-4 py-2 rounded-full bg-gray-800 text-sm"
        >
          건너뛰기 ⏭️
        </button>
      </div>
      
      {/* 타이머 */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* 원형 타이머 */}
        <div className="relative w-48 h-48 mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="#374151"
              strokeWidth="8"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="url(#timerGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={553}
              strokeDashoffset={553 - (progress / 100) * 553}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4CD4A1" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold">{formatTime(timeLeft)}</span>
            <span className="text-gray-400 text-sm">/{formatTime(restTime)}</span>
          </div>
        </div>
        
        {/* 다음 운동 미리보기 */}
        <div className="w-full max-w-sm mx-auto px-5">
          <p className="text-gray-400 text-sm mb-3 text-center">다음 운동</p>
          <div className="bg-gray-800 rounded-xl p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
              <span className="text-3xl">{nextExercise.emoji}</span>
            </div>
            <div>
              <h3 className="font-semibold">{nextExercise.name}</h3>
              <p className="text-sm text-gray-400">
                {nextExercise.sets}세트 × {nextExercise.reps}회
              </p>
            </div>
          </div>
        </div>
        
        {/* 팁 */}
        <div className="mt-8 px-5">
          <p className="text-center text-gray-400">
            💧 물 한 잔 마시기 좋은 타이밍!
          </p>
        </div>
      </div>
      
      {/* 바로 시작 버튼 */}
      <div className="px-5 pb-8">
        <button 
          onClick={onSkip}
          className="w-full py-4 bg-gray-800 rounded-2xl font-bold text-lg hover:bg-gray-700 transition-colors"
        >
          ▶️ 바로 시작
        </button>
      </div>
    </div>
  );
};

// 운동 완료 화면
const CompletionScreen = ({ summary, onGoHome, onShare }) => {
  const [rating, setRating] = useState(0);
  const [showConfetti, setShowConfetti] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);
  
  const ratingEmojis = [
    { value: 1, emoji: '😫', label: '너무 힘들어' },
    { value: 2, emoji: '😐', label: '조금 힘들어' },
    { value: 3, emoji: '🙂', label: '보통' },
    { value: 4, emoji: '😊', label: '좋았어요' },
    { value: 5, emoji: '🤩', label: '최고!' },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-gray-900 text-white flex flex-col">
      {/* 컨페티 효과 */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-2xl animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 50}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            >
              {['🎉', '✨', '💪', '🔥', '⭐'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}
      
      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        {/* 축하 아이콘 */}
        <div className="text-7xl mb-4 animate-bounce">🎉</div>
        
        <h1 className="text-3xl font-bold mb-8">운동 완료!</h1>
        
        {/* 결과 카드 */}
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-orange-400">🔥 {summary.calories}</p>
              <p className="text-sm text-gray-400">kcal</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-400">⏱️ {summary.duration}</p>
              <p className="text-sm text-gray-400">분</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-400">💪 {summary.sets}</p>
              <p className="text-sm text-gray-400">세트</p>
            </div>
          </div>
        </div>
        
        {/* 스트릭 */}
        {summary.streak > 0 && (
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl px-6 py-3 mb-8">
            <p className="text-center">
              🔥 <span className="font-bold">{summary.streak}일 연속 달성!</span>
              <span className="text-yellow-400 ml-2">+{summary.points}P</span>
            </p>
          </div>
        )}
        
        {/* 평가 */}
        <div className="w-full max-w-sm mb-8">
          <p className="text-center text-gray-300 mb-4">이 운동이 어땠나요?</p>
          <div className="flex justify-between">
            {ratingEmojis.map((item) => (
              <button
                key={item.value}
                onClick={() => setRating(item.value)}
                className={`flex flex-col items-center p-2 rounded-xl transition-all ${
                  rating === item.value 
                    ? 'bg-white/20 scale-110' 
                    : 'hover:bg-white/10'
                }`}
              >
                <span className="text-3xl mb-1">{item.emoji}</span>
                <span className="text-xs text-gray-400">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* 버튼들 */}
      <div className="px-5 pb-8 space-y-3">
        <button 
          onClick={onShare}
          className="w-full py-4 bg-white/10 rounded-2xl font-bold text-lg hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
        >
          📤 공유하기
        </button>
        <button 
          onClick={onGoHome}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl font-bold text-lg hover:opacity-90 transition-opacity"
        >
          🏠 홈으로
        </button>
        <button className="w-full py-3 text-purple-300 font-medium">
          다음 추천 운동 보기 →
        </button>
      </div>
    </div>
  );
};

// 메인 앱 - 상태별 화면 전환
export default function WorkoutSession() {
  const [screen, setScreen] = useState('exercise'); // 'exercise' | 'rest' | 'completion'
  const [currentSet, setCurrentSet] = useState(1);
  
  const exercise = {
    name: '스쿼트',
    emoji: '🏋️',
    targetReps: 15,
    tip: '무릎이 발끝을 넘지 않게 주의하세요!',
    previousRecord: { reps: 15, sets: 3 },
  };
  
  const nextExercise = {
    name: '사이드 런지',
    emoji: '🦵',
    sets: 3,
    reps: 12,
  };
  
  const totalSets = 3;
  
  const handleCompleteSet = (reps) => {
    if (currentSet < totalSets) {
      setScreen('rest');
    } else {
      setScreen('completion');
    }
  };
  
  const handleRestComplete = () => {
    setCurrentSet(prev => prev + 1);
    setScreen('exercise');
  };
  
  const summary = {
    calories: 125,
    duration: 18,
    sets: 12,
    streak: 4,
    points: 20,
  };
  
  if (screen === 'exercise') {
    return (
      <ExerciseScreen
        exercise={exercise}
        currentSet={currentSet}
        totalSets={totalSets}
        onComplete={handleCompleteSet}
        onExit={() => alert('운동 종료')}
      />
    );
  }
  
  if (screen === 'rest') {
    return (
      <RestScreen
        nextExercise={nextExercise}
        restTime={60}
        onSkip={handleRestComplete}
        onTimeUp={handleRestComplete}
      />
    );
  }
  
  return (
    <CompletionScreen
      summary={summary}
      onGoHome={() => alert('홈으로')}
      onShare={() => alert('공유하기')}
    />
  );
}
