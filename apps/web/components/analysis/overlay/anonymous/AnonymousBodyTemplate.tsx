'use client';

/**
 * S-2: 익명 공유용 체형 실루엣 (3종, 성별 무관)
 *
 * @description 기하학적 미니멀 실루엣, 어깨:힙 비율만 변형 (ADR-084 neutral 기본값)
 * @see docs/adr/ADR-097-visual-overlay-anonymous-share.md D3
 */

export type AnonymousBodyType = 'S' | 'W' | 'N';

export interface AnonymousBodyTemplateProps {
  bodyType?: AnonymousBodyType;
  children?: React.ReactNode;
}

// 체형별 실루엣 — 성별 특징 없는 기하학적 도형
// S(Straight): 어깨=힙, 직선적 / W(Wave): 힙>어깨, 곡선적 / N(Natural): 어깨>힙, 골격감
const BODY_SILHOUETTES: Record<AnonymousBodyType, string> = {
  // Straight: 어깨=힙, 허리 약간 들어감, 직선적
  S: `M 72 50 L 128 50
      Q 135 55 135 70 L 130 120
      Q 128 135 118 140 L 120 200
      Q 122 220 128 250 L 132 300
      Q 134 320 128 340 L 125 380
      L 105 380 L 108 340 Q 110 320 105 300
      L 100 260 L 95 300
      Q 90 320 92 340 L 95 380
      L 75 380 L 72 340
      Q 66 320 68 300 L 72 250
      Q 72 235 80 200 L 82 140
      Q 72 135 70 120 L 65 70
      Q 65 55 72 50 Z`,
  // Wave: 힙이 넓고 곡선적, 허리 잘록
  W: `M 75 50 L 125 50
      Q 132 55 132 70 L 128 110
      Q 125 125 110 130
      Q 100 133 90 130 Q 75 125 72 110
      L 68 70 Q 68 55 75 50 Z
      M 90 130 Q 82 135 78 150 Q 70 170 68 190
      L 65 220 Q 60 240 62 260
      L 68 300 Q 70 320 66 340 L 63 380
      L 83 380 L 86 340 Q 88 320 85 300
      L 82 260 Q 90 245 100 260
      L 97 300 Q 94 320 96 340 L 99 380
      L 119 380 L 116 340
      Q 112 320 114 300 L 120 260
      Q 122 240 118 220 L 115 190
      Q 113 170 108 150 Q 104 135 95 130 Z`,
  // Natural: 어깨 넓고 골격감, 직선적이되 프레임 큼
  N: `M 65 50 L 135 50
      Q 142 55 140 75 L 135 120
      Q 132 135 120 138 L 122 200
      Q 124 220 126 250 L 128 300
      Q 130 320 126 340 L 123 380
      L 105 380 L 108 340 Q 110 320 107 300
      L 102 260 L 98 300
      Q 95 320 97 340 L 100 380
      L 82 380 L 78 340
      Q 74 320 76 300 L 80 250
      Q 80 230 82 200 L 84 138
      Q 72 135 68 120 L 62 75
      Q 60 55 65 50 Z`,
};

// 체형별 라벨
const BODY_TYPE_LABELS: Record<AnonymousBodyType, string> = {
  S: '스트레이트',
  W: '웨이브',
  N: '내추럴',
};

/**
 * 익명 체형 템플릿 — 체형/자세 공유 시 실제 체형 사진 대체
 */
export function AnonymousBodyTemplate({
  bodyType = 'S',
  children,
}: AnonymousBodyTemplateProps): React.ReactElement {
  const silhouette = BODY_SILHOUETTES[bodyType];
  const label = BODY_TYPE_LABELS[bodyType];

  return (
    <div data-testid="anonymous-body-template" className="relative w-full max-w-[160px] mx-auto">
      <svg
        viewBox="0 0 200 400"
        className="w-full h-auto"
        role="img"
        aria-label={`익명 체형 일러스트 (${label}형)`}
      >
        {/* 머리 (단순 원) */}
        <circle cx="100" cy="30" r="22" fill="#D1D5DB" stroke="#9CA3AF" strokeWidth="1" />
        {/* 체형 실루엣 */}
        <path d={silhouette} fill="#D1D5DB" stroke="#9CA3AF" strokeWidth="0.8" fillRule="evenodd" />
      </svg>
      {/* 오버레이 콘텐츠 (스켈레톤/정렬선) */}
      {children && <div className="absolute inset-0 pointer-events-none">{children}</div>}
    </div>
  );
}
