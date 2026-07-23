'use client';

/* eslint-disable no-restricted-syntax --
   공유카드는 html-to-image로 캡처돼 PNG로 배포되는 산출물이다. 뷰어 라이트/다크 테마와
   무관하게 항상 같은 색이어야 하므로(테마 CSS 변수를 쓰면 다크 뷰어 캡처에서 카드가 깨짐)
   브랜드 색(블러시 크림·잉크·로즈)을 의도적으로 고정 hex로 둔다. 테마 적용 대상이 아니다. */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { PAPER_GRAIN_URI } from '@/components/share/paper-grain';

/** 카드에 표시되는 축 뱃지 (한국어 라벨만 — 영문 원값 금지, 성공 축만 전달) */
export interface PersonaBadge {
  label: string;
  value: string;
}

/** 퍼스널컬러 팔레트 색 하나 — 진단된 hex + (있으면) 색이름 */
export interface PaletteColor {
  hex: string;
  /** 색이름(예: "더스티 로즈"). 없으면 색블록만 렌더(지어내지 않음) */
  name?: string;
}

/** 카드 비율 — 'square'(1:1, 피드/저장) | 'story'(9:16, 인스타 스토리) */
export type PersonaCardFormat = 'square' | 'story';

/** 카드 마감 — 'matte'(기본) | 'foil'(포토카드 홀로 시머, 은은한 프리미엄 질감) */
export type PersonaCardFinish = 'matte' | 'foil';

interface PersonaShareCardProps {
  /** 페르소나 한 줄 은유(예: "차분한 빛을 품은 사람") — toneName이 있으면 서브카피로 강등 */
  oneLine: string;
  /**
   * 진단명(로케일 라벨, 예: "뮤티드 서머") — 카드의 시각적 1순위.
   * 왜: 퍼컬 문화의 자랑 포인트는 문장이 아니라 톤 라벨(2026-07-15 조사 — 자랑 위계 1위).
   * 없으면(퍼컬 실패) oneLine이 히어로 자리를 유지한다.
   */
  toneName?: string;
  /** 퍼컬 외 성공 축의 값(피부·체형·헤어) — 서명 로우. 퍼컬은 toneName이 담당(중복 금지) */
  badges: PersonaBadge[];
  /** 베스트 컬러 팔레트 — 카드의 주인공(진단된/톤 표준 색, 못 베끼는 자산) */
  palette?: PaletteColor[];
  /** 피해야 할 색 — 오프라인 진단의 재미·전문성 신호(작은 소밴드) */
  worstPalette?: PaletteColor[];
  /** 발급 번호(실제 세션 순번) — 정직한 희소성. 없으면 미표기 */
  serialNo?: number | null;
  /** 초대 한 줄(로케일 값 주입, 예: "너의 계절은?") — 카드=테스트 초대장 루프 */
  inviteText?: string;
  format?: PersonaCardFormat;
  finish?: PersonaCardFinish;
  className?: string;
}

// 포맷별 치수/여백 — story는 9:16이라 히어로·색밴드가 더 시원하게 숨 쉰다.
const FORMAT: Record<
  PersonaCardFormat,
  {
    width: string;
    minH: string;
    pad: string;
    hero: string;
    sub: string;
    bandMt: string;
    bandH: string;
    name: string;
  }
> = {
  square: {
    width: 'w-[400px]',
    minH: 'min-h-[420px]',
    pad: 'px-7 pt-7 pb-5',
    hero: 'mt-5 text-[30px]',
    sub: 'mt-2 text-[14px]',
    bandMt: 'mt-5',
    bandH: 'h-[64px]',
    name: 'pt-1.5 text-[9px]',
  },
  story: {
    width: 'w-[360px]',
    minH: 'min-h-[640px]',
    pad: 'px-7 pt-9 pb-7',
    hero: 'mt-8 text-[34px]',
    sub: 'mt-3 text-[15px]',
    // mt-auto: 9:16의 잉여 세로 공간을 푸터 mt-auto와 반씩 나눠 히어로 상단/팔레트 중하단의
    // 포스터 3단 구도로 — 고정 mt-9는 하단 1/3이 통공백으로 남아 미완성으로 읽혔다(시각 감사 7/23)
    bandMt: 'mt-auto pt-9',
    bandH: 'h-[112px]',
    name: 'pt-2 text-[10px]',
  },
};

/** 헥사곤-Y 브랜드 마크 (인장) */
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

/**
 * 페르소나 공유 카드 V2 — "뽐내기" 정체성 포토카드 (E+ 에디토리얼, 2026-07-15 확정).
 *
 * 디자인 원칙(→ memory design-taste-moat): 장식 그라데이션·반짝이·글래스 = 0.
 * 위계 = ①진단명(자랑 라벨) ②은유 서브카피 ③베스트 팔레트(주인공) ④피해야 할 색(재미)
 * ⑤서명·발급번호·초대(바이럴 루프). 블러시 크림 + 로즈 포인트 1색 = 여성 우선 뷰티 미감.
 *
 * 왜 사진이 없나: 생체정보(얼굴)는 공유 산출물에 절대 포함하지 않는다(BIPA/PIPA).
 * forwardRef: html-to-image 캡처 대상. backdrop-filter는 캡처 미지원이라 금지.
 */
export const PersonaShareCard = forwardRef<HTMLDivElement, PersonaShareCardProps>(
  function PersonaShareCard(
    {
      oneLine,
      toneName,
      badges,
      palette = [],
      worstPalette = [],
      serialNo,
      inviteText,
      format = 'square',
      finish = 'matte',
      className,
    },
    ref
  ) {
    const fmt = FORMAT[format];
    const swatches = palette.slice(0, 6);
    const worst = worstPalette.slice(0, 4);
    // 이름은 전부 있을 때만 렌더 → 일부만 있으면 컬럼 높이가 들쭉날쭉해지므로 통일(정렬 유지)
    const showNames = swatches.length > 0 && swatches.every((c) => !!c.name);
    const facets = badges
      .map((b) => b.value)
      .filter(Boolean)
      .join(' · ');
    // 발급 번호 — 실제 순번만 표기(정직한 희소성). 6자리 패딩 = 한정판 인쇄 넘버 감성
    const serial =
      typeof serialNo === 'number' && serialNo > 0
        ? `No.${String(serialNo).padStart(6, '0')}`
        : null;

    return (
      <div
        ref={ref}
        className={cn(
          'relative shrink-0 overflow-hidden rounded-3xl bg-[#FBF3F1] shadow-xl',
          fmt.width,
          className
        )}
        data-testid="persona-share-card"
        data-format={format}
        data-finish={finish}
      >
        {/* 종이 질감 — 인쇄물 소유감. 캡처 PNG에도 구워짐(인라인 SVG, 외부 요청 0) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: PAPER_GRAIN_URI }}
        />

        {/* 포토카드 홀로 시머(선택) — 대각 시어 하이라이트, 저채도·저불투명으로 절제.
            blur/backdrop-filter 미사용(캡처 안전). 정지 이미지에서도 포일 인쇄 질감으로 읽힘 */}
        {finish === 'foil' && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(115deg, transparent 18%, rgba(255,255,255,0.5) 30%, rgba(244,214,222,0.35) 38%, transparent 50%),' +
                'linear-gradient(295deg, transparent 55%, rgba(226,214,244,0.28) 70%, transparent 85%)',
            }}
          />
        )}

        <div className={cn('relative flex flex-col text-[#2B2320]', fmt.minH, fmt.pad)}>
          {/* 브랜드 로우 — 헥사곤-Y 인장 + 워드마크 + 우상단 발급번호(한정판 인쇄 넘버) */}
          <div className="flex items-baseline gap-2">
            <HexagonY size={16} className="self-center text-[#C56A84]" />
            <span className="font-serif text-[17px] tracking-tight">Yiroom</span>
            {serial && (
              // 레터프레스 압인 — 크림 지면 아래 1px 밝은 섀도(활판 눌림의 하단 모서리 빛)
              <span
                className="ml-auto font-serif text-[12.5px] italic tabular-nums text-[#C56A84] [text-shadow:0_1px_0_rgba(255,255,255,0.55)]"
                data-testid="persona-share-serial"
              >
                {serial}
              </span>
            )}
          </div>

          {/* 퍼컬 실패(팔레트 無) 시 히어로를 광학 중앙으로 — 상단 붙박이 + 하단 통공백이
              '깨진 렌더'로 읽히는 것을 막는다. 푸터 mt-auto와 잉여 공간을 균등 분배 */}
          {swatches.length === 0 && <div aria-hidden="true" className="mt-auto" />}

          {/* 진단명 히어로 — 자랑의 본체. 퍼컬 실패 시 은유가 히어로 자리를 지킨다 */}
          <h2
            className={cn(
              'whitespace-pre-wrap break-keep font-bold leading-[1.25] tracking-tight [text-shadow:0_1px_0_rgba(255,255,255,0.45)]',
              fmt.hero
            )}
            data-testid="persona-share-hero"
          >
            {toneName ?? oneLine}
          </h2>

          {/* 은유 서브카피 — 이룸 차별화(업계 표준 아님 → 라벨을 대체하지 않게 서브로) */}
          {toneName && (
            <p
              className={cn(
                'whitespace-pre-wrap break-keep leading-[1.55] text-[#8C7F78]',
                fmt.sub
              )}
              data-testid="persona-share-oneline"
            >
              {oneLine}
            </p>
          )}

          {/* 베스트 팔레트 — 카드의 주인공. 전면 밴드 + (있으면) 색이름 */}
          {swatches.length > 0 && (
            <div className={fmt.bandMt}>
              <p className="font-serif text-[11px] italic text-[#B6A9A1]">Best colors</p>
              <div className="-mx-7 mt-2 flex" data-testid="persona-share-swatches">
                {swatches.map((c, i) => (
                  <div key={`${c.hex}-${i}`} className="flex flex-1 flex-col">
                    <span
                      className={cn('block w-full', fmt.bandH)}
                      style={{ backgroundColor: c.hex }}
                      aria-hidden="true"
                    />
                    {showNames && (
                      // break-keep: '브라이트 에메랄드'류 긴 이름이 음절 중간("…에메랄"+"드")이 아닌
                      // 어절 단위로 꺾이게 — 히어로·서브카피와 동일한 타이포 표준
                      <span
                        className={cn(
                          'block break-keep text-center leading-tight tracking-tight text-[#8C7F78]',
                          fmt.name
                        )}
                      >
                        {c.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 피해야 할 색 — 오프라인 진단의 재미 포인트(작게, 병치 대비) */}
          {worst.length > 0 && (
            <div className="mt-4 flex items-center gap-2.5" data-testid="persona-share-worst">
              <span className="font-serif text-[11px] italic text-[#B6A9A1]">Avoid</span>
              <span className="flex gap-1.5">
                {worst.map((c, i) => (
                  <span
                    key={`${c.hex}-${i}`}
                    className="h-4 w-6 rounded-[4px]"
                    // 취소선 오버레이 — 진단지 리포트와 동일한 부정 표기(색 hex는 정직 유지).
                    // 이탤릭 'Avoid' 라벨만으로는 축소 썸네일에서 추천색으로 오독된다
                    style={{
                      backgroundColor: c.hex,
                      backgroundImage:
                        'linear-gradient(135deg, transparent 46%, rgba(43,35,32,0.5) 46%, rgba(43,35,32,0.5) 54%, transparent 54%)',
                    }}
                    aria-hidden="true"
                  />
                ))}
              </span>
            </div>
          )}

          {/* 서명 로우 — 성공 축 값(정직성) + 초대 한 줄(카드=테스트 초대장) + 도메인 */}
          <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-[11.5px] text-[#8C7F78]">
            {facets ? <span className="truncate">{facets}</span> : <span />}
            <span className="flex shrink-0 items-center gap-1.5">
              <HexagonY size={13} className="text-[#C56A84]" />
              {inviteText && <span data-testid="persona-share-invite">{inviteText}</span>}
              <span className="font-medium text-[#2B2320]">yiroom.app</span>
            </span>
          </div>
        </div>
      </div>
    );
  }
);
