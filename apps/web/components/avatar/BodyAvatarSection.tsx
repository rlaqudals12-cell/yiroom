'use client';

/**
 * 3D 체형 아바타 섹션 (AV-5) — dynamic import + 2D 폴백 + 직전 비교 토글
 *
 * three.js는 이 파일의 dynamic import 청크에만 존재 (초기 번들 영향 0).
 * 로딩 중/WebGL 실패/데이터 없음 = 기존 2D 실루엣(AnonymousBodyTemplate) 폴백 —
 * 동일 컨테이너 크기로 레이아웃 시프트 방지.
 *
 * @see docs/specs/SDD-BODY-AVATAR-3D.md §2.4
 */

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { Layers } from 'lucide-react';
import { AnonymousBodyTemplate } from '@/components/analysis/overlay/anonymous/AnonymousBodyTemplate';
import { deriveAvatarParams } from '@/lib/avatar';
import type { AvatarBodyType, BodyRowForAvatar } from '@/lib/avatar';
import { BODY_TYPE_SHORT_GLOSS } from '@/lib/mock/body-analysis';
import type { BodyType3 } from '@/lib/mock/body-analysis';

/** 아바타가 무엇을 표현하는지 정직하게 알리는 캡션 (실물 아님을 명시) */
const AVATAR_CAPTION = '내 비율로 만든 체형 실루엣이에요 (실제 모습이 아닌 비율 표현)';

const BodyAvatar3D = dynamic(() => import('./BodyAvatar3D'), {
  ssr: false,
  loading: () => null,
});

interface BodyAvatarSectionProps {
  /** 현재 분석 행 (아바타 입력) — null이면 2D 폴백 */
  row: BodyRowForAvatar | null;
  /** 직전 분석 행 — 있으면 "직전과 비교" 토글 노출 */
  previousRow?: BodyRowForAvatar | null;
  /** 체형 라벨 (예: "웨이브") */
  label?: string;
  /** 폴백 실루엣용 체형 타입 */
  bodyType: AvatarBodyType;
}

export function BodyAvatarSection({ row, previousRow, label, bodyType }: BodyAvatarSectionProps) {
  const [webglFailed, setWebglFailed] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  const params = useMemo(() => (row ? deriveAvatarParams(row) : null), [row]);
  const previousParams = useMemo(
    () => (previousRow ? deriveAvatarParams(previousRow) : null),
    [previousRow]
  );

  // 라벨 짧은 풀이 — "내추럴" 등 생소한 용어를 처음 보는 사용자용 (S/W/N만 정의)
  const gloss = BODY_TYPE_SHORT_GLOSS[bodyType as BodyType3];

  // 데이터 없음 / WebGL 실패 → 기존 2D 실루엣 (ADR-097 시각 언어 유지)
  if (!params || webglFailed) {
    return (
      <div data-testid="body-avatar-section" className="flex flex-col items-center gap-2">
        <AnonymousBodyTemplate bodyType={bodyType}>
          {label && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm font-semibold text-foreground bg-background/80 rounded-lg px-3 py-2">
                {gloss ? `${label} — ${gloss}` : label}
              </p>
            </div>
          )}
        </AnonymousBodyTemplate>
        <p className="text-[11px] text-muted-foreground text-center max-w-[240px]">
          {AVATAR_CAPTION}
        </p>
      </div>
    );
  }

  return (
    <div data-testid="body-avatar-section" className="flex flex-col items-center gap-2">
      {/* 2D 폴백(max-w-[160px], viewBox 1:2)과 유사한 세로 비율 — 레이아웃 시프트 최소화 */}
      <div className="relative w-full max-w-[220px] h-[300px]">
        <BodyAvatar3D
          params={params}
          previous={showCompare ? previousParams : null}
          onRenderFailed={() => setWebglFailed(true)}
        />
      </div>
      <div className="flex items-center gap-2">
        {label && (
          <p className="text-sm font-semibold text-foreground">
            {gloss ? `${label} — ${gloss}` : label}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground">드래그로 돌려보세요</p>
      </div>
      {/* 아바타가 무엇인지 정직하게 — 실물이 아닌 비율 표현 */}
      <p className="text-[11px] text-muted-foreground text-center max-w-[240px]">
        {AVATAR_CAPTION}
      </p>
      {/* 직전 분석이 있을 때만 비교 토글 — "숫자보다 변화" (원리 §1.5) */}
      {previousParams && (
        <button
          type="button"
          onClick={() => setShowCompare((v) => !v)}
          aria-pressed={showCompare}
          data-testid="body-avatar-compare-toggle"
          className={`flex items-center gap-1 text-xs rounded-full px-3 py-1.5 border transition-colors ${
            showCompare
              ? 'border-violet-400 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300'
              : 'border-border text-muted-foreground hover:border-violet-300'
          }`}
        >
          <Layers className="w-3 h-3" aria-hidden="true" />
          {showCompare ? '지난 분석의 실루엣이에요' : '지난 분석과 비교'}
        </button>
      )}
    </div>
  );
}
