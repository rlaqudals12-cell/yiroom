'use client';

import {
  RefreshCw,
  Sparkles,
  ShoppingBag,
  Zap,
  Ruler,
  Scale,
  Target,
  Palette,
  Shirt,
  Ban,
  AlertTriangle,
  Users,
  Lightbulb,
  Bookmark,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type BodyAnalysisResult,
  type BodyType3,
  BODY_TYPES,
  BODY_TYPES_3,
  getBodyTypeColor,
  getBodyTypeBgColor,
  getBodyType3Color,
  getBodyType3BgColor,
  mapBodyTypeTo3Type,
} from '@/lib/mock/body-analysis';
import { FadeInUp, ScaleIn, CountUp } from '@/components/animations';
import { RecommendedClothingCard, BodyStyleImage } from '@/components/analysis/body';
import { getOutfitExamples } from '@/lib/color-recommendations';
import { BodyEvidenceSummary } from '@/components/analysis/EvidenceSummary';

// 체형 분석 근거 타입
interface BodyAnalysisEvidence {
  silhouette?: 'I' | 'S' | 'X' | 'H' | 'Y';
  upperLowerBalance?: 'upper_dominant' | 'balanced' | 'lower_dominant';
}

// 3타입인지 확인
function isBodyType3(type: string): type is BodyType3 {
  return type === 'S' || type === 'W' || type === 'N';
}

interface AnalysisResultProps {
  result: BodyAnalysisResult;
  onRetry: () => void;
  shareRef?: React.RefObject<HTMLDivElement | null>;
  evidence?: BodyAnalysisEvidence | null;
}

export default function AnalysisResult({
  result,
  onRetry,
  shareRef,
  evidence,
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
    easyBodyTip,
  } = result;

  // 3타입 시스템 지원
  const is3Type = isBodyType3(bodyType);
  const type3 = is3Type
    ? bodyType
    : mapBodyTypeTo3Type(bodyType as import('@/lib/mock/body-analysis').BodyType);
  const typeInfo3 = BODY_TYPES_3[type3];
  const _typeInfoLegacy = !is3Type
    ? BODY_TYPES[bodyType as import('@/lib/mock/body-analysis').BodyType]
    : null;

  // 색상 헬퍼
  const getColor = () =>
    is3Type
      ? getBodyType3Color(type3)
      : getBodyTypeColor(bodyType as import('@/lib/mock/body-analysis').BodyType);
  const getBgColor = () =>
    is3Type
      ? getBodyType3BgColor(type3)
      : getBodyTypeBgColor(bodyType as import('@/lib/mock/body-analysis').BodyType);

  // 키워드 (3타입이면 typeInfo3에서, 아니면 레거시 변환)
  const keywords = (result as { keywords?: string[] }).keywords || typeInfo3.keywords;
  // 피해야 할 스타일
  const avoidStyles = (result as { avoidStyles?: string[] }).avoidStyles || typeInfo3.avoidStyles;
  // 특징
  const _characteristics =
    (result as { characteristics?: string }).characteristics || typeInfo3.characteristics;

  // 체형 + 퍼스널 컬러 조합 코디 예시
  const outfitExamples = getOutfitExamples(type3, personalColorSeason || null);

  return (
    <div ref={shareRef} className="space-y-6" role="region" aria-label="체형 분석 결과">
      {/* 기본 정보 (사용자 입력) */}
      {userInput && (
        <FadeInUp>
          <section className="bg-card rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">기본 정보</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Ruler className="w-4 h-4" />
                  <span className="text-xs">키</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  <CountUp end={userInput.height} duration={1000} />
                </p>
                <p className="text-xs text-muted-foreground">cm</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Scale className="w-4 h-4" />
                  <span className="text-xs">몸무게</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  <CountUp end={userInput.weight} duration={1000} />
                </p>
                <p className="text-xs text-muted-foreground">kg</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-xs">BMI</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  <CountUp end={bmi || 0} decimals={1} duration={1200} />
                </p>
                <p
                  className={`text-xs ${
                    bmiCategory === '정상'
                      ? 'text-green-500'
                      : bmiCategory === '저체중'
                        ? 'text-blue-500'
                        : 'text-orange-500'
                  }`}
                >
                  {bmiCategory}
                </p>
              </div>
            </div>
            {userInput.targetWeight && (
              <div className="mt-4 pt-4 border-t text-center">
                <p className="text-sm text-muted-foreground">
                  목표 몸무게:{' '}
                  <span className="font-medium text-foreground">{userInput.targetWeight}kg</span>
                  <span className="ml-2 text-purple-500">
                    ({userInput.weight > userInput.targetWeight ? '-' : '+'}
                    {Math.abs(userInput.weight - userInput.targetWeight).toFixed(1)}kg)
                  </span>
                </p>
              </div>
            )}
          </section>
        </FadeInUp>
      )}

      {/* 체형 타입 카드 - ScaleIn으로 강조 */}
      <ScaleIn delay={1}>
        <section className="bg-card rounded-xl border p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">체형 타입</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">{typeInfo3.emoji}</span>
            <span className={`text-4xl font-bold ${getColor()}`}>
              {is3Type ? typeInfo3.label : bodyTypeLabel}
            </span>
          </div>
          {is3Type && <p className="text-sm text-muted-foreground mt-1">({typeInfo3.labelEn})</p>}
          <p className="mt-2 text-muted-foreground">{bodyTypeDescription}</p>

          {/* 초보자용 한 줄 설명 */}
          {typeInfo3.simpleExplanation && (
            <div className={`mt-3 px-4 py-2 rounded-lg ${getBgColor()} inline-block`}>
              <p className={`text-sm font-medium ${getColor()}`}>{typeInfo3.simpleExplanation}</p>
            </div>
          )}

          {/* 키워드 태그 */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className={`px-3 py-1 rounded-full text-sm ${
                  is3Type
                    ? type3 === 'S'
                      ? 'bg-blue-100 text-blue-700'
                      : type3 === 'W'
                        ? 'bg-pink-100 text-pink-700'
                        : 'bg-green-100 text-green-700'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {keyword}
              </span>
            ))}
          </div>

          {/* 대표 연예인 예시 */}
          {typeInfo3.celebrities && typeInfo3.celebrities.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-2">
                <Users className="w-4 h-4" />
                <span className="text-xs">대표 연예인</span>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {typeInfo3.celebrities.map((celeb) => (
                  <span
                    key={celeb}
                    className="px-2 py-1 bg-muted rounded-md text-sm text-foreground/80"
                  >
                    {celeb}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 핵심 판정 근거 요약 */}
          <BodyEvidenceSummary
            silhouette={evidence?.silhouette}
            upperLowerBalance={evidence?.upperLowerBalance}
            bodyType={bodyType}
            className="mt-4"
          />
        </section>
      </ScaleIn>

      {/* 자가 진단 팁 */}
      {typeInfo3.selfCheckTip && (
        <FadeInUp delay={2}>
          <section className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200 p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 mb-1">알고 계셨나요?</p>
                <p className="text-sm text-amber-700 leading-relaxed">{typeInfo3.selfCheckTip}</p>
              </div>
            </div>
          </section>
        </FadeInUp>
      )}

      {/* 초보자 친화 스타일 가이드 (EASY_BODY_TIPS) */}
      {easyBodyTip && (
        <FadeInUp delay={2}>
          <section className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 rounded-xl border border-teal-200 dark:border-teal-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-teal-500" />
              <h2 className="text-lg font-semibold text-foreground">초보자를 위한 스타일 가이드</h2>
            </div>

            {/* 요약 */}
            <p className="text-teal-800 dark:text-teal-200 font-medium mb-3">
              {easyBodyTip.summary}
            </p>
            <p className="text-sm text-muted-foreground mb-4">{easyBodyTip.easyExplanation}</p>

            {/* DO / DON'T 리스트 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* 추천 스타일 */}
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-green-600">✓</span>
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    추천
                  </span>
                </div>
                <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                  {easyBodyTip.doList.map((item, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-green-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 피해야 할 스타일 */}
              <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                <div className="flex items-center gap-1.5 mb-2">
                  <Ban className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">피하기</span>
                </div>
                <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                  {easyBodyTip.dontList.map((item, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-red-500">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 핵심 팁 */}
            <div className="flex items-start gap-2 p-2.5 bg-teal-100 dark:bg-teal-900/50 rounded-lg">
              <Sparkles className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-teal-800 dark:text-teal-200">
                <span className="font-medium">핵심 팁:</span> {easyBodyTip.styleTip}
              </p>
            </div>
          </section>
        </FadeInUp>
      )}

      {/* 스타일 예시 이미지 */}
      {is3Type && (
        <FadeInUp delay={2}>
          <section className="bg-card rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Camera className="w-5 h-5 text-violet-500" />
              <h2 className="text-lg font-semibold text-foreground">추천 스타일 예시</h2>
            </div>
            <BodyStyleImage bodyType={type3} showLabels />
            <p className="text-xs text-muted-foreground mt-3 text-center">
              {typeInfo3.label} 체형에 잘 어울리는 스타일이에요
            </p>
          </section>
        </FadeInUp>
      )}

      {/* 비율 분석 */}
      <FadeInUp delay={3}>
        <section className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">비율 분석</h2>
          <div className="space-y-4">
            {measurements.map((measurement) => (
              <div key={measurement.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-foreground/80">{measurement.name}</span>
                  <span className={`text-sm font-semibold ${getColor()}`}>{measurement.value}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getBgColor()}`}
                    style={{ width: `${measurement.value}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{measurement.description}</p>
              </div>
            ))}
          </div>
        </section>
      </FadeInUp>

      {/* 강점 */}
      <FadeInUp delay={4}>
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
      </FadeInUp>

      {/* 피해야 할 스타일 */}
      {avoidStyles && avoidStyles.length > 0 && (
        <FadeInUp delay={5}>
          <section className="bg-card rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-foreground">피해야 할 스타일</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {avoidStyles.map((style, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm border border-orange-200"
                >
                  {style}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              위 스타일은 체형의 장점을 살리기 어려울 수 있어요
            </p>
          </section>
        </FadeInUp>
      )}

      {/* AI 스타일 인사이트 (가변 보상) */}
      <FadeInUp delay={6}>
        <section className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-foreground">스타일 인사이트</h2>
          </div>
          <p className="text-foreground/80 leading-relaxed">{insight}</p>
        </section>
      </FadeInUp>

      {/* 퍼스널 컬러 기반 색상 추천 */}
      {colorRecommendations && (
        <FadeInUp delay={7}>
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
        </FadeInUp>
      )}

      {/* 색상 팁 */}
      {colorTips && colorTips.length > 0 && (
        <FadeInUp delay={8}>
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
        </FadeInUp>
      )}

      {/* 맞춤 코디 예시 (체형 + 퍼스널 컬러 조합) */}
      {outfitExamples.length > 0 && (
        <FadeInUp delay={9}>
          <section className="bg-card rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bookmark className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-semibold text-foreground">맞춤 코디 예시</h2>
              {personalColorSeason && (
                <span className="ml-auto text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded-full">
                  {typeInfo3.label} + {personalColorSeason}
                </span>
              )}
            </div>
            <div className="space-y-4">
              {outfitExamples.map((outfit, index) => (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg border border-rose-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-foreground">{outfit.title}</h3>
                    <span className="text-xs bg-white px-2 py-0.5 rounded-full text-rose-600 border border-rose-200">
                      {outfit.occasion}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {outfit.items.map((item, itemIndex) => (
                      <span
                        key={itemIndex}
                        className="px-3 py-1.5 bg-white rounded-lg text-sm text-foreground/80 border border-rose-100"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              체형과 퍼스널 컬러를 고려한 맞춤 코디예요
            </p>
          </section>
        </FadeInUp>
      )}

      {/* 추천 아이템 (가변 보상) */}
      <FadeInUp delay={10}>
        <section className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-semibold text-foreground">추천 아이템</h2>
          </div>
          <div className="space-y-3">
            {styleRecommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
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
      </FadeInUp>

      {/* 맞춤 의류 쇼핑 추천 */}
      <FadeInUp delay={11}>
        <RecommendedClothingCard
          bodyType={bodyType}
          styleRecommendations={styleRecommendations}
          colorRecommendations={colorRecommendations}
          personalColorSeason={personalColorSeason}
        />
      </FadeInUp>

      {/* 분석 시간 */}
      <FadeInUp delay={12}>
        <p className="text-center text-sm text-muted-foreground">
          분석 시간: {analyzedAt.toLocaleString('ko-KR')}
        </p>
      </FadeInUp>

      {/* 다시 분석하기 버튼 */}
      <FadeInUp delay={12}>
        <Button onClick={onRetry} variant="outline" className="w-full h-12 text-base gap-2">
          <RefreshCw className="w-4 h-4" />
          다시 분석하기
        </Button>
      </FadeInUp>
    </div>
  );
}
