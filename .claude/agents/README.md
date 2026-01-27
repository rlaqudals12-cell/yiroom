# 에이전트 인덱스 (Agents Index)

> **Version**: 1.0 | **Updated**: 2026-01-19

> 이룸 프로젝트 전문 AI 에이전트 가이드

---

## 빠른 탐색

| 에이전트                                            | 용도                   | 자동 호출 조건             |
| --------------------------------------------------- | ---------------------- | -------------------------- |
| [sisyphus-adaptive](#sisyphus-adaptive)             | 복잡도 기반 작업 분배  | 4+ 파일 수정, DB/인증 관련 |
| [korean-ux-writer](#korean-ux-writer)               | 한국어 UX 라이팅       | UX 텍스트 작성 요청        |
| [korean-beauty-validator](#korean-beauty-validator) | K-뷰티 트렌드 검증     | 뷰티 관련 분석             |
| [yiroom-code-quality](#yiroom-code-quality)         | 코드 품질 검사         | 코드 리뷰 요청             |
| [yiroom-spec-reviewer](#yiroom-spec-reviewer)       | 스펙 논리적 허점 검토  | 스펙 문서 리뷰             |
| [yiroom-test-writer](#yiroom-test-writer)           | 테스트 코드 작성       | 테스트 작성 요청           |
| [yiroom-ui-validator](#yiroom-ui-validator)         | 브랜드 가이드라인 검증 | UI 컴포넌트 리뷰           |

**총 에이전트**: 7개

---

## 에이전트 상세

### sisyphus-adaptive

> 복잡도 기반 적응형 오케스트레이터

**용도**: 복잡한 작업을 병렬로 분배하고 품질 관리

**호출 조건**:

- 4개 이상 파일 수정
- DB 스키마 또는 인증 관련 변경
- 새로운 패턴 도입
- `/sisyphus` 명령어 실행

**도구 접근**: Task, Read, Grep, Glob, Bash

**관련 명령어**: [sisyphus.md](../commands/sisyphus.md)

---

### korean-ux-writer

> 한국어 UX 라이팅 및 마이크로카피 최적화 전문가

**용도**:

- 버튼, 라벨, 에러 메시지 등 UX 텍스트 작성
- 한국어 자연스러움 검증
- 마이크로카피 최적화

**호출 조건**:

- UI 텍스트 작성/수정 요청
- 한국어 UX 검토 필요 시

**도구 접근**: Read, Edit, Grep

---

### korean-beauty-validator

> 한국 뷰티 트렌드 검증 및 K-뷰티 전문 분석 Agent

**용도**:

- K-뷰티 트렌드 검증
- 화장품 성분 분석 검토
- 피부 타입별 추천 검증

**호출 조건**:

- 뷰티/스킨케어 관련 분석
- 제품 추천 로직 검토

**도구 접근**: Read, Grep, WebSearch

---

### yiroom-code-quality

> 이룸 프로젝트 코드 품질 검사 및 개선점 제시

**용도**:

- 코드 품질 검사
- 리팩토링 제안
- 성능 최적화 포인트 식별

**호출 조건**:

- `/review` 명령어 실행
- 코드 리뷰 요청

**도구 접근**: Read, Grep, Bash

**관련 명령어**: [review.md](../commands/review.md)

---

### yiroom-spec-reviewer

> 이룸 프로젝트 스펙 문서 검토 및 논리적 허점 분석

**용도**:

- 스펙 문서 논리적 검토
- 누락된 요구사항 식별
- P3 원자 분해 검증

**호출 조건**:

- 스펙 문서 리뷰 요청
- `/qplan` 명령어 실행

**도구 접근**: Read, Grep, Glob

**관련 명령어**: [qplan.md](../commands/qplan.md)

---

### yiroom-test-writer

> 이룸 프로젝트 테스트 코드 작성 전문가

**용도**:

- 단위/통합 테스트 작성
- 테스트 커버리지 향상
- 테스트 패턴 적용

**호출 조건**:

- 테스트 작성 요청
- `/test` 명령어 실행

**도구 접근**: Read, Write, Edit, Bash

**관련 명령어**: [test.md](../commands/test.md)

---

### yiroom-ui-validator

> 이룸 브랜드 가이드라인 및 UX 기준 검증

**용도**:

- 브랜드 가이드라인 준수 검증
- UX 일관성 확인
- 접근성 기준 검토

**호출 조건**:

- UI 컴포넌트 리뷰 요청
- 디자인 시스템 준수 확인

**도구 접근**: Read, Grep

---

## 에이전트 호출 방법

### Task 도구 사용

```typescript
// Task 도구로 에이전트 호출
Task({
  subagent_type: 'yiroom-code-quality',
  prompt: '코드 품질 검사 요청...',
  description: '코드 품질 검사',
});
```

### 슬래시 명령어 연동

| 명령어      | 연동 에이전트        |
| ----------- | -------------------- |
| `/sisyphus` | sisyphus-adaptive    |
| `/review`   | yiroom-code-quality  |
| `/qplan`    | yiroom-spec-reviewer |
| `/test`     | yiroom-test-writer   |

---

## 에이전트 선택 가이드

### 코드 작업 시

```
복잡한 작업 (4+ 파일) → sisyphus-adaptive
코드 품질 검토 → yiroom-code-quality
테스트 작성 → yiroom-test-writer
```

### 문서 작업 시

```
스펙 문서 검토 → yiroom-spec-reviewer
UX 텍스트 작성 → korean-ux-writer
```

### 도메인 검증 시

```
K-뷰티 관련 → korean-beauty-validator
UI/UX 검증 → yiroom-ui-validator
```

---

## 관련 문서

| 목적          | 문서                                                      |
| ------------- | --------------------------------------------------------- |
| 규칙 인덱스   | [.claude/rules/README.md](../rules/README.md)             |
| 명령어 인덱스 | [.claude/commands/README.md](../commands/README.md)       |
| 제1원칙       | [00-first-principles.md](../rules/00-first-principles.md) |

---

**Author**: Claude Code
