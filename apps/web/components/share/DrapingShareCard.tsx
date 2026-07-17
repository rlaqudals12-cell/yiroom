'use client';

/* eslint-disable no-restricted-syntax --
   공유카드는 html-to-image로 캡처돼 PNG로 배포되는 산출물이다. 뷰어 테마와 무관하게
   항상 같은 색이어야 하므로 브랜드 색(블러시 크림·잉크·로즈)을 고정 hex로 둔다.
   (PersonaShareCard와 동일 관례) */

/**
 * 드레이핑 공유 카드 — 얼굴 포함 옵트인 카드 (7/15 배치 C, 문화·법 조사로 확정)
 *
 * 왜 별도 카드인가: 기존 PersonaShareCard(얼굴無)는 "전원 참여의 지속력"(MBTI형) 담당,
 * 이 카드는 "옵트인한 소수의 폭발력"(얼굴 드레이핑 = 퍼컬 바이럴 정본 형식) 담당.
 * 디폴트는 여전히 얼굴 없는 카드다 — 이 카드는 사용자가 명시적으로 선택했을 때만 렌더.
 *
 * 프라이버시 설계: 사진+드레이프는 **캔버스 픽셀에 구워짐**(캡처 우회 불가).
 * 모든 처리는 이 기기(브라우저)에서만 — 이 컴포넌트에는 fetch/업로드 코드가 없다(PR 체크포인트).
 * (눈가림 밴드는 7/16 문화 검증으로 제거 — 검은 밴드 = 성형·의료 검열 코드라 브랜드 부정합.
 *  얼굴을 가리고 싶은 유저의 답은 이 카드가 아니라 얼굴 없는 기본 카드다.)
 * 생성형 AI가 아닌 캔버스 합성이므로 AI 라벨 대상 아님(정직 표기는 섹션 고지가 담당).
 */

import { forwardRef, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { getConstrainedCanvasSize, createOptimizedContext } from '@/lib/analysis/canvas-utils';
import { applyDrapeColor } from '@/lib/analysis/drape-reflectance';
import type { PaletteColor } from '@/components/share/PersonaShareCard';

export interface DrapingShareCardProps {
  /** 로드 완료된 분석 사진 (섹션이 crossOrigin='anonymous'로 로드해 전달 — taint 방지) */
  img: HTMLImageElement;
  /** 드레이프로 합성할 색 (진단 베스트 중 선택) */
  drapeHex: string;
  /** 진단명(로케일 라벨) — 카드 라벨 */
  toneName?: string;
  /** 베스트 팔레트 — 하단 미니 밴드 */
  bestColors: PaletteColor[];
  /** 발급 번호(실제 세션 순번) — 정직한 희소성 */
  serialNo?: number | null;
  /** 초대 한 줄(로케일 값 주입) */
  inviteText?: string;
  className?: string;
}

// 캡처 화질 기준(스케일 3 캡처 감안)
const MAX_CANVAS = 720;

/** 사진 + 드레이프를 캔버스 픽셀에 굽는다 */
function drawCard(canvas: HTMLCanvasElement, img: HTMLImageElement, drapeHex: string): void {
  const { width, height } = getConstrainedCanvasSize(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    MAX_CANVAS
  );
  canvas.width = width;
  canvas.height = height;
  const ctx = createOptimizedContext(canvas, { willReadFrequently: true });
  if (!ctx) return;
  ctx.drawImage(img, 0, 0, width, height);
  applyDrapeColor(ctx, drapeHex, new Uint8Array(width * height), height);
}

/** 헥사곤-Y 브랜드 마크 (PersonaShareCard와 동일 인장) */
function HexagonY({ size, className }: { size: number; className?: string }): React.JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2l8.5 5v10L12 22 3.5 17V7z" />
      <path d="M9.2 9.4l2.8 2.6 2.8-2.6M12 12v3.4" />
    </svg>
  );
}

export const DrapingShareCard = forwardRef<HTMLDivElement, DrapingShareCardProps>(
  function DrapingShareCard(
    { img, drapeHex, toneName, bestColors, serialNo, inviteText, className },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const swatches = bestColors.slice(0, 6);
    const serial =
      typeof serialNo === 'number' && serialNo > 0
        ? `No.${String(serialNo).padStart(6, '0')}`
        : null;

    useEffect(() => {
      if (canvasRef.current) drawCard(canvasRef.current, img, drapeHex);
    }, [img, drapeHex]);

    return (
      <div
        ref={ref}
        className={cn(
          'w-[400px] shrink-0 overflow-hidden rounded-3xl bg-[#FBF3F1] shadow-xl',
          className
        )}
        data-testid="draping-share-card"
      >
        <div className="flex flex-col px-6 pb-5 pt-6 text-[#2B2320]">
          {/* 브랜드 로우 + 발급번호 */}
          <div className="flex items-baseline gap-2">
            <HexagonY size={16} className="self-center text-[#C56A84]" />
            <span className="font-serif text-[17px] tracking-tight">Yiroom</span>
            {toneName && (
              <span className="font-serif text-[13px] italic text-[#C56A84]">{toneName}</span>
            )}
            {serial && (
              <span
                className="ml-auto font-serif text-[12px] italic tabular-nums text-[#C56A84]"
                data-testid="draping-card-serial"
              >
                {serial}
              </span>
            )}
          </div>

          {/* 사진 캔버스 — 드레이프가 픽셀에 구워짐(캡처 우회 불가) */}
          <canvas
            ref={canvasRef}
            className="mt-4 w-full rounded-xl"
            data-testid="draping-card-canvas"
            aria-label={toneName ?? 'draping'}
          />

          {/* 베스트 팔레트 미니 밴드 */}
          {swatches.length > 0 && (
            <div className="-mx-6 mt-4 flex" data-testid="draping-card-palette">
              {swatches.map((c, i) => (
                <span
                  key={`${c.hex}-${i}`}
                  className="block h-3 flex-1"
                  style={{ backgroundColor: c.hex }}
                  aria-hidden="true"
                />
              ))}
            </div>
          )}

          {/* 서명 로우 — 초대 + 도메인 */}
          <div className="mt-4 flex items-center justify-end gap-1.5 text-[11.5px] text-[#8C7F78]">
            <HexagonY size={13} className="text-[#C56A84]" />
            {inviteText && <span>{inviteText}</span>}
            <span className="font-medium text-[#2B2320]">yiroom.app</span>
          </div>
        </div>
      </div>
    );
  }
);
