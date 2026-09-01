'use client';

/**
 * 드레이핑 비교 섹션 — 내 분석 사진 + 진단 베스트/워스트 색천 병치 (7/15 배치 B)
 *
 * 왜: 오프라인 퍼스널컬러 진단의 핵심 경험(얼굴 아래 색천 대보기)이자 퍼컬 바이럴의
 * 정본 형식(틱톡 3.75억 뷰). 생성형 AI가 아니라 **캔버스 색 합성**(물리 드레이핑의 정직한
 * 재현)이라 원가 0이고, 얼굴을 변형하지 않는다.
 *
 * 기술: applyDrapeColor는 faceMask=0인 픽셀에만 드레이프를 칠하므로 zero-mask
 * (전부 0)를 넘기면 MediaPipe/얼굴 검출 없이 하단(87%~, 턱끝 아래)에 천이 그려진다 —
 * 구 DrapingSimulationTab(MediaPipe 의존)은 CSP가 CDN을 막아 항상 Mock 마스크로
 * 폴백해 "유령 가면"을 그렸기에 삭제됐고(2026-07), 이 zero-mask 방식이 정본이다.
 * 합성은 전부 이 기기(브라우저)에서 일어나고 결과물은 어디에도 저장되지 않는다. 단, 원본 사진은
 * 이미 서버의 분석 기록에 보관돼 있으므로 고지 문구를 "사진이 서버에 안 간다"로 쓰면 안 된다.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { getConstrainedCanvasSize, createOptimizedContext } from '@/lib/analysis/canvas-utils';
import { applyDrapeColor } from '@/lib/analysis/drape-reflectance';
import { findNearestOpticalDrape } from '@/lib/analysis/drape-palette';
import { getToneCompatibility } from '@/lib/analysis/personal-color/palette';
import { hexToLab } from '@/lib/color';
import { getKoreanColorName } from '@/lib/utils/color-names';
import type { PaletteColor } from '@/components/share/PersonaShareCard';
import type { ColorCompatibility, TwelveTone } from '@/lib/analysis/personal-color/types';

export interface DrapingSectionProps {
  /** 분석 사진 서명 URL (1h 만료 — 로드 실패 시 정직한 실패 문구) */
  imageUrl: string;
  /** 진단 베스트 컬러 (이름 포함 가능) */
  bestColors: PaletteColor[];
  /** 피해야 할 색 */
  worstColors: PaletteColor[];
  /** 저장된 12톤 판정이 있을 때만 색천별 적합도를 계산한다. */
  tone?: TwelveTone;
  /**
   * 재시도 시 부모가 분석을 재조회해 **새 서명 URL**을 발급하도록 하는 훅.
   * 로드 실패의 주원인이 서명 URL 1h 만료라, 같은 URL로 다시 시도하면 반드시 또 실패한다.
   * 미제공 시에는 기존 동작(로컬 재로드)만 수행한다.
   */
  onRetry?: () => void;
}

// 캔버스 최대 변 — 결과 페이지 2열 병치 기준 충분한 해상도(레티나 감안)
const MAX_CANVAS = 640;

const GRADE_LABELS: Record<ColorCompatibility['grade'], string> = {
  perfect: '매우 잘 어울려요',
  good: '잘 어울려요',
  neutral: '무난해요',
  poor: '덜 어울려요',
  avoid: '피하는 편이 좋아요',
};

interface DrapeAssessment {
  compatibility: ColorCompatibility;
  opticalReference: ReturnType<typeof findNearestOpticalDrape>;
}

/** 12톤·유효 HEX가 모두 있을 때만 기존 CIE/광학 팔레트 엔진을 연결한다. */
function assessDrapeColor(tone: TwelveTone, hex: string): DrapeAssessment | null {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return null;
  return {
    compatibility: getToneCompatibility(tone, hexToLab(hex)),
    opticalReference: findNearestOpticalDrape(hex),
  };
}

/** 사진에 드레이프 색을 합성해 캔버스에 그린다 (zero-mask = 얼굴 검출 없음) */
function drawDrape(canvas: HTMLCanvasElement, img: HTMLImageElement, hex: string): void {
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
  applyDrapeColor(ctx, hex, new Uint8Array(width * height), height);
}

function DrapeFigure({
  img,
  color,
  colors,
  selected,
  onSelect,
  label,
  side,
  assessment,
}: {
  img: HTMLImageElement;
  color: PaletteColor;
  colors: PaletteColor[];
  selected: number;
  onSelect: (i: number) => void;
  label: string;
  side: 'best' | 'worst';
  assessment: DrapeAssessment | null;
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) drawDrape(canvasRef.current, img, color.hex);
  }, [img, color.hex]);

  const captionText = color.name ? `${label} · ${color.name}` : label;

  return (
    <figure className="min-w-0 flex-1 space-y-2">
      {/* 캔버스는 기본 role이 없어 보조기술에 '빈 요소'로 읽힌다 → 합성 결과 이미지임을 명시 */}
      <canvas
        ref={canvasRef}
        role="img"
        className="w-full rounded-xl border"
        data-testid={`draping-canvas-${side}`}
        aria-label={captionText}
      />
      <figcaption className="flex items-center justify-between gap-2 text-xs">
        <span className={side === 'best' ? 'font-medium text-foreground' : 'text-muted-foreground'}>
          {captionText}
        </span>
      </figcaption>
      {assessment && (
        <div className="space-y-0.5 text-[11px] leading-relaxed text-muted-foreground">
          <p
            className="font-medium text-foreground"
            data-testid={`draping-grade-${side}`}
            data-grade={assessment.compatibility.grade}
          >
            {GRADE_LABELS[assessment.compatibility.grade]}
          </p>
          <p
            data-testid={`draping-optical-reference-${side}`}
            data-optical-reflectance={assessment.opticalReference.reflectance}
            data-optical-warmth={assessment.opticalReference.warmth}
          >
            가장 가까운 표준 색천: {assessment.opticalReference.name}
          </p>
        </div>
      )}
      {/* 색 스와치 — 탭해서 다른 진단 색으로 드레이프 교체.
          색만 칠한 버튼은 접근 가능한 이름이 없다 → 진단 색명(없으면 hex 기반 색명)으로 라벨링 */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {colors.map((c, i) => (
          <button
            key={`${c.hex}-${i}`}
            type="button"
            onClick={() => onSelect(i)}
            aria-pressed={selected === i}
            aria-label={c.name ?? getKoreanColorName(c.hex)}
            title={c.name ?? getKoreanColorName(c.hex)}
            className={cn(
              'h-6 w-6 rounded-full border transition-transform',
              selected === i ? 'ring-2 ring-primary ring-offset-1 scale-110' : 'hover:scale-105'
            )}
            style={{ backgroundColor: c.hex }}
            data-testid={`draping-swatch-${side}-${i}`}
          />
        ))}
      </div>
    </figure>
  );
}

export function DrapingSection({
  imageUrl,
  bestColors,
  worstColors,
  tone,
  onRetry,
}: DrapingSectionProps): React.JSX.Element | null {
  const t = useTranslations('analysis.integratedResult');
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [failed, setFailed] = useState(false);
  const [bestIdx, setBestIdx] = useState(0);
  const [worstIdx, setWorstIdx] = useState(0);

  // 서명 URL 이미지를 1회 로드 — crossOrigin 필수(캔버스 taint 방지, 기존 선례 패턴)
  const load = useCallback(() => {
    setFailed(false);
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => setImg(image);
    image.onerror = () => setFailed(true);
    image.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    load();
  }, [load]);

  // 재시도 = 부모 재조회(새 서명 URL) + 로컬 재로드. URL이 그대로 돌아와도 한 번 더 시도한다.
  const handleRetry = useCallback(() => {
    onRetry?.();
    load();
  }, [onRetry, load]);

  if (bestColors.length === 0) return null;
  const best = bestColors[Math.min(bestIdx, bestColors.length - 1)];
  const worst = worstColors[Math.min(worstIdx, Math.max(0, worstColors.length - 1))];
  const bestAssessment = tone ? assessDrapeColor(tone, best.hex) : null;
  const worstAssessment = tone && worst ? assessDrapeColor(tone, worst.hex) : null;
  const bestColorName = best.name ?? getKoreanColorName(best.hex);
  const worstColorName = worst ? (worst.name ?? getKoreanColorName(worst.hex)) : null;
  const comparisonVerdict = (() => {
    if (!bestAssessment || !worstAssessment || !worstColorName) return null;
    if (bestAssessment.compatibility.score === worstAssessment.compatibility.score) {
      return `${bestColorName}와 ${worstColorName}의 12톤 적합도가 비슷해요.`;
    }
    const bestWins = bestAssessment.compatibility.score > worstAssessment.compatibility.score;
    const winnerSide = bestWins ? '왼쪽' : '오른쪽';
    const winnerName = bestWins ? bestColorName : worstColorName;
    return `${winnerSide} ${winnerName} 쪽이 진단된 12톤에 더 가까워요.`;
  })();

  return (
    // 인쇄물에는 얼굴 사진을 넣지 않는다 — PDF는 파일로 남아 손을 떠난다(진단지 인쇄 계약)
    <section
      className="rounded-2xl border bg-card p-5 md:p-6"
      data-testid="draping-section"
      aria-label={t('draping.heading')}
      data-print-hide
    >
      <div className="space-y-1">
        <p className="font-serif text-[13px] italic text-primary">Draping</p>
        <h2 className="text-sm font-semibold text-foreground">{t('draping.heading')}</h2>
        <p className="text-xs text-muted-foreground">{t('draping.subtitle')}</p>
        {/* 무엇을 볼지 알려주지 않으면 "그림 두 장"으로 끝난다 — 판정이 아닌 관찰 지시 */}
        <p className="text-xs text-muted-foreground" data-testid="draping-observe-hint">
          {t('draping.observeHint')}
        </p>
      </div>

      {comparisonVerdict && (
        <p
          className="mt-3 border-y border-border py-2 font-serif text-sm text-foreground"
          data-testid="draping-verdict"
        >
          {comparisonVerdict}
        </p>
      )}

      {/* 실패 → 정직한 실패 문구(조용한 숨김 금지) / 로딩 → 스켈레톤 / 성공 → 병치 비교 */}
      {failed && (
        <div className="mt-4 space-y-2 text-center">
          <p className="text-xs text-muted-foreground" data-testid="draping-load-error">
            {t('draping.loadError')}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-full border px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            {t('draping.retry')}
          </button>
        </div>
      )}
      {!failed && !img && (
        <div className="mt-4 h-48 animate-pulse rounded-xl bg-secondary" aria-hidden="true" />
      )}
      {!failed && img && (
        // 360px 폭에서 2열은 각 ~150px로 압착돼 비교가 불가능하다 → 좁은 화면은 세로 스택
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <DrapeFigure
            img={img}
            color={best}
            colors={bestColors}
            selected={bestIdx}
            onSelect={setBestIdx}
            label={t('draping.bestLabel')}
            side="best"
            assessment={bestAssessment}
          />
          {worst && (
            <DrapeFigure
              img={img}
              color={worst}
              colors={worstColors}
              selected={worstIdx}
              onSelect={setWorstIdx}
              label={t('draping.worstLabel')}
              side="worst"
              assessment={worstAssessment}
            />
          )}
        </div>
      )}

      {/* 정직 표기 — 생성이 아닌 합성임을 명시 + "기기 내 처리"의 범위를 합성물로 한정한다.
          (원본 사진은 분석 기록으로 서버에 보관 중이므로 "서버로 안 보낸다"는 표현은 오독을 낳는다) */}
      <p className="mt-3 text-[11px] text-muted-foreground">{t('draping.honestNote')}</p>
    </section>
  );
}
