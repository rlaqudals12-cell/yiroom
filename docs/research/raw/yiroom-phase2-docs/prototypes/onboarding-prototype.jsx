import React, { useState } from 'react';

// 이룸 컬러 팔레트
const colors = {
  primary: '#7C3AED',
  secondary: '#4CD4A1',
  coral: '#FF6B6B',
};

// 프로그레스 인디케이터
const ProgressIndicator = ({ current, total }) => (
  <div className="flex items-center gap-2">
    {[...Array(total)].map((_, i) => (
      <div
        key={i}
        className={`h-1.5 rounded-full transition-all duration-300 ${
          i < current 
            ? 'w-6 bg-gradient-to-r from-purple-500 to-indigo-500' 
            : i === current 
              ? 'w-6 bg-purple-300' 
              : 'w-2 bg-gray-200'
        }`}
      />
    ))}
  </div>
);

// 옵션 버튼
const OptionButton = ({ emoji, label, selected, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${
      selected
        ? 'border-purple-500 bg-purple-50 shadow-md'
        : 'border-gray-200 bg-white hover:border-purple-300'
    }`}
  >
    <span className="text-3xl">{emoji}</span>
    <span className={`font-medium ${selected ? 'text-purple-700' : 'text-gray-700'}`}>
      {label}
    </span>
    {selected && (
      <div className="ml-auto w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
        <span className="text-white text-sm">✓</span>
      </div>
    )}
  </button>
);

// 슬라이더 컴포넌트
const CalorieSlider = ({ value, onChange, min, max }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className="w-full">
      <div className="relative h-2 bg-gray-200 rounded-full">
        <div 
          className="absolute h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={50}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer"
        />
        <div 
          className="absolute w-6 h-6 bg-white border-4 border-purple-500 rounded-full -top-2 transform -translate-x-1/2 shadow-md"
          style={{ left: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-sm text-gray-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

// W-1 운동 온보딩
const WorkoutOnboarding = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    goal: null,
    time: null,
    equipment: null,
  });
  
  const steps = [
    {
      question: '운동 목표가 뭐예요?',
      key: 'goal',
      options: [
        { emoji: '🔥', label: '체중 감량', value: 'weight_loss' },
        { emoji: '💪', label: '근력 강화', value: 'muscle_gain' },
        { emoji: '🧘', label: '유연성 향상', value: 'flexibility' },
        { emoji: '❤️', label: '전반적 건강', value: 'general_health' },
      ],
    },
    {
      question: '하루에 운동할 수 있는 시간은?',
      key: 'time',
      options: [
        { emoji: '⚡', label: '10분 이하', value: 'under_10' },
        { emoji: '🕐', label: '10-20분', value: '10_to_20' },
        { emoji: '🕑', label: '20-30분', value: '20_to_30' },
        { emoji: '🕒', label: '30분 이상', value: 'over_30' },
      ],
    },
    {
      question: '운동 장비가 있어요?',
      key: 'equipment',
      options: [
        { emoji: '🏠', label: '맨몸 운동만', value: 'bodyweight' },
        { emoji: '🎾', label: '간단한 도구 (밴드, 덤벨)', value: 'light_equipment' },
        { emoji: '🏋️', label: '홈짐 장비', value: 'home_gym' },
      ],
    },
  ];
  
  const currentStep = steps[step];
  
  const handleSelect = (value) => {
    setAnswers({ ...answers, [currentStep.key]: value });
  };
  
  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(answers);
    }
  };
  
  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };
  
  const canProceed = answers[currentStep.key] !== null;
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <div className="px-5 py-4 flex items-center justify-between">
        <button 
          onClick={handleBack}
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            step > 0 ? 'text-gray-600' : 'text-transparent'
          }`}
        >
          ←
        </button>
        <ProgressIndicator current={step} total={steps.length} />
        <button className="text-gray-400 text-sm">건너뛰기</button>
      </div>
      
      {/* 콘텐츠 */}
      <div className="flex-1 px-5 py-8">
        <div className="mb-8">
          <span className="text-4xl mb-4 block">💪</span>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {currentStep.question}
          </h1>
          <p className="text-gray-500">
            맞춤 운동 추천을 위해 알려주세요
          </p>
        </div>
        
        <div className="space-y-3">
          {currentStep.options.map((option) => (
            <OptionButton
              key={option.value}
              emoji={option.emoji}
              label={option.label}
              selected={answers[currentStep.key] === option.value}
              onClick={() => handleSelect(option.value)}
            />
          ))}
        </div>
      </div>
      
      {/* 하단 버튼 */}
      <div className="px-5 pb-8">
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
            canProceed
              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:opacity-90'
              : 'bg-gray-200 text-gray-400'
          }`}
        >
          {step < steps.length - 1 ? '다음' : '완료'}
        </button>
      </div>
    </div>
  );
};

// N-1 영양 온보딩
const NutritionOnboarding = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    goal: null,
    mealPattern: null,
    targetCalories: 1800,
  });
  
  const steps = [
    {
      type: 'select',
      question: '식단 관리 목표가 뭐예요?',
      key: 'goal',
      options: [
        { emoji: '🔥', label: '체중 감량', value: 'weight_loss' },
        { emoji: '💪', label: '근육 증가', value: 'muscle_gain' },
        { emoji: '⚖️', label: '체중 유지', value: 'maintain' },
        { emoji: '🌿', label: '건강한 식습관', value: 'healthy_eating' },
      ],
    },
    {
      type: 'select',
      question: '하루에 몇 끼 드세요?',
      key: 'mealPattern',
      options: [
        { emoji: '🍳', label: '2끼 (간헐적 단식)', value: '2_meals' },
        { emoji: '🍱', label: '3끼', value: '3_meals' },
        { emoji: '🥪', label: '3끼 + 간식', value: '3_meals_snack' },
        { emoji: '🍽️', label: '4끼 이상 (소식 다회)', value: '4_plus_meals' },
      ],
    },
    {
      type: 'calorie',
      question: '추천 일일 칼로리예요',
      key: 'targetCalories',
    },
  ];
  
  const currentStep = steps[step];
  
  const handleSelect = (value) => {
    setAnswers({ ...answers, [currentStep.key]: value });
  };
  
  const handleCalorieChange = (value) => {
    setAnswers({ ...answers, targetCalories: value });
  };
  
  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(answers);
    }
  };
  
  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };
  
  const canProceed = currentStep.type === 'calorie' || answers[currentStep.key] !== null;
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <div className="px-5 py-4 flex items-center justify-between">
        <button 
          onClick={handleBack}
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            step > 0 ? 'text-gray-600' : 'text-transparent'
          }`}
        >
          ←
        </button>
        <ProgressIndicator current={step} total={steps.length} />
        <button className="text-gray-400 text-sm">건너뛰기</button>
      </div>
      
      {/* 콘텐츠 */}
      <div className="flex-1 px-5 py-8">
        <div className="mb-8">
          <span className="text-4xl mb-4 block">🥗</span>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {currentStep.question}
          </h1>
          <p className="text-gray-500">
            {currentStep.type === 'calorie' 
              ? '체형과 목표를 기반으로 계산했어요' 
              : '맞춤 식단 추천을 위해 알려주세요'}
          </p>
        </div>
        
        {currentStep.type === 'select' ? (
          <div className="space-y-3">
            {currentStep.options.map((option) => (
              <OptionButton
                key={option.value}
                emoji={option.emoji}
                label={option.label}
                selected={answers[currentStep.key] === option.value}
                onClick={() => handleSelect(option.value)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            {/* 칼로리 표시 */}
            <div className="text-center mb-8">
              <div className="inline-flex items-baseline">
                <span className="text-5xl font-bold text-gray-800">
                  {answers.targetCalories.toLocaleString()}
                </span>
                <span className="text-xl text-gray-400 ml-2">kcal</span>
              </div>
              <p className="text-gray-500 mt-2">일일 목표 칼로리</p>
            </div>
            
            {/* 슬라이더 */}
            <CalorieSlider
              value={answers.targetCalories}
              onChange={handleCalorieChange}
              min={1200}
              max={3000}
            />
            
            {/* 목표별 안내 */}
            <div className="mt-6 p-4 bg-purple-50 rounded-xl">
              <p className="text-sm text-purple-700">
                {answers.goal === 'weight_loss' && '💡 체중 감량을 위해 기초대사량보다 20% 낮게 설정했어요'}
                {answers.goal === 'muscle_gain' && '💡 근육 증가를 위해 기초대사량보다 10% 높게 설정했어요'}
                {answers.goal === 'maintain' && '💡 현재 체중 유지에 적합한 칼로리예요'}
                {answers.goal === 'healthy_eating' && '💡 균형 잡힌 식단을 위한 적정 칼로리예요'}
                {!answers.goal && '💡 목표에 맞게 조절해보세요'}
              </p>
            </div>
            
            {/* 매크로 비율 */}
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-green-50 rounded-xl">
                <p className="text-2xl font-bold text-green-600">50%</p>
                <p className="text-xs text-gray-500">탄수화물</p>
              </div>
              <div className="p-3 bg-pink-50 rounded-xl">
                <p className="text-2xl font-bold text-pink-600">30%</p>
                <p className="text-xs text-gray-500">단백질</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-xl">
                <p className="text-2xl font-bold text-orange-600">20%</p>
                <p className="text-xs text-gray-500">지방</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 하단 버튼 */}
      <div className="px-5 pb-8">
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
            canProceed
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90'
              : 'bg-gray-200 text-gray-400'
          }`}
        >
          {step < steps.length - 1 ? '다음' : '시작하기'}
        </button>
      </div>
    </div>
  );
};

// 온보딩 완료 화면
const OnboardingComplete = ({ type, userData, onStart }) => {
  const isWorkout = type === 'workout';
  
  return (
    <div className={`min-h-screen flex flex-col ${
      isWorkout 
        ? 'bg-gradient-to-b from-purple-600 to-indigo-700' 
        : 'bg-gradient-to-b from-green-500 to-emerald-600'
    } text-white`}>
      <div className="flex-1 flex flex-col items-center justify-center px-5">
        {/* 아이콘 */}
        <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6">
          <span className="text-5xl">{isWorkout ? '🎯' : '🥗'}</span>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">준비 완료!</h1>
        <p className="text-white/80 text-center mb-8">
          {userData.name || '회원'}님을 위한 맞춤 {isWorkout ? '운동' : '식단'}이<br />
          준비되었어요
        </p>
        
        {/* 요약 카드 */}
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-lg rounded-2xl p-6 space-y-4">
          {isWorkout ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-white/70">운동 목표</span>
                <span className="font-medium">
                  {userData.goal === 'weight_loss' && '🔥 체중 감량'}
                  {userData.goal === 'muscle_gain' && '💪 근력 강화'}
                  {userData.goal === 'flexibility' && '🧘 유연성 향상'}
                  {userData.goal === 'general_health' && '❤️ 전반적 건강'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">운동 시간</span>
                <span className="font-medium">
                  {userData.time === 'under_10' && '⚡ 10분 이하'}
                  {userData.time === '10_to_20' && '🕐 10-20분'}
                  {userData.time === '20_to_30' && '🕑 20-30분'}
                  {userData.time === 'over_30' && '🕒 30분 이상'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">장비</span>
                <span className="font-medium">
                  {userData.equipment === 'bodyweight' && '🏠 맨몸 운동'}
                  {userData.equipment === 'light_equipment' && '🎾 간단한 도구'}
                  {userData.equipment === 'home_gym' && '🏋️ 홈짐 장비'}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-white/70">식단 목표</span>
                <span className="font-medium">
                  {userData.goal === 'weight_loss' && '🔥 체중 감량'}
                  {userData.goal === 'muscle_gain' && '💪 근육 증가'}
                  {userData.goal === 'maintain' && '⚖️ 체중 유지'}
                  {userData.goal === 'healthy_eating' && '🌿 건강한 식습관'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">식사 패턴</span>
                <span className="font-medium">
                  {userData.mealPattern === '2_meals' && '🍳 2끼'}
                  {userData.mealPattern === '3_meals' && '🍱 3끼'}
                  {userData.mealPattern === '3_meals_snack' && '🥪 3끼 + 간식'}
                  {userData.mealPattern === '4_plus_meals' && '🍽️ 4끼 이상'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">일일 목표</span>
                <span className="font-medium">
                  🎯 {userData.targetCalories?.toLocaleString()} kcal
                </span>
              </div>
            </>
          )}
        </div>
        
        {/* 체형 연동 안내 */}
        <div className="mt-6 bg-white/10 rounded-xl px-5 py-3 max-w-sm">
          <p className="text-center text-sm">
            ✨ Y체형 분석 결과가 반영되었어요
          </p>
        </div>
      </div>
      
      {/* 시작 버튼 */}
      <div className="px-5 pb-8">
        <button
          onClick={onStart}
          className="w-full py-4 bg-white text-gray-800 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-colors"
        >
          {isWorkout ? '🏋️ 첫 운동 시작하기' : '🍽️ 첫 식단 기록하기'}
        </button>
      </div>
    </div>
  );
};

// 메인 앱 - 온보딩 타입 선택 및 플로우
export default function OnboardingFlow() {
  const [type, setType] = useState(null); // 'workout' | 'nutrition'
  const [completed, setCompleted] = useState(false);
  const [userData, setUserData] = useState({});
  
  const handleComplete = (answers) => {
    setUserData({ ...userData, ...answers, name: '민지' });
    setCompleted(true);
  };
  
  // 타입 선택 화면
  if (!type) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-5">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">온보딩 프로토타입</h1>
        <p className="text-gray-500 mb-8">테스트할 모듈을 선택하세요</p>
        
        <div className="w-full max-w-sm space-y-4">
          <button
            onClick={() => setType('workout')}
            className="w-full p-6 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-opacity"
          >
            💪 W-1 운동 온보딩
          </button>
          <button
            onClick={() => setType('nutrition')}
            className="w-full p-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-opacity"
          >
            🥗 N-1 영양 온보딩
          </button>
        </div>
      </div>
    );
  }
  
  // 완료 화면
  if (completed) {
    return (
      <OnboardingComplete
        type={type}
        userData={userData}
        onStart={() => {
          setType(null);
          setCompleted(false);
          setUserData({});
        }}
      />
    );
  }
  
  // 온보딩 플로우
  return type === 'workout' ? (
    <WorkoutOnboarding onComplete={handleComplete} />
  ) : (
    <NutritionOnboarding onComplete={handleComplete} />
  );
}
