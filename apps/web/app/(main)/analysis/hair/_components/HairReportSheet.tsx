'use client';

import { useLocale } from 'next-intl';
import { Activity, Ruler, Sprout, Waves } from 'lucide-react';
import {
  ReportEyebrow,
  SectionHeader,
  AttrRow,
  RowTable,
  SpectrumRow,
  TrustFooter,
} from '@/components/analysis/report';
import { getDateLocale } from '@/lib/utils/date-format';
import { PAPER_GRAIN_URI } from '@/components/share/paper-grain';

/** 진단지에 올리는 항목별 컨디션 행 — 인라인(label)·결과(name) 필드 차이는 호출부가 어댑팅한다 */
export interface HairReportMetric {
  id: string;
  label: string;
  value: number;
  status: 'good' | 'normal' | 'warning';
}

export interface HairReportSheetProps {
  hairTypeLabel: string;
  /** 자가입력 경로는 굵기 라벨이 비어있음 — 빈 값은 히어로·속성표에서 생략한다 */
  hairThicknessLabel?: string;
  scalpTypeLabel: string;
  overallScore: number;
  metrics: HairReportMetric[];
  /** 저장된 3등급 신뢰도 — 미제공이면 신뢰도 라인 미렌더 (위장 수치 금지) */
  reliability?: 'high' | 'medium' | 'low';
  analyzedAt?: Date;
  /** 항목별 컨디션 섹션 제목 — 인라인 뷰는 i18n 키를 주입한다 */
  metricsTitle?: string;
  testId?: string;
}

// 신호등 색 대신 텍스트로 상태를 말한다 (ADR-120)
const STATUS_TEXT: Record<HairReportMetric['status'], string> = {
  good: '양호',
  normal: '보통',
  warning: '집중 케어',
};

// 표시용 신뢰도 % — 저장값은 3등급뿐이라 결과 페이지 ExpertDataPanel과 동일 매핑 재사용 (새 수치 생성 아님)
const RELIABILITY_CONFIDENCE: Record<'high' | 'medium' | 'low', number> = {
  high: 90,
  medium: 70,
  low: 40,
};

// 종합 점수 상태 문구 — 결과 페이지 getStatus와 동일 임계값(71/41)에서 파생
function scoreStatusText(value: number): string {
  if (value >= 71) return STATUS_TEXT.good;
  if (value >= 41) return STATUS_TEXT.normal;
  return STATUS_TEXT.warning;
}

/**
 * 헤어 진단지 시트 — 아이브로우 → 세리프 히어로(모질·굵기) → 01 속성표 → 02 항목별 컨디션 → 신뢰 푸터.
 * 원형 채점 게이지·신호등 게이지를 대체하는 진단지 문법 (ADR-120, 정본 = PC AnalysisResult).
 */
export function HairReportSheet({
  hairTypeLabel,
  hairThicknessLabel,
  scalpTypeLabel,
  overallScore,
  metrics,
  reliability,
  analyzedAt,
  metricsTitle = '항목별 컨디션',
  testId,
}: HairReportSheetProps): React.JSX.Element {
  const locale = useLocale();
  // 자가입력 경로는 굵기 라벨이 비어있음 — 빈 값은 표시하지 않음
  const heroTitle = [hairTypeLabel, hairThicknessLabel].filter(Boolean).join(' · ');

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] dark:shadow-none"
      data-testid={testId}
    >
      {/* 깊이: 크림 지면 위 백색 시트 — 종이 그레인 1겹(시트 한정, ≤0.05) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05] dark:hidden"
        style={{ backgroundImage: PAPER_GRAIN_URI }}
      />
      <div className="px-5 pb-6 pt-6 sm:px-7">
        {/* 히어로 — 아이브로우 + 세리프 진단명 + 두피 서브카피 */}
        <ReportEyebrow>HAIR REPORT</ReportEyebrow>
        <div className="mt-3 min-w-0">
          <h2 className="break-keep font-serif text-3xl font-semibold leading-tight tracking-tight text-foreground">
            {heroTitle}
          </h2>
          <p className="mt-2 break-keep text-sm text-muted-foreground">{scalpTypeLabel}</p>
        </div>

        {/* 01 진단 속성표 — 점수는 채점 게이지 대신 "NN점 · 상태" 텍스트 행으로 */}
        <div className="mt-6">
          <SectionHeader no={1} title="진단 요약" />
          <div className="mt-4">
            <RowTable testId={testId ? `${testId}-attrs` : undefined}>
              <AttrRow icon={Waves} label="모질" value={hairTypeLabel} />
              {hairThicknessLabel && (
                <AttrRow icon={Ruler} label="굵기" value={hairThicknessLabel} />
              )}
              <AttrRow icon={Sprout} label="두피" value={scalpTypeLabel} />
              <AttrRow
                icon={Activity}
                label="컨디션"
                value={`${overallScore}점 · ${scoreStatusText(overallScore)}`}
              />
            </RowTable>
          </div>
        </div>

        {/* 02 항목별 컨디션 — 신호등 게이지 대신 뮤트 스펙트럼 + 상태 텍스트 */}
        {metrics.length > 0 && (
          <div className="mt-6">
            <SectionHeader no={2} title={metricsTitle} />
            <div className="mt-4">
              <RowTable testId={testId ? `${testId}-metrics` : undefined}>
                {metrics.map((metric) => (
                  // 메이크업 결과의 progressbar aria 문법 승계 — 값은 저장 점수 그대로
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
                      status={`${metric.value}점 · ${STATUS_TEXT[metric.status]}`}
                      testId={testId ? `${testId}-metric-${metric.id}` : undefined}
                    />
                  </div>
                ))}
              </RowTable>
            </div>
          </div>
        )}

        {/* 푸터 신뢰 블록 — 진단서의 직인 */}
        <TrustFooter
          confidence={reliability ? RELIABILITY_CONFIDENCE[reliability] : null}
          testId={testId ? `${testId}-trust` : undefined}
          className="mt-6"
        >
          {analyzedAt && <p>분석 시간: {analyzedAt.toLocaleString(getDateLocale(locale))}</p>}
        </TrustFooter>
      </div>
    </section>
  );
}
