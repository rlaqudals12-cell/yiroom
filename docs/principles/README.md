# 기술 원리 문서

> 이룸 프로젝트의 도메인별 기본 원리
>
> **규칙**: 코드 작성 전에 관련 원리를 먼저 문서화한다. (P2: 원리 우선)

## 문서 목록

| 문서 | 도메인 | 소스 리서치 | 버전 |
|------|--------|------------|------|
| [color-science.md](color-science.md) | 색채학 (퍼스널컬러) | PC-1, PC-2, CIE-3 | 1.0 |
| [skin-physiology.md](skin-physiology.md) | 피부 생리학 | S-1, S-2 | 1.0 |
| [body-mechanics.md](body-mechanics.md) | 체형 역학 | C-1, C-2, W-2 | 1.0 |
| [image-processing.md](image-processing.md) | 이미지 처리 | CIE-1~4 | 1.0 |
| [design-system.md](design-system.md) | 디자인 시스템 | INF-1~4 | 1.0 |
| [security-patterns.md](security-patterns.md) | 보안 아키텍처 | P0-3~7, SEC-1~8 | **2.0** |
| [legal-compliance.md](legal-compliance.md) | 법적 준수 | N-1~4, C-2~4 | **2.0** |
| [ai-inference.md](ai-inference.md) | AI 추론 | AI-1~8 | **2.0** |
| [rag-retrieval.md](rag-retrieval.md) | RAG 검색 | RAG-OPT-1~4, EMB-1~4, VDB-1~4 | **1.0 (신규)** |
| [nutrition-science.md](nutrition-science.md) | 영양학 | N-1, COMBO-SKIN-NUTRITION | 1.0 |
| [exercise-physiology.md](exercise-physiology.md) | 운동생리학 | W-1, COMBO-BODY-EXERCISE | 1.0 |
| [cross-domain-synergy.md](cross-domain-synergy.md) | 크로스 도메인 시너지 | COMBO-1~10 | 1.0 |
| [oral-health.md](oral-health.md) | 구강 건강 | OH-1-BUNDLE | 1.0 |
| [skin-procedures.md](skin-procedures.md) | 피부 시술 | SK-1~6 | 1.0 |
| [db-migration.md](db-migration.md) | DB 마이그레이션 | DB-1~4, DFA, ACID | **2.0** |
| [hybrid-data.md](hybrid-data.md) | Hybrid 데이터 패턴 | ADR-002, ADR-007 | **1.0 (신규)** |
| [api-design.md](api-design.md) | API 설계 | ADR-020, API-1~4 | **1.0 (신규)** |
| [performance.md](performance.md) | 성능 최적화 | ADR-014, ADR-019 | **1.0 (신규)** |
| [coaching-psychology.md](coaching-psychology.md) | AI 코칭 심리학 | TTM, SDT, MI, GROW | **1.0 (신규)** |
| [personalization-engine.md](personalization-engine.md) | 개인화 추천 엔진 | ADR-036, COMBO-1~10, 3-3-3 Rule | **2.1** |
| [extensibility.md](extensibility.md) | 확장성 원리 (OCP) | SOLID, DIP, Strategy/Adapter | **1.0 (신규)** |
| [fashion-matching.md](fashion-matching.md) | 패션 매칭 | J-1, P-2, P-3 스타일링 AI | **1.0 (신규)** |
| [hair-makeup-analysis.md](hair-makeup-analysis.md) | 헤어/메이크업 분석 | H-1, M-1 분석 원리 | **1.0 (신규)** |
| [accessibility.md](accessibility.md) | 접근성 | WCAG 2.1 AA, WAI-ARIA, POUR | **1.0 (신규)** |
| [lesion-analysis.md](lesion-analysis.md) | 피부 병변 분석 | S-2, 트러블/병변 감지 | **1.0 (신규)** |
| [stretching-physiology.md](stretching-physiology.md) | 스트레칭 생리학 | W-2, ROM, 유연성 | **1.0 (신규)** |
| [risk-exercise-criteria.md](risk-exercise-criteria.md) | 위험 운동 기준 | W-2, 금기사항, PAR-Q+ | **1.0 (신규)** |
| [color-matching-theory.md](color-matching-theory.md) | 색상 매칭 이론 | PC-1, PC-2, 색상 조화 | **1.0 (신규)** |
| [3d-face-shape.md](3d-face-shape.md) | 3D 얼굴 형태 분석 | C-1, C-2, MediaPipe | **1.0 (신규)** |

## 폴더 구조

```
docs/principles/
├── README.md                # 이 파일 (인덱스)
├── color-science.md         # 색채학 (PC-1, PC-2, 퍼스널컬러)
├── skin-physiology.md       # 피부 생리학 (S-1, S-2, 피부분석)
├── body-mechanics.md        # 체형 역학 (C-1, C-2, 체형분석)
├── image-processing.md      # 이미지 처리 (CIE-1~4)
├── design-system.md         # 디자인 시스템 (INF-1~4)
├── security-patterns.md     # 보안 아키텍처 (P0-3~7, SEC-1~8) ✅ v2.0
├── legal-compliance.md      # 법적 준수 (N-1~4, C-2~4) ✅ v2.0
├── ai-inference.md          # AI 추론 (AI-1~8) ✅ v2.0
├── rag-retrieval.md         # RAG 검색 (RAG-OPT, EMB, VDB) ✅ 신규
├── nutrition-science.md     # 영양학 (N-1, COMBO-SKIN-NUTRITION)
├── exercise-physiology.md   # 운동생리학 (W-1, COMBO-BODY-EXERCISE)
├── cross-domain-synergy.md  # 크로스 도메인 시너지 (COMBO-1~10)
├── oral-health.md           # 구강 건강
├── skin-procedures.md       # 피부 시술 (SK-1~6)
├── db-migration.md          # DB 마이그레이션 ✅ 신규
├── hybrid-data.md           # Hybrid 데이터 패턴 ✅ 신규
├── api-design.md            # API 설계 ✅ 신규
├── performance.md           # 성능 최적화 ✅ 신규
├── coaching-psychology.md   # AI 코칭 심리학 ✅ 신규
├── personalization-engine.md # 개인화 추천 엔진 (3-3-3 Rule, V1~V3) ✅ 신규
├── extensibility.md         # 확장성 원리 (OCP, DIP, ISP) ✅ 신규
├── fashion-matching.md      # 패션 매칭 (J-1, P-2, P-3) ✅ 신규
├── hair-makeup-analysis.md  # 헤어/메이크업 분석 (H-1, M-1) ✅ 신규
├── accessibility.md         # 접근성 (WCAG 2.1 AA, WAI-ARIA) ✅ 신규
├── lesion-analysis.md       # 피부 병변 분석 (S-2, 트러블/병변) ✅ 신규
├── stretching-physiology.md # 스트레칭 생리학 (W-2, ROM) ✅ 신규
├── risk-exercise-criteria.md # 위험 운동 기준 (W-2, PAR-Q+) ✅ 신규
├── color-matching-theory.md # 색상 매칭 이론 (PC-1, PC-2) ✅ 신규
└── 3d-face-shape.md         # 3D 얼굴 형태 분석 (C-1, C-2) ✅ 신규
```

## 원리 문서 템플릿

```markdown
# [도메인명] 원리

> 이 문서는 [모듈명]의 기반이 되는 기본 원리를 설명한다.

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"[도메인]의 완벽한 이해와 적용"

- [제약 없는 이상적 상태 1]
- [제약 없는 이상적 상태 2]
```

### 물리적 한계

| 항목 | 한계 |
|------|------|
| [한계 항목] | [구체적 제약 설명] |

### 100점 기준

- [측정 가능한 기준 1]
- [측정 가능한 기준 2]

### 현재 목표: X%

- [이번 문서에서 다루는 범위]

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| [제외 항목] | [제외 이유] | [재검토 조건] |

## 1. 핵심 개념

### 1.1 [개념명]
[학문적/과학적 정의]

### 1.2 [개념명]
[학문적/과학적 정의]

## 2. 수학적/물리학적 기반

### 2.1 [공식/법칙명]
```
[수식 또는 공식]
```

### 2.2 적용 방법
[원리를 코드로 변환하는 방법]

## 3. 구현 도출

### 3.1 원리 → 알고리즘
[원리에서 알고리즘을 도출하는 논리]

### 3.2 알고리즘 → 코드
[알고리즘의 코드 구현 방향]

## 4. 검증 방법

### 4.1 원리 준수 검증
[구현이 원리를 위반하지 않았는지 확인하는 방법]

## 5. 참고 자료

- [논문/문서 링크]
- [학술 자료]

---

**Version**: 1.0 | **Updated**: YYYY-MM-DD
```

> **참조**: [P1-SECTION-TEMPLATE.md](../templates/P1-SECTION-TEMPLATE.md) - P1 섹션 상세 작성 가이드

## 양방향 링크 현황

> 원리 문서 ↔ 구현 스펙/ADR 간 양방향 참조

### 완료된 양방향 링크 (핵심 7개)

| 원리 문서 | 구현 스펙 | 관련 ADR |
|----------|----------|----------|
| nutrition-science.md | SDD-N1-NUTRITION | ADR-030 |
| exercise-physiology.md | SDD-W1-WORKOUT | ADR-031 |
| skin-physiology.md | SDD-SKIN-ANALYSIS-v2 | ADR-003, ADR-010 |
| color-science.md | SDD-PERSONAL-COLOR-v2 | ADR-026 |
| body-mechanics.md | SDD-BODY-ANALYSIS-v2 | ADR-005 |
| image-processing.md | SDD-CIE-1~4 | ADR-001, ADR-033 |
| ai-inference.md | - | ADR-003, ADR-007, ADR-010, ADR-024 |

### 관련 문서 섹션 표준 구조

```markdown
## N. 관련 문서

### 구현 스펙 (이 원리를 적용하는 문서)
| 문서 | 설명 |
|------|------|
| [SDD-XXX](../specs/SDD-XXX.md) | 모듈 스펙, P3 원자 분해 |

### 관련 원리 문서
| 문서 | 설명 |
|------|------|
| [other-principle.md](./other-principle.md) | 관련 원리 |
```

## 관련 규칙

- `.claude/rules/00-first-principles.md` → P2: 원리 우선
- 코드는 원리의 구현체일 뿐, 원리 없는 코드는 금지

---

**Version**: 5.0 | **Created**: 2026-01-15 | **Updated**: 2026-01-29

### 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 5.0 | 2026-01-29 | P3 원리 문서 5개 신규 추가 (lesion-analysis, stretching-physiology, risk-exercise-criteria, color-matching-theory, 3d-face-shape) |
| 4.4 | 2026-01-23 | accessibility.md 신규 추가 (WCAG 2.1 AA, WAI-ARIA, POUR 원칙) |
| 4.3 | 2026-01-23 | fashion-matching.md, hair-makeup-analysis.md 인덱스 추가 |
| 4.2 | 2026-01-22 | extensibility.md 신규 추가 (OCP, DIP, ISP, Strategy/Adapter 패턴) |
| 4.1 | 2026-01-22 | db-migration.md v2.0 - DFA 형식 정의, 안전성 메트릭, ACID 검증, 학술 인용 추가 (P3 강화) |
| 4.0 | 2026-01-22 | personalization-engine.md 신규 추가 (Smart Combination Engine V1/V2/V3) |
| 3.0 | 2026-01-21 | db-migration, hybrid-data, api-design, performance 원리 문서 4개 신규 추가 |
| 2.0 | 2026-01-19 | rag-retrieval.md 신규, security/legal/ai 문서 v2.0 업데이트 반영 |
| 1.0 | 2026-01-15 | 초기 버전 |
