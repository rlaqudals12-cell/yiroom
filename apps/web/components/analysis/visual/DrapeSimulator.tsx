'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import type { DrapeSimulatorProps, MetalType } from '@/types/visual-analysis';
import {
  applyDrapeColor,
  applyMetalReflectance,
  createOptimizedContext,
  getConstrainedCanvasSize,
  applyVignette,
  releaseCanvas,
} from '@/lib/analysis';
import { cn } from '@/lib/utils';
import { getKoreanColorName } from '@/lib/utils/color-names';
import { useTranslations } from 'next-intl';

type SlotId = 'A' | 'B';

/**
 * PC-1+ 드레이프 시뮬레이터 — "직접 대보는" 체험 도구
 *
 * 이전의 "베스트 컬러 TOP 5 / 어울림 N위 / 별점 / 베스트 vs 워스트"는 측정 신호가 없는
 * 지어낸 순위였다(드레이프 색은 얼굴 밖에만 칠해지고 반사광은 색과 무관 → 모든 색 동률).
 * 이제 시뮬레이터는 어울림을 판정하지 않는다:
 * - 추천 후보 = 진단 정본(diagnosisBestColors, PC 결과의 bestColors)을 스와치로 제시
 * - A·B 두 색을 사용자가 직접 골라 좌우로 나란히 비교
 */
export default function DrapeSimulator({
  image,
  faceMask,
  metalType,
  diagnosisBestColors,
  externalSelectedColor,
  skinInsight,
  className,
}: DrapeSimulatorProps & { skinInsight?: string; externalSelectedColor?: string | null }) {
  const t = useTranslations('visualAnalysisUI');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [slotA, setSlotA] = useState<string | null>(null);
  const [slotB, setSlotB] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<SlotId>('A');
  // 팔레트 탭 선택은 externalSelectedColor로 흘러온다. 슬롯 자동 채움이
  // activeSlot 변화로 중복 발동하지 않도록 마지막 적용 색을 기록한다.
  const lastExternalRef = useRef<string | null>(null);

  /**
   * 단일 색상 미리보기 (메인 캔버스)
   */
  const previewDrape = useCallback(
    (color: string) => {
      const canvas = canvasRef.current;
      if (!canvas || !image) return;

      const ctx = createOptimizedContext(canvas, { willReadFrequently: true });
      if (!ctx) return;

      const { width, height } = getConstrainedCanvasSize(
        image.naturalWidth || image.width,
        image.naturalHeight || image.height
      );
      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(image, 0, 0, width, height);
      applyDrapeColor(ctx, color, faceMask, canvas.height);
      applyMetalReflectance(ctx, faceMask, metalType);
      applyVignette(ctx, width, height, 0.3);

      setSelectedColor(color);
    },
    [image, faceMask, metalType]
  );

  /**
   * 색 선택 = 메인 미리보기 + 현재 활성 슬롯에 담고 다음 슬롯으로 전환.
   * 판정이 아니라 "담기" 동작이다.
   */
  const handlePick = useCallback(
    (color: string) => {
      previewDrape(color);
      if (activeSlot === 'A') {
        setSlotA(color);
        setActiveSlot('B');
      } else {
        setSlotB(color);
        setActiveSlot('A');
      }
    },
    [previewDrape, activeSlot]
  );

  // 팔레트 탭에서 고른 색 → 활성 슬롯에 담기 (같은 색 재적용 방지 가드)
  useEffect(() => {
    if (
      externalSelectedColor &&
      externalSelectedColor !== lastExternalRef.current &&
      image &&
      faceMask
    ) {
      lastExternalRef.current = externalSelectedColor;
      handlePick(externalSelectedColor);
    }
  }, [externalSelectedColor, image, faceMask, handlePick]);

  // 컴포넌트 언마운트 시 캔버스 정리
  useEffect(() => {
    const canvas = canvasRef.current;
    return () => {
      if (canvas) {
        releaseCanvas(canvas);
      }
    };
  }, []);

  // 초기 이미지 표시
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = createOptimizedContext(canvas);
    if (!ctx) return;

    const { width, height } = getConstrainedCanvasSize(
      image.naturalWidth || image.width,
      image.naturalHeight || image.height
    );
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    applyVignette(ctx, width, height, 0.3);
  }, [image]);

  return (
    <div className={cn('space-y-3', className)} data-testid="drape-simulator">
      {/* 1. 메인 미리보기 — 선택한 색을 얼굴 아래에 대본 모습 */}
      <div className="relative w-full aspect-[3/4] max-h-[25vh] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain"
          aria-label={t('drapeSimulator0')}
        />
      </div>

      {/* 2. 안내 — 판정이 아니라 직접 대보는 체험임을 명확히 */}
      <div className="p-3 bg-muted/50 rounded-lg text-center space-y-1">
        <p className="text-sm font-medium">직접 대보며 비교해보세요</p>
        <p className="text-xs text-muted-foreground">
          색을 고르면 얼굴 아래에 대본 모습을 보여줘요. 두 색을 A·B 슬롯에 담아 나란히 비교할 수
          있어요.
        </p>
      </div>

      {/* 피부 분석 기반 시너지 노트 (있을 때만) */}
      {skinInsight && (
        <p className="text-xs text-muted-foreground text-center" data-testid="drape-skin-note">
          {skinInsight}
        </p>
      )}

      {/* 3. 진단 정본 베스트 컬러 후보 (없으면 미노출 — 지어내지 않음) */}
      {diagnosisBestColors && diagnosisBestColors.length > 0 && (
        <DiagnosisColorsSection
          colors={diagnosisBestColors}
          selectedColor={selectedColor}
          onPick={handlePick}
        />
      )}

      {/* 4. A·B 직접 비교 */}
      <ABCompareSection
        slotA={slotA}
        slotB={slotB}
        activeSlot={activeSlot}
        onSelectSlot={setActiveSlot}
        image={image}
        faceMask={faceMask}
        metalType={metalType}
      />
    </div>
  );
}

/**
 * 진단 정본 베스트 컬러 후보 스와치
 * - 순위·별점 없음. 진단이 추천한 색을 "탭해서 대보는" 후보로만 제시한다.
 */
function DiagnosisColorsSection({
  colors,
  selectedColor,
  onPick,
}: {
  colors: Array<{ hex: string; name: string }>;
  selectedColor: string | null;
  onPick: (color: string) => void;
}) {
  return (
    <div className="space-y-2" data-testid="diagnosis-best-colors">
      <h4 className="text-sm font-medium">내 진단 베스트 컬러</h4>
      <p className="text-xs text-muted-foreground">
        진단에서 추천된 색이에요. 탭하면 대볼 수 있어요.
      </p>
      <div className="flex gap-2 flex-wrap">
        {colors.map((color) => (
          <button
            key={color.hex}
            onClick={() => onPick(color.hex)}
            className={cn(
              'w-12 h-12 rounded-lg border-2 transition-all',
              'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary',
              selectedColor === color.hex
                ? 'border-primary ring-2 ring-primary'
                : 'border-transparent'
            )}
            style={{ backgroundColor: color.hex }}
            title={color.name}
            aria-label={`${color.name} 대보기`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * A·B 나란히 비교 섹션
 * - 자동 판정/순위 없이, 사용자가 담을 슬롯을 고르고 색을 넣어 좌우로 비교한다.
 */
function ABCompareSection({
  slotA,
  slotB,
  activeSlot,
  onSelectSlot,
  image,
  faceMask,
  metalType,
}: {
  slotA: string | null;
  slotB: string | null;
  activeSlot: SlotId;
  onSelectSlot: (slot: SlotId) => void;
  image: HTMLImageElement;
  faceMask: Uint8Array;
  metalType: MetalType;
}) {
  return (
    <div className="space-y-2" data-testid="ab-compare-section">
      <h4 className="text-sm font-medium">A·B 나란히 비교</h4>
      <p className="text-xs text-muted-foreground">
        담을 슬롯(A·B)을 고른 뒤 색을 선택하면 좌우로 비교돼요.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <SlotColumn
          label="A"
          color={slotA}
          active={activeSlot === 'A'}
          onSelect={() => onSelectSlot('A')}
          image={image}
          faceMask={faceMask}
          metalType={metalType}
        />
        <SlotColumn
          label="B"
          color={slotB}
          active={activeSlot === 'B'}
          onSelect={() => onSelectSlot('B')}
          image={image}
          faceMask={faceMask}
          metalType={metalType}
        />
      </div>
    </div>
  );
}

/**
 * 개별 슬롯 (A 또는 B) — 담긴 색을 캔버스에 렌더
 */
function SlotColumn({
  label,
  color,
  active,
  onSelect,
  image,
  faceMask,
  metalType,
}: {
  label: SlotId;
  color: string | null;
  active: boolean;
  onSelect: () => void;
  image: HTMLImageElement;
  faceMask: Uint8Array;
  metalType: MetalType;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const renderToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image || !color) return;

    const ctx = createOptimizedContext(canvas, { willReadFrequently: true });
    if (!ctx) return;

    const { width, height } = getConstrainedCanvasSize(
      image.naturalWidth || image.width,
      image.naturalHeight || image.height
    );
    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(image, 0, 0, width, height);
    applyDrapeColor(ctx, color, faceMask, canvas.height);
    applyMetalReflectance(ctx, faceMask, metalType);
    applyVignette(ctx, width, height, 0.3);
  }, [image, faceMask, metalType, color]);

  useEffect(() => {
    if (color) renderToCanvas();
  }, [color, renderToCanvas]);

  // 언마운트 시 캔버스 정리
  useEffect(() => {
    const canvas = canvasRef.current;
    return () => {
      if (canvas) releaseCanvas(canvas);
    };
  }, []);

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        data-testid={`slot-${label}-select`}
        className={cn(
          'w-full text-xs font-medium rounded-md py-1.5 border transition-colors',
          active
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border text-muted-foreground hover:border-primary/50'
        )}
      >
        {label} 슬롯{active ? ' (담는 중)' : ''}
      </button>

      <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden flex items-center justify-center">
        {color ? (
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full object-contain"
            aria-label={`${label} 슬롯 미리보기`}
          />
        ) : (
          <p className="text-[11px] text-muted-foreground px-2 text-center">색을 선택하세요</p>
        )}
      </div>

      {color && (
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded border flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <p className="text-xs text-foreground truncate">{getKoreanColorName(color)}</p>
        </div>
      )}
    </div>
  );
}
