'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/** 카드에 표시되는 축 뱃지 (한국어 라벨만 — 영문 원값 금지, 성공 축만 전달) */
export interface PersonaBadge {
  label: string;
  value: string;
}

interface PersonaShareCardProps {
  /** 페르소나 한 줄 (예: "차분한 빛을 품은 사람") */
  oneLine: string;
  /** 성공한 축의 한국어 요약 뱃지 (실패 축은 호출부에서 제외 — 정직성) */
  badges: PersonaBadge[];
  /** PC 시즌(spring/summer/autumn/winter) — 카드 배경 팔레트 결정 */
  season?: string | null;
  className?: string;
}

// 시즌별 그라데이션 — 퍼스널컬러 결과가 곧 카드의 색 정체성이 되도록.
// 흰 텍스트 대비를 위해 중간 이상 명도의 진한 팔레트만 사용.
const SEASON_GRADIENT: Record<string, string> = {
  spring: 'from-orange-400 via-rose-400 to-pink-500',
  summer: 'from-sky-400 via-indigo-400 to-purple-500',
  autumn: 'from-amber-500 via-orange-600 to-rose-600',
  winter: 'from-blue-600 via-indigo-600 to-fuchsia-600',
};

// PC 축이 없거나 시즌 미상이면 브랜드 그라데이션 (기존 ShareCardTemplate personal-color와 동일 계열)
const DEFAULT_GRADIENT = 'from-pink-500 to-purple-600';

/**
 * 페르소나 공유 카드 — "뽐내기" 정서용 정체성 배지.
 *
 * 왜 사진이 없나: 생체정보(얼굴)는 공유 산출물에 절대 포함하지 않는다(BIPA/PIPA).
 * MBTI 카드처럼 텍스트+팔레트만으로 정체성을 표현해, 부담 없이 SNS에 올릴 수 있게 한다.
 * forwardRef: html-to-image 캡처 대상.
 */
export const PersonaShareCard = forwardRef<HTMLDivElement, PersonaShareCardProps>(
  function PersonaShareCard({ oneLine, badges, season, className }, ref) {
    const gradient = (season && SEASON_GRADIENT[season]) || DEFAULT_GRADIENT;

    return (
      <div
        ref={ref}
        className={cn(
          'w-[400px] shrink-0 overflow-hidden rounded-3xl bg-gradient-to-br shadow-xl',
          gradient,
          className
        )}
        data-testid="persona-share-card"
      >
        <div className="flex min-h-[500px] flex-col px-8 py-9 text-white">
          {/* 상단 브랜드 소제목 */}
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/80">
            Yiroom Identity
          </p>

          {/* 페르소나 한 줄 — 카드의 주인공 */}
          <h2
            className="mt-6 whitespace-pre-wrap break-keep text-[32px] font-bold leading-snug"
            data-testid="persona-share-oneline"
          >
            {oneLine}
          </h2>

          {/* 축 뱃지 — 성공한 축만, 한국어 라벨 */}
          {badges.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2" data-testid="persona-share-badges">
              {badges.map((b) => (
                <span
                  key={b.label}
                  className="rounded-full bg-white/20 px-3.5 py-1.5 text-[13px] font-medium backdrop-blur-sm"
                >
                  <span className="text-white/75">{b.label}</span>
                  <span className="ml-1.5 font-semibold">{b.value}</span>
                </span>
              ))}
            </div>
          )}

          {/* 하단 워터마크 — 카드가 돌아다닐 때 유입 경로가 된다 */}
          <div className="mt-auto pt-10">
            <p className="text-sm font-semibold">이룸</p>
            <p className="text-xs text-white/75">온전한 나를 찾는 여정 · yiroom.vercel.app</p>
          </div>
        </div>
      </div>
    );
  }
);
