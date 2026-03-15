'use client';

/**
 * K-3 체형 분석 강화: 체중 목표 추적 페이지
 *
 * @description BMI 기반 건강 체중 관리 및 목표 추적
 * @see docs/specs/SDD-PHASE-K-COMPREHENSIVE-UPGRADE.md 섹션 4
 */

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Target, Scale, TrendingDown, TrendingUp, Info, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { selectByKey, getTrendDirection } from '@/lib/utils/conditional-helpers';
import {
  calculateBMI,
  calculateTargetWeight,
  getBMIColor,
  type BMIResult,
  type BMICategory,
} from '@/lib/body/bmi-calculator';

// BMI 게이지 컴포넌트
function BMIGauge({ bmi, category: _category }: { bmi: number; category: BMICategory }) {
  // BMI 15-40 범위를 0-100%로 변환
  const percentage = Math.min(Math.max(((bmi - 15) / 25) * 100, 0), 100);

  return (
    <div className="relative h-4 bg-gradient-to-r from-blue-400 via-green-400 via-yellow-400 to-red-500 rounded-full overflow-hidden">
      {/* 마커 */}
      <div
        className="absolute top-0 w-1 h-full bg-white shadow-lg transform -translate-x-1/2"
        style={{ left: `${percentage}%` }}
      />
      {/* BMI 값 표시 */}
      <div
        className="absolute -top-8 transform -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded font-bold"
        style={{ left: `${percentage}%` }}
      >
        {bmi}
      </div>
    </div>
  );
}

// 목표 진행률 컴포넌트
function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          className="text-muted"
          fill="none"
        />
        {/* 진행 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="url(#progressGradient)"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
      </svg>
      {/* 중앙 텍스트 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{Math.round(progress)}%</span>
        <span className="text-xs text-muted-foreground">달성률</span>
      </div>
    </div>
  );
}

export default function WeightGoalTrackingPage() {
  const router = useRouter();

  // 사용자 입력 상태
  const [height, setHeight] = useState<string>('170');
  const [currentWeight, setCurrentWeight] = useState<string>('70');
  const [goalWeight, setGoalWeight] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  // BMI 계산 결과
  const bmiResult = useMemo<BMIResult | null>(() => {
    const h = parseFloat(height);
    const w = parseFloat(currentWeight);
    if (isNaN(h) || isNaN(w) || h < 100 || h > 250 || w < 20 || w > 300) {
      return null;
    }
    try {
      return calculateBMI(h, w);
    } catch {
      return null;
    }
  }, [height, currentWeight]);

  // 목표 체중 계산
  const targetWeightRange = useMemo(() => {
    const h = parseFloat(height);
    if (isNaN(h) || h < 100 || h > 250) return null;
    return calculateTargetWeight(h);
  }, [height]);

  // 목표 진행률 계산
  const progress = useMemo(() => {
    const current = parseFloat(currentWeight);
    const goal = parseFloat(goalWeight);
    if (isNaN(current) || isNaN(goal) || !bmiResult) return 0;

    const startWeight =
      bmiResult.weightDifference > 0
        ? current + bmiResult.weightDifference // 감량 시작점
        : current - Math.abs(bmiResult.weightDifference); // 증량 시작점

    const totalChange = Math.abs(startWeight - goal);
    const currentChange = Math.abs(startWeight - current);

    if (totalChange === 0) return 100;
    return Math.min((currentChange / totalChange) * 100, 100);
  }, [currentWeight, goalWeight, bmiResult]);

  // 자동 목표 체중 설정
  const handleAutoGoal = useCallback(() => {
    if (targetWeightRange) {
      setGoalWeight(targetWeightRange.ideal.toString());
    }
  }, [targetWeightRange]);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-pink-50/30 dark:from-slate-950 dark:via-violet-950/20 dark:to-pink-950/20"
      data-testid="weight-goal-tracking-page"
    >
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-lg"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-lg">체중 목표 관리</h1>
          <div className="w-9" /> {/* 균형용 */}
        </div>
      </header>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* 신체 정보 입력 */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-violet-600" />
            신체 정보
          </h2>

          <div className="space-y-4">
            {/* 성별 선택 */}
            <div>
              <label className="block text-sm text-muted-foreground mb-2">성별</label>
              <div className="flex gap-2">
                {(['male', 'female'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={cn(
                      'flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all',
                      gender === g ? 'bg-violet-600 text-white' : 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {g === 'male' ? '남성' : '여성'}
                  </button>
                ))}
              </div>
            </div>

            {/* 키 입력 */}
            <div>
              <label htmlFor="height" className="block text-sm text-muted-foreground mb-2">
                키 (cm)
              </label>
              <input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                min={100}
                max={250}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                placeholder="170"
              />
            </div>

            {/* 현재 체중 입력 */}
            <div>
              <label htmlFor="weight" className="block text-sm text-muted-foreground mb-2">
                현재 체중 (kg)
              </label>
              <input
                id="weight"
                type="number"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(e.target.value)}
                min={20}
                max={300}
                step={0.1}
                className="w-full px-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                placeholder="70"
              />
            </div>
          </div>
        </section>

        {/* BMI 결과 */}
        {bmiResult && (
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
            <h2 className="font-bold text-lg mb-4">BMI 분석</h2>

            {/* BMI 게이지 */}
            <div className="mb-6 pt-8">
              <BMIGauge bmi={bmiResult.value} category={bmiResult.category} />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>가벼운 편</span>
                <span>균형 구간</span>
                <span>여유 있는 편</span>
                <span>높은 편</span>
              </div>
            </div>

            {/* BMI 카테고리 */}
            <div
              className={cn(
                'text-center p-4 rounded-xl mb-4',
                selectByKey(
                  bmiResult.category,
                  {
                    normal: 'bg-green-50 dark:bg-green-900/20',
                    underweight: 'bg-blue-50 dark:bg-blue-900/20',
                  },
                  'bg-orange-50 dark:bg-orange-900/20'
                )
              )}
            >
              <p className="text-2xl font-bold" style={{ color: getBMIColor(bmiResult.category) }}>
                {bmiResult.categoryLabel}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                BMI {bmiResult.value} (참고 균형 구간: 18.5-22.9)
              </p>
            </div>

            {/* 건강 체중 범위 */}
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Info className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                키 {height}cm 기준 건강 체중:{' '}
                <span className="font-medium text-foreground">
                  {bmiResult.healthyWeightRange.min}~{bmiResult.healthyWeightRange.max}kg
                </span>
              </p>
            </div>

            {/* 체중 차이 */}
            {bmiResult.weightDifference !== 0 && (
              <div className="flex items-center gap-2 mt-3">
                {bmiResult.weightDifference > 0 ? (
                  <>
                    <TrendingDown className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">
                      균형 구간까지{' '}
                      <span className="font-bold text-orange-600">
                        약 {Math.abs(bmiResult.weightDifference)}kg
                      </span>{' '}
                      줄여볼 수 있어요
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">
                      균형 구간까지{' '}
                      <span className="font-bold text-blue-600">
                        약 {Math.abs(bmiResult.weightDifference)}kg
                      </span>{' '}
                      늘려볼 수 있어요
                    </span>
                  </>
                )}
              </div>
            )}
          </section>
        )}

        {/* 목표 설정 */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-pink-600" />
            목표 체중
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="goalWeight" className="block text-sm text-muted-foreground mb-2">
                목표 체중 (kg)
              </label>
              <div className="flex gap-2">
                <input
                  id="goalWeight"
                  type="number"
                  value={goalWeight}
                  onChange={(e) => setGoalWeight(e.target.value)}
                  min={30}
                  max={200}
                  step={0.1}
                  className="flex-1 px-4 py-3 rounded-lg border bg-background focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder={targetWeightRange?.ideal.toString() || '65'}
                />
                <button
                  onClick={handleAutoGoal}
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  추천 목표
                </button>
              </div>
            </div>

            {/* 목표 진행률 */}
            {goalWeight && parseFloat(goalWeight) > 0 && (
              <div className="flex flex-col items-center py-4">
                <ProgressRing progress={progress} />
                <p className="text-sm text-muted-foreground mt-3">
                  {(() => {
                    const diff = parseFloat(currentWeight) - parseFloat(goalWeight);
                    const direction = getTrendDirection(diff);
                    return selectByKey(
                      direction,
                      {
                        up: `목표까지 약 ${diff.toFixed(1)}kg 남았어요`,
                        down: `목표까지 약 ${(-diff).toFixed(1)}kg 남았어요`,
                      },
                      '목표에 도달했어요!'
                    );
                  })()}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 권장사항 */}
        {bmiResult && (
          <section className="bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-900/20 dark:to-pink-900/20 rounded-2xl p-5">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              건강 권장사항
            </h2>
            <ul className="space-y-2">
              {bmiResult.category === 'normal' && (
                <>
                  <li className="text-sm text-foreground">• 현재 건강한 체중을 유지하고 계세요!</li>
                  <li className="text-sm text-foreground">
                    • 규칙적인 운동과 균형 잡힌 식단을 계속 유지해주세요.
                  </li>
                </>
              )}
              {bmiResult.category === 'underweight' && (
                <>
                  <li className="text-sm text-foreground">
                    • 균형 잡힌 식단이 에너지와 활력에 도움이 될 수 있어요.
                  </li>
                  <li className="text-sm text-foreground">
                    • 근력 운동으로 근육량을 키워보는 것도 좋은 방법이에요.
                  </li>
                </>
              )}
              {['overweight', 'obese1', 'obese2', 'obese3'].includes(bmiResult.category) && (
                <>
                  <li className="text-sm text-foreground">
                    • 가벼운 식단 조절과 규칙적인 움직임이 도움이 될 수 있어요.
                  </li>
                  <li className="text-sm text-foreground">
                    • 하루 30분 정도 걷기부터 시작해보는 건 어떨까요?
                  </li>
                  <li className="text-sm text-foreground">
                    • 급격한 변화보다 점진적인 생활습관 개선이 더 효과적이에요.
                  </li>
                </>
              )}
            </ul>
          </section>
        )}

        {/* 면책조항 */}
        <p className="text-xs text-muted-foreground text-center px-4">
          {bmiResult?.disclaimer ||
            '이 결과는 참고용이며, 정확한 건강 상태 평가는 전문 의료인과 상담하시기 바랍니다.'}
        </p>
      </div>
    </div>
  );
}
