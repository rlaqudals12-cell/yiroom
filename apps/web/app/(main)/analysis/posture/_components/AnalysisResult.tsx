'use client';

import {
  RefreshCw,
  Sparkles,
  Activity,
  AlertTriangle,
  CheckCircle,
  Target,
  Dumbbell,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  type PostureAnalysisResult,
  type PostureMeasurement,
  POSTURE_TYPES,
  getPostureTypeColor,
  getScoreColor,
} from '@/lib/mock/posture-analysis';
import { FadeInUp, ScaleIn, CountUp } from '@/components/animations';

interface AnalysisResultProps {
  result: PostureAnalysisResult;
  onRetry: () => void;
  shareRef?: React.RefObject<HTMLDivElement | null>;
}

// 측정값 상태별 아이콘
function StatusIcon({ status }: { status: 'good' | 'warning' | 'alert' }) {
  if (status === 'good') return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (status === 'warning') return <ArrowUpRight className="w-4 h-4 text-amber-500" />;
  return <AlertTriangle className="w-4 h-4 text-red-500" />;
}

// 측정값 바 컴포넌트
function MeasurementBar({ measurement }: { measurement: PostureMeasurement }) {
  // 50이 이상적이므로, 50에서 얼마나 떨어졌는지 표시
  const deviation = Math.abs(measurement.value - 50);
  const isLeft = measurement.value < 50;

  return (
    <div className="p-3 bg-muted rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StatusIcon status={measurement.status} />
          <span className="text-sm font-medium text-foreground">{measurement.name}</span>
        </div>
        <span
          className={`text-sm font-semibold ${
            measurement.status === 'good'
              ? 'text-green-500'
              : measurement.status === 'warning'
                ? 'text-amber-500'
                : 'text-red-500'
          }`}
        >
          {measurement.value}
        </span>
      </div>

      {/* 양방향 바 (50이 중앙) */}
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        {/* 중앙선 */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-400 z-10" />

        {/* 값 표시 바 */}
        <div
          className={`absolute top-0 h-full transition-all ${
            measurement.status === 'good'
              ? 'bg-green-400'
              : measurement.status === 'warning'
                ? 'bg-amber-400'
                : 'bg-red-400'
          }`}
          style={{
            left: isLeft ? `${measurement.value}%` : '50%',
            width: `${deviation}%`,
          }}
        />
      </div>

      <p className="text-xs text-muted-foreground mt-1">{measurement.description}</p>
    </div>
  );
}

export default function AnalysisResult({ result, onRetry, shareRef }: AnalysisResultProps) {
  const {
    postureType,
    postureTypeLabel,
    postureTypeDescription,
    overallScore,
    confidence,
    frontAnalysis,
    sideAnalysis,
    concerns,
    stretchingRecommendations,
    insight,
    analyzedAt,
    bodyTypeCorrelation,
  } = result;

  const typeInfo = POSTURE_TYPES[postureType];
  const isIdeal = postureType === 'ideal';

  return (
    <div ref={shareRef} className="space-y-6" role="region" aria-label="자세 분석 결과">
      {/* 자세 타입 카드 */}
      <ScaleIn delay={1}>
        <section className="bg-card rounded-xl border p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">자세 타입</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">{typeInfo.emoji}</span>
            <span className={`text-3xl font-bold ${getPostureTypeColor(postureType)}`}>
              {postureTypeLabel}
            </span>
          </div>
          <p className="mt-2 text-muted-foreground">{postureTypeDescription}</p>

          {/* 전체 점수 */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">전체 점수</p>
                <p className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                  <CountUp end={overallScore} duration={1000} />
                  <span className="text-sm">/100</span>
                </p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground">신뢰도</p>
                <p className="text-2xl font-bold text-foreground">
                  <CountUp end={confidence} duration={1000} />
                  <span className="text-sm">%</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </ScaleIn>

      {/* 정면 분석 */}
      <FadeInUp delay={2}>
        <section className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-foreground">정면 분석</h2>
          </div>
          <div className="space-y-3">
            <MeasurementBar measurement={frontAnalysis.shoulderSymmetry} />
            <MeasurementBar measurement={frontAnalysis.pelvisSymmetry} />
            <MeasurementBar measurement={frontAnalysis.kneeAlignment} />
            <MeasurementBar measurement={frontAnalysis.footAngle} />
          </div>
        </section>
      </FadeInUp>

      {/* 측면 분석 */}
      <FadeInUp delay={3}>
        <section className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-foreground">측면 분석</h2>
          </div>
          <div className="space-y-3">
            <MeasurementBar measurement={sideAnalysis.headForwardAngle} />
            <MeasurementBar measurement={sideAnalysis.thoracicKyphosis} />
            <MeasurementBar measurement={sideAnalysis.lumbarLordosis} />
            <MeasurementBar measurement={sideAnalysis.pelvicTilt} />
          </div>
        </section>
      </FadeInUp>

      {/* 문제점/주의사항 */}
      {concerns.length > 0 && !isIdeal && (
        <FadeInUp delay={4}>
          <section className="bg-card rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-foreground">주의사항</h2>
            </div>
            <ul className="space-y-2">
              {concerns.map((concern, index) => (
                <li key={index} className="flex items-start gap-2 text-foreground/80">
                  <span className="text-amber-500 mt-0.5">-</span>
                  {concern}
                </li>
              ))}
            </ul>
          </section>
        </FadeInUp>
      )}

      {/* AI 인사이트 */}
      <FadeInUp delay={5}>
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-foreground">AI 인사이트</h2>
          </div>
          <p className="text-foreground/80 leading-relaxed">{insight}</p>
        </section>
      </FadeInUp>

      {/* C-1 체형 연동 정보 */}
      {bodyTypeCorrelation && (
        <FadeInUp delay={6}>
          <section className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-foreground">체형 연동 분석</h2>
              <span className="ml-auto text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                {bodyTypeCorrelation.bodyType} 타입
              </span>
            </div>
            <p className="text-foreground/80 mb-3">{bodyTypeCorrelation.correlationNote}</p>
            {bodyTypeCorrelation.riskFactors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {bodyTypeCorrelation.riskFactors.map((risk, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
                  >
                    {risk}
                  </span>
                ))}
              </div>
            )}
          </section>
        </FadeInUp>
      )}

      {/* 스트레칭 추천 */}
      <FadeInUp delay={7}>
        <section className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Dumbbell className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-foreground">추천 스트레칭</h2>
          </div>
          <div className="space-y-4">
            {stretchingRecommendations.map((stretch, index) => (
              <div key={index} className="p-4 bg-muted rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-foreground">{stretch.name}</h3>
                    <p className="text-xs text-muted-foreground">타깃: {stretch.targetArea}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      stretch.difficulty === 'easy'
                        ? 'bg-green-100 text-green-700'
                        : stretch.difficulty === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {stretch.difficulty === 'easy'
                      ? '쉬움'
                      : stretch.difficulty === 'medium'
                        ? '보통'
                        : '어려움'}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mb-2">{stretch.description}</p>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>시간: {stretch.duration}</span>
                  <span>빈도: {stretch.frequency}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </FadeInUp>

      {/* 분석 시간 */}
      <FadeInUp delay={8}>
        <p className="text-center text-sm text-muted-foreground">
          분석 시간: {analyzedAt.toLocaleString('ko-KR')}
        </p>
      </FadeInUp>

      {/* 다시 분석하기 버튼 */}
      <FadeInUp delay={8}>
        <Button onClick={onRetry} variant="outline" className="w-full h-12 text-base gap-2">
          <RefreshCw className="w-4 h-4" />
          다시 분석하기
        </Button>
      </FadeInUp>
    </div>
  );
}
