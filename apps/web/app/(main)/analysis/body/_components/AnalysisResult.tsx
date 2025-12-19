'use client';

import { RefreshCw, Sparkles, ShoppingBag, Zap, Ruler, Scale, Target, Palette, Shirt, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type BodyAnalysisResult,
  BODY_TYPES,
  getBodyTypeColor,
  getBodyTypeBgColor,
} from '@/lib/mock/body-analysis';

interface AnalysisResultProps {
  result: BodyAnalysisResult;
  onRetry: () => void;
}

export default function AnalysisResult({
  result,
  onRetry,
}: AnalysisResultProps) {
  const {
    bodyType,
    bodyTypeLabel,
    bodyTypeDescription,
    measurements,
    strengths,
    insight,
    styleRecommendations,
    analyzedAt,
    userInput,
    bmi,
    bmiCategory,
    personalColorSeason,
    colorRecommendations,
    colorTips,
  } = result;

  const typeInfo = BODY_TYPES[bodyType];

  return (
    <div className="space-y-6">
      {/* 기본 정보 (사용자 입력) */}
      {userInput && (
        <section className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">기본 정보</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Ruler className="w-4 h-4" />
                <span className="text-xs">키</span>
              </div>
              <p className="text-xl font-bold text-foreground">{userInput.height}</p>
              <p className="text-xs text-muted-foreground">cm</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Scale className="w-4 h-4" />
                <span className="text-xs">몸무게</span>
              </div>
              <p className="text-xl font-bold text-foreground">{userInput.weight}</p>
              <p className="text-xs text-muted-foreground">kg</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <Target className="w-4 h-4" />
                <span className="text-xs">BMI</span>
              </div>
              <p className="text-xl font-bold text-foreground">{bmi?.toFixed(1)}</p>
              <p className={`text-xs ${
                bmiCategory === '정상' ? 'text-green-500' :
                bmiCategory === '저체중' ? 'text-blue-500' :
                'text-orange-500'
              }`}>{bmiCategory}</p>
            </div>
          </div>
          {userInput.targetWeight && (
            <div className="mt-4 pt-4 border-t text-center">
              <p className="text-sm text-muted-foreground">
                목표 몸무게: <span className="font-medium text-foreground">{userInput.targetWeight}kg</span>
                <span className="ml-2 text-purple-500">
                  ({userInput.weight > userInput.targetWeight ? '-' : '+'}
                  {Math.abs(userInput.weight - userInput.targetWeight).toFixed(1)}kg)
                </span>
              </p>
            </div>
          )}
        </section>
      )}

      {/* 체형 타입 카드 */}
      <section className="bg-card rounded-xl border p-6 text-center">
        <p className="text-sm text-muted-foreground mb-2">체형 타입</p>
        <div className="flex items-center justify-center gap-2">
          <span className={`text-4xl font-bold ${getBodyTypeColor(bodyType)}`}>
            {bodyTypeLabel}
          </span>
          <span className="text-2xl">{typeInfo.emoji}</span>
        </div>
        <p className="mt-2 text-muted-foreground">{bodyTypeDescription}</p>
        <p className="mt-1 text-sm text-muted-foreground">{typeInfo.characteristics}</p>
      </section>

      {/* 비율 분석 */}
      <section className="bg-card rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">비율 분석</h2>
        <div className="space-y-4">
          {measurements.map((measurement) => (
            <div key={measurement.name}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-foreground/80">
                  {measurement.name}
                </span>
                <span className={`text-sm font-semibold ${getBodyTypeColor(bodyType)}`}>
                  {measurement.value}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getBodyTypeBgColor(bodyType)}`}
                  style={{ width: `${measurement.value}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{measurement.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 강점 */}
      <section className="bg-card rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold text-foreground">강점</h2>
        </div>
        <ul className="space-y-2">
          {strengths.map((strength, index) => (
            <li key={index} className="flex items-start gap-2 text-foreground/80">
              <span className="text-green-500 mt-0.5">•</span>
              {strength}
            </li>
          ))}
        </ul>
      </section>

      {/* AI 스타일 인사이트 (가변 보상) */}
      <section className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-foreground">스타일 인사이트</h2>
        </div>
        <p className="text-foreground/80 leading-relaxed">{insight}</p>
      </section>

      {/* 퍼스널 컬러 기반 색상 추천 */}
      {colorRecommendations && (
        <section className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-violet-500" />
            <h2 className="text-lg font-semibold text-foreground">코디 색상 추천</h2>
            {personalColorSeason && (
              <span className="ml-auto text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full">
                {personalColorSeason} 톤
              </span>
            )}
          </div>

          {/* 추천 상의 색상 */}
          <div className="mb-4">
            <div className="flex items-center gap-1 mb-2">
              <Shirt className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground/80">추천 상의 색상</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {colorRecommendations.topColors.map((color, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-violet-50 text-violet-700 rounded-full text-sm"
                >
                  {color}
                </span>
              ))}
            </div>
          </div>

          {/* 추천 하의 색상 */}
          <div className="mb-4">
            <div className="flex items-center gap-1 mb-2">
              <Shirt className="w-4 h-4 text-muted-foreground rotate-180" />
              <span className="text-sm font-medium text-foreground/80">추천 하의 색상</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {colorRecommendations.bottomColors.map((color, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                >
                  {color}
                </span>
              ))}
            </div>
          </div>

          {/* 베스트 조합 */}
          {colorRecommendations.bestCombinations.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-foreground/80 mb-2">베스트 조합</p>
              <div className="space-y-2">
                {colorRecommendations.bestCombinations.slice(0, 3).map((combo, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm bg-muted px-3 py-2 rounded-lg"
                  >
                    <span className="text-violet-600">{combo.top}</span>
                    <span className="text-muted-foreground">+</span>
                    <span className="text-indigo-600">{combo.bottom}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 악세서리 추천 */}
          {colorRecommendations.accessories.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-foreground/80 mb-2">악세서리 추천</p>
              <div className="flex flex-wrap gap-2">
                {colorRecommendations.accessories.map((acc, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm"
                  >
                    {acc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 피해야 할 색상 */}
          {colorRecommendations.avoidColors.length > 0 && (
            <div className="pt-3 border-t">
              <div className="flex items-center gap-1 mb-2">
                <Ban className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">피해야 할 색상</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {colorRecommendations.avoidColors.map((color, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm line-through"
                  >
                    {color}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 색상 팁 */}
      {colorTips && colorTips.length > 0 && (
        <section className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl border border-violet-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-5 h-5 text-violet-500" />
            <h2 className="text-lg font-semibold text-foreground">색상 팁</h2>
          </div>
          <ul className="space-y-2">
            {colorTips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2 text-foreground/80">
                <span className="text-violet-500 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 추천 아이템 (가변 보상) */}
      <section className="bg-card rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="w-5 h-5 text-pink-500" />
          <h2 className="text-lg font-semibold text-foreground">추천 아이템</h2>
        </div>
        <div className="space-y-3">
          {styleRecommendations.map((rec, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 bg-muted rounded-lg"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-sm font-medium">
                {index + 1}
              </span>
              <div>
                <p className="font-medium text-foreground">{rec.item}</p>
                <p className="text-sm text-muted-foreground">{rec.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 분석 시간 */}
      <p className="text-center text-sm text-muted-foreground">
        분석 시간: {analyzedAt.toLocaleString('ko-KR')}
      </p>

      {/* 다시 분석하기 버튼 */}
      <Button
        onClick={onRetry}
        variant="outline"
        className="w-full h-12 text-base gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        다시 분석하기
      </Button>
    </div>
  );
}
