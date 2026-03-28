'use client';

/**
 * S-1: 익명 공유용 제네릭 얼굴 일러스트 (3종 얼굴형)
 *
 * @description 성별 무관, 형태 기반 분류 (ADR-084 준수)
 * @see docs/adr/ADR-097-visual-overlay-anonymous-share.md D3
 */

export type AnonymousFaceShape = 'oval' | 'round' | 'angular';
export type AnonymousSkinTone = 'light' | 'medium' | 'dark';

export interface AnonymousFaceTemplateProps {
  faceShape?: AnonymousFaceShape;
  skinTone?: AnonymousSkinTone;
  children?: React.ReactNode;
}

// 피부톤별 색상 (명도 기반, 인종/성별 무관)
const SKIN_TONE_COLORS: Record<AnonymousSkinTone, { base: string; shadow: string }> = {
  light: { base: '#F5DEB3', shadow: '#E8D1A0' },
  medium: { base: '#D2A679', shadow: '#C49468' },
  dark: { base: '#8D6748', shadow: '#7A5A3E' },
};

// 얼굴형별 SVG 윤곽 (성별 특징 없는 기하학적 형태)
const FACE_OUTLINES: Record<AnonymousFaceShape, string> = {
  // 타원형: 가장 보편적, 부드러운 곡선
  oval: 'M 100 25 Q 140 30 155 60 Q 165 100 155 130 Q 145 160 130 175 Q 115 185 100 188 Q 85 185 70 175 Q 55 160 45 130 Q 35 100 45 60 Q 60 30 100 25 Z',
  // 둥근형: 폭이 넓고 둥근
  round:
    'M 100 28 Q 145 32 160 65 Q 170 100 160 130 Q 150 158 135 170 Q 118 182 100 184 Q 82 182 65 170 Q 50 158 40 130 Q 30 100 40 65 Q 55 32 100 28 Z',
  // 각진형: 턱이 각진 직선적
  angular:
    'M 100 25 Q 138 28 155 55 Q 165 85 163 115 L 150 155 L 130 175 Q 115 183 100 185 Q 85 183 70 175 L 50 155 L 37 115 Q 35 85 45 55 Q 62 28 100 25 Z',
};

// 최소한의 얼굴 특징 (눈/코/입 — 심플 기하학적)
function FaceFeatures({ tone }: { tone: AnonymousSkinTone }): React.ReactElement {
  const shadowColor = SKIN_TONE_COLORS[tone].shadow;
  return (
    <>
      {/* 눈 (단순 타원) */}
      <ellipse cx="78" cy="80" rx="10" ry="5" fill={shadowColor} opacity={0.5} />
      <ellipse cx="122" cy="80" rx="10" ry="5" fill={shadowColor} opacity={0.5} />
      {/* 코 (단순 세로선) */}
      <line
        x1="100"
        y1="90"
        x2="100"
        y2="115"
        stroke={shadowColor}
        strokeWidth="1.5"
        opacity={0.3}
      />
      {/* 입 (단순 곡선) */}
      <path
        d="M 85 135 Q 100 145 115 135"
        stroke={shadowColor}
        strokeWidth="1.5"
        fill="none"
        opacity={0.4}
      />
    </>
  );
}

/**
 * 익명 얼굴 템플릿 — 피부/메이크업/헤어 공유 시 실제 얼굴 대체
 */
export function AnonymousFaceTemplate({
  faceShape = 'oval',
  skinTone = 'medium',
  children,
}: AnonymousFaceTemplateProps): React.ReactElement {
  const colors = SKIN_TONE_COLORS[skinTone];
  const outline = FACE_OUTLINES[faceShape];

  return (
    <div data-testid="anonymous-face-template" className="relative w-full max-w-[200px] mx-auto">
      <svg
        viewBox="0 0 200 210"
        className="w-full h-auto"
        role="img"
        aria-label={`익명 얼굴 일러스트 (${faceShape === 'oval' ? '타원형' : faceShape === 'round' ? '둥근형' : '각진형'})`}
      >
        {/* 얼굴 배경 */}
        <path d={outline} fill={colors.base} stroke={colors.shadow} strokeWidth="1" />
        {/* 최소 특징 */}
        <FaceFeatures tone={skinTone} />
      </svg>
      {/* 오버레이 콘텐츠 (히트맵/컬러 가이드) — 절대 위치 */}
      {children && <div className="absolute inset-0 pointer-events-none">{children}</div>}
    </div>
  );
}
