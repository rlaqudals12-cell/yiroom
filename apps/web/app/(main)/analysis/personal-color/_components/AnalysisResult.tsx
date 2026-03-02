'use client';

import {
  Sparkles,
  Palette,
  Shirt,
  Heart,
  Star,
  Lightbulb,
  Brush,
  Tag,
  Droplets,
} from 'lucide-react';
import {
  type PersonalColorResult,
  type GroomingRecommendation,
  type ClothingRecommendation,
  type StyleDescription,
  SEASON_INFO,
  getSeasonColor,
  getSeasonLightBgColor,
  getSeasonBorderColor,
  GROOMING_RECOMMENDATIONS,
  MALE_CLOTHING_RECOMMENDATIONS,
  MALE_STYLE_DESCRIPTIONS,
} from '@/lib/mock/personal-color';
import { FadeInUp, ScaleIn } from '@/components/animations';
import {
  PersonalColorEvidenceSummary,
  type PersonalColorEvidenceSummaryProps,
} from '@/components/analysis/EvidenceSummary';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getGenderAdaptiveTerm } from '@/lib/content/gender-adaptive';
import { selectByKey } from '@/lib/utils/conditional-helpers';

// 분석 근거 타입 (AnalysisEvidenceReport와 호환)
interface AnalysisEvidence {
  veinColor?: PersonalColorEvidenceSummaryProps['veinColor'];
  skinUndertone?: PersonalColorEvidenceSummaryProps['skinUndertone'];
}

interface AnalysisResultProps {
  result: PersonalColorResult;
  onRetry?: () => void;
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

export default function AnalysisResult({
  result,
  onRetry: _onRetry,
  evidence,
}: AnalysisResultProps) {
  const {
    seasonType,
    seasonLabel,
    seasonDescription,
    confidence,
    bestColors,
    worstColors,
    lipstickRecommendations,
    foundationRecommendations,
    clothingRecommendations,
    styleDescription,
    insight,
    easyInsight,
    analyzedAt,
  } = result;

  const info = SEASON_INFO[seasonType];

  // 사용자 프로필에서 성별 가져오기 (스타일 키워드 적응에 사용)
  const { profile } = useUserProfile();
  const userGender = profile.gender || 'neutral';
  const isMale = userGender === 'male';

  // 성별에 따른 데이터 선택
  const genderStyleDescription: StyleDescription = isMale
    ? MALE_STYLE_DESCRIPTIONS[seasonType]
    : styleDescription;
  const genderClothingRecommendations: ClothingRecommendation[] = isMale
    ? MALE_CLOTHING_RECOMMENDATIONS[seasonType]
    : clothingRecommendations;
  const groomingRecommendations: GroomingRecommendation[] = GROOMING_RECOMMENDATIONS[seasonType];

  return (
    <div className="space-y-6">
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
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
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
              <div className="relative w-16 h-20 sm:w-20 sm:h-24 mx-auto mb-2">
                <FaceAvatar className="w-full h-full text-stone-300 dark:text-stone-600" />
                <div
                  className="absolute inset-0 mix-blend-multiply opacity-50 dark:mix-blend-screen dark:opacity-30"
                  style={{ backgroundColor: bestColors[0]?.hex }}
                />
              </div>
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-lg shadow-sm border-2 border-pink-300 dark:border-pink-700"
                style={{ backgroundColor: bestColors[0]?.hex }}
              />
              <p className="text-xs text-muted-foreground mt-1">{bestColors[0]?.name}</p>
              <p className="text-sm font-medium text-pink-600 dark:text-pink-400 mt-1 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3" />
                {getGenderAdaptiveTerm('화사해요', userGender)}
              </p>
            </div>

            {/* 워스트 컬러 */}
            <div className="text-center">
              <div className="relative w-16 h-20 sm:w-20 sm:h-24 mx-auto mb-2">
                <FaceAvatar className="w-full h-full text-stone-300 dark:text-stone-600" />
                <div
                  className="absolute inset-0 mix-blend-multiply opacity-50 dark:mix-blend-screen dark:opacity-30"
                  style={{ backgroundColor: worstColors[0]?.hex }}
                />
              </div>
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 mx-auto rounded-lg shadow-sm border border-muted opacity-70"
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
            더 {isMale ? '깔끔해' : '화사해'} 보여요
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

      {/* 스타일 키워드 - 성별 적응형 */}
      <FadeInUp delay={4}>
        <section className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-foreground">나의 스타일 키워드</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {genderStyleDescription.imageKeywords.map((keyword, index) => (
              <span
                key={index}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${getSeasonLightBgColor(seasonType)} ${getSeasonColor(seasonType)} border ${getSeasonBorderColor(seasonType)}`}
              >
                {/* 성별에 따라 키워드 변환 (화사한→깔끔한, 청순한→단정한 등) */}
                {getGenderAdaptiveTerm(keyword, userGender)}
              </span>
            ))}
          </div>
        </section>
      </FadeInUp>

      {/* 메이크업/그루밍 & 패션 스타일 가이드 (초보자 친화, 성별 적응형) */}
      <FadeInUp delay={5}>
        <section className="bg-card rounded-xl border p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Brush className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-semibold text-foreground">스타일 가이드</h2>
          </div>

          {/* 남성: 그루밍 가이드 / 여성: 메이크업 가이드 */}
          {isMale ? (
            // 남성용 그루밍 가이드
            <div className="p-4 bg-slate-50 dark:bg-slate-950/20 rounded-lg space-y-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">✨ 그루밍</p>
              {genderStyleDescription.easyGrooming ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                      피부
                    </span>
                    <p className="text-sm text-foreground/80">
                      {genderStyleDescription.easyGrooming.skin}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                      헤어
                    </span>
                    <p className="text-sm text-foreground/80">
                      {genderStyleDescription.easyGrooming.hair}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded">
                      향수
                    </span>
                    <p className="text-sm text-foreground/80">
                      {genderStyleDescription.easyGrooming.scent}
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 p-2 bg-slate-100 dark:bg-slate-900/30 rounded">
                    💡 {genderStyleDescription.easyGrooming.tip}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {genderStyleDescription.makeupStyle}
                </p>
              )}
            </div>
          ) : (
            // 여성용 메이크업 가이드
            <div className="p-4 bg-pink-50 dark:bg-pink-950/20 rounded-lg space-y-3">
              <p className="text-sm font-medium text-pink-700 dark:text-pink-300">💄 메이크업</p>
              {genderStyleDescription.easyMakeup ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-xs bg-pink-200 dark:bg-pink-800 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded">
                      립
                    </span>
                    <p className="text-sm text-foreground/80">
                      {genderStyleDescription.easyMakeup.lip}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs bg-pink-200 dark:bg-pink-800 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded">
                      눈
                    </span>
                    <p className="text-sm text-foreground/80">
                      {genderStyleDescription.easyMakeup.eye}
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-xs bg-pink-200 dark:bg-pink-800 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded">
                      볼
                    </span>
                    <p className="text-sm text-foreground/80">
                      {genderStyleDescription.easyMakeup.cheek}
                    </p>
                  </div>
                  <p className="text-xs text-pink-600 dark:text-pink-400 mt-2 p-2 bg-pink-100 dark:bg-pink-900/30 rounded">
                    💡 {genderStyleDescription.easyMakeup.tip}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {genderStyleDescription.makeupStyle}
                </p>
              )}
            </div>
          )}

          {/* 패션 - 초보자 친화 (성별 공통, 데이터만 다름) */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg space-y-3">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">👕 패션</p>
            {genderStyleDescription.easyFashion ? (
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">추천 컬러</p>
                  <div className="flex flex-wrap gap-1">
                    {genderStyleDescription.easyFashion.colors.map((color, idx) => (
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
                    {genderStyleDescription.easyFashion.avoid.map((color, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded line-through"
                      >
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-foreground/80">
                  {genderStyleDescription.easyFashion.style}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded">
                  💡 {genderStyleDescription.easyFashion.tip}
                </p>
              </div>
            ) : (
              <p className="text-sm text-foreground/80 leading-relaxed">
                {genderStyleDescription.fashionStyle}
              </p>
            )}
          </div>

          {/* 액세서리 - 초보자 친화 (성별 공통, 데이터만 다름) */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg space-y-3">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              {isMale ? '⌚ 액세서리' : '💍 액세서리'}
            </p>
            {genderStyleDescription.easyAccessory ? (
              <div className="space-y-2">
                <p className="text-sm text-foreground/80">
                  <span className="font-medium">{genderStyleDescription.easyAccessory.metal}</span>
                  이 잘 어울려요
                </p>
                <div className="flex flex-wrap gap-1">
                  {genderStyleDescription.easyAccessory.examples.map((item, idx) => (
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
                {genderStyleDescription.accessories}
              </p>
            )}
          </div>
        </section>
      </FadeInUp>

      {/* 남성: 그루밍 제품 추천 / 여성: 립스틱 추천 */}
      <FadeInUp delay={6}>
        <section className="bg-card rounded-xl border p-6">
          {isMale ? (
            // 남성용 그루밍 제품 추천
            <>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-slate-500" />
                <h2 className="text-lg font-semibold text-foreground">추천 그루밍 아이템</h2>
              </div>
              <div className="space-y-3">
                {groomingRecommendations.map((item, index) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg shadow-sm border border-border flex-shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: item.hex }}
                      >
                        <span className="text-xs text-foreground/50">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground">{item.itemName}</p>
                          <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                            {item.colorTone}
                          </span>
                        </div>
                        {item.easyDescription && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.easyDescription}
                          </p>
                        )}
                        {item.brandExample && (
                          <p className="text-xs text-muted-foreground">{item.brandExample}</p>
                        )}
                      </div>
                    </div>
                    {item.oliveyoungAlt && (
                      <div className="mt-2 pl-12 sm:pl-12 sm:pl-[52px]">
                        <p className="text-xs text-green-600 dark:text-green-400">
                          🏪 올리브영: {item.oliveyoungAlt}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            // 여성용 립스틱 추천
            <>
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
                      <div className="mt-2 pl-12 sm:pl-12 sm:pl-[52px]">
                        <p className="text-xs text-green-600 dark:text-green-400">
                          🏪 올리브영: {lip.oliveyoungAlt}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </FadeInUp>

      {/* 파운데이션 추천 */}
      {foundationRecommendations && foundationRecommendations.length > 0 && (
        <FadeInUp delay={7}>
          <section className="bg-card rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Droplets className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-foreground">추천 파운데이션</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {result.tone === 'warm'
                ? '옐로 베이스 (웜톤용) 파운데이션이 잘 어울려요'
                : '핑크 베이스 (쿨톤용) 파운데이션이 잘 어울려요'}
            </p>
            <div className="space-y-3">
              {foundationRecommendations.map((foundation, index) => (
                <div key={index} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg shadow-sm border border-border flex-shrink-0 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                      <span className="text-lg">💧</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">{foundation.shadeName}</p>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            selectByKey(foundation.undertone, {
                              warm: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                              cool: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                            }, 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400')
                          }`}
                        >
                          {selectByKey(foundation.undertone, {
                            warm: '웜',
                            cool: '쿨',
                          }, '뉴트럴')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {foundation.easyDescription}
                      </p>
                      <p className="text-xs text-muted-foreground">{foundation.brandExample}</p>
                    </div>
                  </div>
                  {foundation.oliveyoungAlt && (
                    <div className="mt-2 pl-12 sm:pl-[52px]">
                      <p className="text-xs text-green-600 dark:text-green-400">
                        🏪 올리브영: {foundation.oliveyoungAlt}
                      </p>
                    </div>
                  )}
                  {foundation.tip && (
                    <div className="mt-2 pl-12 sm:pl-[52px]">
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        💡 {foundation.tip}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </FadeInUp>
      )}

      {/* 의류 추천 (성별 적응형) */}
      <FadeInUp delay={8}>
        <section className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shirt className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-foreground">추천 스타일링</h2>
          </div>
          <div className="space-y-3">
            {genderClothingRecommendations.map((rec, index) => (
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
      <FadeInUp delay={9}>
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
    </div>
  );
}
