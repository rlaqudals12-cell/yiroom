/**
 * 피부 고민별 SVG 일러스트 컴포넌트
 *
 * Phase B: Lucide 아이콘 대체 - 시각적으로 풍부한 인라인 SVG
 * 각 일러스트는 40x40 기준, 그라디언트 + 피부 고민 시각 표현
 */

import type { SVGProps } from 'react';

type IllustrationProps = SVGProps<SVGSVGElement> & { size?: number };

function baseProps(props: IllustrationProps, d = 40): SVGProps<SVGSVGElement> {
  const { size: s, ...rest } = props;
  return { width: s ?? d, height: s ?? d, viewBox: '0 0 40 40', fill: 'none', ...rest };
}

/** 수분도 - 물방울 */
export function HydrationIllust(props: IllustrationProps): React.JSX.Element {
  return (
    <svg {...baseProps(props)} aria-hidden="true">
      <defs>
        <linearGradient id="hydra-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="22" r="14" fill="#dbeafe" />
      <path
        d="M20 8c0 0-10 12-10 18a10 10 0 0020 0c0-6-10-18-10-18z"
        fill="url(#hydra-g)"
        opacity="0.85"
      />
      <ellipse cx="16" cy="22" rx="2.5" ry="3.5" fill="white" opacity="0.4" />
    </svg>
  );
}

/** 유분도 - 기름방울 */
export function OilIllust(props: IllustrationProps): React.JSX.Element {
  return (
    <svg {...baseProps(props)} aria-hidden="true">
      <defs>
        <linearGradient id="oil-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="14" fill="#fef3c7" />
      <circle cx="20" cy="20" r="10" fill="url(#oil-g)" opacity="0.8" />
      <ellipse
        cx="17"
        cy="17"
        rx="3"
        ry="2"
        fill="white"
        opacity="0.5"
        transform="rotate(-20 17 17)"
      />
      <circle cx="24" cy="16" r="1.5" fill="white" opacity="0.3" />
    </svg>
  );
}

/** 모공 - 확대경 */
export function PoreIllust(props: IllustrationProps): React.JSX.Element {
  return (
    <svg {...baseProps(props)} aria-hidden="true">
      <defs>
        <linearGradient id="pore-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="14" fill="#f1f5f9" />
      <circle cx="14" cy="16" r="1.2" fill="#94a3b8" />
      <circle cx="18" cy="14" r="1" fill="#94a3b8" />
      <circle cx="22" cy="16" r="1.3" fill="#94a3b8" />
      <circle cx="16" cy="20" r="1.1" fill="#94a3b8" />
      <circle cx="20" cy="19" r="1.4" fill="#94a3b8" />
      <circle cx="24" cy="21" r="1" fill="#94a3b8" />
      <circle cx="24" cy="26" r="6" stroke="url(#pore-g)" strokeWidth="2" fill="none" />
      <line
        x1="28.2"
        y1="30.2"
        x2="33"
        y2="35"
        stroke="#64748b"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 주름 - 곡선 */
export function WrinkleIllust(props: IllustrationProps): React.JSX.Element {
  return (
    <svg {...baseProps(props)} aria-hidden="true">
      <defs>
        <linearGradient id="wrk-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="14" fill="#ede9fe" />
      <path
        d="M10 17c4-3 8 3 12 0s6-3 10 0"
        stroke="url(#wrk-g)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M10 22c4-3 8 3 12 0s6-3 10 0"
        stroke="url(#wrk-g)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M10 27c4-3 8 3 12 0s6-3 10 0"
        stroke="url(#wrk-g)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

/** 탄력 - 바운스 */
export function ElasticityIllust(props: IllustrationProps): React.JSX.Element {
  return (
    <svg {...baseProps(props)} aria-hidden="true">
      <defs>
        <linearGradient id="elas-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="14" fill="#fce7f3" />
      <path
        d="M14 28 L20 14 L26 28"
        stroke="url(#elas-g)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M17 24 L20 18 L23 24"
        stroke="#f472b6"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="20" cy="12" r="1.5" fill="#ec4899" opacity="0.6" />
      <circle cx="28" cy="16" r="1" fill="#f472b6" opacity="0.4" />
      <circle cx="12" cy="18" r="1" fill="#f472b6" opacity="0.4" />
    </svg>
  );
}

/** 색소침착 - 반점 */
export function PigmentationIllust(props: IllustrationProps): React.JSX.Element {
  return (
    <svg {...baseProps(props)} aria-hidden="true">
      <defs>
        <linearGradient id="pig-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="14" fill="#ffedd5" />
      <circle cx="15" cy="17" r="3" fill="url(#pig-g)" opacity="0.5" />
      <circle cx="24" cy="15" r="2.5" fill="url(#pig-g)" opacity="0.4" />
      <circle cx="20" cy="23" r="3.5" fill="url(#pig-g)" opacity="0.6" />
      <circle cx="27" cy="24" r="2" fill="url(#pig-g)" opacity="0.35" />
      <circle cx="13" cy="25" r="1.8" fill="url(#pig-g)" opacity="0.3" />
    </svg>
  );
}

/** 트러블 - 붉은 돌기 */
export function TroubleIllust(props: IllustrationProps): React.JSX.Element {
  return (
    <svg {...baseProps(props)} aria-hidden="true">
      <defs>
        <radialGradient id="trbl-g" cx="0.4" cy="0.4" r="0.6">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="100%" stopColor="#ef4444" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="14" fill="#fee2e2" />
      <circle cx="16" cy="16" r="3" fill="url(#trbl-g)" />
      <circle cx="24" cy="18" r="2.5" fill="url(#trbl-g)" opacity="0.8" />
      <circle cx="19" cy="25" r="2" fill="url(#trbl-g)" opacity="0.6" />
      <circle cx="15" cy="15" r="1" fill="white" opacity="0.4" />
      <circle cx="23" cy="17" r="0.8" fill="white" opacity="0.3" />
    </svg>
  );
}

/** 민감도 - 보호막 실드 */
export function SensitivityIllust(props: IllustrationProps): React.JSX.Element {
  return (
    <svg {...baseProps(props)} aria-hidden="true">
      <defs>
        <linearGradient id="sens-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="14" fill="#d1fae5" />
      <path
        d="M20 8 L30 14 V23 C30 30 20 35 20 35 C20 35 10 30 10 23 V14 Z"
        fill="url(#sens-g)"
        opacity="0.7"
      />
      <path
        d="M15 21 L18 24 L25 16"
        stroke="white"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 메트릭 ID -> 일러스트 컴포넌트 매핑 */
export const SKIN_ILLUSTRATIONS: Record<string, (props: IllustrationProps) => React.JSX.Element> = {
  hydration: HydrationIllust,
  oil: OilIllust,
  pores: PoreIllust,
  wrinkles: WrinkleIllust,
  elasticity: ElasticityIllust,
  pigmentation: PigmentationIllust,
  trouble: TroubleIllust,
  sensitivity: SensitivityIllust,
};
