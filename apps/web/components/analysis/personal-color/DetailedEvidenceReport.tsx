'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { BarChart3, Palette, Sparkles, Circle, CheckCircle2 } from 'lucide-react';
import type { AnalysisEvidence, ImageQuality } from '../AnalysisEvidenceReport';
import type { ColorInfo, SeasonType } from '@/lib/mock/personal-color';

interface DetailedEvidenceReportProps {
  evidence: AnalysisEvidence | null;
  imageQuality: ImageQuality | null;
  seasonType: SeasonType;
  tone: 'warm' | 'cool';
  bestColors: ColorInfo[];
  worstColors: ColorInfo[];
  className?: string;
}

// 톤 스펙트럼 바 - 웜/쿨 위치 시각화
function ToneSpectrumBar({ veinScore, tone }: { veinScore: number; tone: 'warm' | 'cool' }) {
  // veinScore: 0-100 (쿨톤 확률)
  const position = veinScore;
  const isCool = tone === 'cool';

  return (
    <div className="space-y-2" data-testid="tone-spectrum-bar">
      <div className="flex justify-between text-xs font-medium">
        <span className={cn('transition-colors', !isCool && 'text-orange-600 font-bold')}>
          웜톤
        </span>
        <span className="text-muted-foreground">중립</span>
        <span className={cn('transition-colors', isCool && 'text-blue-600 font-bold')}>쿨톤</span>
      </div>
      <div className="relative h-4 rounded-full overflow-hidden bg-gradient-to-r from-orange-400 via-gray-200 to-blue-400">
        {/* 포인터 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-2 shadow-lg transition-all duration-500"
          style={{
            left: `calc(${position}% - 10px)`,
            borderColor: isCool ? '#2563eb' : '#ea580c',
          }}
        >
          <div
            className="absolute inset-1 rounded-full"
            style={{ backgroundColor: isCool ? '#3b82f6' : '#f97316' }}
          />
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {isCool ? '쿨톤' : '웜톤'} 확률: <strong className="text-foreground">{position}%</strong>
      </p>
    </div>
  );
}

// 색상 비교 시각화 카드
function ColorCompareVisual({
  bestColors,
  worstColors,
}: {
  bestColors: ColorInfo[];
  worstColors: ColorInfo[];
}) {
  return (
    <div className="grid grid-cols-2 gap-4" data-testid="color-compare-visual">
      {/* Best Colors */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">잘 어울리는 색</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {bestColors.slice(0, 6).map((color, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-lg shadow-sm border border-white/50 transition-transform hover:scale-110"
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Worst Colors */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Circle className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-red-600">피해야 할 색</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {worstColors.slice(0, 6).map((color, i) => (
            <div
              key={i}
              className="w-8 h-8 rounded-lg shadow-sm border border-white/50 opacity-75 transition-transform hover:scale-110"
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// 악세서리 금속 톤 비교
function MetalToneCompare({ tone }: { tone: 'warm' | 'cool' }) {
  const isWarm = tone === 'warm';

  return (
    <div className="grid grid-cols-2 gap-4" data-testid="metal-tone-compare">
      {/* 골드 */}
      <div
        className={cn(
          'p-4 rounded-xl border-2 transition-all',
          isWarm
            ? 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-400 shadow-md'
            : 'bg-gradient-to-br from-amber-50/50 to-yellow-50/50 border-amber-200/50 opacity-60'
        )}
      >
        <div className="flex items-center justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-inner" />
        </div>
        <p
          className={cn(
            'text-center text-sm font-medium',
            isWarm ? 'text-amber-800' : 'text-muted-foreground'
          )}
        >
          골드
        </p>
        {isWarm && <p className="text-center text-xs text-amber-600 mt-1">✓ 추천</p>}
      </div>

      {/* 실버 */}
      <div
        className={cn(
          'p-4 rounded-xl border-2 transition-all',
          !isWarm
            ? 'bg-gradient-to-br from-slate-50 to-gray-100 border-slate-400 shadow-md'
            : 'bg-gradient-to-br from-slate-50/50 to-gray-50/50 border-slate-200/50 opacity-60'
        )}
      >
        <div className="flex items-center justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-slate-400 shadow-inner" />
        </div>
        <p
          className={cn(
            'text-center text-sm font-medium',
            !isWarm ? 'text-slate-700' : 'text-muted-foreground'
          )}
        >
          실버
        </p>
        {!isWarm && <p className="text-center text-xs text-slate-600 mt-1">✓ 추천</p>}
      </div>
    </div>
  );
}

// 분석 팩터별 시각화
function AnalysisFactorsVisual({ evidence }: { evidence: AnalysisEvidence }) {
  // 각 분석 요소를 스코어로 변환 (시각화용)
  const factors = [
    {
      name: '혈관 색상',
      description:
        evidence.veinColor === 'blue' || evidence.veinColor === 'purple'
          ? '파란색/보라색 → 쿨톤'
          : evidence.veinColor === 'green' || evidence.veinColor === 'olive'
            ? '녹색/올리브색 → 웜톤'
            : '혼합',
      score: evidence.veinScore,
      indicatesCool: evidence.veinColor === 'blue' || evidence.veinColor === 'purple',
    },
    {
      name: '피부 언더톤',
      description:
        evidence.skinUndertone === 'pink'
          ? '핑크 기 → 쿨톤 경향'
          : evidence.skinUndertone === 'yellow'
            ? '노란 기 → 웜톤 경향'
            : '중립',
      score: evidence.skinUndertone === 'pink' ? 80 : evidence.skinUndertone === 'yellow' ? 20 : 50,
      indicatesCool: evidence.skinUndertone === 'pink',
    },
    {
      name: '입술 자연색',
      description:
        evidence.lipNaturalColor === 'pink'
          ? '핑크빛 → 쿨톤 경향'
          : evidence.lipNaturalColor === 'coral'
            ? '코랄빛 → 웜톤 경향'
            : '중립',
      score:
        evidence.lipNaturalColor === 'pink' ? 75 : evidence.lipNaturalColor === 'coral' ? 25 : 50,
      indicatesCool: evidence.lipNaturalColor === 'pink',
    },
  ];

  return (
    <div className="space-y-3" data-testid="analysis-factors-visual">
      {factors.map((factor, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-foreground">{factor.name}</span>
            <span className="text-muted-foreground text-xs">{factor.description}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-gradient-to-r from-orange-200 via-gray-100 to-blue-200">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${factor.score}%`,
                background:
                  factor.score > 50
                    ? `linear-gradient(to right, #fbbf24 0%, #60a5fa ${factor.score}%)`
                    : `linear-gradient(to right, #fb923c 0%, #94a3b8 ${factor.score}%)`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * PC-1 상세 분석 리포트 컴포넌트
 * - 톤 스펙트럼 시각화
 * - Best/Worst 컬러 비교
 * - 골드/실버 추천
 * - 분석 팩터별 시각화
 */
export default function DetailedEvidenceReport({
  evidence,
  imageQuality,
  seasonType: _seasonType, // 향후 시즌별 UI 확장 예정
  tone,
  bestColors,
  worstColors,
  className,
}: DetailedEvidenceReportProps) {
  if (!evidence && !imageQuality) {
    return null;
  }

  const isCool = tone === 'cool';

  return (
    <div className={cn('space-y-4', className)} data-testid="detailed-evidence-report">
      {/* 톤 스펙트럼 카드 */}
      {evidence && evidence.veinScore > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />톤 분석 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ToneSpectrumBar veinScore={evidence.veinScore} tone={tone} />
          </CardContent>
        </Card>
      )}

      {/* 색상 비교 카드 */}
      {bestColors.length > 0 && worstColors.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="w-4 h-4" />
              색상 비교
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ColorCompareVisual bestColors={bestColors} worstColors={worstColors} />
          </CardContent>
        </Card>
      )}

      {/* 악세서리 추천 카드 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            악세서리 금속 톤
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MetalToneCompare tone={tone} />
          <p className="text-xs text-muted-foreground text-center mt-3">
            {isCool
              ? '쿨톤에게는 은색 계열 악세서리가 피부톤을 더 화사하게 만들어줘요'
              : '웜톤에게는 금색 계열 악세서리가 피부톤과 자연스럽게 어울려요'}
          </p>
        </CardContent>
      </Card>

      {/* 분석 팩터 시각화 */}
      {evidence && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">분석 요소별 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalysisFactorsVisual evidence={evidence} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
