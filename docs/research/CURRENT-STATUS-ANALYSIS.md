# 현황 분석 결과

> 분석일: 2026-01-15
> 목적: 리빌딩 전 현재 상태 파악

---

## ⚠️ 최우선 참조: 제1원칙

**모든 작업 전 [FIRST-PRINCIPLES.md](../FIRST-PRINCIPLES.md) 확인 필수**

---

## 0. 핵심 지표 요약

| 항목 | 현재 | 권장 | 상태 |
|------|------|------|------|
| **CLAUDE.md 줄 수** | 322줄 | 150-300줄 | ❌ 초과 |
| **eslint.config.mjs** | Flat Config | Flat Config | ✅ 유지 |
| **turbo.json** | 1.x 형식 | 2.x (선택) | ⚠️ 검토 |
| **.claude/rules/** | 12개, paths 없음 | 4-6개, paths 적용 | ❌ 필요 |
| **.claude/commands/** | 9개, description 없음 | description 필수 | ❌ 필요 |
| **.claude/agents/** | 7개, frontmatter 있음 | name/description 필수 | ✅ 완료 |

---

## 1. `.claude/` 폴더 분석

### 전체 구조 (28개 파일)

| 폴더 | 파일 수 | 상태 |
|------|---------|------|
| commands/ | 9개 | ⚠️ 2개 삭제 후보 |
| rules/ | 12개 | ⚠️ 3개 통합 검토 |
| agents/ | 6개 | ✅ 유지 |
| lib/ | 1개 | ✅ 유지 |

### 삭제 후보 (2개)

| 파일 | 이유 |
|------|------|
| `commands/standup.md` | CLAUDE.md 미참조, 외부 도구 의존 |
| `commands/create-feature.md` | CLAUDE.md 미참조, 초기 설정 전용 |

### 통합 검토 (3개 그룹)

| 그룹 | 파일들 | 문제 |
|------|--------|------|
| sisyphus | `sisyphus.md`, `sisyphus-trigger.md`, `sisyphus-adaptive.md` | 3개가 같은 주제 |
| 코드 리뷰 | `qcheck.md`, `review.md` | 역할 불명확 |
| AI 코드 | `ai-code-review.md`, `coding-standards.md` | AI 특화 vs 일반 |

### CLAUDE.md 누락 항목

- `/qcheck` 명령어
- `/review` 명령어
- `/standup` 명령어

---

## 2. 문서 불일치

### CLAUDE.md vs phase-0 비교

| 항목 | phase-0 | 현재 CLAUDE.md | 조치 |
|------|---------|----------------|------|
| 테스트 수 | 2,776개 | 2,686개 | ❌ 둘 다 오래됨 → ~8,000개로 수정 |
| 제1원칙 | "가장 단순한가?" | "불필요한 복잡도?" | ✅ 수정 완료 |
| .beads | 언급됨 | 미언급 | ⚠️ 추가 검토 |
| Phase N | 상세 가이드 | 미반영 | ⚠️ 동기화 필요 |
| 영구 제외 | 4개 명시 | 미포함 | ⚠️ 추가 필요 |

### 테스트 현황 (실제)

| 영역 | 테스트 파일 | 테스트 케이스 |
|------|-------------|---------------|
| 웹 (Vitest) | 469개 | 7,534개 |
| 모바일 (Jest) | - | 455개 |
| **총계** | **469+** | **~8,000개** |

---

## 3. 권장 조치

### 즉시 실행 (리서치 대기 중)

| 우선순위 | 작업 | 영향 |
|----------|------|------|
| 1 | 테스트 수 업데이트 (CLAUDE.md, STATUS.md) | 문서 정확성 |
| 2 | 삭제 후보 2개 확인 (실제 사용 여부) | 정리 |
| 3 | 영구 제외 항목 CLAUDE.md에 추가 | 일관성 |

### 리서치 후 실행

| 작업 | 의존성 |
|------|--------|
| sisyphus 문서 3개 통합 | 베스트 프랙티스 참조 |
| CLAUDE.md 구조 재설계 | 문서 구조 연구 결과 |
| 규칙 파일 통합/분리 | 최적 구조 연구 결과 |

---

## 4. 제1원칙 적용 결과

```
질문: "사용되고 있고, 가치가 있는가?"

.claude/ 폴더:
✅ 유지: 23개 (82%)
⚠️ 통합: 3개 (11%)
❌ 삭제 검토: 2개 (7%)

문서 일관성:
❌ 테스트 수 불일치 → 수정 필요
⚠️ phase-0 ↔ CLAUDE.md 동기화 필요
✅ 제1원칙 수정 완료
```

---

## 5. P0 작업 상세 계획

### 5.1 CLAUDE.md 축소 (322줄 → 150줄)

**이동 대상**:

| 섹션 | 대상 | 줄 수 |
|------|------|------|
| 프로젝트 구조 | → apps/web/CLAUDE.md | ~30줄 |
| Route Groups 상세 | → apps/web/CLAUDE.md | ~40줄 |
| 데이터베이스 테이블 목록 | → DATABASE-SCHEMA.md 참조 | ~20줄 |
| 슬래시 명령어 상세 | → .claude/commands/ 설명으로 대체 | ~15줄 |
| 에이전트 상세 | → .claude/agents/ 설명으로 대체 | ~10줄 |
| 복잡도 분석 기준 | → .claude/lib/ 참조 | ~20줄 |

### 5.2 Rules 통합 계획 (12개 → 6개)

**최종 구조**:

| 신규 파일명 | paths | 통합 대상 |
|------------|-------|-----------|
| `code-style.md` | (없음-항상) | coding-standards.md + ai-code-review.md |
| `git-workflow.md` | (없음-항상) | 신규 (CLAUDE.md에서 추출) |
| `react-patterns.md` | `**/*.tsx` | project-structure.md 일부 |
| `nextjs-conventions.md` | `apps/web/**` | server-debugging.md |
| `supabase-db.md` | `**/db/**`, `**/supabase/**` | db-api-sync.md |
| `ai-integration.md` | `**/gemini*`, `**/ai*` | ai-integration.md + prompt-engineering.md |

**docs/ 이동**:

| 파일 | 이유 |
|------|------|
| agent-roadmap.md | 로드맵 문서 |
| workflow-roadmap.md | 로드맵 문서 |
| deferred-items-documentation.md | 프로세스 문서 |

**통합/삭제**:

| 파일 | 조치 |
|------|------|
| sisyphus-trigger.md | → sisyphus.md 통합 |
| hybrid-data-pattern.md | → nextjs-conventions.md 또는 별도 skill |

### 5.3 Commands frontmatter 추가

모든 명령어 파일에 다음 형식 추가:

```yaml
---
description: [명령어 설명 - /help에 표시됨]
---
```

| 명령어 | description |
|--------|-------------|
| `/qplan` | 빠른 계획 분석 및 검토 |
| `/qcode` | 계획된 작업 빠른 구현 |
| `/qcheck` | 코드 품질 검사 |
| `/test` | 테스트 실행 |
| `/review` | 코드 리뷰 요청 |
| `/sisyphus` | 복잡도 기반 적응형 오케스트레이터 |
| `/create-feature` | 새 기능 스캐폴딩 |
| `/deploy-check` | 배포 전 체크리스트 |
| `/standup` | 일일 스탠드업 리포트 |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-01-15 | 초기 분석 완료 |
| 2026-01-15 | 핵심 지표 + P0 상세 계획 추가 |
