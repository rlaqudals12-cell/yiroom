# ADR-001: Core Image Engine 아키텍처

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"모든 이미지 기반 분석이 단일 파이프라인을 통과하며,
각 단계에서 신뢰도를 정량적으로 측정하고 전파하는 시스템"

- CIE-1~4 모든 단계 완전 구현
- 신뢰도 전파: 0.59+ (60% 이상) 달성
- 모든 분석 모듈 CIE 통과 필수
- 품질 미달 이미지 자동 거부 + 개선 가이드 제공
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| 카메라 품질 | 사용자 기기 해상도/센서 한계 |
| 조명 환경 | 실외/실내 조명 편차 |
| 브라우저 지원 | Canvas API 성능 한계 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| CIE 구현율 | 4/4 단계 완전 구현 |
| 신뢰도 정확도 | AI vs 전문가 판정 95% 일치 |
| 처리 속도 | 전체 파이프라인 < 500ms |
| 롤백 대비 | Feature Flag 100% 커버리지 |

### 현재 달성률

**30%** - CIE-1,2 Gemini 대체, CIE-3 미구현, CIE-4 부분 구현

### 의도적 제외

| 제외 항목 | 이유 |
|----------|------|
| 네이티브 이미지 처리 | Gemini VLM이 충분히 정확 (비용 효율) |
| WASM 기반 처리 | 브라우저 호환성 문제 |

---

## 상태

`accepted`

## 날짜

2026-01-15

## 맥락 (Context)

이룸은 퍼스널컬러(PC-1), 피부 분석(S-1), 체형 분석(C-1) 등 여러 이미지 기반 분석 모듈을 제공합니다. 현재 각 모듈이 독립적으로 이미지 처리를 수행하여 다음 문제가 발생합니다:

1. **코드 중복**: 이미지 품질 검증, 얼굴 감지 로직이 각 모듈에 산재
2. **일관성 부재**: 모듈마다 다른 품질 기준 적용
3. **신뢰도 산정 불가**: 분석 결과의 신뢰도를 체계적으로 계산하지 못함
4. **유지보수 어려움**: 이미지 처리 개선 시 모든 모듈 수정 필요

## 결정 (Decision)

**4단계 Core Image Engine (CIE) 파이프라인**을 공유 커널로 구축합니다:

```
┌─────────────────────────────────────────────────────────────┐
│                    Core Image Engine                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CIE-1: 이미지 품질 검증                                     │
│    └── 해상도, 조명, 선명도, 얼굴 감지                       │
│                      ↓                                       │
│  CIE-2: 얼굴 랜드마크 추출                                   │
│    └── 68점 랜드마크, 포즈 추정, 대칭성                      │
│                      ↓                                       │
│  CIE-3: 조명 보정 알고리즘                                   │
│    └── 화이트밸런스, 색온도 보정, Lab 색공간 변환            │
│                      ↓                                       │
│  CIE-4: ROI(관심 영역) 추출                                  │
│    └── 피부존, 혈관 영역, 체형 랜드마크                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 신뢰도 전파 모델

```
최종 신뢰도 = CIE-1 × CIE-2 × CIE-3 × CIE-4 × 분석모듈

예시: 0.90 × 0.95 × 0.85 × 0.92 × 0.88 = 0.59 (59%)
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| 각 모듈 독립 처리 유지 | 모듈간 독립성 | 코드 중복, 일관성 부재 | `LOW_ROI` - 장기 유지보수 비용 증가 |
| 외부 이미지 처리 서비스 | 검증된 기술 | 비용, 의존성 | `FINANCIAL_HOLD` - 비용 대비 효과 불확실 |
| Gemini Vision 직접 사용 | 간단한 구현 | 품질 제어 불가, 비용 | `LOW_ROI` - 세밀한 품질 제어 필요 |

## 결과 (Consequences)

### 긍정적 결과

- **코드 재사용**: 모든 분석 모듈이 동일한 전처리 파이프라인 사용
- **일관된 품질**: 동일한 이미지 → 동일한 전처리 결과
- **신뢰도 투명성**: 사용자에게 분석 신뢰도를 수치로 제공
- **유지보수 용이**: 이미지 처리 개선이 모든 모듈에 자동 적용

### 부정적 결과

- **초기 구현 비용**: Phase 1에 20시간 소요
- **복잡도 증가**: 파이프라인 단계별 의존성 관리 필요

### 리스크

- CIE 장애 시 모든 분석 모듈 영향 → **Feature Flag로 롤백 대비**

## 구현 현황

### 구현 상태 (2026-01-19)

| 단계 | 구현 상태 | 비고 |
|------|----------|------|
| **CIE-1** (품질 검증) | ⏳ Gemini VLM 대체 | 이미지 품질을 Gemini가 직접 판단 |
| **CIE-2** (랜드마크) | ⏳ Gemini VLM 대체 | 얼굴 감지를 Gemini가 직접 처리 |
| **CIE-3** (조명 보정) | ❌ 미구현 | HSL 기반 밝기 조절로 대체 (ADR-026) |
| **CIE-4** (ROI 추출) | ⏳ 부분 구현 | 드레이프 영역 마스킹만 구현 |

### 현재 전략: Gemini VLM 직접 처리

```
┌─────────────────────────────────────────────────────────────┐
│                   현재 구현 (Simplified)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  클라이언트                                                   │
│  ├── 이미지 캡처/업로드                                      │
│  └── 드레이핑 시뮬레이션 (HSL, ADR-026)                     │
│                      ↓                                       │
│  서버                                                        │
│  └── Gemini VLM에서 품질/얼굴/색상 분석 일괄 처리           │
│                      ↓                                       │
│  결과                                                        │
│  └── 웜/쿨톤, 계절, 신뢰도 반환                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 향후 CIE 파이프라인 전환 조건

| 조건 | 설명 |
|------|------|
| Gemini 비용 증가 | API 호출 비용이 로컬 처리보다 높아질 때 |
| 정밀 분석 필요 | ΔE 색차 기반 제품 매칭 등 |
| 오프라인 지원 | 네트워크 없이 분석 필요 시 |
| 실시간 피드백 | 카메라 프리뷰 중 실시간 가이드 |

## 구현 가이드

### 파일 구조

```
lib/image-engine/          # 향후 구현 예정
├── index.ts                 # 통합 export
├── types.ts                 # 공통 타입
├── constants.ts             # 임계값 상수
├── quality-validator.ts     # CIE-1
├── landmark-extractor.ts    # CIE-2
├── lighting-corrector.ts    # CIE-3
└── roi-extractor.ts         # CIE-4

lib/analysis/              # 현재 구현
├── canvas-utils.ts          # HSL 색공간 유틸
└── drape-reflectance.ts     # 드레이핑 시뮬레이션
```

### 타입 정의

```typescript
interface CoreEngineResult {
  qualityResult: ImageQualityResult;
  landmarkResult: FaceLandmarkResult;
  correctionResult?: LightingCorrectionResult;
  roiResult?: PersonalColorROI | SkinAnalysisROI;
  processingTime: number;
  pipelineVersion: string;
}
```

## 리서치 티켓

```
[CIE-1-R1] 이미지 품질 평가 알고리즘
────────────────────────────────────
claude.ai 딥 리서치 요청:
1. Laplacian variance vs Sobel gradient sharpness 측정 비교
2. 색온도 추정 알고리즘 (Von Kries, CAT02)
3. 클라이언트(Canvas API) vs 서버(Sharp) 구현 차이

→ 결과를 Claude Code에서 구현
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 이미지 처리](../principles/image-processing.md) - Laplacian variance, 색온도 보정
- [원리: 색채학](../principles/color-science.md) - Lab 색공간, 피부톤 분석

### 관련 ADR
- [ADR-007: Mock Fallback 전략](./ADR-007-mock-fallback-strategy.md)

### 구현 스펙
- [SDD-S1-PROFESSIONAL-ANALYSIS](../specs/SDD-S1-PROFESSIONAL-ANALYSIS.md) - 피부 분석
- [SDD-VISUAL-SKIN-REPORT](../specs/SDD-VISUAL-SKIN-REPORT.md) - 시각적 피부 리포트
- [SDD-PHASE-E-SKIN-ZOOM](../specs/SDD-PHASE-E-SKIN-ZOOM.md) - 피부 확대 분석
- [PC1-detailed-evidence-report](../specs/PC1-detailed-evidence-report.md) - 퍼스널컬러 근거 리포트

### 관련 규칙
- [Prompt Engineering Rules](../../.claude/rules/prompt-engineering.md)

---

**Author**: Claude Code
**Reviewed by**: -
