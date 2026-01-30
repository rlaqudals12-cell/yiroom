# ADR-026: HSL 색공간 사용 결정

## 상태

`accepted`

## 날짜

2026-01-19

## 맥락 (Context)

[color-science.md](../principles/color-science.md)에서 Lab 색공간 사용을 권장하고 있으나, 현재 드레이핑 시뮬레이션(`drape-reflectance.ts`)은 HSL 색공간을 사용합니다.

### Lab vs HSL 비교

| 기준 | Lab | HSL |
|------|-----|-----|
| **인간 지각 일치** | 우수 (ΔE 균일) | 보통 |
| **피부톤 분석** | 최적 (a*, b* 축) | 제한적 |
| **브라우저 호환성** | 변환 필요 | 기본 지원 |
| **실시간 성능** | 느림 (행렬 연산) | 빠름 |
| **드레이핑 목적** | 과잉 스펙 | 충분 |

### 현재 사용 사례

1. **드레이핑 시뮬레이션**: 밝기/채도 조절 → HSL 충분
2. **균일도 측정**: 휘도(Luminance) 기반 → HSL 충분
3. **피부톤 분류**: Lab 필요 → **Gemini VLM에서 처리**

## P1: 궁극의 형태 (Ultimate Form)

> 원리 참조: [00-first-principles.md](../../.claude/rules/00-first-principles.md) P1

### 이상적 최종 상태

**제약이 없다면**:
- 전체 파이프라인 Lab 색공간 기반
- CIEDE2000 정밀 색차 계산
- 조명 조건 자동 보정 (Bradford 변환)
- 디스플레이 색영역 자동 감지 (sRGB, P3, Rec.2020)
- 한국인 피부톤 최적화 색차 공식 적용
- WebGPU 가속 실시간 변환 (60fps)

### 물리적 한계

| 제약 | 현실 | 완화 |
|------|------|------|
| 브라우저 성능 | Lab 변환 CPU 부담 | HSL로 실시간 처리 |
| 번들 크기 | color.js 13KB+ | 필요 시점에 추가 |
| Gemini VLM | AI가 색 분석 수행 | 클라이언트 부담 감소 |
| WebGPU 호환성 | 아직 제한적 | Canvas API 사용 |

### 100점 기준

| 항목 | 100점 기준 | 현재 목표 |
|------|-----------|----------|
| 색공간 | 전면 Lab | 2단계 (HSL + Gemini) |
| 색차 계산 | CIEDE2000 | Gemini 내부 처리 |
| 조명 보정 | Bradford 변환 | 없음 (CIE-3 예정) |
| 실시간 성능 | 60fps Lab | 60fps HSL |
| 디스플레이 대응 | P3, Rec.2020 | sRGB만 |

### 현재 목표

**Phase 1: 50%** (HSL + Gemini 하이브리드)
- 클라이언트: HSL 색공간 (드레이핑, 균일도)
- 서버: Gemini VLM이 색 분석 담당
- Lab은 CIE-3 구현 시 추가

### 의도적 제외

| 제외 항목 | 사유 | 재검토 시점 |
|----------|------|------------|
| 전면 Lab 적용 | 현재 요구사항에 과잉 | CIE-3 구현 시 |
| CIEDE2000 직접 구현 | Gemini가 처리 | 제품 매칭 고도화 시 |
| 조명 보정 | 복잡도 높음 | CIE-3 구현 시 |
| HDR 디스플레이 | 시장 보급률 낮음 | 2027년 이후 |
| color.js 라이브러리 | 번들 크기 증가 | Lab 필요 시 |

---

## 결정 (Decision)

**2단계 색공간 전략** 채택:

```
┌─────────────────────────────────────────────────────────────┐
│                   색공간 사용 전략                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  클라이언트 (Canvas API)                                     │
│  ├── HSL 색공간 사용                                        │
│  ├── 드레이핑 시뮬레이션 (밝기/채도 조절)                   │
│  └── 균일도 측정 (휘도 기반)                                │
│                                                              │
│  서버 (AI 분석)                                              │
│  ├── Gemini VLM 내부 처리                                   │
│  └── 웜/쿨톤, 계절 판정은 AI가 직접 수행                    │
│                                                              │
│  향후 CIE-3 구현 시                                          │
│  ├── Lab 색공간 변환 추가                                    │
│  ├── 조명 보정 (Bradford 변환)                               │
│  └── CIEDE2000 색차 계산                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 코드 위치

| 기능 | 색공간 | 파일 |
|------|--------|------|
| 드레이핑 시뮬레이션 | HSL | `lib/analysis/drape-reflectance.ts` |
| Canvas 유틸리티 | HSL | `lib/analysis/canvas-utils.ts` |
| 퍼스널컬러 판정 | Gemini 내부 | `app/api/analyze/personal-color/route.ts` |
| (향후) 조명 보정 | Lab | `lib/image-engine/lighting-corrector.ts` |

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| 전면 Lab 적용 | 원리 문서 일치 | 성능 저하, 복잡도 증가 | `LOW_ROI` - 현재 요구사항에 과잉 |
| 외부 라이브러리 (color.js) | 정확한 변환 | 번들 크기 증가 | `HIGH_COMPLEXITY` - 13KB+ 추가 |
| WebGL 색공간 변환 | 고성능 | 호환성 이슈 | `HIGH_COMPLEXITY` - 유지보수 어려움 |

## 결과 (Consequences)

### 긍정적 결과

- **성능 최적화**: 실시간 드레이핑 가능 (60fps)
- **단순한 구현**: 행렬 연산 없이 간단한 변환
- **브라우저 호환성**: 모든 브라우저에서 동작

### 부정적 결과

- **원리 문서와 불일치**: color-science.md는 Lab 권장
- **정밀도 제한**: 미세한 색차 측정 불가
- **CIE-3 구현 시 추가 작업**: Lab 변환 별도 구현 필요

### 리스크

- 향후 정밀한 색 분석 필요 시 리팩토링 필요 → **CIE-3 구현 시 Lab 추가**

## 구현 가이드

### 현재 HSL 구현 (유지)

```typescript
// lib/analysis/canvas-utils.ts
export function rgbaToHsl(r: number, g: number, b: number): { h: number; s: number; l: number };
export function hslToRgba(h: number, s: number, l: number): { r: number; g: number; b: number };
```

### 향후 Lab 구현 (CIE-3)

```typescript
// lib/image-engine/color-space.ts (향후 구현)
export function rgbToLab(r: number, g: number, b: number): LabColor;
export function labToRgb(L: number, a: number, b: number): RGBColor;
export function calculateDeltaE(lab1: LabColor, lab2: LabColor): number;
```

### 마이그레이션 계획

| 단계 | 작업 | 조건 |
|------|------|------|
| 1 | HSL 유지 (현재) | 드레이핑 기능 충분 |
| 2 | Lab 추가 | CIE-3 구현 시 |
| 3 | 제품 매칭 Lab 적용 | CIEDE2000 필요 시 |
| 4 | 전체 Lab 전환 (선택) | 성능 이슈 없을 시 |

## 리서치 티켓

```
[ADR-026-R1] 색공간 최적화 전략
────────────────────────────────────
claude.ai 딥 리서치 요청:
1. WebGPU를 활용한 실시간 Lab 색공간 변환 성능 벤치마크
2. 한국인 피부톤에 최적화된 색차 공식 (CIEDE2000 vs CMC l:c)
3. HDR 디스플레이 대응 색공간 확장 (Display P3, Rec.2020)

→ 결과를 Claude Code에서 lib/image-engine/color-space CIE-3 구현 시 적용
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 색채학](../principles/color-science.md) - Lab 색공간 이론, 웜/쿨톤 판정
- [원리: 이미지 처리](../principles/image-processing.md) - 색온도 보정

### 관련 ADR/스펙
- [ADR-001: Core Image Engine](./ADR-001-core-image-engine.md) - CIE-3 조명 보정
- [ADR-003: AI 모델 선택](./ADR-003-ai-model-selection.md) - Gemini VLM 색 분석

---

**Author**: Claude Code
**Reviewed by**: -
