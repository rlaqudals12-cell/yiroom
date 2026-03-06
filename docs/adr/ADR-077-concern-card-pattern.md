# ADR-077: ConcernCard 패턴 + MetricBarGaugeList Collapsible

> **상태**: 승인됨 (Accepted)
> **날짜**: 2026-03-07
> **결정자**: 개발팀

## 맥락 (Context)

피부 분석 상세 리포트(AnalysisResult)에서 Layer 0(종합 점수)에서 바로 Layer 2(MetricBarGaugeList 상세 수치)로 넘어가는 구조적 문제가 있음.

- **Layer 1 (Concern Overview) 부재**: 사용자가 "내 피부의 전체 그림"을 한눈에 시각적으로 파악할 수 없음
- **MetricBarGaugeList 7-8개 세로 나열**: 스크롤이 길고, 각 메트릭의 상대적 우선순위 파악이 어려움
- **경쟁사 대비 부족**: 피부 고민별 클로즈업 일러스트/아이콘 그리드가 업계 표준화 추세

### 5-Layer 리포트 모델 분석

| Layer                   | 역할                      | 현재 달성 |
| ----------------------- | ------------------------- | --------- |
| 0. Emotional Hook       | 한 문장 요약 + 점수       | 80%       |
| **1. Concern Overview** | **고민별 시각 스캔**      | **0%**    |
| 2. Deep Metrics         | 데이터 상세 + 동년배 비교 | 90%       |
| 3. Action               | 성분/루틴/제품 추천       | 85%       |
| 4. Trust                | 근거 + AI 고지            | 75%       |

## 결정 (Decision)

### D1: ConcernCard 공통 컴포넌트 도입

분석 메트릭을 카드 단위로 시각화하는 공통 컴포넌트를 도입한다.

- 아이콘 + 점수 + 심각도 배지 + 한 줄 팁
- 2열 반응형 그리드 (ConcernGrid)
- Strengths-First 정렬 (점수 높은 순)
- Triple Encoding (색상 + 아이콘 + 텍스트) 접근성

### D2: MetricBarGaugeList Collapsible 래핑

기존 MetricBarGaugeList를 Collapsible 안에 넣어 기본 접힘 상태로 변경한다.

- ConcernCard가 Layer 1 (개요), MetricBarGaugeList가 Layer 2 (상세)
- "상세 수치 보기" 토글로 펼침
- Miller's Law 준수: 화면 정보 청크 6개 이하 유지

### D3: 크로스-모듈 재사용 설계

ConcernCard/ConcernGrid를 `components/analysis/common/`에 배치하여 향후 모든 분석 모듈에서 재사용 가능하게 한다.

- 피부(8개), 체형(6개), 헤어(5개), 메이크업(4개), 구강(4개)
- 타입: `types/analysis-concern.ts`에 공통 인터페이스 정의

## 대안 (Alternatives Considered)

### A. MetricBarGaugeList에 아이콘만 추가 (기각)

- 기존 세로 나열 구조 유지 → Layer 1 개요 역할 불가
- "한눈에 전체 파악" 불가능
- Miller's Law 위반 지속

### B. 카드형 그리드 (채택)

- 2열 그리드로 한 화면에 4개씩 표시
- 3초 내 전체 스캔 가능
- Progressive Disclosure: 탭 → MetricDetailCard Sheet
- 크로스-모듈 재사용 가능

### C. 탭 분리 (메트릭별 탭) (기각)

- Hick's Law 위반 (탭 선택 = 추가 결정)
- 전체 그림 한눈에 파악 불가
- 기존 basic/evidence/visual 탭과 중복

## 근거 (Rationale)

### UX 원칙

- **V1 (Progressive Disclosure)**: Layer 0 → Layer 1(ConcernCard) → Layer 2(MetricDetail) → Layer 3(과학적 배경)
- **V2 (Strengths-First)**: 점수 높은 순 정렬 → 긍정 경험 먼저
- **V3 (Triple Encoding)**: 적록 색맹 접근성 보장
- **V4 (Concern Card 패턴)**: 1카드 = 1메트릭, 시각적 일관성
- **V5 (Information Chunking)**: ConcernGrid = 1개 청크 (내부 8카드)

### Miller's Law 준수

변경 전: 정보 블록 17-22개 (위반)
변경 후: 6개 청크 (A: 첫인상 3 / B: 고민 개요 1 / C: 시각화 1 / D: 인사이트 1 / E: 실행 3 / F: 신뢰 2)

## 영향 (Consequences)

### 긍정적

- Layer 1 달성: 0% → 80%
- 전체 리포트 완성도: 70% → 85%
- 사용자 메트릭 파악 시간: 스크롤 30초 → 스캔 3초
- 크로스-모듈 확장 기반 마련

### 부정적/주의

- basic 탭 전체 높이 증가 (ConcernGrid 추가분)
- MetricBarGaugeList가 기본 접힘 → 상세 수치 접근에 한 단계 추가
- Phase B (Gemini 일러스트)까지 아이콘만으로 시각적 풍부함 제한

## 관련 문서

- [UX 디자인 원칙 V1-V5](../principles/ux-design.md#8-시각화-원칙-visualization-principles)
- [SDD-CONCERN-CARD](../specs/SDD-CONCERN-CARD.md) (작성 예정)
- [피부 생리학 원리](../principles/skin-physiology.md)

---

**Version**: 1.0 | **Created**: 2026-03-07
