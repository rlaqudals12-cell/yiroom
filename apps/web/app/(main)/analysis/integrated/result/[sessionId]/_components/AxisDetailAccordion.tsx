'use client';

/**
 * 축별 상세 아코디언 (결과 페이지 중단)
 *
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §4.2
 */

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { getBodyShapeLabel } from '@/lib/body';
import type { AxisDbRecord } from '@/lib/analysis/integrated/internal/result-fetcher';

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

export function AxisDetailAccordion({ axes }: AxisDetailAccordionProps): React.JSX.Element {
  const sections: AxisSection[] = [
    {
      code: 'personal_color',
      label: '퍼스널컬러',
      record: axes.personalColor,
      renderDetail: (r) => (
        <>
          <DetailRow k="계절" v={r.season} />
          <DetailRow k="언더톤" v={r.undertone} />
          <DetailRow k="신뢰도" v={r.confidence} />
          <DetailRow k="추천 색상" v={r.best_colors} />
          <DetailRow k="피해야 할 색상" v={r.worst_colors} />
        </>
      ),
    },
    {
      code: 'skin',
      label: '피부',
      record: axes.skin,
      renderDetail: (r) => (
        <>
          <DetailRow k="피부 타입" v={r.skin_type} />
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
          <DetailRow k="얼굴형" v={r.face_shape} />
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
          <DetailRow k="언더톤" v={r.undertone} />
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
      {sections.map((s) => (
        <AccordionItem key={s.code} value={s.code} className="border-zinc-800">
          <AccordionTrigger className="text-sm font-semibold text-white">
            <span className="flex items-center gap-3">
              <span>{s.label}</span>
              {!s.record && (
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                  분석 미완료
                </span>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            {s.record ? (
              <div className="space-y-1">{s.renderDetail(s.record)}</div>
            ) : (
              <p className="text-xs text-zinc-500">
                이 축의 분석 결과가 없어요. 아래 &ldquo;다시 시도&rdquo; 버튼으로 새 세션을 시작할
                수 있어요.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
