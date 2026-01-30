# 문서 기여 가이드

> **Version**: 1.0 | **Updated**: 2026-01-21
> 이룸 프로젝트 문서 기여 방법

---

## 문서 구조 개요

```
docs/
├── INDEX.md              # 문서 허브 (진입점)
├── FIRST-PRINCIPLES.md   # 제1원칙
├── ARCHITECTURE.md       # 시스템 아키텍처
├── principles/           # 도메인 원리 문서
├── adr/                  # Architecture Decision Records
├── specs/                # 기능 스펙 (SDD)
├── legal/                # 법무/규제 문서
├── ops/                  # 운영 문서
└── research/             # 리서치 문서
```

---

## P7 워크플로우 (필수)

새 기능 문서화 시 반드시 다음 순서를 따릅니다:

```
리서치 → 원리 문서화 → ADR → 스펙 → 구현
```

| 단계 | 산출물 위치 | 설명 |
|------|------------|------|
| 1. 리서치 | `docs/research/` | 도메인 지식, 기술 스펙 조사 |
| 2. 원리 | `docs/principles/` | 핵심 원리 정리 |
| 3. ADR | `docs/adr/` | 기술 선택 결정 |
| 4. 스펙 | `docs/specs/` | 구현 상세 스펙 |
| 5. 구현 | `apps/`, `packages/` | 코드 작성 |

---

## 문서 유형별 가이드

### 1. 원리 문서 (Principles)

**위치**: `docs/principles/`

**네이밍**: `{domain}.md` (예: `color-science.md`)

**템플릿**:

```markdown
# [도메인명] 원리

> 이 문서는 [모듈명]의 기반이 되는 기본 원리를 설명한다.

## 1. 핵심 개념

### 1.1 [개념명]
[학문적/과학적 정의]

## 2. 수학적/물리학적 기반

### 2.1 [공식명]
\`\`\`
[수식]
\`\`\`

## 3. 구현 도출

### 3.1 원리 → 알고리즘
[알고리즘 도출 방법]

## 4. 참고 자료
- [링크]
```

---

### 2. ADR (Architecture Decision Records)

**위치**: `docs/adr/`

**네이밍**: `ADR-{번호}-{제목}.md` (예: `ADR-033-face-detection-library.md`)

**다음 번호 확인**:
```bash
ls docs/adr/ADR-*.md | tail -1
```

**템플릿**:

```markdown
# ADR-{번호}: {제목}

> **Status**: Accepted | Proposed | Deprecated
> **Created**: YYYY-MM-DD
> **Updated**: YYYY-MM-DD

## 맥락 (Context)
[왜 이 결정이 필요한가?]

## 결정 (Decision)
[무엇을 선택했는가?]

## 대안 (Alternatives)

| 옵션 | 장점 | 단점 |
|------|------|------|
| A | ... | ... |
| B | ... | ... |

## 결과 (Consequences)

### 긍정적
- ...

### 부정적
- ...

## 관련 문서
- [원리: xxx](../principles/xxx.md)
- [스펙: xxx](../specs/xxx.md)
```

---

### 3. 스펙 문서 (SDD)

**위치**: `docs/specs/`

**네이밍**: `SDD-{모듈}-{기능}.md` (예: `SDD-CIE-1-IMAGE-QUALITY.md`)

**필수 섹션**:

```markdown
# SDD: {기능명}

> **Status**: 📋 Planned | 🔨 In Progress | ✅ Completed
> **Version**: 1.0
> **Created**: YYYY-MM-DD

## 1. 개요
### 1.1 목적
### 1.2 범위
### 1.3 관련 문서

## 2. 이론/배경

## 3. 알고리즘 상세
[TypeScript 구현 포함]

## 4. 입력/출력 스펙

## 5. 에러 케이스

## 6. P3 원자 분해 (필수)

| ID | 원자 | 입력 | 출력 | 시간 |
|----|------|------|------|------|
| XXX-1 | ... | ... | ... | Xh |

**총 예상 시간**: XXh

## 7. 관련 문서
```

---

## P3 원자 분해 규칙

모든 SDD 문서는 **P3 원자 분해** 섹션을 포함해야 합니다.

### 원자 정의 기준

| 항목 | 규칙 |
|------|------|
| 소요시간 | ≤ 2시간 |
| 독립성 | 단독 테스트 가능 |
| 입출력 | 명확히 정의 |
| ID | `{모듈}-{번호}` 형식 |

### 예시

```markdown
| ID | 원자 | 입력 | 출력 | 시간 |
|----|------|------|------|------|
| CIE1-1 | 해상도 검증 유틸 | ImageData | {width, height, isValid} | 1h |
| CIE1-2 | Laplacian 선명도 | ImageData | {score, variance} | 2h |
| CIE1-3 | 노출 평가 | ImageData | {brightness, isOverexposed} | 1.5h |
```

---

## 검증 스크립트

### 깨진 링크 검사

```bash
node scripts/check-broken-links.js
```

### P3 점수 검증

```bash
node scripts/validate-p3-scores.js
```

### INDEX.md 동기화 검사

```bash
node scripts/index-sync-check.js
```

---

## PR 체크리스트

### 새 문서 추가 시

- [ ] P7 워크플로우 순서 준수 (리서치→원리→ADR→스펙)
- [ ] 적절한 폴더에 파일 생성
- [ ] 네이밍 규칙 준수
- [ ] INDEX.md에 문서 추가
- [ ] 관련 문서 링크 연결
- [ ] `node scripts/check-broken-links.js` 통과

### SDD 문서 추가 시

- [ ] P3 원자 분해 섹션 포함
- [ ] 각 원자 ≤ 2시간
- [ ] 의존성 그래프 포함 (복잡한 경우)
- [ ] TypeScript 구현 예시 포함
- [ ] 에러 케이스 정의

### ADR 추가 시

- [ ] 다음 번호 확인 (`ls docs/adr/ADR-*.md | tail -1`)
- [ ] 대안(Alternatives) 섹션 포함
- [ ] 결과(Consequences) 긍정/부정 모두 기술
- [ ] 관련 원리 문서 연결

---

## 문서 스타일 가이드

### 마크다운 규칙

| 항목 | 규칙 |
|------|------|
| 제목 | `#` 계층 유지 (H1 → H2 → H3) |
| 코드 | 언어 명시 (```typescript) |
| 테이블 | 헤더와 정렬 포함 |
| 링크 | 상대 경로 사용 |
| 이모지 | 상태 표시에만 사용 (📋🔨✅) |

### 언어 규칙

- **주석**: 한국어
- **코드**: 영어
- **문서 본문**: 한국어 (기술 용어는 영어 혼용)

### 상태 이모지

| 이모지 | 의미 |
|--------|------|
| 📋 | Planned (계획) |
| 🔨 | In Progress (진행 중) |
| ✅ | Completed (완료) |
| ⏳ | Deferred (보류) |
| ❌ | Rejected (거부) |

---

## 자주 묻는 질문

### Q: ADR 번호는 어떻게 정하나요?

기존 ADR 중 가장 큰 번호 + 1을 사용합니다:
```bash
ls docs/adr/ADR-*.md | sort -V | tail -1
# 예: ADR-035-xxx.md → 다음은 ADR-036
```

### Q: 원리 문서와 ADR의 차이는?

- **원리 문서**: "무엇이 사실인가?" (과학적/학문적 근거)
- **ADR**: "왜 이것을 선택했는가?" (기술 결정)

### Q: P3 점수는 어떻게 계산하나요?

각 SDD의 구현 완성도를 0-100점으로 표기합니다:
- **0-30점**: 초안 (draft)
- **30-60점**: 진행 중
- **60-90점**: 대부분 완성
- **90-100점**: 완전 구현

---

## 관련 문서

- [INDEX.md](./INDEX.md) - 문서 허브
- [FIRST-PRINCIPLES.md](./FIRST-PRINCIPLES.md) - 제1원칙
- [.claude/rules/README.md](../.claude/rules/README.md) - 규칙 인덱스

---

**Author**: Claude Code
