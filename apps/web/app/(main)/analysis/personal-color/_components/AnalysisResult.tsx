'use client';

import { RefreshCw, Sparkles, Palette, Shirt, Heart, Star, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type PersonalColorResult,
  SEASON_INFO,
  getSeasonColor,
  getSeasonLightBgColor,
  getSeasonBorderColor,
} from '@/lib/mock/personal-color';
import { useShare } from '@/hooks/useShare';
import { ShareButton } from '@/components/share';
import { FadeInUp, ScaleIn } from '@/components/animations';

interface AnalysisResultProps {
  result: PersonalColorResult;
  onRetry: () => void;
}

export default function AnalysisResult({
  result,
  onRetry,
}: AnalysisResultProps) {
  const {
    seasonType,
    seasonLabel,
    seasonDescription,
    confidence,
    bestColors,
    worstColors,
    lipstickRecommendations,
    clothingRecommendations,
    celebrityMatch,
    insight,
    analyzedAt,
  } = result;

  const info = SEASON_INFO[seasonType];
  const { ref: shareRef, share, loading: shareLoading } = useShare(`이룸-퍼스널컬러-${seasonLabel}`);

  return (
    <div ref={shareRef} className="space-y-6">
      {/* 퍼스널 컬러 타입 카드 - 메인 결과로 ScaleIn 강조 */}
      <ScaleIn>
        <section className={`rounded-xl border p-6 text-center ${getSeasonLightBgColor(seasonType)} ${getSeasonBorderColor(seasonType)}`}>
          <p className="text-sm text-gray-500 mb-2">당신의 퍼스널 컬러</p>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className={`text-4xl font-bold ${getSeasonColor(seasonType)}`}>
              {seasonLabel}
            </span>
            <span className="text-3xl">{info.emoji}</span>
          </div>
          <p className="text-gray-600">{seasonDescription}</p>
          <p className="mt-2 text-sm text-gray-500">{info.characteristics}</p>
          <div className="mt-4 inline-flex items-center gap-1 px-3 py-1 bg-white/70 rounded-full">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">
              신뢰도 {confidence}%
            </span>
          </div>
        </section>
      </ScaleIn>

      {/* 베스트 컬러 팔레트 */}
      <FadeInUp delay={1}>
        <section className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-semibold text-gray-900">베스트 컬러</h2>
            <span className="text-xs text-gray-400 ml-auto">TOP 10</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {bestColors.map((color, index) => (
              <div key={index} className="text-center">
                <div
                  className="w-full aspect-square rounded-lg shadow-sm border border-gray-100"
                  style={{ backgroundColor: color.hex }}
                />
                <p className="text-xs text-gray-600 mt-1 truncate">{color.name}</p>
              </div>
            ))}
          </div>
        </section>
      </FadeInUp>

      {/* 워스트 컬러 */}
      <FadeInUp delay={2}>
        <section className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">피해야 할 컬러</h2>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {worstColors.map((color, index) => (
              <div key={index} className="text-center opacity-70">
                <div
                  className="w-full aspect-square rounded-lg shadow-sm border border-gray-100 relative"
                  style={{ backgroundColor: color.hex }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-red-500/50 rotate-45" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{color.name}</p>
              </div>
            ))}
          </div>
        </section>
      </FadeInUp>

      {/* AI 스타일 인사이트 (가변 보상) */}
      <FadeInUp delay={3}>
        <section className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-semibold text-gray-900">스타일 인사이트</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">{insight}</p>
        </section>
      </FadeInUp>

      {/* 연예인 매칭 (가변 보상) */}
      <FadeInUp delay={4}>
        <section className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900">닮은 연예인</h2>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center text-2xl">
              {info.emoji}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{celebrityMatch.name}</p>
              <p className="text-sm text-gray-600">{celebrityMatch.reason}</p>
            </div>
          </div>
        </section>
      </FadeInUp>

      {/* 립스틱 추천 */}
      <FadeInUp delay={5}>
        <section className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-gray-900">추천 립스틱</h2>
          </div>
          <div className="space-y-3">
            {lipstickRecommendations.map((lip, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div
                  className="w-8 h-8 rounded-full shadow-sm border border-gray-200"
                  style={{ backgroundColor: lip.hex }}
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{lip.colorName}</p>
                  {lip.brandExample && (
                    <p className="text-xs text-gray-500">{lip.brandExample}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </FadeInUp>

      {/* 의류 추천 */}
      <FadeInUp delay={6}>
        <section className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shirt className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">추천 스타일링</h2>
          </div>
          <div className="space-y-3">
            {clothingRecommendations.map((rec, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${getSeasonLightBgColor(seasonType)} ${getSeasonColor(seasonType)}`}>
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-900">
                    {rec.item} - <span className={getSeasonColor(seasonType)}>{rec.colorSuggestion}</span>
                  </p>
                  <p className="text-sm text-gray-600">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </FadeInUp>

      {/* 통계 정보 */}
      <FadeInUp delay={7}>
        <section className="bg-gray-50 rounded-xl border p-4 text-center">
          <p className="text-sm text-gray-500">
            전체 사용자 중 <span className={`font-semibold ${getSeasonColor(seasonType)}`}>{info.percentage}%</span>가 {seasonLabel}이에요
          </p>
        </section>
      </FadeInUp>

      {/* 분석 시간 */}
      <p className="text-center text-sm text-gray-400">
        분석 시간: {analyzedAt.toLocaleString('ko-KR')}
      </p>

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

      {/* 공유 버튼 */}
      <FadeInUp delay={8}>
        <ShareButton
          onShare={share}
          loading={shareLoading}
          variant="default"
        />
      </FadeInUp>
    </div>
  );
}
