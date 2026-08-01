'use client';

/**
 * 메이크업 분석 결과 인라인 뷰 — 진단지 문법 (ADR-120)
 *
 * page.tsx 내 결과 표시용 (result/[id]와는 별도).
 * 구세대 핑크 그라데 + 원형 점수 연출을 진단지 문법(아이브로우 → 세리프 진단명 →
 * 러닝넘버 섹션 → 속성표 → 신뢰 푸터)으로 재조립 — 데이터 배선은 그대로.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Activity, Droplets, Eye, ScanFace, Smile } from 'lucide-react';
import { getDateLocale } from '@/lib/utils/date-format';
import type { MakeupAnalysisResult } from '@/lib/mock/makeup-analysis';
import type { MakeupStyleId } from '@/lib/analysis/makeup';
import {
  extractGlossaryTerms,
  buildSituationalTips,
  detectMakeupShelfCategory,
  type MakeupShelfCategory,
} from '@/lib/analysis/makeup';
import type { ShelfItem } from '@/lib/scan/product-shelf';
import { Button } from '@/components/ui/button';
import { AnonymousFaceTemplate } from '@/components/analysis/overlay';
import { TextureSwatch, type TextureKind } from '@/components/share/TextureSwatch';
import { PAPER_GRAIN_URI } from '@/components/share/paper-grain';
import {
  ReportEyebrow,
  SectionHeader,
  AttrRow,
  RowTable,
  SpectrumRow,
  TrustFooter,
} from '@/components/analysis/report';

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

// 신호등 상태색 대신 텍스트로 말한다 (ADR-120 — 채점 연출 금지)
const STATUS_LABELS: Record<'good' | 'normal' | 'warning', string> = {
  good: '양호',
  normal: '보통',
  warning: '집중 케어',
};

// 종합 점수 상태어 임계값 — 헤어 진단지 scoreStatusText와 동일 기준(결정론 매핑)
const SCORE_GOOD_MIN = 71;
const SCORE_NORMAL_MIN = 41;

// 저장 점수의 표기 번역(새 판정 생성 아님) — "NN점" 단독 표기의 해석 공백을 메운다
function scoreStatusText(value: number): string {
  if (value >= SCORE_GOOD_MIN) return STATUS_LABELS.good;
  if (value >= SCORE_NORMAL_MIN) return STATUS_LABELS.normal;
  return STATUS_LABELS.warning;
}

// 신뢰도 등급 → 표시 % — result/[id]의 ExpertDataPanel과 동일 매핑(새 수치 발명 아님)
const RELIABILITY_CONFIDENCE: Record<'high' | 'medium' | 'low', number> = {
  high: 90,
  medium: 70,
  low: 40,
};

// 얼굴 도식 위 카테고리별 마커 위치 (AnonymousFaceTemplate viewBox 200×210 기준 %)
// 왜: 기존엔 배열 순서대로 좌측 60%에 세로로 쌓아 립이 볼 옆·아이섀도가 턱 근처로
// 어긋났다. 각 부위의 실제 위치(눈/입술/볼/이마)에 매핑한다.
const FACE_ZONE_POS: Record<MakeupShelfCategory, { top: string; left: string }> = {
  foundation: { top: '23%', left: '50%' }, // 이마/전체 베이스
  eyeshadow: { top: '37%', left: '50%' }, // 눈 (cy≈80/210)
  blush: { top: '52%', left: '27%' }, // 볼 (왼쪽)
  contour: { top: '60%', left: '75%' }, // 턱선/광대 (오른쪽)
  lip: { top: '65%', left: '50%' }, // 입술 (y≈135/210)
};

// 카테고리별 발색 질감 — 플랫 칩 대신 "실물 발색"(비주얼 벤치마크 m07·m08의 결정적 우위).
// 색은 진단 hex 그대로, 질감만 고정 SVG(재현성 유지 — ADR-120 생성이미지 기각과 양립)
const TEXTURE_BY_CATEGORY: Record<MakeupShelfCategory, TextureKind> = {
  foundation: 'foundation',
  lip: 'lip',
  eyeshadow: 'powder',
  blush: 'powder',
  contour: 'powder',
};

// 얼굴형 → 익명 템플릿 형태 매핑 (round/square 외에는 oval)
function toAnonymousFaceShape(faceShape: string): 'round' | 'angular' | 'oval' {
  if (faceShape === 'round') return 'round';
  if (faceShape === 'square') return 'angular';
  return 'oval';
}

interface ReportSection {
  key: string;
  title: string;
  body: React.ReactNode;
}

export function MakeupAnalysisResultView({
  result,
  onRetry,
}: MakeupAnalysisResultViewProps): React.JSX.Element {
  // 콜로폰 분석 시간 표기 — 하드코딩 ko-KR 대신 사용자 로캘 (PC 진단지 표준)
  const locale = useLocale();
  // 상황별 팁 탭 (데일리 / 풀메이크업) — 기존 추천 데이터 재구성 (새 AI 없음)
  const situational = useMemo(() => buildSituationalTips(result), [result]);
  const [situation, setSituation] = useState<'daily' | 'full'>('daily');

  // 요약/인사이트에서 전문 용어 쉬운 풀이 추출
  const glossary = useMemo(
    () =>
      extractGlossaryTerms(
        [result.undertoneLabel, result.faceShapeLabel, result.insight].join(' ')
      ),
    [result.undertoneLabel, result.faceShapeLabel, result.insight]
  );

  // 내 화장대 보유 메이크업 카테고리 — "내 ○○ 활용" 배지용.
  // 1회 조회, 비로그인/실패 시 빈 세트(무표시).
  const [ownedCats, setOwnedCats] = useState<Set<MakeupShelfCategory>>(new Set());
  useEffect(() => {
    let cancelled = false;
    async function loadShelf(): Promise<void> {
      try {
        const res = await fetch('/api/scan/shelf?status=owned&limit=100');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !Array.isArray(data.items)) return;
        const cats = new Set<MakeupShelfCategory>();
        for (const item of data.items as ShelfItem[]) {
          const cat = detectMakeupShelfCategory(item);
          if (cat) cats.add(cat);
        }
        if (!cancelled) setOwnedCats(cats);
      } catch {
        /* 조회 실패 — 무표시 */
      }
    }
    loadShelf();
    return () => {
      cancelled = true;
    };
  }, []);

  const situationTips = situation === 'daily' ? situational.daily : situational.full;

  // 히어로 진단명 — 자가입력 경로는 얼굴형 라벨이 비어있음(빈 값은 표시하지 않음)
  const heroTitle =
    [result.undertoneLabel, result.faceShapeLabel].filter(Boolean).join(' · ') || '메이크업 진단';
  const heroSub = [result.eyeShapeLabel, result.lipShapeLabel].filter(Boolean).join(' · ');

  // ─── 번호 섹션 — 데이터 있는 섹션만 조립, 번호는 렌더 시점에 매겨 결번을 막는다
  const sections: ReportSection[] = [];

  // 진단 속성표 — 실데이터 행만 (없는 행은 미렌더)
  sections.push({
    key: 'attrs',
    title: '진단 속성',
    body: (
      <RowTable testId="makeup-report-attrs">
        {result.undertoneLabel && (
          <AttrRow icon={Droplets} label="언더톤" value={result.undertoneLabel} />
        )}
        {result.faceShapeLabel && (
          <AttrRow icon={ScanFace} label="얼굴형" value={result.faceShapeLabel} />
        )}
        {result.eyeShapeLabel && <AttrRow icon={Eye} label="눈" value={result.eyeShapeLabel} />}
        {result.lipShapeLabel && <AttrRow icon={Smile} label="입술" value={result.lipShapeLabel} />}
        <AttrRow
          icon={Activity}
          label="피부 컨디션"
          value={`${result.overallScore}점 · ${scoreStatusText(result.overallScore)}`}
        />
      </RowTable>
    ),
  });

  // 분석 요약 + 쉬운 풀이
  sections.push({
    key: 'summary',
    title: '분석 요약',
    body: (
      <div>
        <p className="text-sm leading-relaxed text-muted-foreground">{result.insight}</p>
        {/* 초보자용 쉬운 풀이 — 요약에 등장한 전문 용어 설명 */}
        {glossary.length > 0 && (
          <div
            className="mt-4 space-y-1.5 border-t border-border/60 pt-4"
            data-testid="makeup-glossary"
          >
            <p className="text-xs font-medium text-muted-foreground">쉬운 풀이</p>
            <ul className="space-y-1">
              {glossary.map((g) => (
                <li key={g.term} className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{g.term}</span> = {g.easy}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    ),
  });

  // 피부 상태 — 신호등 게이지 → 뮤트 스펙트럼 행 (점수는 텍스트로 유지)
  if (result.metrics.length > 0) {
    sections.push({
      key: 'skin',
      title: '피부 상태',
      body: (
        <RowTable testId="makeup-report-metrics">
          {result.metrics.map((metric) => (
            // 기존 게이지의 progressbar aria 승계 — 값은 저장 점수 그대로
            <div
              key={metric.id}
              role="progressbar"
              aria-valuenow={metric.value}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${metric.label}: ${metric.value}점`}
            >
              <SpectrumRow
                label={metric.label}
                pos={metric.value / 100}
                status={`${metric.value}점 · ${STATUS_LABELS[metric.status]}`}
              />
            </div>
          ))}
        </RowTable>
      ),
    });
  }

  // 추천 스타일 — 색면 칩 → 중립 보더 칩
  if (result.recommendedStyles.length > 0) {
    sections.push({
      key: 'styles',
      title: '추천 메이크업 스타일',
      body: (
        <div className="flex flex-wrap gap-1.5">
          {result.recommendedStyles.map((style, i) => (
            <span
              key={i}
              className="rounded-full border border-border px-2.5 py-0.5 text-xs text-foreground/80"
            >
              {STYLE_LABELS[style as MakeupStyleId] || style}
            </span>
          ))}
        </div>
      ),
    });
  }

  // 색상 추천 — 발색 질감 스와치 + 보유 화장품 배지
  if (result.colorRecommendations.length > 0) {
    sections.push({
      key: 'colors',
      title: '추천 색상',
      body: (
        <div className="space-y-5">
          {result.colorRecommendations.map((cr) => {
            const owned = ownedCats.has(cr.category);
            return (
              <div key={cr.category}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">{cr.categoryLabel}</p>
                  {/* 보유 화장품 연동 배지 */}
                  {owned && (
                    <span
                      className="rounded-full border border-primary/40 px-2 py-0.5 text-xs text-primary"
                      data-testid={`makeup-shelf-badge-${cr.category}`}
                    >
                      내 {cr.categoryLabel} 활용
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-3">
                  {cr.colors.map((color, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <TextureSwatch
                        hex={color.hex}
                        kind={TEXTURE_BY_CATEGORY[cr.category] ?? 'powder'}
                        width={56}
                        className="shrink-0"
                      />
                      <div>
                        <p className="text-sm font-medium">{color.name}</p>
                        <p className="text-xs text-muted-foreground">{color.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ),
    });
  }

  // 상황별 메이크업 (데일리 / 풀) — 탭 testid 계약 유지
  sections.push({
    key: 'situational',
    title: '상황별 메이크업',
    body: (
      <div data-testid="makeup-situational-tabs">
        <div className="mb-4 inline-flex rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setSituation('daily')}
            aria-pressed={situation === 'daily'}
            data-testid="makeup-situation-daily"
            className={`rounded-md px-4 py-1.5 text-sm transition-colors ${
              situation === 'daily'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            데일리
          </button>
          <button
            type="button"
            onClick={() => setSituation('full')}
            aria-pressed={situation === 'full'}
            data-testid="makeup-situation-full"
            className={`rounded-md px-4 py-1.5 text-sm transition-colors ${
              situation === 'full'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            풀메이크업
          </button>
        </div>
        <div className="space-y-4">
          {situationTips.map((tipGroup, i) => (
            <div key={i}>
              <p className="mb-2 text-xs font-medium text-muted-foreground">{tipGroup.category}</p>
              <ul className="space-y-1">
                {tipGroup.tips.map((tip, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span aria-hidden="true">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    ),
  });

  // 메이크업 팁
  if (result.makeupTips.length > 0) {
    sections.push({
      key: 'tips',
      title: '메이크업 팁',
      body: (
        <div className="space-y-4">
          {result.makeupTips.map((tipGroup, i) => (
            <div key={i}>
              <p className="mb-2 text-xs font-medium text-muted-foreground">{tipGroup.category}</p>
              <ul className="space-y-1">
                {tipGroup.tips.map((tip, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span aria-hidden="true">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ),
    });
  }

  // 퍼스널 컬러 연동 — 그라데 박스 → 속성표 행 + 한 줄 풀이 + 링크
  if (result.personalColorConnection) {
    const pc = result.personalColorConnection;
    sections.push({
      key: 'personal-color',
      title: '퍼스널 컬러 연동',
      body: (
        <div>
          <RowTable testId="makeup-report-pc">
            <AttrRow label="예상 시즌" value={pc.season} />
          </RowTable>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{pc.note}</p>
          <Link
            href="/analysis/personal-color"
            className="mt-2 inline-block text-sm text-primary underline-offset-2 hover:underline"
          >
            퍼스널 컬러 진단받기 →
          </Link>
        </div>
      ),
    });
  }

  return (
    <div className="space-y-6" data-testid="makeup-analysis-result">
      {/* 진단지 한 장 — 히어로부터 신뢰 블록까지 단일 시트 (진단지 문법)
          깊이: 크림 지면 위 백색 시트 — rest 섀도 + 종이 그레인 1겹(시트 한정, ≤0.05) */}
      {/* text-pretty: 짧은 꼬리 줄 방지 점진 향상 (Tailwind v4 내장 유틸) */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card text-pretty shadow-[var(--shadow-card)] dark:shadow-none">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.05] dark:hidden"
          style={{ backgroundImage: PAPER_GRAIN_URI }}
        />
        <div className="px-5 pb-6 pt-6 sm:px-7">
          {/* 히어로 — 아이브로우 + 세리프 진단명 */}
          <ReportEyebrow>MAKEUP REPORT</ReportEyebrow>
          <h2 className="mt-3 break-keep font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground">
            {heroTitle}
          </h2>
          {heroSub && <p className="mt-2 break-keep text-sm text-muted-foreground">{heroSub}</p>}

          {/* 얼굴형 일러스트 + 부위별 색상 포인트 (ADR-097) — 진단지의 도판 */}
          <div className="mt-5 flex justify-center">
            <AnonymousFaceTemplate
              faceShape={toAnonymousFaceShape(result.faceShape)}
              skinTone="medium"
            >
              {/* 카테고리별 색상 스와치 — 각 부위 위치에 배치 */}
              {result.colorRecommendations?.map((rec) => {
                const pos = FACE_ZONE_POS[rec.category];
                if (!pos) return null;
                return (
                  <div
                    key={rec.category}
                    className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
                    style={{ top: pos.top, left: pos.left }}
                    data-testid={`makeup-facemarker-${rec.category}`}
                    data-top={pos.top}
                  >
                    <div className="flex items-center gap-0.5">
                      {rec.colors.slice(0, 3).map((c, j) => (
                        <div
                          key={j}
                          className="h-3 w-3 rounded-full border border-white/70 shadow-sm"
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                    <span className="whitespace-nowrap rounded bg-black/40 px-1 py-0.5 text-[8px] leading-none text-white">
                      {rec.categoryLabel ?? rec.category}
                    </span>
                  </div>
                );
              })}
            </AnonymousFaceTemplate>
          </div>

          {/* 번호 섹션들 — 데이터 있는 것만, 번호 자동 재부여 */}
          {sections.map((section, index) => (
            <div key={section.key} className="mt-6">
              <SectionHeader no={index + 1} title={section.title} />
              <div className="mt-4">{section.body}</div>
            </div>
          ))}

          {/* 푸터 신뢰 블록 — 등급→% 매핑은 result/[id]와 동일 (진단서의 직인) */}
          <TrustFooter
            confidence={RELIABILITY_CONFIDENCE[result.analysisReliability]}
            testId="makeup-trust-footer"
            className="mt-6"
          >
            <p>
              분석 시간:{' '}
              {result.analyzedAt.toLocaleString(getDateLocale(locale), {
                dateStyle: 'long',
                timeStyle: 'short',
              })}
            </p>
          </TrustFooter>
        </div>
      </section>

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
