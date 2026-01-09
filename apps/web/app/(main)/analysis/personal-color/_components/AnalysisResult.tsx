'use client';

import {
  RefreshCw,
  Sparkles,
  Palette,
  Shirt,
  Heart,
  Star,
  Lightbulb,
  Brush,
  Tag,
} from 'lucide-react';
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
import {
  PersonalColorEvidenceSummary,
  type PersonalColorEvidenceSummaryProps,
} from '@/components/analysis/EvidenceSummary';

// 분석 근거 타입 (AnalysisEvidenceReport와 호환)
interface AnalysisEvidence {
  veinColor?: PersonalColorEvidenceSummaryProps['veinColor'];
  skinUndertone?: PersonalColorEvidenceSummaryProps['skinUndertone'];
}

interface AnalysisResultProps {
  result: PersonalColorResult;
  onRetry: () => void;
  evidence?: AnalysisEvidence | null;
}

// 얼굴 실루엣 아바타 (색상 비교용)
function FaceAvatar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 56" className={className} aria-hidden="true">
      {/* 머리 */}
      <ellipse cx="24" cy="20" rx="14" ry="16" fill="currentColor" />
      {/* 목 */}
      <rect x="18" y="34" width="12" height="8" fill="currentColor" />
      {/* 어깨 */}
      <ellipse cx="24" cy="48" rx="20" ry="8" fill="currentColor" />
    </svg>
  );
}

export default function AnalysisResult({ result, onRetry, evidence }: AnalysisResultProps) {
  const {
    seasonType,
    seasonLabel,
    seasonDescription,
    confidence,
    bestColors,
    worstColors,
    lipstickRecommendations,
    clothingRecommendations,
    styleDescription,
    insight,
    easyInsight,
    analyzedAt,
  } = result;

  const info = SEASON_INFO[seasonType];
  const {
    ref: shareRef,
    share,
    loading: shareLoading,
  } = useShare(`이룸-퍼스널컬러-${seasonLabel}`);

  return (
    <div ref={shareRef} className="space-y-6">
      {/* 퍼스널 컬러 타입 카드 - 메인 결과로 ScaleIn 강조 */}
      <ScaleIn>
        <section
          className={`rounded-xl border p-6 text-center ${getSeasonLightBgColor(seasonType)} ${getSeasonBorderColor(seasonType)}`}
        >
          <p className="text-sm text-muted-foreground mb-2">당신의 퍼스널 컬러</p>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className={`text-4xl font-bold ${getSeasonColor(seasonType)}`}>
              {seasonLabel}
            </span>
            <span className="text-3xl">{info.emoji}</span>
          </div>
          <p className="text-muted-foreground">{seasonDescription}</p>
          <p className="mt-2 text-sm text-muted-foreground">{info.characteristics}</p>
          <div className="mt-4 inline-flex items-center gap-1 px-3 py-1 bg-card/70 rounded-full">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-foreground/80">신뢰도 {confidence}%</span>
          </div>

          {/* 핵심 판정 근거 요약 */}
          <PersonalColorEvidenceSummary
            veinColor={evidence?.veinColor}
            skinUndertone={evidence?.skinUndertone}
            tone={result.tone}
            className="mt-4"
          />
        </section>
      </ScaleIn>

      {/* 베스트 컬러 팔레트 */}
      <FadeInUp delay={1}>
        <section className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-semibold text-foreground">베스트 컬러</h2>
            <span className="text-xs text-muted-foreground ml-auto">TOP 10</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {bestColors.map((color, index) => (
              <div key={index} className="text-center">
                <div
                  className="w-full aspect-square rounded-lg shadow-sm border border-border"
                  style={{ backgroundColor: color.hex }}
                />
                <p className="text-xs text-muted-foreground mt-1 truncate">{color.name}</p>
              </div>
            ))}
          </div>
        </section>
      </FadeInUp>

      {/* 컬러 비교 - Color Comparison UX */}
      <FadeInUp delay={2}>
        <section className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-amber-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">컬러가 주는 인상 차이</h2>
          </div>

          {/* 베스트 vs 워스트 비교 카드 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* 베스트 컬러 */}
            <div className="text-center">
              <div className="relative w-20 h-24 mx-auto mb-2">
                <FaceAvatar className="w-full h-full text-stone-300 dark:text-stone-600" />
                <div
                  className="absolute inset-0 mix-blend-multiply opacity-50 dark:mix-blend-screen dark:opacity-30"
                  style={{ backgroundColor: bestColors[0]?.hex }}
                />
              </div>
              <div
                className="w-10 h-10 mx-auto rounded-lg shadow-sm border-2 border-pink-300 dark:border-pink-700"
                style={{ backgroundColor: bestColors[0]?.hex }}
              />
              <p className="text-xs text-muted-foreground mt-1">{bestColors[0]?.name}</p>
              <p className="text-sm font-medium text-pink-600 dark:text-pink-400 mt-1 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" />
                화사해요
              </p>
            </div>

            {/* 워스트 컬러 */}
            <div className="text-center">
              <div className="relative w-20 h-24 mx-auto mb-2">
                <FaceAvatar className="w-full h-full text-stone-300 dark:text-stone-600" />
                <div
                  className="absolute inset-0 mix-blend-multiply opacity-50 dark:mix-blend-screen dark:opacity-30"
                  style={{ backgroundColor: worstColors[0]?.hex }}
                />
              </div>
              <div
                className="w-10 h-10 mx-auto rounded-lg shadow-sm border border-muted opacity-70"
                style={{ backgroundColor: worstColors[0]?.hex }}
              />
              <p className="text-xs text-muted-foreground mt-1">{worstColors[0]?.name}</p>
              <p className="text-sm text-muted-foreground mt-1">칙칙해요</p>
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t border-border my-4" />

          {/* 나머지 주의 컬러 (참고용) */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">나머지 주의 컬러 (참고용)</p>
            <div className="flex gap-2">
              {worstColors.slice(1, 5).map((color, index) => (
                <div key={index} className="text-center">
                  <div
                    className="w-8 h-8 rounded-md border border-dashed border-muted-foreground/40"
                    style={{ backgroundColor: color.hex }}
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5 text-center leading-tight max-w-[48px]">
                    {color.name}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 안내 텍스트 */}
          <p className="text-xs text-muted-foreground mt-4">
            위의 <span className="font-medium text-foreground">베스트 컬러</span>를 활용하면 피부가
            더 화사해 보여요
          </p>
        </section>
      </FadeInUp>

      {/* AI 스타일 인사이트 (초보자 친화) */}
      <FadeInUp delay={3}>
        <section className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 rounded-xl border border-pink-200 dark:border-pink-800 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-semibold text-foreground">스타일 인사이트</h2>
          </div>
          {easyInsight ? (
            <div className="space-y-4">
              <p className="text-foreground/90 leading-relaxed font-medium">
                {easyInsight.summary}
              </p>
              <p className="text-foreground/70 leading-relaxed text-sm">
                {easyInsight.easyExplanation}
              </p>
              <div className="mt-3 p-3 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                <p className="text-sm text-pink-700 dark:text-pink-300 font-medium">
                  💡 바로 실천해보세요
                </p>
                <p className="text-sm text-pink-600 dark:text-pink-400 mt-1">
                  {easyInsight.actionTip}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-foreground/80 leading-relaxed">{insight}</p>
          )}
        </section>
      </FadeInUp>

      {/* 스타일 키워드 */}
      <FadeInUp delay={4}>
        <section className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-foreground">나의 스타일 키워드</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {styleDescription.imageKeywords.map((keyword, index) => (
              <span
                key={index}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${getSeasonLightBgColor(seasonType)} ${getSeasonColor(seasonType)} border ${getSeasonBorderColor(seasonType)}`}
              >
                {keyword}
              </span>
            ))}
          </div>
        </section>
      </FadeInUp>

      {/* 메이크업 & 패션 스타일 가이드 (초보자 친화) */}
      <FadeInUp delay={5}>
        <section className="bg-card rounded-xl border p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Brush className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-semibold text-foreground">스타일 가이드</h2>
          </div>

          {/* 메이크업 - 초보자 친화 */}
          <div className="p-4 bg-pink-50 dark:bg-pink-950/20 rounded-lg space-y-3">
            <p className="text-sm font-medium text-pink-700 dark:text-pink-300">💄 메이크업</p>
            {styleDescription.easyMakeup ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs bg-pink-200 dark:bg-pink-800 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded">
                    립
                  </span>
                  <p className="text-sm text-foreground/80">{styleDescription.easyMakeup.lip}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs bg-pink-200 dark:bg-pink-800 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded">
                    눈
                  </span>
                  <p className="text-sm text-foreground/80">{styleDescription.easyMakeup.eye}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs bg-pink-200 dark:bg-pink-800 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded">
                    볼
                  </span>
                  <p className="text-sm text-foreground/80">{styleDescription.easyMakeup.cheek}</p>
                </div>
                <p className="text-xs text-pink-600 dark:text-pink-400 mt-2 p-2 bg-pink-100 dark:bg-pink-900/30 rounded">
                  💡 {styleDescription.easyMakeup.tip}
                </p>
              </div>
            ) : (
              <p className="text-sm text-foreground/80 leading-relaxed">
                {styleDescription.makeupStyle}
              </p>
            )}
          </div>

          {/* 패션 - 초보자 친화 */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg space-y-3">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">👕 패션</p>
            {styleDescription.easyFashion ? (
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">추천 컬러</p>
                  <div className="flex flex-wrap gap-1">
                    {styleDescription.easyFashion.colors.map((color, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded"
                      >
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">피해야 할 컬러</p>
                  <div className="flex flex-wrap gap-1">
                    {styleDescription.easyFashion.avoid.map((color, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded line-through"
                      >
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-foreground/80">{styleDescription.easyFashion.style}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                  💡 {styleDescription.easyFashion.tip}
                </p>
              </div>
            ) : (
              <p className="text-sm text-foreground/80 leading-relaxed">
                {styleDescription.fashionStyle}
              </p>
            )}
          </div>

          {/* 액세서리 - 초보자 친화 */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg space-y-3">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">💍 액세서리</p>
            {styleDescription.easyAccessory ? (
              <div className="space-y-2">
                <p className="text-sm text-foreground/80">
                  <span className="font-medium">{styleDescription.easyAccessory.metal}</span>이 잘
                  어울려요
                </p>
                <div className="flex flex-wrap gap-1">
                  {styleDescription.easyAccessory.examples.map((item, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground/80 leading-relaxed">
                {styleDescription.accessories}
              </p>
            )}
          </div>
        </section>
      </FadeInUp>

      {/* 립스틱 추천 (초보자 친화) */}
      <FadeInUp delay={6}>
        <section className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-foreground">추천 립스틱</h2>
          </div>
          <div className="space-y-3">
            {lipstickRecommendations.map((lip, index) => (
              <div key={index} className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full shadow-sm border border-border flex-shrink-0"
                    style={{ backgroundColor: lip.hex }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{lip.colorName}</p>
                      {lip.easyDescription && (
                        <span className="text-xs text-muted-foreground">
                          = {lip.easyDescription}
                        </span>
                      )}
                    </div>
                    {lip.brandExample && (
                      <p className="text-xs text-muted-foreground">{lip.brandExample}</p>
                    )}
                  </div>
                </div>
                {lip.oliveyoungAlt && (
                  <div className="mt-2 ml-13 pl-[52px]">
                    <p className="text-xs text-green-600 dark:text-green-400">
                      🏪 올리브영: {lip.oliveyoungAlt}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </FadeInUp>

      {/* 의류 추천 */}
      <FadeInUp delay={7}>
        <section className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shirt className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-foreground">추천 스타일링</h2>
          </div>
          <div className="space-y-3">
            {clothingRecommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <span
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${getSeasonLightBgColor(seasonType)} ${getSeasonColor(seasonType)}`}
                >
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-foreground">
                    {rec.item} -{' '}
                    <span className={getSeasonColor(seasonType)}>{rec.colorSuggestion}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </FadeInUp>

      {/* 통계 정보 */}
      <FadeInUp delay={8}>
        <section className="bg-muted rounded-xl border p-4 text-center">
          <p className="text-sm text-muted-foreground">
            전체 사용자 중{' '}
            <span className={`font-semibold ${getSeasonColor(seasonType)}`}>
              {info.percentage}%
            </span>
            가 {seasonLabel}이에요
          </p>
        </section>
      </FadeInUp>

      {/* 분석 시간 */}
      <p className="text-center text-sm text-muted-foreground">
        분석 시간: {analyzedAt.toLocaleString('ko-KR')}
      </p>

      {/* 다시 분석하기 버튼 */}
      <FadeInUp delay={9}>
        <Button onClick={onRetry} variant="outline" className="w-full h-12 text-base gap-2">
          <RefreshCw className="w-4 h-4" />
          다시 분석하기
        </Button>
      </FadeInUp>

      {/* 공유 버튼 */}
      <FadeInUp delay={9}>
        <ShareButton onShare={share} loading={shareLoading} variant="default" />
      </FadeInUp>
    </div>
  );
}
