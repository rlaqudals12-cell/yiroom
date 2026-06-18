# ADR-108: 축별 분석 정확도 업그레이드 로드맵 (방법론·연구 매핑)

- **Status**: accepted (로드맵 — 구현은 단계별)
- **Date**: 2026-06-17
- **관련**: [ADR-098](./ADR-098-identity-redefinition-5axis-model.md)(5축), [ADR-106](./ADR-106-demo-positioning-and-investment-staging.md)(투자 스테이징), [ADR-107](./ADR-107-recommendation-model-single-vs-cross-axis.md)(추천 모델), `.claude/rules/prompt-engineering.md`(Level 1-4)

---

## Context

"셀카 한 장으로 5축"의 정확도 우려 + 전문 방법론 도입 검토. 핵심 결론: **얼굴 4축(PC/피부/헤어얼굴형/메이크업)은 좋은 셀카로 충분, 체형은 전신 필요**. 이룸은 이미 강한 V2 엔진 보유(`body-v2` MediaPipe Pose 33랜드마크, `personal-color-v2` Lab 12톤, `skin-v2` 12-zone) + Level 2 프롬프트(논문 7편). 업그레이드 = "처음부터 만들기"가 아니라 **연구 기반 보강 + 통합 연결 + Level 3/4**.

⚠️ 범위 경계(ADR-098): **체형(C-1)=스타일링용 SHAPE**(코디). 자세/교정(거북목·골반·O다리·ROM)은 **off-thesis(PT/피트니스)·gated·"의료급 아님" 책임 리스크** → 핵심 제외. 사용자·기술 성장 후 별도·면책 트랙으로 재검토(B).

## Decision — 축별 업그레이드 방향

| 축                | 현재 자산                               | 연구 기반 업그레이드                                                                                                  | 비고                                                   |
| ----------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **체형(A, 우선)** | body-v2 MediaPipe Pose 33랜드마크       | **ASTM D5585** 어깨-힙·허리-힙 비율 분류(front+fitted 80-88%) + **멀티앵글(정면+측면)→±5mm** 둘레 + 격자/segmentation | 촬영 규율은 전문 자세시트에서 차용, _교정 목적은 제외_ |
| 피부              | skin-v2 12-zone+hydration               | **셀카 기반 TEWL/수분 추정**(arxiv 2509.06282) + **percentile 코호트**(동연령 상위 X%)                                | UV/cross-polarized=하드웨어 → 한계 정직 표기           |
| PC                | PC-2 Lab 12톤                           | **디지털 드레이핑**(사진 색 오버레이→시프트) + gold/silver·**손목 혈관** + 자연광/화밸 엄격검증(CIE-1)                | undertone 최난도 → 다중신호                            |
| 헤어              | face-shape + style-recommender(ADR-107) | 모발/두피는 셀카 한계 → 문진 보조 정직                                                                                | —                                                      |
| 메이크업          | PC+S 실행                               | **얼굴형별 기법**(컨투어·브로우) — face/eye/lip_shape 이미 저장                                                       | —                                                      |

### 공통 (모든 축)

- **percentile/코호트 비교** ("동연령·동타입 대비 상위 X%") — 신뢰·맥락.
- **축별 신뢰도 시각화 + 편집/override** (사용자가 보정).
- **촬영 품질 게이트(CIE-1)** 표면화 — 단일 셀카 정확도는 *장수*가 아니라 *조명/조건*이 변수.

### Level 체계 위치

프롬프트 Level 2(논문 7편)까지 완료 → 이 업그레이드 = **Level 3(과거 데이터)/4(코호트 통계) + 입력 방법론**(멀티앵글·디지털드레이핑·셀카TEWL).

## Staging (ADR-106 연계)

- 전부 **"조언/분석 정확도" 업그레이드 = 쇼핑 아님 → buildable**. 단 _기능 투자_.
- **지금**: 체형(A) 통합 연결 감사 → 멀티앵글 사다리 설계. (pose-detector 이미 존재)
- **투자 후**: 피부 percentile·셀카TEWL, PC 디지털드레이핑, 메이크업 기법 등 순차. 자세교정(B)은 그 이후 별도 트랙.

## Consequences

- 지원서 "기술 로드맵"의 근거(왜 정확하고 어디까지 갈지) + 개발 가이드.
- 각 축 실제 구현 시 P7 순서로 `docs/principles/`(body-mechanics·skin-physiology·color-science) + 스펙 갱신. (지금 전부 미리 작성 X)

## 연구 출처

- 체형: ASTM D5585(패션 사이징 표준); [arxiv 2409.17671](https://arxiv.org/html/2409.17671v3); [MDPI ResNet landmarks 96.6%](https://www.mdpi.com/2073-8994/12/12/1997); [Springer pose anthropometry](https://link.springer.com/chapter/10.1007/978-3-032-13029-7_5)
- 피부: [AI vs VISIA](https://www.banyanandbamboo.com/blog/ai-vs-visia-which-skin-analysis-is-right-for-you/); [셀카 TEWL/hydration arxiv 2509.06282](https://arxiv.org/html/2509.06282); [Perfect Corp](https://www.perfectcorp.com/business/blog/ai-skincare/visia-skin-analysis)
- PC: [IED 색채학](https://www.ied.edu/news/armocromy-science-colours-personal-styling); [Style Academy](https://www.styleacademyintl.com/post/mastering-seasonal-color-analysis)
- 신뢰도 UX: [Confidence Visualization Patterns](https://www.aiuxdesign.guide/patterns/confidence-visualization); [Uncertain AI Outputs](https://altersquare.medium.com/designing-interfaces-around-uncertain-ai-outputs-c9478dc08e72)
