'use client';

import { useMemo } from 'react';
import { RefreshCw, Sparkles, FlaskConical, AlertTriangle, ShoppingBag, Palette, Sun, Moon, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type SkinAnalysisResult,
  getScoreColor,
  getScoreBgColor,
  getStatusLabel,
} from '@/lib/mock/skin-analysis';
import { FadeInUp, ScaleIn, CountUp } from '@/components/animations';

interface AnalysisResultProps {
  result: SkinAnalysisResult;
  onRetry: () => void;
  shareRef?: React.RefObject<HTMLDivElement | null>;
}

// 원형 프로그레스 바 컴포넌트
function CircularProgress({ score, size = 140, strokeWidth = 10 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getStrokeColor = (score: number) => {
    if (score >= 71) return '#22c55e'; // green-500
    if (score >= 41) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/30"
        />
        {/* 프로그레스 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getStrokeColor(score)}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* 중앙 점수 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
          <CountUp end={score} duration={1500} />
        </span>
        <span className="text-sm text-muted-foreground">점</span>
      </div>
    </div>
  );
}

export default function AnalysisResult({
  result,
  onRetry,
  shareRef,
}: AnalysisResultProps) {
  const {
    overallScore,
    metrics,
    insight,
    recommendedIngredients,
    analyzedAt,
    personalColorSeason,
    foundationRecommendation,
    ingredientWarnings,
    productRecommendations,
  } = result;

  // 가장 좋은/나쁜 지표 찾기
  const { bestMetric, worstMetric } = useMemo(() => {
    const sorted = [...metrics].sort((a, b) => b.value - a.value);
    return {
      bestMetric: sorted[0],
      worstMetric: sorted[sorted.length - 1],
    };
  }, [metrics]);

  return (
    <div ref={shareRef} className="space-y-6" role="region" aria-label="피부 분석 결과">
      {/* 전체 점수 카드 - 원형 프로그레스 바 */}
      <ScaleIn>
        <section className="bg-gradient-to-br from-emerald-50 via-card to-teal-50 rounded-xl border p-6">
          <p className="text-sm text-muted-foreground mb-4 text-center">전체 피부 점수</p>
          <div className="flex justify-center mb-4">
            <CircularProgress score={overallScore} />
          </div>
          <div className="flex justify-center">
            <span
              className={`px-4 py-1.5 rounded-full text-sm font-medium text-white ${getScoreBgColor(overallScore)}`}
            >
              {overallScore >= 71
                ? '건강한 피부'
                : overallScore >= 41
                  ? '보통 상태'
                  : '관리 필요'}
            </span>
          </div>
        </section>
      </ScaleIn>

      {/* 피부 상태 요약 */}
      <FadeInUp delay={1}>
        <section className="grid grid-cols-2 gap-3">
          {/* 가장 좋은 지표 */}
          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">Best</span>
            </div>
            <p className="font-semibold text-foreground">{bestMetric.name}</p>
            <p className="text-2xl font-bold text-green-600">{bestMetric.value}점</p>
          </div>
          {/* 개선 필요 지표 */}
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-700">Focus</span>
            </div>
            <p className="font-semibold text-foreground">{worstMetric.name}</p>
            <p className="text-2xl font-bold text-amber-600">{worstMetric.value}점</p>
          </div>
        </section>
      </FadeInUp>

      {/* 7가지 지표 */}
      <FadeInUp delay={2}>
        <section className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            7가지 피부 지표
          </h2>
          <div className="space-y-4">
            {metrics.map((metric) => (
              <div key={metric.id}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-foreground/80">
                    {metric.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${getScoreColor(metric.value)}`}>
                      {metric.value}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        metric.status === 'good'
                          ? 'bg-green-100 text-green-700'
                          : metric.status === 'normal'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {getStatusLabel(metric.status)}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getScoreBgColor(metric.value)}`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </FadeInUp>

      {/* AI 인사이트 (가변 보상) */}
      <FadeInUp delay={3}>
        <section className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-foreground">AI 인사이트</h2>
          </div>
          <p className="text-foreground/80 leading-relaxed">{insight}</p>
        </section>
      </FadeInUp>

      {/* 추천 성분 (가변 보상) */}
      <FadeInUp delay={4}>
        <section className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <FlaskConical className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-foreground">추천 성분</h2>
          </div>
          <div className="space-y-3">
            {recommendedIngredients.map((ingredient, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-muted rounded-lg"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-foreground">{ingredient.name}</p>
                  <p className="text-sm text-muted-foreground">{ingredient.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </FadeInUp>

      {/* 성분 경고 (화해 스타일) */}
      {ingredientWarnings && ingredientWarnings.length > 0 && (
        <FadeInUp delay={5}>
          <section className="bg-card rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-foreground">주의 성분</h2>
            </div>
            <div className="space-y-3">
              {ingredientWarnings.map((warning, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    warning.level === 'high'
                      ? 'bg-red-50 border-red-200'
                      : warning.level === 'medium'
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {warning.ingredient}
                      </span>
                      {warning.ingredientEn && (
                        <span className="text-xs text-muted-foreground">
                          ({warning.ingredientEn})
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        warning.level === 'high'
                          ? 'bg-red-100 text-red-700'
                          : warning.level === 'medium'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {warning.level === 'high'
                        ? '높음'
                        : warning.level === 'medium'
                          ? '중간'
                          : '낮음'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{warning.reason}</p>
                  {warning.alternatives && warning.alternatives.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      대안: {warning.alternatives.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </FadeInUp>
      )}

      {/* 제품 추천 */}
      {productRecommendations && (
        <FadeInUp delay={6}>
          <section className="bg-card rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-pink-500" />
              <h2 className="text-lg font-semibold text-foreground">맞춤 루틴</h2>
            </div>

            {/* 아침/저녁 루틴 */}
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                <Sun className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">아침 루틴</p>
                  <p className="text-sm text-muted-foreground">
                    {productRecommendations.skincareRoutine.morning}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-indigo-50 rounded-lg">
                <Moon className="w-4 h-4 text-indigo-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">저녁 루틴</p>
                  <p className="text-sm text-muted-foreground">
                    {productRecommendations.skincareRoutine.evening}
                  </p>
                </div>
              </div>
            </div>

            {/* 단계별 제품 추천 */}
            {productRecommendations.routine.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground/80">추천 제품</p>
                {productRecommendations.routine.slice(0, 5).map((step, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 bg-muted rounded-lg"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-medium">
                      {step.step}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {step.category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {step.products.join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </FadeInUp>
      )}

      {/* 퍼스널 컬러 기반 파운데이션 추천 */}
      {foundationRecommendation && (
        <FadeInUp delay={7}>
          <section className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-200 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-semibold text-foreground">
                파운데이션 추천
              </h2>
              {personalColorSeason && (
                <span className="ml-auto text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full">
                  {personalColorSeason} 톤
                </span>
              )}
            </div>
            <p className="text-foreground/80">{foundationRecommendation}</p>
          </section>
        </FadeInUp>
      )}

      {/* 분석 시간 */}
      <FadeInUp delay={8}>
        <p className="text-center text-sm text-muted-foreground">
          분석 시간: {analyzedAt.toLocaleString('ko-KR')}
        </p>
      </FadeInUp>

      {/* 다시 분석하기 버튼 */}
      <FadeInUp delay={8}>
        <Button
          onClick={onRetry}
          variant="outline"
          className="w-full h-12 text-base gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          다시 분석하기
        </Button>
      </FadeInUp>
    </div>
  );
}
