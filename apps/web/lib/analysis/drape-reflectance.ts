/**
 * 드레이프 색상 합성 모듈
 * @description PC-1+ 드레이핑 - 사진 하단(목/어깨)에 드레이프 색상 적용(체험 렌더)
 *
 * 순위/균일도 측정 로직 제거(2026-07): 드레이프 색은 얼굴 '밖'(목/어깨)에만 칠해지고
 * 금속 반사광은 색과 무관하게 적용되므로, 얼굴 영역 균일도는 색에 따라 유의미하게 달라지지
 * 않는다(모든 색이 사실상 동률). "베스트 컬러 순위·별점"은 측정 신호가 없는 지어낸 수치였기에
 * 삭제했고, 시뮬레이터는 '어울림을 판정하는 도구'가 아니라 '직접 대보는 체험 렌더 도구'로 남는다.
 * 추천 후보는 진단 정본(PC 결과의 bestColors)이 담당한다.
 */

// 금속 반사광(METAL_REFLECTANCE·applyReflectance·applyMetalReflectance)은 삭제됨(2026-07)
// — 유일 소비자였던 DrapeSimulator(MediaPipe 실패 경로)가 DrapingSection으로 통합되면서 소멸.

// ============================================
// 드레이프 레이아웃 상수
// ============================================

/**
 * 드레이프(천) 영역 배치 — "얼굴 아래에 천을 대본다"는 은유에 맞춤.
 *
 * 왜 하단 13%인가(2026-08 재조정, 구 28%): 촬영 가이드 실루엣 기준 **턱끝이 프레임 약 88%
 * 지점**이다. 72%에서 시작하면 입·턱을 덮어 "얼굴에 물감을 칠한" 인상이 되고, 정작 색천이
 * 대야 할 목·어깨는 좁게 남는다. 87%부터 칠하면 얼굴은 온전히 남고 천은 턱 바로 아래에 놓인다.
 *
 * - START: 드레이프 시작 지점(프레임 높이 비율). 턱끝(≈88%) 바로 위에서 시작.
 * - FADE: 상단 경계 전환 구간. 밴드가 좁아진 만큼 페이드도 얇게(3%) — 넓으면 밴드 전체가
 *   그라데이션이 되어 천이 아니라 얼룩으로 보인다.
 * - MAX_BLEND: 밴드가 얼굴을 침범하지 않으므로 은은한 틴트가 아니라 **불투명 색천**으로 채운다.
 *   색이 진할수록 얼굴과의 동시대비(simultaneous contrast)가 또렷해져 체험 목적에 맞는다.
 */
const DRAPE_START_RATIO = 0.87;
const DRAPE_FADE_RATIO = 0.03;
const DRAPE_MAX_BLEND = 0.92;

// ============================================
// 드레이프 색상 적용
// ============================================

/**
 * 드레이프 색상을 얼굴 하단에 자연스럽게 적용
 * - 상단 경계 그라데이션으로 부드러운 전환
 * - 약간의 천 주름 효과 (밝기 변화)
 * - 얼굴 영역 주변 부드러운 블렌딩
 *
 * @param ctx - Canvas 2D 컨텍스트
 * @param drapeColor - 드레이프 색상 (HEX)
 * @param faceMask - 얼굴 마스크
 * @param canvasHeight - 캔버스 높이
 */
export function applyDrapeColor(
  ctx: CanvasRenderingContext2D,
  drapeColor: string,
  faceMask: Uint8Array,
  canvasHeight: number
): void {
  const canvasWidth = ctx.canvas.width;

  // HEX → RGB 변환
  const r = parseInt(drapeColor.slice(1, 3), 16);
  const g = parseInt(drapeColor.slice(3, 5), 16);
  const b = parseInt(drapeColor.slice(5, 7), 16);

  // 드레이프 영역 (얼굴 아래 목/어깨 — 얼굴 침범 최소화)
  const drapeStartY = Math.floor(canvasHeight * DRAPE_START_RATIO);
  const fadeZone = Math.floor(canvasHeight * DRAPE_FADE_RATIO);

  // 드레이프 색상 적용
  const imageData = ctx.getImageData(0, drapeStartY, canvasWidth, canvasHeight - drapeStartY);
  const { data } = imageData;

  // 간단한 시드 기반 노이즈 (주름 효과용)
  const getNoiseValue = (x: number, y: number): number => {
    const seed = (x * 12.9898 + y * 78.233) * 43758.5453;
    return (seed - Math.floor(seed)) * 0.12 - 0.06; // -0.06 ~ +0.06 범위
  };

  for (let i = 0; i < data.length; i += 4) {
    const localY = Math.floor(i / 4 / canvasWidth);
    const globalY = drapeStartY + localY;
    const x = (i / 4) % canvasWidth;
    const pixelIndex = globalY * canvasWidth + x;

    // 마스크 영역 외부만 드레이프 적용
    if (faceMask[pixelIndex] === 0) {
      // 상단 페이드 (부드러운 경계)
      let blendRatio = DRAPE_MAX_BLEND;
      if (localY < fadeZone) {
        // 0 ~ fadeZone 사이: 0.2 → DRAPE_MAX_BLEND 그라데이션
        blendRatio = 0.2 + (localY / fadeZone) * (DRAPE_MAX_BLEND - 0.2);
      }

      // 주름 효과 (밝기 미세 변화)
      const noise = getNoiseValue(x, localY);
      const foldEffect = 1 + noise;

      // 드레이프 색상 (주름 효과 적용)
      const drapeR = Math.min(255, Math.round(r * foldEffect));
      const drapeG = Math.min(255, Math.round(g * foldEffect));
      const drapeB = Math.min(255, Math.round(b * foldEffect));

      // 블렌딩
      data[i] = Math.round(data[i] * (1 - blendRatio) + drapeR * blendRatio);
      data[i + 1] = Math.round(data[i + 1] * (1 - blendRatio) + drapeG * blendRatio);
      data[i + 2] = Math.round(data[i + 2] * (1 - blendRatio) + drapeB * blendRatio);
    }
  }

  ctx.putImageData(imageData, 0, drapeStartY);
}
