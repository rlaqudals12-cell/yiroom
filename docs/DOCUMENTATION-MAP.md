# 문서 의존성 맵

> **Version**: 1.0 | **Created**: 2026-01-19 | **Updated**: 2026-01-19

> 이룸 프로젝트 문서 간 의존성 관계를 시각화한 맵

---

## 1. 전체 구조

```mermaid
graph TB
    subgraph "📚 문서 계층"
        FP[FIRST-PRINCIPLES.md] --> ARCH[ARCHITECTURE.md]
        ARCH --> PRINCIPLES[principles/]
        PRINCIPLES --> ADR[adr/]
        ADR --> SPECS[specs/]
        SPECS --> CODE[구현 코드]
    end

    subgraph "🔄 피드백 루프"
        CODE -.-> SPECS
        SPECS -.-> ADR
        ADR -.-> PRINCIPLES
    end
```

---

## 2. 원리 → ADR 의존성

```mermaid
graph LR
    subgraph "원리 문서"
        CS[color-science.md]
        SP[skin-physiology.md]
        BM[body-mechanics.md]
        AI[ai-inference.md]
        LC[legal-compliance.md]
        SEC[security-patterns.md]
        NS[nutrition-science.md]
        EP[exercise-physiology.md]
        IP[image-processing.md]
        RR[rag-retrieval.md]
        DS[design-system.md]
        CMS[cross-domain-synergy.md]
    end

    subgraph "ADR"
        ADR001[ADR-001<br/>Core Image Engine]
        ADR003[ADR-003<br/>AI Model Selection]
        ADR010[ADR-010<br/>AI Pipeline]
        ADR011[ADR-011<br/>Cross Module]
        ADR022[ADR-022<br/>Age Verification]
        ADR024[ADR-024<br/>AI Transparency]
        ADR025[ADR-025<br/>Audit Logging]
        ADR030[ADR-030<br/>Nutrition Module]
        ADR031[ADR-031<br/>Workout Module]
    end

    CS --> ADR001
    CS --> ADR003
    SP --> ADR001
    SP --> ADR010
    BM --> ADR031
    AI --> ADR003
    AI --> ADR010
    LC --> ADR022
    LC --> ADR024
    LC --> ADR025
    SEC --> ADR025
    NS --> ADR030
    EP --> ADR031
    IP --> ADR001
    CMS --> ADR011
```

---

## 3. ADR → 스펙 의존성

```mermaid
graph LR
    subgraph "ADR"
        A022[ADR-022<br/>Age Verification]
        A024[ADR-024<br/>AI Transparency]
        A025[ADR-025<br/>Audit Logging]
        A030[ADR-030<br/>Nutrition]
        A031[ADR-031<br/>Workout]
        A027[ADR-027<br/>Coach AI]
        A028[ADR-028<br/>Social Feed]
        A029[ADR-029<br/>Affiliate]
    end

    subgraph "스펙"
        S01[SDD-N-1-AGE-VERIFICATION]
        S02[SDD-AI-TRANSPARENCY]
        S03[SDD-AUDIT-LOGGING]
        S04[SDD-N1-NUTRITION]
        S05[SDD-W1-WORKOUT]
        S06[SDD-COACH-AI-CHAT]
        S07[SDD-SOCIAL-FEED]
        S08[SDD-AFFILIATE-INTEGRATION]
    end

    A022 --> S01
    A024 --> S02
    A025 --> S03
    A030 --> S04
    A031 --> S05
    A027 --> S06
    A028 --> S07
    A029 --> S08
```

---

## 4. 모듈별 문서 체인

### 4.1 피부 분석 (S-1)

```mermaid
graph TD
    P1[skin-physiology.md] --> ADR1[ADR-001<br/>Image Engine]
    P2[ai-inference.md] --> ADR3[ADR-003<br/>AI Model]
    ADR1 --> ADR10[ADR-010<br/>AI Pipeline]
    ADR3 --> ADR10
    ADR10 --> S1[SDD-S1-*<br/>피부분석 스펙]
    S1 --> CODE1[app/api/analyze/skin/]
```

### 4.2 퍼스널컬러 (PC-1)

```mermaid
graph TD
    P1[color-science.md] --> ADR1[ADR-001<br/>Image Engine]
    P1 --> ADR26[ADR-026<br/>HSL Decision]
    ADR1 --> ADR10[ADR-010<br/>AI Pipeline]
    ADR26 --> PC1[SDD-PHASE-J-AI-STYLING]
    ADR10 --> PC1
    PC1 --> CODE1[app/api/analyze/personal-color/]
```

### 4.3 체형 분석 (C-1)

```mermaid
graph TD
    P1[body-mechanics.md] --> ADR1[ADR-001<br/>Image Engine]
    P1 --> ADR31[ADR-031<br/>Workout]
    ADR1 --> ADR10[ADR-010<br/>AI Pipeline]
    ADR10 --> C1[SDD-C1-*<br/>체형분석 스펙]
    ADR31 --> W1[SDD-W1-WORKOUT]
    C1 --> CODE1[app/api/analyze/body/]
```

### 4.4 영양 모듈 (N-1)

```mermaid
graph TD
    P1[nutrition-science.md] --> ADR30[ADR-030<br/>Nutrition]
    P2[cross-domain-synergy.md] --> ADR11[ADR-011<br/>Cross Module]
    ADR30 --> N1[SDD-N1-NUTRITION]
    ADR11 --> N1
    N1 --> CODE1[app/api/nutrition/]
```

### 4.5 운동 모듈 (W-1)

```mermaid
graph TD
    P1[exercise-physiology.md] --> ADR31[ADR-031<br/>Workout]
    P2[body-mechanics.md] --> ADR31
    ADR31 --> W1[SDD-W1-WORKOUT]
    ADR11[ADR-011<br/>Cross Module] --> W1
    W1 --> CODE1[app/api/workout/]
```

---

## 5. 법률/보안 문서 체인

```mermaid
graph TD
    subgraph "원리"
        LC[legal-compliance.md]
        SEC[security-patterns.md]
    end

    subgraph "ADR"
        A022[ADR-022<br/>Age]
        A023[ADR-023<br/>Terms]
        A024[ADR-024<br/>Transparency]
        A025[ADR-025<br/>Audit]
    end

    subgraph "스펙"
        S01[SDD-N-1-AGE-VERIFICATION]
        S02[SDD-AI-TRANSPARENCY]
        S03[SDD-AUDIT-LOGGING]
        S04[SDD-LEGAL-SUPPORT]
    end

    LC --> A022
    LC --> A023
    LC --> A024
    LC --> A025
    SEC --> A025

    A022 --> S01
    A024 --> S02
    A025 --> S03
    A023 --> S04
```

---

## 6. 크로스 모듈 연동

```mermaid
graph TB
    subgraph "분석 모듈"
        PC1[PC-1<br/>퍼스널컬러]
        S1[S-1<br/>피부]
        C1[C-1<br/>체형]
    end

    subgraph "웰니스 모듈"
        W1[W-1<br/>운동]
        N1[N-1<br/>영양]
    end

    subgraph "사회적 모듈"
        SOCIAL[소셜 피드]
        COACH[AI 코치]
    end

    subgraph "수익화"
        AFF[어필리에이트]
    end

    PC1 --> SOCIAL
    S1 --> N1
    S1 --> SOCIAL
    C1 --> W1
    C1 --> N1
    W1 <--> N1

    PC1 --> AFF
    S1 --> AFF
    N1 --> AFF
    W1 --> AFF

    PC1 --> COACH
    S1 --> COACH
    C1 --> COACH
    W1 --> COACH
    N1 --> COACH
```

---

## 7. 문서 통계

| 분류 | 개수 | 완성도 |
|------|------|--------|
| **원리 문서** | 15개 | 95% |
| **ADR** | 32개 | 100% |
| **스펙 문서** | 29개 | 90% |
| **규칙 문서** | 16개 | 100% |

### 7.1 역참조 현황

| 문서 유형 | ADR 역참조 | 스펙 역참조 |
|----------|-----------|------------|
| 원리 문서 | ✅ 14/14 | - |
| ADR | - | ✅ 5/5 (핵심) |

---

## 8. 문서 작성 순서 (P7 워크플로우)

> **정규 문서**: [.claude/rules/00-first-principles.md](../.claude/rules/00-first-principles.md#p7-워크플로우-순서-workflow-order)

**요약**: 리서치 → 원리 → ADR → 스펙 → 구현 (이 순서는 **절대적**)

---

## 9. 네비게이션

| 목적 | 문서 |
|------|------|
| 전체 문서 진입점 | [INDEX.md](INDEX.md) |
| 제1원칙 | [FIRST-PRINCIPLES.md](FIRST-PRINCIPLES.md) |
| 시스템 구조 | [ARCHITECTURE.md](ARCHITECTURE.md) |
| 원리 인덱스 | [principles/README.md](principles/README.md) |
| ADR 인덱스 | [adr/README.md](adr/README.md) |

---

**Version**: 1.0 | **Author**: Claude Code
