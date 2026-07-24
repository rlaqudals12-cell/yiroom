'use client';

/**
 * 화장품 질감 스와치 — 플랫 색칩 대신 "실물 발색"으로 진단 색을 보여준다.
 *
 * 왜: 비주얼 벤치마크(docs/research/reference-mockups m07·m08)의 결정적 우위가
 * 파우더 뭉갬·립 스미어·마스카라 획 같은 코스메틱 텍스처 표현으로 판정됨(창업자 7/25).
 * 단 생성 이미지는 기각(ADR-120 — 진단 hex 부정확·재현성 파괴)이므로,
 * **질감 = 고정 SVG 마스크(결정론 seed) / 색 = 진단 hex 그대로 틴팅**으로 둘 다 갖는다.
 *
 * 캡처 규약: 인라인 SVG만(외부 요청 0), feTurbulence·feDisplacementMap·feGaussianBlur는
 * html-to-image가 브라우저 래스터를 그대로 가져가므로 안전(금지는 backdrop-filter뿐).
 * 필터 id는 useId로 인스턴스 격리(한 화면 다중 렌더 시 충돌 방지).
 */

import { useId } from 'react';

export type TextureKind = 'powder' | 'lip' | 'mascara' | 'foundation';

interface TextureSwatchProps {
  hex: string;
  kind: TextureKind;
  /** 렌더 폭(px). 높이는 질감별 고정 비율 */
  width?: number;
  className?: string;
}

/**
 * 질감별 렌더 스펙 — viewBox는 64×44 고정, 형태·seed는 상수(같은 색 = 항상 같은 그림).
 * 음영은 같은 hex 위에 검정/흰색 저불투명 오버레이만 사용(제3색 반입 금지 — 뮤트 규율).
 */
function Powder({ hex, fid }: { hex: string; fid: string }): React.JSX.Element {
  return (
    <>
      <defs>
        <filter id={fid} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.09 0.13"
            numOctaves="3"
            seed="11"
            result="n"
          />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="14" />
          <feGaussianBlur stdDeviation="0.4" />
        </filter>
        <filter id={`${fid}g`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.5 0.5 0.5 0 0" />
          <feComposite operator="in" in2="SourceGraphic" />
        </filter>
      </defs>
      {/* 본체 뭉갬 — 가장자리를 노이즈로 흐트러뜨린 타원 2겹(중심 진하게) */}
      <g filter={`url(#${fid})`}>
        <ellipse cx="32" cy="22" rx="24" ry="14" fill={hex} opacity="0.55" />
        <ellipse cx="32" cy="22" rx="18" ry="10.5" fill={hex} opacity="0.85" />
        <ellipse cx="31" cy="21" rx="11" ry="6.5" fill={hex} />
      </g>
      {/* 입자 그레인 — 같은 hex 계열 안에서만(검정 12%) */}
      <g filter={`url(#${fid}g)`} opacity="0.12">
        <ellipse cx="32" cy="22" rx="22" ry="13" fill="#000" />
      </g>
    </>
  );
}

function Lip({ hex, fid }: { hex: string; fid: string }): React.JSX.Element {
  return (
    <>
      <defs>
        <filter id={fid} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05 0.18"
            numOctaves="2"
            seed="4"
            result="n"
          />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="6" />
        </filter>
      </defs>
      {/* 스와이프 스트로크 — 왼쪽 두껍게 시작해 오른쪽으로 얇게 빠지는 발림 */}
      <g filter={`url(#${fid})`}>
        <path
          d="M6 15 Q 14 9, 26 11 L 58 17 Q 60 19, 58 21 L 24 33 Q 12 35, 7 28 Q 3 21, 6 15 Z"
          fill={hex}
        />
        {/* 발림 결 — 검정 10% 스트리크 2줄(윤기·방향감) */}
        <path
          d="M10 19 Q 30 15, 55 19"
          stroke="#000"
          strokeOpacity="0.1"
          strokeWidth="1.6"
          fill="none"
        />
        <path
          d="M11 25 Q 30 27, 52 22"
          stroke="#fff"
          strokeOpacity="0.18"
          strokeWidth="1.2"
          fill="none"
        />
      </g>
    </>
  );
}

function Mascara({ hex, fid }: { hex: string; fid: string }): React.JSX.Element {
  // 브러시 획 3줄 — 곡률·길이를 달리해 손맛(결정론 상수)
  return (
    <>
      <defs>
        <filter id={fid} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.3 0.9"
            numOctaves="2"
            seed="9"
            result="n"
          />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.5" />
        </filter>
      </defs>
      <g filter={`url(#${fid})`} stroke={hex} fill="none" strokeLinecap="round">
        <path d="M8 30 Q 24 24, 56 27" strokeWidth="4.6" />
        <path d="M10 21 Q 28 15, 54 18" strokeWidth="3.4" strokeOpacity="0.92" />
        <path d="M13 12 Q 30 8, 50 10" strokeWidth="2.2" strokeOpacity="0.8" />
      </g>
    </>
  );
}

function Foundation({ hex, fid }: { hex: string; fid: string }): React.JSX.Element {
  return (
    <>
      <defs>
        <filter id={fid} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.5" />
        </filter>
      </defs>
      {/* 크림 dab — 매끈한 방울 + 하이라이트·자기그림자(같은 hex 위 명암만) */}
      <g filter={`url(#${fid})`}>
        <path d="M14 26 Q 12 12, 30 11 Q 52 10, 51 24 Q 50 35, 32 34 Q 16 34, 14 26 Z" fill={hex} />
        <path
          d="M14 26 Q 12 12, 30 11 Q 52 10, 51 24 Q 50 35, 32 34 Q 16 34, 14 26 Z"
          fill="#000"
          opacity="0.06"
        />
        <ellipse cx="26" cy="17" rx="9" ry="4" fill="#fff" opacity="0.22" />
      </g>
    </>
  );
}

const RENDERERS: Record<TextureKind, (p: { hex: string; fid: string }) => React.JSX.Element> = {
  powder: Powder,
  lip: Lip,
  mascara: Mascara,
  foundation: Foundation,
};

export function TextureSwatch({
  hex,
  kind,
  width = 64,
  className,
}: TextureSwatchProps): React.JSX.Element {
  const fid = useId().replace(/:/g, '');
  const Renderer = RENDERERS[kind];
  return (
    <svg
      viewBox="0 0 64 44"
      width={width}
      height={Math.round((width * 44) / 64)}
      className={className}
      aria-hidden="true"
      data-testid={`texture-swatch-${kind}`}
    >
      <Renderer hex={hex} fid={fid} />
    </svg>
  );
}
