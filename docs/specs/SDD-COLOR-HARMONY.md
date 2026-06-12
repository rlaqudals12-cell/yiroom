# SDD: 배색(Color Harmony) 엔진

> Spec-Driven Development | ADR-105 | 2026-05-16

## 1. 목적

진단된 퍼스널컬러 대표색에서 배색 이론(보색/유사색/삼각/분할보색/톤온톤)으로 조화색을
계산해, 코디 시 함께 쓸 색을 안내한다. 하드코딩 팔레트가 아닌 사용자 톤 기반 계산.

## 2. 입출력

### 2.1 `lib/color/harmony.ts` (순수 함수)

| 함수                        | 입력       | 출력                           |
| --------------------------- | ---------- | ------------------------------ |
| `complementary(hex)`        | hex string | hex string (h°+180)            |
| `analogous(hex, spread=30)` | hex, 각도  | hex[2] (양옆)                  |
| `triadic(hex)`              | hex        | hex[2] (h°+120,+240)           |
| `splitComplementary(hex)`   | hex        | hex[2] (h°+150,+210)           |
| `tonOnTone(hex, steps=3)`   | hex, 단계  | hex[steps] (동일 h°, L\* 분할) |
| `analyzeHarmony(hex)`       | hex        | `HarmonyResult` (전체 + lch)   |

**불변식**: 모든 출력은 유효 hex(`#RRGGBB`). 무채색(C\*≈0) 입력도 크래시 없이 유효 hex 반환.

### 2.2 `lib/analysis/personal-color/palette.ts`

```ts
generateTonePaletteV2(tone: TwelveTone): HarmonyPalette
// { tone, base, tonOnTone[], analogous[], accent, triadic[] }
```

대표색 = `TWELVE_TONE_PALETTES[tone].bestColors[0]` (없으면 `#808080` 폴백).

### 2.3 `components/analysis/ColorHarmonyGuide.tsx`

```ts
Props: { baseHex: string; baseName?: string; className?: string }
```

톤온톤/유사색/포인트(보색)/삼각 배색을 스와치 행으로 표시. PC 결과 페이지에서
`result.bestColors[0]`을 base로 호출 (dynamic import, ssr:false).

## 3. 알고리즘 (LCh 회전)

```
toLch(hex) → { L, chroma, hue }
rotateHue(hex, Δ):
  L, C 보존, h = (hue + Δ) mod 360
  lchToLab(L, C, h) → labToRgb → rgbToHex
```

재사용: `lib/color/conversions.ts`(hexToLab, labToRgb, rgbToHex, calculateChroma,
calculateHue). 신규 변환 0 — 기존 SSOT 색 유틸 위에 구현.

## 4. 검증

- `tests/lib/color/harmony.test.ts` (13): 각 배색의 hue 차이 근사(회전 각도), 톤온톤
  명도 단조성·동일 hue, 무채색 엣지, 유효 hex.
- `tests/lib/analysis/personal-color/palette.test.ts` (+2): `generateTonePaletteV2`
  12톤 전부 유효 hex·크래시 없음.
- E2E(수동): PC 결과 페이지 하단 "배색 가이드" 섹션 노출 + 스와치 색상 표시.

## 5. 범위 외 (출시 후 — 대 단계)

- 제품 `dominantColor` 태깅 + CIEDE2000 거리 기반 정밀 매칭 (제품 DB 색상 데이터 선행)
- 체형(C-1) × PC 통합 코디

## 관련

- ADR-105 (결정), `docs/principles/color-science.md §8` (원리)
