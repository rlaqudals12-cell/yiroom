# ADR-105: 배색(Color Harmony) 엔진 — 진단 위에 배색 알고리즘

## 상태

승인됨 (2026-05-16)

## 날짜

2026-05-16

## 1. 맥락 (Context)

출시 직전 제품 본질 재점검에서, 이룸의 퍼스널컬러 분석이 **진단(Lab/CIEDE2000/12톤,
전문가급 70~80%)** 은 강하나 진단 직후 **추천 팔레트가 하드코딩(배색 이론 0%)** 임을
확인. 즉 "당신은 봄웜톤" (과학적) → "이 색들 쓰세요" (예쁜 색 박기) 구조였다.

이는 두 가지 손실:

1. **컨설턴트 대체 한계** — 퍼스널컬러리스트는 진단 후 "이 톤에 이 색을 매치"하는
   배색 처방을 한다. 이룸은 그 처방 로직이 비어 있었다.
2. **구매 전환 손실** — 하드코딩 팔레트로 "이 립 어때요"는 전환이 약하다. 진짜 배색
   이론 기반 추천이 구매로 이어진다 (어필리에이트/브랜드 수익 퍼널).

이룸은 이미 색채학 토대(`lib/color/` — Lab 변환, CIEDE2000, hue/chroma)와 원리
문서(`docs/principles/color-science.md §8 색상 조화 이론`)를 갖고 있다. 따라서 진단
엔진을 건드리지 않고 **그 위에 배색 알고리즘을 얹는** 것이 최소 리스크·최대 레버리지.

## 2. 결정 (Decision)

### 2.1 LCh 공간 hue 회전 기반 배색 (`lib/color/harmony.ts`)

기준색의 **명도(L\*)·채도(C\*)는 보존하고 색상각(h°)만 회전**시켜 조화색을 도출한다.
RGB 회전이 아닌 LCh 회전이 색채학적으로 정확(지각 균등성).

| 배색                           | 회전              | 용도               |
| ------------------------------ | ----------------- | ------------------ |
| 보색 (complementary)           | h°+180            | 강한 대비 포인트   |
| 유사색 (analogous)             | h°±30             | 조화로운 기본 배색 |
| 삼각 (triadic)                 | h°+120, +240      | 활기찬 3색         |
| 분할보색 (split-complementary) | h°+150, +210      | 부드러운 대비      |
| 톤온톤 (ton-on-ton)            | 동일 h°, L\* 분할 | 안정적 단색        |

근거 원리: `docs/principles/color-science.md §8.1` (조화 유형 Δh° 정의).

### 2.2 Hybrid 팔레트 (`generateTonePaletteV2`)

기존 `TWELVE_TONE_PALETTES`(하드코딩 폴백)는 **그대로 유지**하고, 그 대표색 위에 배색을
계산해 `HarmonyPalette`를 추가 생성. 기존 사용자도 재분석 없이 혜택(Hybrid 데이터 패턴).

### 2.3 PC 결과 페이지 배색 가이드 (`ColorHarmonyGuide`)

진단된 대표색에서 톤온톤/유사색/포인트/삼각 배색을 시각 스와치로 안내. dynamic import
(스크롤 하단). 12톤 매핑 없이 `result.bestColors[0]`을 base로 직접 계산.

### 2.4 범위 — 출시 전 "소+중", 제품 정밀 매칭은 출시 후

- **출시 전(소·중)**: 배색 알고리즘 + 팔레트 + 결과 페이지 가이드. ✅ 구현.
- **출시 후(대)**: 제품 색상(`dominantColor`) 태깅 + CIEDE2000 거리 기반 정밀 매칭 +
  체형(C-1)×PC 통합 코디. **제품 DB에 색상 hex가 전무**하여 지금 매칭 분기를 넣으면
  전 제품이 폴백되는 죽은 코드(P4 위반). 색상 태깅과 한 묶음으로 출시 후 진행.

### 2.5 진단 엔진 불가침

`lib/analysis/personal-color-v2/classify.ts`, `lib/color/ciede2000.ts`, `lib/gemini.ts`는
변경하지 않는다. 배색은 진단 결과를 **소비**할 뿐 진단 로직에 영향 없음.

## 3. 대안 (Alternatives)

| 대안                     | 기각 사유                                                        |
| ------------------------ | ---------------------------------------------------------------- |
| RGB 색상환 회전          | 지각 불균등 — 같은 각도라도 색차가 들쭉날쭉. LCh가 정확          |
| 하드코딩 팔레트 확장     | 배색 "이론"이 아닌 수작업 — 12톤×다배색 유지 불가, 정체성과 무관 |
| 제품 색상 매칭 즉시 구현 | 제품 색상 데이터 0 → 죽은 코드. 태깅 선행 필요 (출시 후)         |

## 4. 결과 (Consequences)

- ✅ "진단 → 배색 처방" 연결 — 컨설턴트 업무에 한 발 근접
- ✅ 진단 엔진 무변경 — 리스크 최소
- ✅ Hybrid — 기존 사용자 재분석 불필요
- ⏭️ 제품 정밀 매칭·체형 통합은 출시 후 (데이터 태깅 선행)

## 관련 문서

- 원리: `docs/principles/color-science.md §8 색상 조화 이론`
- 스펙: `docs/specs/SDD-COLOR-HARMONY.md`
- 코드(웹): `lib/color/harmony.ts`, `lib/analysis/personal-color/palette.ts` (`generateTonePaletteV2`), `components/analysis/ColorHarmonyGuide.tsx`
- 코드(모바일, 2026-06-12 포팅): `apps/mobile/lib/color/harmony.ts`, `apps/mobile/components/analysis/ColorHarmonyGuide.tsx` (PC 결과 요약 탭)
- 선행: ADR-066 (색공간 SSOT 통합), ADR-098 (정체성 5축)
