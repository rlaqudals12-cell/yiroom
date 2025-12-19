import React, { useState } from 'react';

// 운동 상세 화면
export default function WorkoutDetail() {
  const [isSaved, setIsSaved] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'like' | 'dislike' | null
  
  // 샘플 운동 데이터
  const workout = {
    id: 1,
    title: '힙업 스쿼트',
    emoji: '🏋️',
    rating: 4.8,
    reviewCount: 128,
    duration: 15,
    difficulty: '초급',
    equipment: '맨몸',
    calories: 120,
    matchScore: 92,
    recommendReason: 'Y체형의 하체 볼륨 밸런스에 효과적이에요. 엉덩이 근육을 강화하면서 허벅지 라인을 정리할 수 있어요.',
    targetAreas: ['하체', '엉덩이', '코어'],
    exercises: [
      { name: '워밍업', duration: 3, type: 'warmup' },
      { name: '스쿼트', sets: 3, reps: 15, type: 'main' },
      { name: '사이드 런지', sets: 3, reps: 12, type: 'main' },
      { name: '글루트 브릿지', sets: 3, reps: 15, type: 'main' },
      { name: '쿨다운 스트레칭', duration: 2, type: 'cooldown' },
    ],
    cautions: [
      '무릎이 발끝을 넘지 않도록 주의하세요',
      '허리를 곧게 유지하세요',
      '호흡을 멈추지 마세요',
    ],
  };
  
  const getDifficultyColor = (diff) => {
    switch (diff) {
      case '초급': return 'bg-green-100 text-green-700';
      case '중급': return 'bg-yellow-100 text-yellow-700';
      case '고급': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 헤더 */}
      <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-gray-100 sticky top-0 z-10">
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600">
          ←
        </button>
        <button 
          onClick={() => setIsSaved(!isSaved)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isSaved ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          {isSaved ? '❤️' : '🤍'}
        </button>
      </div>
      
      {/* 미리보기 이미지 */}
      <div className="h-56 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <span className="text-7xl block mb-2">{workout.emoji}</span>
          <span className="text-sm text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            미리보기 GIF
          </span>
        </div>
      </div>
      
      {/* 콘텐츠 */}
      <div className="px-5 py-6">
        {/* 제목 및 평점 */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{workout.title}</h1>
          <div className="flex items-center gap-2">
            <span className="text-yellow-500">⭐</span>
            <span className="font-medium text-gray-700">{workout.rating}</span>
            <span className="text-gray-400">({workout.reviewCount} 리뷰)</span>
          </div>
        </div>
        
        {/* 메타 태그 */}
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            ⏱️ {workout.duration}분
          </span>
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getDifficultyColor(workout.difficulty)}`}>
            {workout.difficulty}
          </span>
          <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            {workout.equipment}
          </span>
          <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
            🔥 {workout.calories} kcal
          </span>
        </div>
        
        {/* AI 추천 이유 */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-5 mb-6 border border-purple-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">✨</span>
            <span className="font-semibold text-purple-700">AI 추천 이유</span>
            <span className="ml-auto px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              {workout.matchScore}% 매칭
            </span>
          </div>
          <p className="text-gray-700 leading-relaxed">
            "{workout.recommendReason}"
          </p>
        </div>
        
        {/* 운동 구성 */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📋</span> 운동 구성
          </h2>
          <div className="space-y-3">
            {workout.exercises.map((ex, index) => (
              <div 
                key={index}
                className={`p-4 rounded-xl border ${
                  ex.type === 'warmup' 
                    ? 'bg-blue-50 border-blue-100' 
                    : ex.type === 'cooldown'
                      ? 'bg-green-50 border-green-100'
                      : 'bg-white border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      ex.type === 'warmup' 
                        ? 'bg-blue-200 text-blue-700' 
                        : ex.type === 'cooldown'
                          ? 'bg-green-200 text-green-700'
                          : 'bg-purple-200 text-purple-700'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-medium text-gray-800">{ex.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {ex.duration ? `${ex.duration}분` : `${ex.sets}세트 × ${ex.reps}회`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 타겟 부위 */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🎯</span> 타겟 부위
          </h2>
          <div className="flex flex-wrap gap-2">
            {workout.targetAreas.map((area, index) => (
              <span 
                key={index}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full font-medium"
              >
                {area}
              </span>
            ))}
          </div>
        </div>
        
        {/* 주의사항 */}
        <div className="mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>⚠️</span> 주의사항
          </h2>
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
            <ul className="space-y-2">
              {workout.cautions.map((caution, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span>{caution}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* 피드백 */}
        <div className="bg-gray-100 rounded-xl p-4">
          <p className="text-center text-gray-600 mb-3">이 운동이 마음에 드시나요?</p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => setFeedback('dislike')}
              className={`px-6 py-2 rounded-full transition-all ${
                feedback === 'dislike' 
                  ? 'bg-red-100 text-red-600 scale-110' 
                  : 'bg-white text-gray-500 hover:bg-red-50'
              }`}
            >
              👎 맞지 않아요
            </button>
            <button 
              onClick={() => setFeedback('like')}
              className={`px-6 py-2 rounded-full transition-all ${
                feedback === 'like' 
                  ? 'bg-green-100 text-green-600 scale-110' 
                  : 'bg-white text-gray-500 hover:bg-green-50'
              }`}
            >
              👍 좋아요
            </button>
          </div>
        </div>
      </div>
      
      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4">
        <button className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-lg rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
          <span>🎬</span> 운동 시작하기
        </button>
      </div>
    </div>
  );
}
