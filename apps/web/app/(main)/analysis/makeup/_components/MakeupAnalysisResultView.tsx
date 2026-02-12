'use client';

/**
 * 메이크업 분석 결과 인라인 뷰
 *
 * page.tsx 내 결과 표시용 (result/[id]와는 별도)
 */

import Link from 'next/link';
import { Palette, Sparkles } from 'lucide-react';
import type { MakeupAnalysisResult, MakeupStyleId } from '@/lib/mock/makeup-analysis';
import { Button } from '@/components/ui/button';

interface MakeupAnalysisResultViewProps {
  result: MakeupAnalysisResult;
  onRetry: () => void;
}

const STYLE_LABELS: Record<MakeupStyleId, string> = {
  natural: '내추럴',
  glam: '글램',
  cute: '큐트',
  chic: '시크',
  vintage: '빈티지',
  edgy: '엣지',
};

export function MakeupAnalysisResultView({ result, onRetry }: MakeupAnalysisResultViewProps) {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-pink-600 bg-pink-100';
    }
  };

  return (
    <div className="space-y-6" data-testid="makeup-analysis-result">
      {/* 종합 점수 */}
      <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-white shadow-lg flex items-center justify-center mb-4">
          <span className="text-4xl font-bold text-pink-600">{result.overallScore}</span>
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {result.undertoneLabel} · {result.faceShapeLabel}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {result.eyeShapeLabel} · {result.lipShapeLabel}
        </p>
      </div>

      {/* 인사이트 */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-500" />
          분석 요약
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{result.insight}</p>
      </div>

      {/* 지표 */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">📊 피부 상태</h3>
        <div className="space-y-4">
          {result.metrics.map((metric) => (
            <div key={metric.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{metric.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(metric.status)}`}
                >
                  {metric.value}점
                </span>
              </div>
              <div
                className="h-2 bg-muted rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={metric.value}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${metric.label}: ${metric.value}점`}
              >
                <div
                  className={`h-full rounded-full transition-all ${
                    metric.status === 'good'
                      ? 'bg-green-500'
                      : metric.status === 'warning'
                        ? 'bg-red-500'
                        : 'bg-pink-500'
                  }`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 추천 스타일 */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Palette className="w-4 h-4 text-pink-500" />
          추천 메이크업 스타일
        </h3>
        <div className="flex flex-wrap gap-2">
          {result.recommendedStyles.map((style, i) => (
            <span key={i} className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
              {STYLE_LABELS[style as MakeupStyleId] || style}
            </span>
          ))}
        </div>
      </div>

      {/* 색상 추천 */}
      {result.colorRecommendations.map((cr) => (
        <div key={cr.category} className="bg-card rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold mb-3">💄 {cr.categoryLabel} 추천 색상</h3>
          <div className="flex flex-wrap gap-3">
            {cr.colors.map((color, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                  style={{ backgroundColor: color.hex }}
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium">{color.name}</p>
                  <p className="text-xs text-muted-foreground">{color.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 메이크업 팁 */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-3">✨ 메이크업 팁</h3>
        <div className="space-y-4">
          {result.makeupTips.map((tipGroup, i) => (
            <div key={i}>
              <p className="text-sm font-medium text-pink-600 mb-2">{tipGroup.category}</p>
              <ul className="space-y-1">
                {tipGroup.tips.map((tip, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-pink-500">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 퍼스널 컬러 연동 */}
      {result.personalColorConnection && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
          <h3 className="font-semibold mb-2 flex items-center gap-2">🎨 퍼스널 컬러 연동</h3>
          <p className="text-sm text-muted-foreground mb-2">
            예상 시즌:{' '}
            <span className="font-medium text-foreground">
              {result.personalColorConnection.season}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">{result.personalColorConnection.note}</p>
          <Link
            href="/analysis/personal-color"
            className="inline-block mt-3 text-sm text-purple-600 hover:underline"
          >
            퍼스널 컬러 진단받기 →
          </Link>
        </div>
      )}

      {/* 버튼 */}
      <Button
        onClick={onRetry}
        variant="outline"
        className="w-full"
        data-testid="makeup-retry-button"
        aria-label="메이크업 분석 다시 시작"
      >
        다시 분석하기
      </Button>
    </div>
  );
}
