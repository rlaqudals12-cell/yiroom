import React, { useState } from 'react';

// 메인 기록 화면
const FoodLogMain = ({ onCamera, onSearch, mealType }) => {
  const mealLabels = {
    breakfast: '아침',
    lunch: '점심',
    dinner: '저녁',
    snack: '간식',
  };
  
  const recentFoods = [
    { id: 1, emoji: '🍳', name: '계란찜' },
    { id: 2, emoji: '🍚', name: '밥' },
    { id: 3, emoji: '🥘', name: '김치찌개' },
    { id: 4, emoji: '🍗', name: '닭가슴살' },
  ];
  
  const favoriteFoods = [
    { id: 1, emoji: '🥛', name: '그릭요거트' },
    { id: 2, emoji: '🥑', name: '아보카도' },
    { id: 3, emoji: '🍙', name: '현미밥' },
  ];
  
  const categories = [
    { id: 'rice', label: '밥/면류', emoji: '🍚' },
    { id: 'soup', label: '국/찌개', emoji: '🥘' },
    { id: 'side', label: '반찬', emoji: '🥗' },
    { id: 'meat', label: '고기/해산물', emoji: '🍖' },
    { id: 'salad', label: '샐러드', emoji: '🥬' },
    { id: 'snack', label: '간식', emoji: '🍪' },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-gray-100">
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600">
          ✕
        </button>
        <h1 className="font-bold text-gray-800">{mealLabels[mealType]} 기록하기</h1>
        <div className="w-10" />
      </div>
      
      <div className="px-5 py-6">
        {/* 검색 바 */}
        <div className="mb-6">
          <button 
            onClick={onSearch}
            className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-xl text-left text-gray-400 flex items-center gap-2"
          >
            🔍 음식 검색...
          </button>
        </div>
        
        {/* 사진 기록 버튼 */}
        <button 
          onClick={onCamera}
          className="w-full mb-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-dashed border-green-300 rounded-2xl flex flex-col items-center gap-3 hover:bg-green-100 transition-colors"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">📷</span>
          </div>
          <div className="text-center">
            <p className="font-bold text-gray-800">사진으로 기록하기</p>
            <p className="text-sm text-gray-500">AI가 음식을 인식해요</p>
          </div>
        </button>
        
        {/* 최근 기록 */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">⏱️ 최근 기록</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentFoods.map(food => (
              <button 
                key={food.id}
                className="flex-shrink-0 w-20 p-3 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center gap-2 hover:border-green-300 transition-colors"
              >
                <span className="text-2xl">{food.emoji}</span>
                <span className="text-xs text-gray-600 truncate w-full text-center">{food.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* 즐겨찾기 */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-600 mb-3">⭐ 즐겨찾기</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {favoriteFoods.map(food => (
              <button 
                key={food.id}
                className="flex-shrink-0 w-20 p-3 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center gap-2 hover:border-green-300 transition-colors"
              >
                <span className="text-2xl">{food.emoji}</span>
                <span className="text-xs text-gray-600 truncate w-full text-center">{food.name}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* 카테고리 */}
        <div>
          <h2 className="text-sm font-semibold text-gray-600 mb-3">📂 카테고리</h2>
          <div className="grid grid-cols-3 gap-3">
            {categories.map(cat => (
              <button 
                key={cat.id}
                className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center gap-2 hover:border-green-300 transition-colors"
              >
                <span className="text-2xl">{cat.emoji}</span>
                <span className="text-xs text-gray-600">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 카메라 화면
const CameraScreen = ({ onCapture, onBack, onGallery }) => {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white"
        >
          ←
        </button>
        <h1 className="font-bold text-white">사진으로 기록</h1>
        <div className="w-10" />
      </div>
      
      {/* 카메라 프리뷰 */}
      <div className="flex-1 flex items-center justify-center mx-5 my-4">
        <div className="w-full aspect-square bg-gray-800 rounded-3xl flex items-center justify-center">
          <div className="text-center">
            <span className="text-6xl mb-4 block">📷</span>
            <p className="text-gray-400">카메라 프리뷰</p>
          </div>
        </div>
      </div>
      
      {/* 팁 */}
      <div className="px-5 mb-6">
        <p className="text-center text-gray-400 text-sm">
          💡 음식이 잘 보이게 찍어주세요
        </p>
      </div>
      
      {/* 컨트롤 */}
      <div className="flex items-center justify-around px-10 pb-10">
        <button 
          onClick={onGallery}
          className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center"
        >
          <span className="text-2xl">🖼️</span>
        </button>
        <button 
          onClick={onCapture}
          className="w-20 h-20 rounded-full bg-white flex items-center justify-center"
        >
          <div className="w-16 h-16 rounded-full border-4 border-gray-300" />
        </button>
        <div className="w-14 h-14" />
      </div>
    </div>
  );
};

// AI 인식 로딩 화면
const RecognitionLoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
      <div className="relative">
        {/* 회전하는 링 */}
        <div className="w-24 h-24 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl">🍽️</span>
        </div>
      </div>
      <p className="mt-6 text-white font-medium">AI가 음식을 분석 중이에요...</p>
      <p className="mt-2 text-gray-400 text-sm">잠시만 기다려주세요</p>
    </div>
  );
};

// AI 인식 결과 화면
const RecognitionResultScreen = ({ results, onConfirm, onBack, onAddMore }) => {
  const [selectedFoods, setSelectedFoods] = useState(
    results.map(food => ({ ...food, selected: true, quantity: 1 }))
  );
  
  const toggleFood = (id) => {
    setSelectedFoods(foods => 
      foods.map(f => f.id === id ? { ...f, selected: !f.selected } : f)
    );
  };
  
  const updateQuantity = (id, delta) => {
    setSelectedFoods(foods =>
      foods.map(f => 
        f.id === id 
          ? { ...f, quantity: Math.max(0.5, f.quantity + delta) }
          : f
      )
    );
  };
  
  const totalCalories = selectedFoods
    .filter(f => f.selected)
    .reduce((sum, f) => sum + f.calories * f.quantity, 0);
  
  const totalMacros = selectedFoods
    .filter(f => f.selected)
    .reduce((acc, f) => ({
      carbs: acc.carbs + f.carbs * f.quantity,
      protein: acc.protein + f.protein * f.quantity,
      fat: acc.fat + f.fat * f.quantity,
    }), { carbs: 0, protein: 0, fat: 0 });
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-white px-5 py-4 flex items-center justify-between border-b border-gray-100">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-600"
        >
          ←
        </button>
        <h1 className="font-bold text-gray-800">인식 결과</h1>
        <div className="w-10" />
      </div>
      
      <div className="flex-1 overflow-auto">
        {/* 촬영된 이미지 */}
        <div className="mx-5 mt-5 h-48 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center">
          <span className="text-6xl">🍱</span>
        </div>
        
        {/* AI 인식 결과 */}
        <div className="px-5 py-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">✨</span>
            <h2 className="font-bold text-gray-800">AI가 인식한 음식</h2>
          </div>
          
          <div className="space-y-3">
            {selectedFoods.map(food => (
              <div 
                key={food.id}
                className={`bg-white rounded-xl p-4 border-2 transition-all ${
                  food.selected ? 'border-green-400' : 'border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* 체크박스 */}
                  <button 
                    onClick={() => toggleFood(food.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                      food.selected 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'border-gray-300'
                    }`}
                  >
                    {food.selected && '✓'}
                  </button>
                  
                  {/* 음식 정보 */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-800">{food.name}</h3>
                      <span className="text-sm text-gray-500">
                        {Math.round(food.calories * food.quantity)} kcal
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      {food.serving} ({food.servingSize}g)
                    </p>
                    
                    {/* 수량 조절 */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">수량:</span>
                      <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-1">
                        <button 
                          onClick={() => updateQuantity(food.id, -0.5)}
                          className="w-8 h-8 rounded-lg hover:bg-gray-200 transition-colors font-bold text-gray-600"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium">{food.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(food.id, 0.5)}
                          className="w-8 h-8 rounded-lg hover:bg-gray-200 transition-colors font-bold text-gray-600"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 음식 추가 버튼 */}
          <button 
            onClick={onAddMore}
            className="w-full mt-4 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:border-green-400 hover:text-green-600 transition-colors"
          >
            + 음식 추가하기
          </button>
        </div>
      </div>
      
      {/* 하단 요약 및 확인 */}
      <div className="bg-white border-t border-gray-200 px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600">총 칼로리</span>
          <span className="text-xl font-bold text-gray-800">{Math.round(totalCalories)} kcal</span>
        </div>
        <div className="flex items-center justify-center gap-4 mb-4 text-sm text-gray-500">
          <span>탄 {Math.round(totalMacros.carbs)}g</span>
          <span>•</span>
          <span>단 {Math.round(totalMacros.protein)}g</span>
          <span>•</span>
          <span>지 {Math.round(totalMacros.fat)}g</span>
        </div>
        <button 
          onClick={onConfirm}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
        >
          ✓ 기록 완료하기
        </button>
      </div>
    </div>
  );
};

// 기록 완료 화면
const LogCompletionScreen = ({ summary, onGoHome }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-500 to-emerald-600 text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        {/* 체크 아이콘 */}
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6">
          <span className="text-5xl">✅</span>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">점심 기록 완료!</h1>
        
        {/* 요약 카드 */}
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-lg rounded-2xl p-6 mt-6">
          <div className="text-center mb-4">
            <span className="text-4xl font-bold">🔥 {summary.calories}</span>
            <span className="text-xl ml-1">kcal 기록</span>
          </div>
          <div className="flex justify-center gap-4 text-sm opacity-80">
            <span>탄 {summary.carbs}g</span>
            <span>•</span>
            <span>단 {summary.protein}g</span>
            <span>•</span>
            <span>지 {summary.fat}g</span>
          </div>
        </div>
        
        {/* 남은 칼로리 */}
        <div className="mt-8 text-center">
          <p className="opacity-80 mb-2">오늘 남은 칼로리</p>
          <div className="inline-flex items-center gap-3 bg-white/10 px-6 py-3 rounded-full">
            <span className="text-3xl font-bold">{summary.remaining}</span>
            <span className="opacity-80">kcal</span>
          </div>
        </div>
        
        {/* 팁 */}
        <div className="mt-8 bg-white/10 rounded-xl px-5 py-4 max-w-sm">
          <p className="text-center">
            💡 단백질을 조금 더 챙겨보세요!<br />
            <span className="opacity-80 text-sm">저녁에 닭가슴살 어때요?</span>
          </p>
        </div>
        
        {/* 스트릭 */}
        <div className="mt-6 bg-yellow-500/20 border border-yellow-400/30 rounded-xl px-5 py-3">
          <p className="text-center">
            📝 <span className="font-bold">5일 연속 기록 달성!</span>
            <span className="ml-2 text-yellow-300">+15P</span>
          </p>
        </div>
      </div>
      
      {/* 버튼 */}
      <div className="px-5 pb-8 space-y-3">
        <button 
          onClick={onGoHome}
          className="w-full py-4 bg-white text-green-600 font-bold rounded-xl hover:bg-gray-100 transition-colors"
        >
          🏠 홈으로
        </button>
        <button className="w-full py-3 text-white/80 font-medium">
          저녁 미리 계획하기 →
        </button>
      </div>
    </div>
  );
};

// 메인 앱 - 상태별 화면 전환
export default function FoodLogFlow() {
  const [screen, setScreen] = useState('main'); // 'main' | 'camera' | 'loading' | 'result' | 'completion'
  
  const recognizedFoods = [
    {
      id: 1,
      name: '김치찌개',
      serving: '1인분',
      servingSize: 300,
      calories: 200,
      carbs: 15,
      protein: 18,
      fat: 8,
    },
    {
      id: 2,
      name: '공기밥',
      serving: '1공기',
      servingSize: 210,
      calories: 313,
      carbs: 68,
      protein: 6,
      fat: 1,
    },
    {
      id: 3,
      name: '계란말이',
      serving: '2조각',
      servingSize: 60,
      calories: 95,
      carbs: 2,
      protein: 7,
      fat: 7,
    },
  ];
  
  const completionSummary = {
    calories: 608,
    carbs: 85,
    protein: 28,
    fat: 18,
    remaining: 1192,
  };
  
  const handleCapture = () => {
    setScreen('loading');
    // 시뮬레이션: 2초 후 결과 표시
    setTimeout(() => {
      setScreen('result');
    }, 2000);
  };
  
  if (screen === 'main') {
    return (
      <FoodLogMain 
        mealType="lunch"
        onCamera={() => setScreen('camera')}
        onSearch={() => alert('검색 화면')}
      />
    );
  }
  
  if (screen === 'camera') {
    return (
      <CameraScreen 
        onCapture={handleCapture}
        onBack={() => setScreen('main')}
        onGallery={() => alert('갤러리')}
      />
    );
  }
  
  if (screen === 'loading') {
    return <RecognitionLoadingScreen />;
  }
  
  if (screen === 'result') {
    return (
      <RecognitionResultScreen 
        results={recognizedFoods}
        onConfirm={() => setScreen('completion')}
        onBack={() => setScreen('camera')}
        onAddMore={() => alert('음식 추가')}
      />
    );
  }
  
  return (
    <LogCompletionScreen 
      summary={completionSummary}
      onGoHome={() => setScreen('main')}
    />
  );
}
