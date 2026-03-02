'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { classifyByRange, selectByKey } from '@/lib/utils/conditional-helpers';
import { BarChart3, Palette, Sparkles, Circle, CheckCircle2, HelpCircle } from 'lucide-react';
import type { AnalysisEvidence, ImageQuality } from '../AnalysisEvidenceReport';
import type { ColorInfo, SeasonType } from '@/lib/mock/personal-color';

// 시즌별 설명 데이터 — 사용자가 "왜 이 색이 어울리는지" 이해할 수 있도록
const SEASON_EXPLANATIONS: Record<
  SeasonType,
  {
    whyThisColor: string;
    skinHarmony: string;
    avoidReason: string;
    dailyTip: string;
  }
> = {
  spring: {
    whyThisColor:
      '봄 웜톤은 피부에 노란 언더톤이 있어서, 따뜻하고 맑은 색상이 피부를 밝고 건강하게 보이게 해요.',
    skinHarmony:
      '피치, 코랄, 아이보리처럼 따뜻한 밝은 색이 피부의 노란 기와 조화를 이루어 생기 있어 보여요.',
    avoidReason:
      '차갑고 탁한 색은 피부의 따뜻한 톤을 가려 얼굴이 칙칙하거나 피곤해 보일 수 있어요.',
    dailyTip: '상의나 스카프에 코랄·살몬·밝은 베이지 같은 색을 활용하면 얼굴이 한결 화사해져요.',
  },
  summer: {
    whyThisColor:
      '여름 쿨톤은 피부에 핑크 언더톤이 있어서, 부드럽고 시원한 파스텔 계열이 피부를 맑게 보이게 해요.',
    skinHarmony:
      '라벤더, 로즈, 스카이블루처럼 차분한 쿨 파스텔이 피부의 핑크 기와 자연스럽게 어울려요.',
    avoidReason:
      '강하고 따뜻한 색(오렌지, 머스타드 등)은 피부의 핑크 톤과 충돌하여 얼굴이 붉거나 탁해 보여요.',
    dailyTip: '회색빛 파란색이나 연한 라벤더 톤의 옷이 피부를 투명하고 우아하게 보이게 해줘요.',
  },
  autumn: {
    whyThisColor:
      '가을 웜톤은 피부에 황금빛 언더톤이 있어서, 깊고 따뜻한 어스 톤이 피부에 깊이감을 더해줘요.',
    skinHarmony:
      '카키, 테라코타, 머스타드처럼 자연의 색이 피부의 따뜻함과 조화를 이루어 풍성해 보여요.',
    avoidReason:
      '차갑고 선명한 색(파란 핑크, 네온)은 피부의 따뜻한 깊이와 어울리지 않아 부자연스러워요.',
    dailyTip:
      '올리브 그린, 캐멀, 와인 같은 깊은 톤을 메인 컬러로 활용하면 고급스러운 분위기가 나요.',
  },
  winter: {
    whyThisColor:
      '겨울 쿨톤은 피부에 푸른 언더톤이 있어서, 선명하고 대비가 강한 색이 얼굴에 생동감을 줘요.',
    skinHarmony: '순백색, 로열블루, 버건디처럼 채도가 높고 선명한 색이 피부의 투명함을 살려줘요.',
    avoidReason:
      '탁하고 따뜻한 중간 톤(베이지, 올리브)은 피부를 칙칙하고 생기 없어 보이게 할 수 있어요.',
    dailyTip: '블랙·화이트 대비에 포인트로 레드나 로열블루를 넣으면 세련된 인상을 줄 수 있어요.',
  },
};

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
      <p className="text-xs text-muted-foreground mt-1">
        {classifyByRange(position, [
          { max: 41, result: isCool
            ? '약한 쿨톤이에요. 따뜻한 색도 어느 정도 어울려요.'
            : '약한 웜톤이에요. 시원한 색도 어느 정도 어울려요.' },
          { max: 71, result: '중성 톤에 가까워서 다양한 색상을 소화할 수 있어요.' },
          { result: isCool
            ? '뚜렷한 쿨톤이에요. 시원한 계열의 색상이 잘 어울려요.'
            : '뚜렷한 웜톤이에요. 따뜻한 계열의 색상이 잘 어울려요.' },
        ])}
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
    <div className="space-y-3" data-testid="color-compare-visual">
      <div className="grid grid-cols-2 gap-4">
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
      <p className="text-xs text-muted-foreground">
        어울리는 색은 피부톤과 조화를 이뤄 얼굴을 밝게 보이게 하고, 피해야 할 색은 피부와 부조화를
        일으켜 칙칙해 보일 수 있어요.
      </p>
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
        (evidence.veinColor === 'blue' || evidence.veinColor === 'purple')
          ? '파란색/보라색 → 쿨톤'
          : selectByKey(evidence.veinColor, { green: '녹색/올리브색 → 웜톤', olive: '녹색/올리브색 → 웜톤' }, '혼합') as string,
      score: evidence.veinScore,
      indicatesCool: evidence.veinColor === 'blue' || evidence.veinColor === 'purple',
    },
    {
      name: '피부 언더톤',
      description: selectByKey(evidence.skinUndertone, {
        pink: '핑크 기 → 쿨톤 경향',
        yellow: '노란 기 → 웜톤 경향',
      }, '중립') as string,
      score: selectByKey(evidence.skinUndertone, { pink: 80, yellow: 20 }, 50) as number,
      indicatesCool: evidence.skinUndertone === 'pink',
    },
    {
      name: '입술 자연색',
      description: selectByKey(evidence.lipNaturalColor, {
        pink: '핑크빛 → 쿨톤 경향',
        coral: '코랄빛 → 웜톤 경향',
      }, '중립') as string,
      score: selectByKey(evidence.lipNaturalColor, { pink: 75, coral: 25 }, 50) as number,
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
  imageQuality: _imageQuality,
  seasonType,
  tone,
  bestColors,
  worstColors,
  className,
}: DetailedEvidenceReportProps) {
  const isCool = tone === 'cool';
  const seasonExplanation = SEASON_EXPLANATIONS[seasonType];
  const seasonLabel = selectByKey(seasonType, {
    spring: '봄 웜톤',
    summer: '여름 쿨톤',
    autumn: '가을 웜톤',
    winter: '겨울 쿨톤',
  }, '겨울 쿨톤') as string;

  return (
    <div className={cn('space-y-4', className)} data-testid="detailed-evidence-report">
      {/* 시즌별 설명 카드 — evidence 없이도 항상 표시 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />왜 이 색이 어울리나요?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <p className="text-sm font-medium">{seasonLabel}의 특징</p>
            <p className="text-sm text-muted-foreground">{seasonExplanation.whyThisColor}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-950/30">
              <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                어울리는 이유
              </p>
              <p className="text-xs text-muted-foreground">{seasonExplanation.skinHarmony}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30">
              <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                피해야 할 이유
              </p>
              <p className="text-xs text-muted-foreground">{seasonExplanation.avoidReason}</p>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-muted">
            <p className="text-xs font-medium mb-1">일상 활용 팁</p>
            <p className="text-xs text-muted-foreground">{seasonExplanation.dailyTip}</p>
          </div>
        </CardContent>
      </Card>

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
