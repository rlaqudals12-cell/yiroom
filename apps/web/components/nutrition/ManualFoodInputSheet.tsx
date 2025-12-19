/**
 * N-1 음식 직접 입력 시트 컴포넌트 (Task 2.11)
 *
 * 바텀 시트 형태로 음식을 직접 입력
 * - 음식명 입력 (필수)
 * - 칼로리/영양소 입력 (선택)
 * - 식사 타입 선택
 * - 신호등 색상 선택
 * - 자주 먹는 음식으로 저장
 */

'use client';

import { useState, useMemo } from 'react';
import {
  X,
  Utensils,
  Sun,
  Moon,
  Apple,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type TrafficLightColor } from './TrafficLight';

// 식사 타입 정보
const MEAL_TYPES = [
  { type: 'breakfast', label: '아침', icon: Sun },
  { type: 'lunch', label: '점심', icon: Utensils },
  { type: 'dinner', label: '저녁', icon: Moon },
  { type: 'snack', label: '간식', icon: Apple },
] as const;

type MealType = (typeof MEAL_TYPES)[number]['type'];

// 신호등 색상 정보
const TRAFFIC_LIGHTS = [
  {
    color: 'green' as TrafficLightColor,
    label: '초록',
    bgColor: 'bg-green-100',
    activeColor: 'bg-green-500 text-white',
    description: '건강식',
  },
  {
    color: 'yellow' as TrafficLightColor,
    label: '노랑',
    bgColor: 'bg-yellow-100',
    activeColor: 'bg-yellow-500 text-white',
    description: '보통',
  },
  {
    color: 'red' as TrafficLightColor,
    label: '빨강',
    bgColor: 'bg-red-100',
    activeColor: 'bg-red-500 text-white',
    description: '주의',
  },
] as const;

// 저장 데이터 타입
export interface ManualFoodData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealType: MealType;
  portion: string;
  trafficLight: TrafficLightColor;
  saveAsFavorite: boolean;
}

export interface ManualFoodInputSheetProps {
  /** 시트 표시 여부 */
  isOpen: boolean;
  /** 시트 닫기 핸들러 */
  onClose: () => void;
  /** 음식 저장 핸들러 */
  onSave: (data: ManualFoodData) => void;
  /** 기본 식사 타입 */
  defaultMealType?: MealType;
  /** 저장 중 상태 */
  isSaving?: boolean;
}

export default function ManualFoodInputSheet({
  isOpen,
  onClose,
  onSave,
  defaultMealType = 'lunch',
  isSaving = false,
}: ManualFoodInputSheetProps) {
  // 폼 상태
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [portion, setPortion] = useState('1인분');
  const [trafficLight, setTrafficLight] = useState<TrafficLightColor>('yellow');
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);

  // 숫자만 추출하는 헬퍼
  const extractNumber = (value: string): string => {
    return value.replace(/[^0-9]/g, '');
  };

  // 예상 칼로리 계산 (단백질 4kcal/g, 탄수화물 4kcal/g, 지방 9kcal/g)
  const estimatedCalories = useMemo(() => {
    const p = parseInt(protein) || 0;
    const c = parseInt(carbs) || 0;
    const f = parseInt(fat) || 0;
    return p * 4 + c * 4 + f * 9;
  }, [protein, carbs, fat]);

  // 폼 유효성 검사
  const isValid = name.trim().length > 0;

  // 저장 핸들러
  const handleSave = () => {
    if (!isValid || isSaving) return;

    onSave({
      name: name.trim(),
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fat: parseInt(fat) || 0,
      mealType,
      portion: portion.trim() || '1인분',
      trafficLight,
      saveAsFavorite,
    });

    // 폼 초기화
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setMealType(defaultMealType);
    setPortion('1인분');
    setTrafficLight('yellow');
    setSaveAsFavorite(false);
  };

  // 바텀 시트가 닫혀있으면 렌더링하지 않음
  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
        data-testid="manual-food-input-overlay"
      />

      {/* 바텀 시트 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-xl transform transition-transform max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-food-input-title"
        data-testid="manual-food-input-sheet"
      >
        <div className="max-w-[480px] mx-auto">
          {/* 핸들 바 */}
          <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-card">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 pb-3 border-b border-border/50 sticky top-6 bg-card">
            <h2
              id="manual-food-input-title"
              className="text-lg font-bold text-foreground"
            >
              음식 직접 입력
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="닫기"
              data-testid="close-button"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="p-4 space-y-5">
            {/* 음식명 입력 (필수) */}
            <div>
              <label
                htmlFor="food-name"
                className="block text-sm font-medium text-foreground mb-2"
              >
                음식명 <span className="text-red-500">*</span>
              </label>
              <input
                id="food-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 김치찌개, 샐러드"
                className="w-full py-3 px-4 rounded-xl border-2 border-border focus:border-orange-500 focus:outline-none transition-colors bg-background"
                aria-label="음식명"
                data-testid="food-name-input"
              />
            </div>

            {/* 식사 타입 선택 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                식사 타입
              </label>
              <div className="grid grid-cols-4 gap-2">
                {MEAL_TYPES.map((meal) => (
                  <button
                    key={meal.type}
                    onClick={() => setMealType(meal.type)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all',
                      mealType === meal.type
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-card text-foreground border-border hover:border-orange-300'
                    )}
                    aria-pressed={mealType === meal.type}
                    data-testid={`meal-type-${meal.type}`}
                  >
                    <meal.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{meal.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 칼로리 입력 */}
            <div>
              <label
                htmlFor="calories"
                className="block text-sm font-medium text-foreground mb-2"
              >
                칼로리 (선택)
              </label>
              <div className="relative">
                <input
                  id="calories"
                  type="text"
                  inputMode="numeric"
                  value={calories}
                  onChange={(e) => setCalories(extractNumber(e.target.value))}
                  placeholder="0"
                  className="w-full py-3 px-4 pr-16 rounded-xl border-2 border-border focus:border-orange-500 focus:outline-none transition-colors bg-background"
                  data-testid="calories-input"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  kcal
                </span>
              </div>
            </div>

            {/* 영양소 입력 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                영양소 (선택)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* 단백질 */}
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={protein}
                    onChange={(e) => setProtein(extractNumber(e.target.value))}
                    placeholder="단백질"
                    className="w-full py-2 px-3 pr-6 rounded-lg border-2 border-border focus:border-orange-500 focus:outline-none transition-colors text-sm bg-background"
                    aria-label="단백질"
                    data-testid="protein-input"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    g
                  </span>
                </div>
                {/* 탄수화물 */}
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={carbs}
                    onChange={(e) => setCarbs(extractNumber(e.target.value))}
                    placeholder="탄수화물"
                    className="w-full py-2 px-3 pr-6 rounded-lg border-2 border-border focus:border-orange-500 focus:outline-none transition-colors text-sm bg-background"
                    aria-label="탄수화물"
                    data-testid="carbs-input"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    g
                  </span>
                </div>
                {/* 지방 */}
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fat}
                    onChange={(e) => setFat(extractNumber(e.target.value))}
                    placeholder="지방"
                    className="w-full py-2 px-3 pr-6 rounded-lg border-2 border-border focus:border-orange-500 focus:outline-none transition-colors text-sm bg-background"
                    aria-label="지방"
                    data-testid="fat-input"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    g
                  </span>
                </div>
              </div>
              {/* 예상 칼로리 힌트 */}
              {estimatedCalories > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  예상 칼로리: 약 {estimatedCalories} kcal
                </p>
              )}
            </div>

            {/* 섭취량 입력 */}
            <div>
              <label
                htmlFor="portion"
                className="block text-sm font-medium text-foreground mb-2"
              >
                섭취량
              </label>
              <input
                id="portion"
                type="text"
                value={portion}
                onChange={(e) => setPortion(e.target.value)}
                placeholder="1인분"
                className="w-full py-3 px-4 rounded-xl border-2 border-border focus:border-orange-500 focus:outline-none transition-colors bg-background"
                data-testid="portion-input"
              />
            </div>

            {/* 신호등 색상 선택 */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                음식 신호등
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TRAFFIC_LIGHTS.map((light) => (
                  <button
                    key={light.color}
                    onClick={() => setTrafficLight(light.color)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all',
                      trafficLight === light.color
                        ? light.activeColor + ' border-transparent'
                        : light.bgColor + ' border-border hover:border-border/80'
                    )}
                    aria-pressed={trafficLight === light.color}
                    data-testid={`traffic-light-${light.color}`}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded-full',
                        trafficLight === light.color
                          ? 'bg-white/80'
                          : light.color === 'green'
                            ? 'bg-green-500'
                            : light.color === 'yellow'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                      )}
                    />
                    <span className="text-xs font-medium">{light.label}</span>
                    <span
                      className={cn(
                        'text-[10px]',
                        trafficLight === light.color
                          ? 'text-white/80'
                          : 'text-muted-foreground'
                      )}
                    >
                      {light.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 자주 먹는 음식으로 저장 */}
            <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
              <input
                type="checkbox"
                id="save-as-favorite"
                checked={saveAsFavorite}
                onChange={(e) => setSaveAsFavorite(e.target.checked)}
                className="w-5 h-5 rounded border-border text-orange-500 focus:ring-orange-500"
                data-testid="save-as-favorite-checkbox"
              />
              <label
                htmlFor="save-as-favorite"
                className="text-sm text-foreground cursor-pointer"
              >
                자주 먹는 음식으로 저장
              </label>
            </div>

            {/* 저장 버튼 */}
            <button
              onClick={handleSave}
              disabled={!isValid || isSaving}
              className={cn(
                'w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2',
                isValid && !isSaving
                  ? 'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
              data-testid="save-food-button"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {name ? `"${name}" 저장하기` : '음식명을 입력해주세요'}
                </>
              )}
            </button>
          </div>

          {/* 하단 안전 영역 */}
          <div className="h-6" />
        </div>
      </div>
    </>
  );
}
