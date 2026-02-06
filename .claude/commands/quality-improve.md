---
description: 모듈 품질 개선 (3-Cycle 패턴)
---

# /quality-improve 명령어

모듈 단위 품질 개선을 3-Cycle 패턴으로 수행합니다.

## 연동 에이전트

- **yiroom-code-quality**: 코드 품질 검사 + 모듈 품질 채점
- **yiroom-test-writer**: 테스트 작성 (Cycle 3)
- **korean-ux-writer**: UX 텍스트 검수 (Cycle 2)
- **Explore**: 코드베이스 탐색 (초기 분석)

---

## 실행 워크플로우

```mermaid
graph TD
    A[/quality-improve 호출] --> B[모듈 식별]
    B --> C[현재 점수 측정]
    C --> D{등급 판단}
    D -->|S 95-100| E[유지보수 모드 - 사이클 불필요]
    D -->|A 85-94| F[1사이클만]
    D -->|B 70-84| G[2사이클]
    D -->|C 50-69| H[3사이클 전체]
    D -->|F 0-49| H2[P1 재정의 → 3사이클]
    F --> I[Cycle 2 또는 3]
    G --> J[Cycle 1 → 2]
    H --> K[Cycle 1 → 2 → 3]
    H2 --> K
    I --> L[최종 측정]
    J --> L
    K --> L
    L --> M[Before/After 보고]
```

---

## 실행 내용

$ARGUMENTS에 대해:

### 1. 초기 분석

**병렬 탐색** (Explore 에이전트 3개):

```
[병렬] Explore A: 컴포넌트 계층 (components/, app/)
[병렬] Explore B: 비즈니스 로직 (lib/)
[병렬] Explore C: 테스트/문서 현황 (tests/, docs/)
```

### 2. 현재 점수 측정

모듈 품질 점수 기준으로 채점 (100점):

| 영역        | 배점 | 측정                            |
| ----------- | ---- | ------------------------------- |
| 기능 완성도 | 20   | 스펙 대비 구현율                |
| 사용자 경험 | 20   | 여정/인지부담/멘탈모델/가치전달 |
| UX/접근성   | 15   | 로딩/에러/빈 상태               |
| 코드 품질   | 15   | TS strict, P8                   |
| 테스트      | 15   | 커버리지, 엣지케이스            |
| 성능/안정성 | 10   | 응답 시간, 폴백                 |
| 문서화      | 5    | 원리/ADR/스펙                   |

### 3. Cycle 실행

> 규칙 상세: `.claude/rules/quality-improvement-cycles.md`

#### Cycle 1: 기능 완성 + 핵심 버그

- 스펙 대비 누락 기능 구현
- Critical 버그 수정
- typecheck + lint + test 통과
- P8 모듈 경계 준수

#### Cycle 2: 사용자 경험 + UX 정제

- **사용자 여정** 검증 (불필요한 단계 제거)
- **인지적 부담** 최적화 (7±2 법칙)
- **멘탈 모델** 정합성 (용어/동작 일치)
- **에러 경험** 개선 (복구 경로 명확)
- UX 표면 점검 (로딩/에러/빈 상태)

#### Cycle 3: 시스템 품질

- 단위 테스트 보강
- 엣지케이스 커버리지
- 원리 문서/ADR 동기화

### 4. 각 사이클 완료 시

```
사이클 완료 → 커밋 → 중간 점수 측정 → 다음 사이클
```

---

## 출력 형식

```markdown
## 모듈 품질 개선 결과

### 대상 모듈: [모듈명]

### Before/After

| 영역        | Before    | After     | 변화   |
| ----------- | --------- | --------- | ------ |
| 기능 완성도 | X/20      | X/20      | +X     |
| 사용자 경험 | X/20      | X/20      | +X     |
| UX/접근성   | X/15      | X/15      | +X     |
| 코드 품질   | X/15      | X/15      | +X     |
| 테스트      | X/15      | X/15      | +X     |
| 성능/안정성 | X/10      | X/10      | +X     |
| 문서화      | X/5       | X/5       | +X     |
| **총점**    | **X/100** | **X/100** | **+X** |

### 등급 변화: [Before 등급] → [After 등급]

### 사이클별 요약

#### Cycle 1: 기능 완성

- [수정 사항 1]
- [수정 사항 2]

#### Cycle 2: 사용자 경험

- [개선 사항 1]
- [개선 사항 2]

#### Cycle 3: 시스템 품질

- [보강 사항 1]
- [보강 사항 2]

### 수정된 파일

- `path/to/file.ts` - 변경 내용
```

---

## 사용 예시

```bash
# 기본 사용 (모듈명 지정)
/quality-improve PC-1

# 피부 분석 모듈
/quality-improve S-1

# 헤어 분석 모듈 (긴급)
/quality-improve H-1
```

---

## 관련 명령어

| 명령어                     | 연계                   |
| -------------------------- | ---------------------- |
| /quality-improve → /qcheck | 개선 후 빠른 품질 확인 |
| /quality-improve → /review | 개선 후 종합 리뷰      |
| /qplan → /quality-improve  | 계획 후 품질 개선      |

## 관련 규칙

- [quality-improvement-cycles.md](../rules/quality-improvement-cycles.md) - 3-Cycle 규칙 상세
- [yiroom-code-quality.md](../agents/yiroom-code-quality.md) - 모듈 품질 채점 기준

---

**Version**: 1.0 | **Created**: 2026-02-06 | PC-1 검증 패턴 공식화
