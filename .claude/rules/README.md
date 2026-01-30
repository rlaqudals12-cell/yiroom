# 규칙 인덱스 (Rules Index)

> **Version**: 2.0 | **Updated**: 2026-01-28

> 이룸 프로젝트 코딩 규칙 및 표준 가이드

---

## 빠른 탐색

| 카테고리                      | 파일 수 | 설명                        |
| ----------------------------- | ------- | --------------------------- |
| [제1원칙](#1-제1원칙-최우선)  | 3개     | 모든 규칙의 기반            |
| [코드 스타일](#2-코드-스타일) | 5개     | 코딩 표준, 패턴             |
| [프레임워크](#3-프레임워크)   | 3개     | Next.js, React, Mobile      |
| [데이터](#4-데이터)           | 2개     | 마이그레이션, Mock Fallback  |
| [AI/ML](#5-aiml)              | 4개     | AI 통합, 프롬프트, Hybrid   |
| [품질](#6-품질)               | 3개     | 테스트, 보안, 코드 리뷰     |
| [운영](#7-운영)               | 4개     | Git, Feature Flags, 디버깅  |
| [설계 원칙](#8-설계-원칙)     | 1개     | OCP, 확장성                 |

**총 규칙 파일**: 25개

---

## 1. 제1원칙 (최우선)

> 모든 규칙보다 우선. 작업 시작 전 필수 확인.

| 파일                                               | 핵심 내용                            | P 원칙   |
| -------------------------------------------------- | ------------------------------------ | -------- |
| [00-first-principles.md](./00-first-principles.md) | P0~P8 원칙, Quality Gates G0~G7      | **전체** |
| [principles-guide.md](./principles-guide.md)       | 원리 문서 작성 가이드, P7 워크플로우 | P2, P7   |
| [encapsulation.md](./encapsulation.md)             | 모듈 경계, Barrel Export, 호출 방향  | P8       |

---

## 2. 코드 스타일

| 파일                                                       | 용도                           | 관련 원칙  |
| ---------------------------------------------------------- | ------------------------------ | ---------- |
| [code-style.md](./code-style.md)                           | TypeScript, 네이밍, 주석 규칙  | P4: 단순화 |
| [typescript-strict.md](./typescript-strict.md)             | TypeScript Strict 모드, 타입 안전성 | P4     |
| [react-patterns.md](./react-patterns.md)                   | 컴포넌트, Hooks, 상태 관리     | P3, P4     |
| [error-handling-patterns.md](./error-handling-patterns.md) | 3단계 폴백, 에러 분류          | P4         |
| [api-design.md](./api-design.md)                           | REST API, 버전 관리, 응답 형식 | P3, P4     |

---

## 3. 프레임워크

| 파일                                             | 용도                          | 관련 원칙 |
| ------------------------------------------------ | ----------------------------- | --------- |
| [nextjs-conventions.md](./nextjs-conventions.md) | App Router, Server Components | P2        |
| [mobile-patterns.md](./mobile-patterns.md)       | Expo, React Native, 오프라인  | P2        |
| [supabase-db.md](./supabase-db.md)               | RLS, 클라이언트, JSONB        | P2        |

---

## 4. 데이터

| 파일                                               | 용도                          | 관련 원칙 |
| -------------------------------------------------- | ----------------------------- | --------- |
| [db-migration-rules.md](./db-migration-rules.md)   | 마이그레이션 워크플로우, 롤백 | P3, P7    |
| [hybrid-data-pattern.md](./hybrid-data-pattern.md) | Mock Fallback, AI 타임아웃    | P4        |

---

## 5. AI/ML

| 파일                                             | 용도                     | 관련 원칙 |
| ------------------------------------------------ | ------------------------ | --------- |
| [ai-integration.md](./ai-integration.md)         | Gemini 통합, 폴백 전략   | P2        |
| [prompt-engineering.md](./prompt-engineering.md) | 프롬프트 작성, 출력 검증 | P2        |
| [ai-code-review.md](./ai-code-review.md)         | AI 생성 코드 리뷰, Vibe Coding 방지 | P0, P3 |
| [feature-flags.md](./feature-flags.md)           | 점진적 출시, 롤백 트리거 | P5, P6    |

---

## 6. 품질

| 파일                                               | 용도                             | 관련 원칙 |
| -------------------------------------------------- | -------------------------------- | --------- |
| [testing-patterns.md](./testing-patterns.md)       | 단위/통합/E2E 테스트             | P3        |
| [security-checklist.md](./security-checklist.md)   | OWASP Top 10, RLS, Rate Limiting | P0        |
| [performance-guidelines.md](./performance-guidelines.md) | Core Web Vitals, 번들 최적화 | P5        |

---

## 7. 운영

| 파일                                           | 용도                              | 관련 원칙 |
| ---------------------------------------------- | --------------------------------- | --------- |
| [git-workflow.md](./git-workflow.md)           | 브랜치 전략, Conventional Commits | P6, P7    |
| [server-debugging.md](./server-debugging.md)   | Next.js 16 서버 디버깅 가이드     | P5        |
| [sisyphus-trigger.md](./sisyphus-trigger.md)   | 시지푸스 자동 트리거 규칙         | P3        |
| [agent-roadmap.md](./agent-roadmap.md)         | 에이전트 로드맵, 도입 기준        | P6        |

---

## 8. 설계 원칙

| 파일                                 | 용도                            | 관련 원칙 |
| ------------------------------------ | ------------------------------- | --------- |
| [ocp-patterns.md](./ocp-patterns.md) | OCP 적용 패턴, Strategy/Adapter | P4, P8    |

> **적용 시점**: 새 기능 추가 시에만 적용. 기존 안정 코드는 리팩토링하지 않음.

---

## P0-P8 원칙별 규칙 매핑

| 원칙                  | 관련 규칙 파일                                                                                      |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| **P0: 요구사항 의심** | security-checklist.md, ai-code-review.md                                                            |
| **P1: 궁극의 형태**   | principles-guide.md                                                                                 |
| **P2: 원리 우선**     | ai-integration.md, supabase-db.md, nextjs-conventions.md, mobile-patterns.md, prompt-engineering.md |
| **P3: 원자 분해**     | testing-patterns.md, react-patterns.md, api-design.md, db-migration-rules.md, sisyphus-trigger.md   |
| **P4: 단순화**        | code-style.md, typescript-strict.md, error-handling-patterns.md, hybrid-data-pattern.md             |
| **P5: 속도**          | performance-guidelines.md, feature-flags.md, server-debugging.md                                    |
| **P6: 자동화**        | git-workflow.md, feature-flags.md, agent-roadmap.md                                                 |
| **P7: 워크플로우**    | principles-guide.md, db-migration-rules.md, git-workflow.md                                         |
| **P8: 모듈 경계**     | encapsulation.md, ocp-patterns.md                                                                   |

---

## 사용 가이드

### 새 기능 개발 시

```
1. 00-first-principles.md → P0~P8 확인
2. principles-guide.md → 원리 문서 확인/작성
3. 관련 규칙 파일 참조 (react-patterns, api-design 등)
4. testing-patterns.md → 테스트 작성
5. security-checklist.md → 보안 체크
```

### 버그 수정 시

```
1. 00-first-principles.md → "근본 원인인가, 증상인가?"
2. error-handling-patterns.md → 적절한 에러 처리
3. testing-patterns.md → 회귀 테스트 추가
```

### 코드 리뷰 시

```
1. code-style.md → 스타일 준수
2. security-checklist.md → OWASP 체크
3. encapsulation.md → 모듈 경계 준수
```

---

## 네비게이션

| 목적             | 문서                                                         |
| ---------------- | ------------------------------------------------------------ |
| 전체 문서 진입점 | [docs/INDEX.md](../../docs/INDEX.md)                         |
| 제1원칙          | [FIRST-PRINCIPLES.md](../../docs/FIRST-PRINCIPLES.md)        |
| 원리 인덱스      | [docs/principles/README.md](../../docs/principles/README.md) |
| ADR 인덱스       | [docs/adr/README.md](../../docs/adr/README.md)               |
| 스펙 인덱스      | [docs/specs/README.md](../../docs/specs/README.md)           |
| 에이전트 인덱스  | [.claude/agents/README.md](../agents/README.md)              |
| 명령어 인덱스    | [.claude/commands/README.md](../commands/README.md)          |

---

**Author**: Claude Code
