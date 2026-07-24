'use client';

/* eslint-disable no-restricted-syntax --
   공유카드는 html-to-image로 캡처돼 PNG로 배포되는 산출물이다. 뷰어 라이트/다크 테마와
   무관하게 항상 같은 색이어야 하므로 브랜드 색(블러시 크림·잉크·로즈)을 의도적으로
   고정 hex로 둔다 (PersonaShareCard와 동일 관례). */

import { forwardRef, useEffect, useRef } from 'react';
import {
  Leaf,
  Palette,
  Droplets,
  Sun,
  Blend,
  Contrast,
  Droplet,
  PersonStanding,
  Smile,
  Brush,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getConstrainedCanvasSize, createOptimizedContext } from '@/lib/analysis/canvas-utils';
import { applyDrapeColor } from '@/lib/analysis/drape-reflectance';
import { PAPER_GRAIN_URI } from '@/components/share/paper-grain';
import { TextureSwatch, type TextureKind } from '@/components/share/TextureSwatch';
import type { PaletteColor } from '@/components/share/PersonaShareCard';

/** 행 아이콘 키 — 라벨 문자열(로케일)이 아닌 의미 키로 아이콘을 고정한다 */
export type ReportIconKey =
  | 'season'
  | 'tone'
  | 'undertone'
  | 'brightness'
  | 'saturation'
  | 'contrast'
  | 'skin'
  | 'body'
  | 'face'
  | 'makeup';

// 라인아트 아이콘 앵커(정보 행 전용, muted 1색) — 장식 아이콘(Sparkles류)과 구분되는 기능 레이어
const ROW_ICONS: Record<ReportIconKey, LucideIcon> = {
  season: Leaf,
  tone: Palette,
  undertone: Droplets,
  brightness: Sun,
  saturation: Blend,
  contrast: Contrast,
  skin: Droplet,
  body: PersonStanding,
  face: Smile,
  makeup: Brush,
};

/** 리포트 표의 한 행 — 라벨·값 모두 로케일 완료 문자열만 (원시 영문값 금지) */
export interface ReportRow {
  label: string;
  value: string;
  /**
   * 스펙트럼 위 위치(0~1) — 파생 범주값(밝은 편·부드러운 편·낮음 등)의 시각화.
   * 숫자를 표기하지 않아 가짜 정밀도를 만들지 않는다(시뮬: "관공서 문서" 탈피 요청).
   */
  spectrumPos?: number;
  /** 라인아트 아이콘 앵커(패널: 정보 행의 시각적 사건) */
  iconKey?: ReportIconKey;
}

/** 추천 스타일 칩 — fit(어울림 0~100, 저장된 suitability)이 있으면 도트로 표시 */
export interface ReportStyleChip {
  name: string;
  fit?: number;
}

/** 개선 포인트 한 항목 (composeActionPlan 산출) */
export interface ReportAction {
  title: string;
  why: string;
}

/** 컬러·프로필 서브그룹 라벨(로케일 완료) — 섹션 아이브로우(영문 세리프)와 별개인 정보 레이어 */
export interface ReportGroupLabels {
  best: string;
  accent: string;
  metal: string;
  avoid: string;
  styles: string;
  care: string;
  /** 그룹 용도 부제(선택) — "그래서 어디에 쓰나"(시뮬: 색→용도 연결 요청). 그룹 정의 자체가 용도라 정직 */
  bestUse?: string;
  accentUse?: string;
  /** 사진 드레이핑 캡션 라벨(선택, 예: "드레이핑") */
  draping?: string;
}

interface PersonaReportCardProps {
  /** 페르소나 한 줄 은유 — toneName이 있으면 서브카피 */
  oneLine: string;
  /** 진단명(로케일 라벨) — 히어로. 퍼컬 실패 시 undefined(은유가 히어로) */
  toneName?: string;
  /**
   * 퍼스널컬러 속성표(계절·톤·언더톤·명도·채도·대비) — 점수의 자리를 대체하는
   * 신뢰 장치 #1. 실데이터 행만 전달된다(지어내지 않음) — 비면 섹션 생략.
   */
  attrs: ReportRow[];
  /** 옵트인한 분석 사진(로드 완료, crossOrigin='anonymous') — 캔버스 픽셀에 구워짐 */
  photoImg?: HTMLImageElement | null;
  /** "분석 한눈에 보기" — persona.keyInsights (실데이터, 목업의 체크리스트 대응) */
  checklist?: string[];
  /** 베스트 컬러 팔레트 */
  palette?: PaletteColor[];
  /** 포인트 컬러(립·네일·강조) — 톤 표준 큐레이션 */
  accents?: PaletteColor[];
  /** 액세서리 금속(웜=골드계/쿨=실버계 관습 파생) */
  metals?: PaletteColor[];
  /** 피하면 좋은 색 */
  worstPalette?: PaletteColor[];
  /** 축 요약 행(피부·체형·헤어·메이크업, 성공 축만) — 2열 미니 카드로 렌더 */
  axisRows: ReportRow[];
  /** 피부 관리 포인트(저장된 관심사) — 그리드의 4번째 카드로 합류 */
  skinNote?: string;
  /** 추천 헤어 스타일(고정 어휘 71종 + 저장된 어울림 fit) — 없으면 생략 */
  hairStyles?: ReportStyleChip[];
  /** 계절 인장(예: "여름 쿨톤") — 점수 없는 타입 확정 스탬프. 리포트당 1개 절제(패널 합의) */
  sealText?: string;
  /** 피하면 좋은 색의 "왜" 한 줄(12톤 정의 파생) — 컨설턴트: "손님은 '왜 피해요?'가 궁금하다" */
  avoidNote?: string;
  /** 개선 포인트(결정론 액션 플랜, 최대 3) */
  actionItems?: ReportAction[];
  /** 전속 뷰티팀 총평(persona.narrative) — 손글씨 대신 세리프 이탤릭 */
  note?: string;
  /** "분석 신뢰도 87%" — 진단의 점수(사람의 점수 아님). 퍼컬 실측 성공 시에만 */
  confidenceText?: string;
  /** 신뢰도 근거 한 줄(시뮬: 근거 없는 숫자는 낚시로 보임) — confidenceText 있을 때만 렌더 */
  confidenceHintText?: string;
  /** 재현성 한 줄 — 진단서의 직인 */
  reproducibilityText: string;
  /** 재현성 짧은 배지(헤더 승격용, 예: "재현성 검증") — 시뮬 지적: 최강 자산이 각주에 묻혀 있었음 */
  reproBadgeText?: string;
  /** 발급일(로케일 포맷 완료) */
  dateText: string;
  /** 서브그룹 라벨(로케일 완료) */
  groupLabels: ReportGroupLabels;
  /** 발급 번호(실제 세션 순번) */
  serialNo?: number | null;
  /** 초대 한 줄(로케일 값) */
  inviteText?: string;
  className?: string;
}

// 사진 캔버스 상한 — scale 2.5 캡처 감안(150px 표시폭 × 2.5 = 375px, 여유 포함)
const PHOTO_MAX = 560;

/**
 * 옵트인 사진 + 베스트 색 드레이프를 캔버스 픽셀에 굽는다 (캡처 안전).
 * 왜 드레이프: 시뮬 판정 "목업은 사진이 분석에 참여하는데 이룸 사진은 장식" —
 * 격자·부위 점수(얼평) 대신 이룸의 답은 드레이핑(내 얼굴 + 내 진단 색). zero-mask 트릭 재사용.
 */
function drawPhoto(canvas: HTMLCanvasElement, img: HTMLImageElement, drapeHex?: string): void {
  const { width, height } = getConstrainedCanvasSize(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    PHOTO_MAX
  );
  canvas.width = width;
  canvas.height = height;
  const ctx = createOptimizedContext(canvas, { willReadFrequently: true });
  if (!ctx) return;
  ctx.drawImage(img, 0, 0, width, height);
  if (drapeHex) applyDrapeColor(ctx, drapeHex, new Uint8Array(width * height), height);
}

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

/** 서브그룹 라벨 — 세리프 이탤릭 1종 통일(대문자 자간 라벨 반복 = 슬롭 신호라 금지) */
function Eyebrow({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <p className="font-serif text-[11.5px] italic text-[#B6A9A1]">{children}</p>;
}

/** 행 아이콘 렌더 — muted 1색·얇은 획(기능 레이어) */
function RowIcon({ iconKey }: { iconKey: ReportIconKey }): React.JSX.Element {
  const Icon = ROW_ICONS[iconKey];
  return (
    <Icon size={12} strokeWidth={1.75} className="shrink-0 text-[#C9B8B1]" aria-hidden="true" />
  );
}

/**
 * 섹션 헤더 미니 썸네일 — 옵트인 사진의 다회 등장(패널: "페이지마다 내 얼굴 = 내 진단서 몰입").
 * 얼굴 검출 없이 상단 중심 정사각 관습 크롭(셀피는 통상 얼굴이 상단부).
 */
function MiniThumb({ img }: { img: HTMLImageElement }): React.JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const out = 96; // 2.5x 캡처 감안 해상도
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const s = Math.min(w, h);
    ctx.drawImage(img, (w - s) / 2, Math.max(0, (h - s) * 0.25), s, s, 0, 0, out, out);
  }, [img]);
  return (
    <canvas
      ref={ref}
      className="ml-auto h-6 w-6 shrink-0 self-center rounded-full"
      data-testid="report-mini-thumb"
      aria-hidden="true"
    />
  );
}

/** 어울림 도트(●●●○) — 저장된 fit(0~100)의 순서형 표시. 사람 점수화 아님(스타일별 적합도) */
function FitDots({ fit }: { fit: number }): React.JSX.Element {
  const filled = Math.min(4, Math.max(1, Math.round(fit / 25)));
  return (
    <span
      className="ml-1 flex items-center gap-[3px]"
      aria-hidden="true"
      data-testid="report-fit-dots"
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            'h-[5px] w-[5px] rounded-full',
            i < filled ? 'bg-[#C56A84]' : 'bg-[#EAD9D4]'
          )}
        />
      ))}
    </span>
  );
}

/** 스펙트럼 미니 바 — 범주값의 위치만 점으로(눈금·숫자 없음 = 가짜 정밀도 금지) */
function SpectrumBar({ pos }: { pos: number }): React.JSX.Element {
  const clamped = Math.min(1, Math.max(0, pos));
  return (
    <span
      className="relative ml-auto mr-2.5 h-[3px] w-16 shrink-0 self-center rounded-full bg-[#EAD9D4]"
      data-testid="report-spectrum"
      aria-hidden="true"
    >
      <span
        className="absolute top-1/2 h-[9px] w-[9px] -translate-y-1/2 rounded-full border-2 border-[#FBF3F1] bg-[#C56A84]"
        style={{ left: `calc(${clamped * 100}% - 4.5px)` }}
      />
    </span>
  );
}

/** 라벨-값 표 — 진단지의 뼈대. 헤어라인 디바이더로만 구획(차트·등급 없음).
    행 압축(py 7→5px)·디바이더 연화 = 패널 4인 "표는 조밀, 섹션은 여유" 리듬 */
function RowTable({ rows, testId }: { rows: ReportRow[]; testId: string }): React.JSX.Element {
  return (
    <dl className="divide-y divide-[#F3E7E2]" data-testid={testId}>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-1.5 py-[5px]">
          {r.iconKey && <RowIcon iconKey={r.iconKey} />}
          <dt className="shrink-0 text-[12px] text-[#8C7F78]">{r.label}</dt>
          {typeof r.spectrumPos === 'number' && <SpectrumBar pos={r.spectrumPos} />}
          <dd
            className={cn(
              'text-right text-[13px] font-medium leading-snug tabular-nums',
              // min-w: 값 글자폭이 스펙트럼 바 트랙 위치를 끌고 다니지 않게 공통 컬럼 고정
              // (4언어 최장값 '부드러운 편' ≈68px 수용 — 바 w-16 축소와 세트, 사진 병치 252px 안전)
              typeof r.spectrumPos === 'number' ? 'min-w-[72px] shrink-0' : 'ml-auto'
            )}
          >
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** 소형 스와치 행(포인트·금속) — 색칩 + 이름. texture 지정 시 화장품 발색 질감으로 렌더 */
function SwatchChips({
  colors,
  testId,
  texture,
}: {
  colors: PaletteColor[];
  testId: string;
  texture?: TextureKind;
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5" data-testid={testId}>
      {colors.map((c, i) => (
        <span key={`${c.hex}-${i}`} className="flex items-center gap-1.5">
          {texture ? (
            <TextureSwatch hex={c.hex} kind={texture} width={40} className="shrink-0" />
          ) : (
            <span
              className="h-4 w-4 rounded-full border border-[#0000000f]"
              style={{ backgroundColor: c.hex }}
              aria-hidden="true"
            />
          )}
          {c.name && <span className="text-[11px] text-[#5C5049]">{c.name}</span>}
        </span>
      ))}
    </div>
  );
}

/** 번호 섹션 골격 — 목업의 넘버링 구조(01·02·…). 데이터 있는 섹션만 번호를 다시 매긴다 */
interface ReportSection {
  eyebrow: string;
  body: React.ReactNode;
  /** 헤더 우측에 옵트인 사진 미니 썸네일(사진의 다회 등장 — 몰입 장치) */
  thumb?: boolean;
}

/**
 * 정체성 리포트 카드 v2 — 목업 밀도의 "진단지 한 장" (2026-07-16).
 *
 * 틀은 한국 퍼컬 진단지/GPT 목업 레이아웃을 본뜨되 데이터는 전부 이룸 실분석 —
 * 목업의 채점표 레이어(종합점수·매력도·레이더·부위별 점수)는 채택하지 않는다
 * (외모 점수화 금지 + 해당 계측 데이터 없음 = 넣으면 지어내기).
 * 점수의 자리 = 속성표 + 체크리스트 + 세분화 팔레트 + 신뢰도 + 재현성.
 *
 * 사진은 옵트인(기본 무사진)이며 캔버스 픽셀에 구워진다(기기 내 처리·서버 미저장).
 * 캡처 규약(PersonaShareCard 승계): 고정 hex·img 태그 0·backdrop-filter/blur 금지.
 * 세로가 길어 캡처 scale 2.5(장변 4096px 이하 안전권 — 섹션에서 지정).
 */
export const PersonaReportCard = forwardRef<HTMLDivElement, PersonaReportCardProps>(
  function PersonaReportCard(
    {
      oneLine,
      toneName,
      attrs,
      photoImg,
      checklist = [],
      palette = [],
      accents = [],
      metals = [],
      worstPalette = [],
      axisRows,
      skinNote,
      hairStyles = [],
      sealText,
      avoidNote,
      actionItems = [],
      note,
      confidenceText,
      confidenceHintText,
      reproducibilityText,
      reproBadgeText,
      dateText,
      groupLabels,
      serialNo,
      inviteText,
      className,
    },
    ref
  ) {
    const photoRef = useRef<HTMLCanvasElement>(null);
    const swatches = palette.slice(0, 6);
    const worst = worstPalette.slice(0, 4);
    const checks = checklist.slice(0, 4);
    const actions = actionItems.slice(0, 3);
    const styles = hairStyles.slice(0, 3);
    const serial =
      typeof serialNo === 'number' && serialNo > 0
        ? `No.${String(serialNo).padStart(6, '0')}`
        : null;

    // 드레이프 색 = 베스트 1번 — 사진이 "내 진단 색을 입은 나"가 되게 한다
    const drapeColor = palette.length > 0 ? palette[0] : undefined;

    useEffect(() => {
      if (photoImg && photoRef.current) drawPhoto(photoRef.current, photoImg, drapeColor?.hex);
    }, [photoImg, drapeColor?.hex]);

    // 데이터가 있는 섹션만 조립 — 번호는 렌더 시점에 매겨 빈 섹션 결번을 막는다
    const sections: ReportSection[] = [];

    if (attrs.length > 0 || photoImg) {
      sections.push({
        eyebrow: 'Personal Color',
        body: (
          <div className="flex items-start gap-4">
            {photoImg && (
              <div className="w-[148px] shrink-0">
                <canvas
                  ref={photoRef}
                  className="w-full rounded-xl"
                  data-testid="report-photo"
                  aria-label={toneName ?? 'photo'}
                />
                {/* 드레이핑 캡션 — 사진이 장식이 아니라 분석(드레이프)임을 명시 */}
                {drapeColor && groupLabels.draping && (
                  <p
                    className="mt-1 flex items-center gap-1.5 text-[10px] text-[#8C7F78]"
                    data-testid="report-photo-caption"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: drapeColor.hex }}
                      aria-hidden="true"
                    />
                    {groupLabels.draping}
                    {drapeColor.name ? ` · ${drapeColor.name}` : ''}
                  </p>
                )}
              </div>
            )}
            {attrs.length > 0 && (
              // 사진 병치 시 표 첫 행 상단 패딩만큼 당겨 사진 상단과 baseline 정렬(에디토리얼 패널)
              <div className={cn('min-w-0 flex-1', photoImg && '-mt-[5px]')}>
                <RowTable rows={attrs} testId="report-attrs" />
              </div>
            )}
          </div>
        ),
      });
    }

    if (checks.length > 0) {
      sections.push({
        eyebrow: 'At a glance',
        thumb: true,
        body: (
          <ul className="space-y-1.5" data-testid="report-checklist">
            {checks.map((line) => (
              <li key={line} className="flex items-start gap-2 text-[12.5px] leading-[1.55]">
                <svg
                  width={13}
                  height={13}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#C56A84"
                  strokeWidth={2.5}
                  className="mt-[3px] shrink-0"
                  aria-hidden="true"
                >
                  <path d="M4 12.5l5 5L20 6.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="break-keep text-[#5C5049]">{line}</span>
              </li>
            ))}
          </ul>
        ),
      });
    }

    if (swatches.length > 0) {
      sections.push({
        eyebrow: 'Color palette',
        body: (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-medium text-[#8C7F78]">
                {groupLabels.best}
                {groupLabels.bestUse && (
                  <span className="ml-1.5 font-normal text-[#9A8C86]">{groupLabels.bestUse}</span>
                )}
              </p>
              <div className="mt-1.5 grid grid-cols-3 gap-2.5" data-testid="report-swatches">
                {swatches.map((c, i) => (
                  <div key={`${c.hex}-${i}`} className="flex flex-col">
                    <span
                      className="block h-11 w-full rounded-lg"
                      style={{ backgroundColor: c.hex }}
                      aria-hidden="true"
                    />
                    {c.name && (
                      <span className="pt-[3px] text-[10px] leading-tight tracking-tight text-[#5C5049]">
                        {c.name}
                      </span>
                    )}
                    {/* hex = 캡션 급수(이름보다 한 단계 아래) — 이름과 붙여 한 덩어리로 */}
                    <span className="text-[8.5px] uppercase tabular-nums tracking-wide text-[#C4B8B1]">
                      {c.hex}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {accents.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-[#8C7F78]">
                  {groupLabels.accent}
                  {groupLabels.accentUse && (
                    <span className="ml-1.5 font-normal text-[#9A8C86]">
                      {groupLabels.accentUse}
                    </span>
                  )}
                </p>
                <div className="mt-1.5">
                  {/* 포인트=립·네일 사용처 → 립 발색 질감(캡처 안전 — 인라인 SVG) */}
                  <SwatchChips colors={accents.slice(0, 3)} testId="report-accents" texture="lip" />
                </div>
              </div>
            )}
            {metals.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-[#8C7F78]">{groupLabels.metal}</p>
                <div className="mt-1.5">
                  <SwatchChips colors={metals.slice(0, 2)} testId="report-metals" />
                </div>
              </div>
            )}
            {worst.length > 0 && (
              <div data-testid="report-worst">
                <div className="flex items-center gap-2.5">
                  <p className="text-[11px] font-medium text-[#8C7F78]">{groupLabels.avoid}</p>
                  <span className="flex gap-1.5">
                    {worst.map((c, i) => (
                      <span
                        key={`${c.hex}-${i}`}
                        className="h-3.5 w-5 rounded-[4px]"
                        // 취소선 오버레이(얇게) — 색은 정직 유지, 존재감은 크기로 억제
                        // (패널 5인 만장일치: 칩 축소+선 연화. 채도 조작 대신 팔레트 원본을 원단색으로 재큐레이션)
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
                {/* "왜 피해요?" 한 줄 — 12톤 정의 파생(컨설턴트: 이유 없는 금지는 신뢰를 못 만든다) */}
                {avoidNote && (
                  <p
                    className="mt-1 text-[10.5px] leading-snug text-[#9A8C86]"
                    data-testid="report-avoid-note"
                  >
                    {avoidNote}
                  </p>
                )}
              </div>
            )}
          </div>
        ),
      });
    }

    if (axisRows.length > 0 || skinNote || styles.length > 0) {
      // 관리 포인트를 4번째 카드로 합류 — 2×2 그리드 완성(패널: "세로 리스트 → 매거진 카드")
      const profileCards: ReportRow[] = [
        ...axisRows,
        ...(skinNote
          ? [{ label: groupLabels.care, value: skinNote, iconKey: 'skin' as const }]
          : []),
      ];
      sections.push({
        eyebrow: 'Beauty profile',
        thumb: true,
        body: (
          <div>
            {profileCards.length > 0 && (
              <div className="grid grid-cols-2 gap-2.5" data-testid="report-axes">
                {profileCards.map((r) => (
                  <div
                    key={r.label}
                    className="rounded-xl border border-[#F5EAE5] bg-[#FDFAF8] px-3 py-2.5"
                  >
                    <p className="flex items-center gap-1.5 text-[10.5px] text-[#8C7F78]">
                      {r.iconKey && <RowIcon iconKey={r.iconKey} />}
                      {r.label}
                    </p>
                    <p className="mt-0.5 break-keep text-[12.5px] font-medium leading-snug">
                      {r.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {styles.length > 0 && (
              <div
                className="mt-2.5 flex flex-wrap items-center gap-1.5"
                data-testid="report-hair-styles"
              >
                <span className="text-[11.5px] font-medium text-[#5C5049]">
                  {groupLabels.styles}
                </span>
                {styles.map((s) => (
                  <span
                    key={s.name}
                    className="flex items-center rounded-full border border-[#EAD9D4] px-2.5 py-0.5 text-[11px] text-[#5C5049]"
                  >
                    {s.name}
                    {typeof s.fit === 'number' && <FitDots fit={s.fit} />}
                  </span>
                ))}
              </div>
            )}
          </div>
        ),
      });
    }

    if (actions.length > 0) {
      sections.push({
        eyebrow: 'Action plan',
        body: (
          <ol className="space-y-2" data-testid="report-actions">
            {actions.map((a, i) => (
              <li
                key={a.title}
                className="flex items-start gap-2.5 rounded-xl border border-[#F5EAE5] bg-[#FDFAF8] px-3.5 py-2.5"
              >
                {/* 액션 번호는 섹션 번호(로즈)보다 낮은 회조 — 러닝 넘버 시스템은 하나여야 함(에디토리얼 패널) */}
                <span className="mt-[1px] shrink-0 font-serif text-[12px] italic tabular-nums text-[#B6A9A1]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0">
                  <span className="block break-keep text-[12.5px] font-medium leading-snug">
                    {a.title}
                  </span>
                  <span className="block break-keep text-[11px] leading-[1.5] text-[#8C7F78]">
                    {a.why}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        ),
      });
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative w-[480px] shrink-0 overflow-hidden rounded-3xl bg-[#FBF3F1] shadow-xl',
          className
        )}
        data-testid="persona-report-card"
      >
        {/* 종이 질감 — 인쇄물 소유감(패널 판정 마지막 갭). 캡처 PNG에도 구워짐 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: PAPER_GRAIN_URI }}
        />
        <div className="relative flex flex-col px-8 pb-6 pt-7 text-[#2B2320]">
          {/* 브랜드 로우 — 인장 + 워드마크 + 발급번호, 아래에 발급일 */}
          <div className="flex items-baseline gap-2">
            <HexagonY size={16} className="self-center text-[#C56A84]" />
            <span className="font-serif text-[17px] tracking-tight">Yiroom</span>
            <span className="font-serif text-[13px] italic text-[#B6A9A1]">Identity Report</span>
            {serial && (
              // 레터프레스 압인 — 발급번호는 진단서의 인장(공유카드와 동일 처리)
              <span
                className="ml-auto font-serif text-[12.5px] italic tabular-nums text-[#C56A84] [text-shadow:0_1px_0_rgba(255,255,255,0.55)]"
                data-testid="report-serial"
              >
                {serial}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-[10.5px] tabular-nums text-[#B6A9A1]">{dateText}</p>
            {reproBadgeText && (
              <span
                className="rounded-full border border-[#EAD9D4] px-2 py-[1px] text-[9.5px] font-medium text-[#C56A84]"
                data-testid="report-repro-badge"
              >
                {reproBadgeText}
              </span>
            )}
          </div>

          {/* 히어로 — 진단명(자랑 라벨) + 은유 서브카피 + 계절 인장(점수 없는 타입 확정 스탬프) */}
          <div className="mt-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2
                className="whitespace-pre-wrap break-keep font-serif text-[27px] font-semibold leading-[1.25] tracking-tight [text-shadow:0_1px_0_rgba(255,255,255,0.45)]"
                data-testid="report-hero"
              >
                {toneName ?? oneLine}
              </h2>
              {toneName && (
                <p className="mt-1.5 whitespace-pre-wrap break-keep text-[13px] leading-[1.55] text-[#8C7F78]">
                  {oneLine}
                </p>
              )}
            </div>
            {sealText && (
              <div
                className="mt-1 flex h-[58px] w-[58px] shrink-0 rotate-3 items-center justify-center rounded-full border-[1.5px] border-[#C56A84]/60"
                data-testid="report-seal"
              >
                <span className="break-keep px-1.5 text-center font-serif text-[10.5px] italic leading-[1.3] text-[#C56A84]">
                  {sealText}
                </span>
              </div>
            )}
          </div>

          {/* 히어로 팔레트 스트립 — 풀블리드 색 필드(실제 톤카드 상단 띠 관습 — 컨설턴트 검증으로
              풀블리드·하드엣지 유지 확정). 아래 헤어라인 1px = "띠"가 아니라 "판"으로 지면에 앉힘 */}
          {swatches.length > 0 && (
            <div
              className="-mx-8 mt-4 flex border-b border-[#EFDDD8]"
              data-testid="report-hero-strip"
              aria-hidden="true"
            >
              {swatches.map((c, i) => (
                <span
                  key={`${c.hex}-${i}`}
                  className="block h-10 flex-1"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          )}

          {/* 번호 섹션들 — 데이터 있는 것만, 번호 자동 재부여 */}
          {sections.map((s, i) => (
            <div key={s.eyebrow} className="mt-6">
              <div className="flex items-baseline gap-2 border-b border-[#F0E3DE] pb-1.5">
                <span className="font-serif text-[12px] italic tabular-nums text-[#C56A84]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Eyebrow>{s.eyebrow}</Eyebrow>
                {s.thumb && photoImg && <MiniThumb img={photoImg} />}
              </div>
              <div className="mt-2.5">{s.body}</div>
            </div>
          ))}

          {/* 전속 뷰티팀 총평 — 손글씨 대신 세리프 이탤릭(브랜드 검증 H 수정 채택) */}
          {note && (
            <div className="mt-6 border-l-2 border-[#C56A84]/50 pl-4" data-testid="report-note">
              <Eyebrow>From your beauty team</Eyebrow>
              <p className="mt-1.5 whitespace-pre-wrap break-keep pr-2 font-serif text-[13.5px] italic leading-[1.7] text-[#5C5049]">
                {note}
              </p>
            </div>
          )}

          {/* 신뢰 블록 — 진단서의 직인: 신뢰도(진단의 점수, 사람의 점수 아님) + 재현성 */}
          <div className="mt-7 border-t border-[#F0E3DE] pt-3 text-[10.5px] leading-relaxed text-[#8C7F78]">
            {confidenceText && (
              <p className="font-medium text-[#5C5049]" data-testid="report-confidence">
                {confidenceText}
                {confidenceHintText && (
                  <span className="ml-1.5 font-normal text-[#9A8C86]">{confidenceHintText}</span>
                )}
              </p>
            )}
            <p>{reproducibilityText}</p>
          </div>

          {/* 서명 로우 — 초대 + 도메인(바이럴 루프) */}
          <div className="mt-3 flex items-center justify-end gap-1.5 text-[11.5px] text-[#8C7F78]">
            <HexagonY size={13} className="text-[#C56A84]" />
            {inviteText && <span>{inviteText}</span>}
            <span className="font-medium text-[#2B2320]">yiroom.app</span>
          </div>
        </div>
      </div>
    );
  }
);
