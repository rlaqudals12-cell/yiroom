'use client';

/**
 * 드레이핑 비교 섹션 — 내 분석 사진 + 진단 베스트/워스트 색천 병치 (7/15 배치 B)
 *
 * 왜: 오프라인 퍼스널컬러 진단의 핵심 경험(얼굴 아래 색천 대보기)이자 퍼컬 바이럴의
 * 정본 형식(틱톡 3.75억 뷰). 생성형 AI가 아니라 **캔버스 색 합성**(물리 드레이핑의 정직한
 * 재현)이라 원가 0이고, 얼굴을 변형하지 않는다.
 *
 * 기술: applyDrapeColor는 faceMask=0인 픽셀에만 드레이프를 칠하므로 zero-mask
 * (전부 0)를 넘기면 MediaPipe/얼굴 검출 없이 하단(72%~)에 천이 그려진다 —
 * DrapingSimulationTab(MediaPipe 의존·실패 경로)을 쓰지 않는 이유.
 * 이미지 처리는 전부 이 기기(브라우저)에서만 일어나고 서버로 전송되지 않는다.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { getConstrainedCanvasSize, createOptimizedContext } from '@/lib/analysis/canvas-utils';
import { applyDrapeColor } from '@/lib/analysis/drape-reflectance';
import type { PaletteColor } from '@/components/share/PersonaShareCard';

export interface DrapingSectionProps {
  /** 분석 사진 서명 URL (1h 만료 — 로드 실패 시 정직한 실패 문구) */
  imageUrl: string;
  /** 진단 베스트 컬러 (이름 포함 가능) */
  bestColors: PaletteColor[];
  /** 피해야 할 색 */
  worstColors: PaletteColor[];
}

// 캔버스 최대 변 — 결과 페이지 2열 병치 기준 충분한 해상도(레티나 감안)
const MAX_CANVAS = 640;

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
  tone,
}: {
  img: HTMLImageElement;
  color: PaletteColor;
  colors: PaletteColor[];
  selected: number;
  onSelect: (i: number) => void;
  label: string;
  tone: 'best' | 'worst';
}): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) drawDrape(canvasRef.current, img, color.hex);
  }, [img, color.hex]);

  const captionText = color.name ? `${label} · ${color.name}` : label;

  return (
    <figure className="min-w-0 flex-1 space-y-2">
      <canvas
        ref={canvasRef}
        className="w-full rounded-xl border"
        data-testid={`draping-canvas-${tone}`}
        aria-label={captionText}
      />
      <figcaption className="flex items-center justify-between gap-2 text-xs">
        <span className={tone === 'best' ? 'font-medium text-primary' : 'text-muted-foreground'}>
          {captionText}
        </span>
      </figcaption>
      {/* 색 스와치 — 탭해서 다른 진단 색으로 드레이프 교체 */}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {colors.map((c, i) => (
          <button
            key={`${c.hex}-${i}`}
            type="button"
            onClick={() => onSelect(i)}
            aria-pressed={selected === i}
            title={c.name}
            className={cn(
              'h-6 w-6 rounded-full border transition-transform',
              selected === i ? 'ring-2 ring-primary ring-offset-1 scale-110' : 'hover:scale-105'
            )}
            style={{ backgroundColor: c.hex }}
            data-testid={`draping-swatch-${tone}-${i}`}
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

  if (bestColors.length === 0) return null;
  const best = bestColors[Math.min(bestIdx, bestColors.length - 1)];
  const worst = worstColors[Math.min(worstIdx, Math.max(0, worstColors.length - 1))];

  return (
    <section
      className="rounded-2xl border bg-card p-5 md:p-6"
      data-testid="draping-section"
      aria-label={t('draping.heading')}
    >
      <div className="space-y-1">
        <p className="font-serif text-[13px] italic text-primary">Draping</p>
        <h2 className="text-sm font-semibold text-foreground">{t('draping.heading')}</h2>
        <p className="text-xs text-muted-foreground">{t('draping.subtitle')}</p>
      </div>

      {/* 실패 → 정직한 실패 문구(조용한 숨김 금지) / 로딩 → 스켈레톤 / 성공 → 병치 비교 */}
      {failed && (
        <div className="mt-4 space-y-2 text-center">
          <p className="text-xs text-muted-foreground" data-testid="draping-load-error">
            {t('draping.loadError')}
          </p>
          <button
            type="button"
            onClick={load}
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
        <div className="mt-4 flex gap-3">
          <DrapeFigure
            img={img}
            color={best}
            colors={bestColors}
            selected={bestIdx}
            onSelect={setBestIdx}
            label={t('draping.bestLabel')}
            tone="best"
          />
          {worst && (
            <DrapeFigure
              img={img}
              color={worst}
              colors={worstColors}
              selected={worstIdx}
              onSelect={setWorstIdx}
              label={t('draping.worstLabel')}
              tone="worst"
            />
          )}
        </div>
      )}

      {/* 정직 표기 — 생성이 아닌 합성임을 명시 + 기기 내 처리(법④ 인라인 고지의 절반) */}
      <p className="mt-3 text-[11px] text-muted-foreground">{t('draping.honestNote')}</p>
    </section>
  );
}
