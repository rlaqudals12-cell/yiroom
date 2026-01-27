# 명령어 인덱스 (Commands Index)

> **Version**: 1.0 | **Updated**: 2026-01-19

> 이룸 프로젝트 슬래시 명령어 가이드

---

## 빠른 탐색

| 명령어                             | 용도                  | 주요 작업                 |
| ---------------------------------- | --------------------- | ------------------------- |
| [/qplan](#qplan)                   | 빠른 계획 분석        | 계획 검토, 스펙 분석      |
| [/qcode](#qcode)                   | 빠른 구현             | 코드 작성 + 테스트 + 검증 |
| [/qcheck](#qcheck)                 | 빠른 품질 검사        | 변경사항 품질 확인        |
| [/test](#test)                     | 테스트 실행           | 테스트 실행 및 결과 분석  |
| [/review](#review)                 | 종합 코드 리뷰        | 코드 품질, 보안 검토      |
| [/sisyphus](#sisyphus)             | 적응형 오케스트레이터 | 복잡한 작업 병렬 처리     |
| [/create-feature](#create-feature) | 새 기능 스캐폴딩      | SDD 템플릿 생성           |
| [/deploy-check](#deploy-check)     | 배포 전 체크          | 배포 전 필수 검증         |
| [/standup](#standup)               | 일일 현황 요약        | 개발 현황 및 계획         |

**총 명령어**: 9개

---

## 명령어 상세

### /qplan

> 빠른 계획 분석 및 검토

**용도**:

- 작업 계획 분석
- 스펙 문서 검토
- 구현 전략 수립

**사용 예시**:

```
/qplan 새로운 API 엔드포인트 추가
/qplan SDD-XXX 스펙 검토
```

**연동 에이전트**: yiroom-spec-reviewer

**출력**: 계획 분석 결과, 리스크 식별, 권장 접근법

---

### /qcode

> 계획된 작업 빠른 구현 + 검증

**용도**:

- 빠른 코드 구현
- 테스트 작성
- 포맷팅 및 검증

**사용 예시**:

```
/qcode 로그인 버튼 컴포넌트 구현
/qcode API 엔드포인트 추가
```

**워크플로우**:

```
1. 구현 → 2. 테스트 → 3. typecheck → 4. lint
```

---

### /qcheck

> 변경사항 빠른 품질 검사

**용도**:

- 변경 파일 품질 확인
- 빠른 검증

**사용 예시**:

```
/qcheck
/qcheck src/components/Button.tsx
```

**검사 항목**: typecheck, lint, 기본 테스트

---

### /test

> 테스트 실행 및 결과 분석

**용도**:

- 단위/통합 테스트 실행
- 테스트 결과 분석
- 커버리지 확인

**사용 예시**:

```
/test
/test WorkoutCard
/test --coverage
```

**연동 에이전트**: yiroom-test-writer

---

### /review

> 종합 코드 리뷰 수행

**용도**:

- 코드 품질 검토
- 보안 취약점 확인
- 성능 이슈 식별

**사용 예시**:

```
/review
/review src/lib/gemini.ts
```

**검토 항목**:

- OWASP Top 10
- 코딩 표준 준수
- 성능 최적화 포인트
- 테스트 커버리지

**연동 에이전트**: yiroom-code-quality

---

### /sisyphus

> 복잡도 기반 적응형 오케스트레이터

**용도**:

- 복잡한 작업 병렬 분배
- 다중 파일 수정
- 품질 관리

**자동 트리거 조건**:

- 4개+ 파일 수정
- DB/인증 관련 변경
- 새 패턴 도입

**사용 예시**:

```
/sisyphus 새 분석 모듈 추가
/sisyphus DB 스키마 마이그레이션
```

**연동 에이전트**: sisyphus-adaptive

---

### /create-feature

> 새 기능 SDD 스캐폴딩

**용도**:

- 새 기능 스펙 템플릿 생성
- P3 원자 분해 가이드
- 파일 구조 제안

**사용 예시**:

```
/create-feature 소셜 공유 기능
/create-feature AI 코치 채팅
```

**출력**: SDD 템플릿, 원자 분해, 의존성 그래프

---

### /deploy-check

> 배포 전 필수 체크리스트

**용도**:

- 배포 전 검증
- 환경변수 확인
- 보안 체크

**사용 예시**:

```
/deploy-check
/deploy-check production
```

**체크 항목**:

- [ ] typecheck 통과
- [ ] lint 통과
- [ ] 테스트 통과
- [ ] 환경변수 설정
- [ ] 보안 취약점 없음

---

### /standup

> 일일 개발 현황 요약 및 계획

**용도**:

- 일일 작업 요약
- 진행 상황 파악
- 다음 작업 계획

**사용 예시**:

```
/standup
/standup --detailed
```

**출력**:

- 어제 완료한 작업
- 오늘 계획
- 블로커/이슈

---

## 명령어 선택 가이드

### 개발 시작 시

```
/qplan → 계획 수립
/create-feature → 새 기능 스캐폴딩
```

### 개발 진행 시

```
/qcode → 빠른 구현
/test → 테스트 실행
/qcheck → 품질 확인
```

### 복잡한 작업 시

```
/sisyphus → 병렬 처리
```

### 완료 전

```
/review → 종합 리뷰
/deploy-check → 배포 전 검증
```

### 일일 루틴

```
/standup → 현황 파악
```

---

## 명령어 조합 예시

### 새 기능 개발 플로우

```bash
/create-feature 사용자 프로필 편집
# → SDD 템플릿 생성

/qplan
# → 계획 검토

/qcode
# → 구현 + 테스트

/review
# → 코드 리뷰

/deploy-check
# → 배포 전 확인
```

### 버그 수정 플로우

```bash
/qplan 버그 분석
# → 원인 파악

/qcode 버그 수정
# → 수정 + 테스트

/qcheck
# → 품질 확인
```

---

## 관련 문서

| 목적            | 문서                                                      |
| --------------- | --------------------------------------------------------- |
| 규칙 인덱스     | [.claude/rules/README.md](../rules/README.md)             |
| 에이전트 인덱스 | [.claude/agents/README.md](../agents/README.md)           |
| 제1원칙         | [00-first-principles.md](../rules/00-first-principles.md) |
| 테스트 패턴     | [testing-patterns.md](../rules/testing-patterns.md)       |

---

**Author**: Claude Code
