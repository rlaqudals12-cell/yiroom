/**
 * 5축 통합 요약 카드 (결과 페이지 상단)
 *
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §4.1
 */

import { Palette, Sparkles, Shirt, Scissors, Brush } from 'lucide-react';
import { getBodyShapeLabel } from '@/lib/body';
import { seasonKo, undertoneKo, skinTypeKo, faceShapeKo } from '@/lib/analysis/integrated';
import type { AxisDbRecord } from '@/lib/analysis/integrated/internal/result-fetcher';

export interface AxesSummaryCardProps {
  axes: {
    personalColor: AxisDbRecord | null;
    skin: AxisDbRecord | null;
    body: AxisDbRecord | null;
    hair: AxisDbRecord | null;
    makeup: AxisDbRecord | null;
  };
}

interface AxisRow {
  code: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  renderSummary: (record: AxisDbRecord | null) => React.JSX.Element;
}

const AXES: AxisRow[] = [
  {
    code: 'personal_color',
    label: '퍼스널컬러',
    icon: Palette,
    iconColor: 'text-pink-400',
    renderSummary: (r) => {
      if (!r) return <MissingLabel />;
      // 원시 영문값(Autumn/Warm) 노출 금지 — 한국어 라벨로
      const season = r.season ? seasonKo(String(r.season)) : '-';
      const undertone = r.undertone ? undertoneKo(String(r.undertone)) : '';
      return (
        <span className="text-white">
          {season}
          {undertone && <span className="text-zinc-400"> / {undertone}</span>}
        </span>
      );
    },
  },
  {
    code: 'skin',
    label: '피부',
    icon: Sparkles,
    iconColor: 'text-amber-400',
    renderSummary: (r) => {
      if (!r) return <MissingLabel />;
      const type = r.skin_type ? skinTypeKo(String(r.skin_type)) : '-';
      const score = Number(r.overall_score ?? 0);
      return (
        <span className="text-white">
          {type} <span className="text-zinc-400">· {score}점</span>
        </span>
      );
    },
  },
  {
    code: 'body',
    label: '체형',
    icon: Shirt,
    iconColor: 'text-blue-400',
    renderSummary: (r) => {
      if (!r) return <MissingLabel />;
      return (
        <span className="text-white">{r.body_type ? getBodyShapeLabel(r.body_type) : '-'}</span>
      );
    },
  },
  {
    code: 'hair',
    label: '헤어',
    icon: Scissors,
    iconColor: 'text-violet-400',
    renderSummary: (r) => {
      if (!r) return <MissingLabel />;
      // 얼굴형 원시값(oval)을 한국어(계란형)로 — faceShapeKo가 이미 "형"까지 포함
      return (
        <span className="text-white">{r.face_shape ? faceShapeKo(String(r.face_shape)) : '-'}</span>
      );
    },
  },
  {
    code: 'makeup',
    label: '메이크업',
    icon: Brush,
    iconColor: 'text-rose-400',
    renderSummary: (r) => {
      if (!r) return <MissingLabel />;
      // 언더톤 원시값(warm)을 한국어(웜톤)로
      return (
        <span className="text-white">{r.undertone ? undertoneKo(String(r.undertone)) : '-'}</span>
      );
    },
  },
];

function MissingLabel(): React.JSX.Element {
  // "미완료"는 실패 뉘앙스 — 세션에 안 담긴 것뿐이므로 "미포함"으로 (개별 결과는 있을 수 있음)
  return <span className="text-zinc-500">이번 분석 미포함</span>;
}

export function AxesSummaryCard({ axes }: AxesSummaryCardProps): React.JSX.Element {
  const records = {
    personal_color: axes.personalColor,
    skin: axes.skin,
    body: axes.body,
    hair: axes.hair,
    makeup: axes.makeup,
  };

  return (
    <div
      className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-[#1A1A2E] p-6"
      data-testid="axes-summary-card"
    >
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        내 정체성 한눈에
      </h2>
      <ul className="space-y-3">
        {AXES.map((axis) => {
          const record = records[axis.code as keyof typeof records];
          const Icon = axis.icon;
          return (
            <li
              key={axis.code}
              className="flex items-center gap-3"
              data-testid={`summary-row-${axis.code}`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5">
                <Icon className={`h-4 w-4 ${axis.iconColor}`} />
              </div>
              <div className="flex flex-1 items-center justify-between gap-3 text-sm">
                <span className="text-zinc-400">{axis.label}</span>
                {axis.renderSummary(record)}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
