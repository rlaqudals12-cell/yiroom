'use client';

/**
 * 축별 상세 아코디언 (결과 페이지 중단)
 *
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §4.2
 */

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getBodyShapeLabel } from '@/lib/body';
import { seasonKo, undertoneKo, skinTypeKo, faceShapeKo } from '@/lib/analysis/integrated';
import type { AxisDbRecord } from '@/lib/analysis/integrated/internal/result-fetcher';
import { useAnalysisStatus, type AnalysisType } from '@/hooks/useAnalysisStatus';

export interface AxisDetailAccordionProps {
  axes: {
    personalColor: AxisDbRecord | null;
    skin: AxisDbRecord | null;
    body: AxisDbRecord | null;
    hair: AxisDbRecord | null;
    makeup: AxisDbRecord | null;
  };
}

interface AxisSection {
  code: string;
  label: string;
  record: AxisDbRecord | null;
  renderDetail: (r: AxisDbRecord) => React.JSX.Element;
}

// JSONB 객체(체형/헤어 style_recommendations {tops:[...],bottoms:[...]} 등) 키 → 한국어 라벨
const DETAIL_KEY_LABELS: Record<string, string> = {
  tops: '상의',
  bottoms: '하의',
  outerwear: '아우터',
  dresses: '원피스',
  accessories: '액세서리',
  avoid: '피할 것',
  styles: '스타일',
  cuts: '컷',
  colors: '컬러',
};

function formatDetailValue(v: unknown): string {
  if (typeof v !== 'object' || v === null) return String(v);
  if (Array.isArray(v)) return v.slice(0, 5).map(String).join(', ');
  // 왜: JSONB 객체를 raw JSON으로 노출하던 버그 수정 — 키를 한국어 라벨로 요약
  return Object.entries(v as Record<string, unknown>)
    .filter(([, val]) => val != null && (!Array.isArray(val) || val.length > 0))
    .slice(0, 4)
    .map(([k, val]) => {
      const label = DETAIL_KEY_LABELS[k] ?? k;
      const text = Array.isArray(val) ? val.slice(0, 2).map(String).join(', ') : String(val);
      return `${label}: ${text}`;
    })
    .join(' · ');
}

// A5: 체형 측정 출처 배지 라벨 (measured=실측 / estimated=추정). 미기록(구 분석)이면 미표시.
function measurementSourceLabel(v: unknown): string | null {
  if (v === 'measured') return '측정 기반 (전신 사진)';
  if (v === 'estimated') return 'AI 추정';
  return null;
}

function DetailRow({ k, v }: { k: string; v: unknown }): React.JSX.Element | null {
  if (v === null || v === undefined || v === '') return null;

  // 왜: JSONB/객체는 미리보기만 표시 (스크롤 지옥 방지)
  const value = formatDetailValue(v);

  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-800 py-2 last:border-0">
      <span className="text-xs text-zinc-500">{k}</span>
      <span className="max-w-[60%] text-right text-xs text-zinc-300">{value}</span>
    </div>
  );
}

// 색상 값 정규화: best_colors/worst_colors는 [{hex,name}] 또는 hex 문자열 배열 두 형태 모두 대응
interface Swatch {
  hex: string;
  name?: string;
}
function toSwatches(v: unknown): Swatch[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item): Swatch | null => {
      if (typeof item === 'string') {
        return /^#?[0-9a-fA-F]{3,8}$/.test(item.trim())
          ? { hex: item.trim().startsWith('#') ? item.trim() : `#${item.trim()}` }
          : null;
      }
      if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        const hex = typeof obj.hex === 'string' ? obj.hex : null;
        if (!hex) return null;
        return { hex, name: typeof obj.name === 'string' ? obj.name : undefined };
      }
      return null;
    })
    .filter((s): s is Swatch => s !== null)
    .slice(0, 10);
}

// 색상 배열은 hex 텍스트 대신 색 견본(스와치)으로 표시 — "#FF7F50" 코드 노출 금지
function ColorDetailRow({ k, v }: { k: string; v: unknown }): React.JSX.Element | null {
  const swatches = toSwatches(v);
  if (swatches.length === 0) return null;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-zinc-800 py-2 last:border-0">
      <span className="shrink-0 text-xs text-zinc-500">{k}</span>
      <div className="flex max-w-[70%] flex-wrap justify-end gap-1.5">
        {swatches.map((s, i) => (
          <span
            key={`${s.hex}-${i}`}
            className="h-4 w-4 rounded-full border border-white/15"
            style={{ backgroundColor: s.hex }}
            title={s.name ? `${s.name} (${s.hex})` : s.hex}
            aria-label={s.name ?? s.hex}
          />
        ))}
      </div>
    </div>
  );
}

// 세션 축 코드 → 개별 분석 타입 (최신 결과 링크용)
const CODE_TO_ANALYSIS_TYPE: Record<string, AnalysisType> = {
  personal_color: 'personal-color',
  skin: 'skin',
  body: 'body',
  hair: 'hair',
  makeup: 'makeup',
};

export function AxisDetailAccordion({ axes }: AxisDetailAccordionProps): React.JSX.Element {
  // 이 세션에 없는 축이라도 개별 분석 최신 결과가 있으면 그쪽으로 안내.
  // 왜: 옛 부분 세션에서 "결과가 없어요"라고만 하면, 이후 개별 분석으로 채운
  // 사용자에게 거짓("내 퍼스널컬러가 사라졌나?")이 됨 — 프로필이 진실의 원천(ADR-109).
  const { analyses } = useAnalysisStatus();
  const latestByType = new Map(analyses.map((a) => [a.type, a]));

  const sections: AxisSection[] = [
    {
      code: 'personal_color',
      label: '퍼스널컬러',
      record: axes.personalColor,
      renderDetail: (r) => (
        <>
          <DetailRow k="계절" v={r.season ? seasonKo(String(r.season)) : null} />
          <DetailRow k="언더톤" v={r.undertone ? undertoneKo(String(r.undertone)) : null} />
          <DetailRow k="신뢰도" v={r.confidence != null ? `${r.confidence}%` : null} />
          <ColorDetailRow k="추천 색상" v={r.best_colors} />
          <ColorDetailRow k="피해야 할 색상" v={r.worst_colors} />
        </>
      ),
    },
    {
      code: 'skin',
      label: '피부',
      record: axes.skin,
      renderDetail: (r) => (
        <>
          <DetailRow k="피부 타입" v={r.skin_type ? skinTypeKo(String(r.skin_type)) : null} />
          <DetailRow k="전체 점수" v={r.overall_score} />
          <DetailRow k="수분" v={r.hydration} />
          <DetailRow k="유분" v={r.oil_level} />
          <DetailRow k="모공" v={r.pores} />
          <DetailRow k="색소" v={r.pigmentation} />
          <DetailRow k="주름" v={r.wrinkles} />
        </>
      ),
    },
    {
      code: 'body',
      label: '체형',
      record: axes.body,
      renderDetail: (r) => (
        <>
          <DetailRow k="체형 타입" v={r.body_type ? getBodyShapeLabel(r.body_type) : null} />
          <DetailRow k="측정 방식" v={measurementSourceLabel(r.measurement_source)} />
          <DetailRow k="비율" v={r.ratio} />
          <DetailRow k="키" v={r.height} />
          <DetailRow k="몸무게" v={r.weight} />
          <DetailRow k="추천 스타일" v={r.style_recommendations} />
        </>
      ),
    },
    {
      code: 'hair',
      label: '헤어',
      record: axes.hair,
      renderDetail: (r) => (
        <>
          <DetailRow k="얼굴형" v={r.face_shape ? faceShapeKo(String(r.face_shape)) : null} />
          <DetailRow k="모발 타입" v={r.hair_type} />
          <DetailRow k="모발 굵기" v={r.hair_thickness} />
          <DetailRow k="추천 스타일" v={r.style_recommendations} />
        </>
      ),
    },
    {
      code: 'makeup',
      label: '메이크업',
      record: axes.makeup,
      renderDetail: (r) => (
        <>
          <DetailRow k="언더톤" v={r.undertone ? undertoneKo(String(r.undertone)) : null} />
          <DetailRow k="전체 점수" v={r.overall_score} />
          <DetailRow k="추천" v={r.recommendations} />
        </>
      ),
    },
  ];

  return (
    <Accordion
      type="multiple"
      className="rounded-2xl border border-zinc-800 bg-neutral-900 px-4"
      data-testid="axis-detail-accordion"
    >
      {sections.map((s) => {
        const latest = latestByType.get(CODE_TO_ANALYSIS_TYPE[s.code]);
        return (
          <AccordionItem key={s.code} value={s.code} className="border-zinc-800">
            <AccordionTrigger className="text-sm font-semibold text-white">
              <span className="flex items-center gap-3">
                <span>{s.label}</span>
                {!s.record && (
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                    이번 분석에 미포함
                  </span>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              {s.record ? (
                <div className="space-y-1">{s.renderDetail(s.record)}</div>
              ) : latest ? (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500">
                    이번 통합 분석에는 포함되지 않았어요. 개별 분석 결과가 있어요.
                  </p>
                  <Link
                    href={`/analysis/${latest.type}/result/${latest.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-pink-400 hover:text-pink-300"
                    data-testid={`axis-latest-link-${s.code}`}
                  >
                    최신 {s.label} 결과 보기 — {latest.summary}
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-zinc-500">
                  이번 통합 분석에는 포함되지 않았어요. 아래 &ldquo;다시 시도&rdquo; 버튼으로 새
                  분석을 시작할 수 있어요.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
