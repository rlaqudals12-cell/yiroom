# Claude Code 설정 아키텍처 가이드 2026

> **목적**: 3,000줄+ CLAUDE.md 최적화 및 .claude/ 폴더 구조 개선
> **대상**: Turborepo 모노레포, 1-2인 개발팀
> **기술스택**: Next.js 16, React 19, Expo SDK 54, Supabase, Clerk

---

## 1. 핵심 발견사항

### 🚨 Critical: 300줄 임계점

| 지표 | 권장값 | 현재 상태 | 영향 |
|------|--------|-----------|------|
| CLAUDE.md 길이 | **150-300줄** | 3,000줄+ | 지시 준수율 급격 저하 |
| 최대 지시 수 | 100-150개 | 초과 | 모든 규칙이 균등하게 무시됨 |
| 단어 수 한계 | 10,000 단어 | 초과 | 40,000 단어에서 경고 발생 |

**핵심 원리**: Claude Code 시스템 프롬프트가 이미 ~50개 지시 슬롯을 사용. 남은 100-150개로 모든 설정을 커버해야 함.

### ✅ 해결책: 계층적 메모리 시스템

```
your-monorepo/
├── CLAUDE.md                    # 150줄 이하 - 범용 규칙만
├── apps/
│   ├── web/CLAUDE.md           # Next.js 전용 (on-demand 로딩)
│   └── mobile/CLAUDE.md        # Expo 전용 (on-demand 로딩)
├── packages/
│   └── shared/CLAUDE.md        # 공유 라이브러리 규칙
└── .claude/
    ├── commands/               # 슬래시 명령어
    ├── agents/                 # 서브에이전트
    ├── skills/                 # 복잡한 패턴 (시맨틱 매칭)
    └── rules/                  # 경로 스코핑된 규칙
```

---

## 2. 즉시 적용 체크리스트

### Phase 1: CLAUDE.md 분리 (1-2시간)

- [ ] 현재 CLAUDE.md 내용 감사 (범용 vs 모듈별 분류)
- [ ] Next.js 규칙 → `apps/web/CLAUDE.md` 추출
- [ ] React Native 규칙 → `apps/mobile/CLAUDE.md` 추출
- [ ] 루트 CLAUDE.md **150줄 이하**로 축소

### Phase 2: Rules 최적화 (30분-1시간)

- [ ] 12개+ 규칙 파일 → 4-6개로 통합
- [ ] `paths` frontmatter 적용 (조건부 로딩)
- [ ] 복잡한 패턴 → Skills로 변환

### Phase 3: Commands/Agents 정비 (30분)

- [ ] 모든 명령어에 `description` 필수 추가
- [ ] 모든 에이전트에 `name`, `description` 필수 추가
- [ ] Sisyphus 패턴에 Stop 훅 구현

---

## 3. Rules 경로 스코핑

### Before (항상 로딩)
```markdown
# supabase-rules.md
- Supabase 쿼리는 서버 컴포넌트에서만 실행
- RLS 정책 필수 확인
...
```

### After (조건부 로딩)
```markdown
---
paths:
  - "src/**/*supabase*.ts"
  - "apps/*/src/lib/db/**"
  - "packages/database/**"
---
# Supabase 데이터베이스 규칙
- 쿼리는 서버 컴포넌트에서만 실행
- RLS 정책 필수 확인
...
```

### 권장 Rules 구조 (12개 → 6개)

| 파일명 | paths 스코프 | 내용 |
|--------|--------------|------|
| `code-style.md` | 없음 (항상) | TypeScript, 네이밍, 포매팅 |
| `git-workflow.md` | 없음 (항상) | 커밋, 브랜치 규칙 |
| `react-patterns.md` | `**/*.tsx` | React 19 패턴, 컴포넌트 규칙 |
| `nextjs-conventions.md` | `apps/web/**` | App Router, 서버 컴포넌트 |
| `expo-mobile.md` | `apps/mobile/**` | React Native, Expo 규칙 |
| `supabase-db.md` | `**/db/**`, `**/supabase/**` | 쿼리, RLS, 마이그레이션 |

---

## 4. 슬래시 명령어 필수 구조

### 필수 Frontmatter

```markdown
---
description: 명령어 설명 (필수! 없으면 /help에 안 나옴)
argument-hint: [feature-name] [complexity:low|medium|high]
allowed-tools: Read, Grep, Glob, Bash(git log:*)
model: claude-sonnet-4-5-20250929
---
```

### 현재 명령어 점검 체크리스트

| 명령어 | description 유무 | argument-hint | allowed-tools |
|--------|------------------|---------------|---------------|
| `/qplan` | ⬜ 확인 필요 | ⬜ | ⬜ |
| `/qcode` | ⬜ 확인 필요 | ⬜ | ⬜ |
| `/sisyphus` | ⬜ 확인 필요 | ⬜ | ⬜ |
| ... | | | |

---

## 5. 에이전트 설정 매트릭스

### 권장 모델 배정

| 에이전트 | 모델 | 도구 접근 | 이유 |
|----------|------|-----------|------|
| Orchestrator | opus | 전체 | 복잡한 조율 필요 |
| Planner | sonnet | Read, Grep, Glob | 분석 집중 |
| Researcher | haiku | Read, Grep | 빠른 탐색 |
| Implementer | sonnet | Edit, Write, Bash | 코드 작성 |
| Reviewer | sonnet | Read, Bash(lint:*) | 품질 검증 |
| Tester | sonnet | Read, Write, Bash(test:*) | 테스트 실행 |
| Documenter | haiku | Read, Write | 단순 문서화 |

### 필수 Frontmatter

```markdown
---
name: code-reviewer          # 필수: 소문자, 하이픈
description: 보안 중심 코드 리뷰 수행  # 필수: 자동 위임 판단에 사용
tools: Read, Grep, Bash(npm run lint:*)
model: sonnet
---
```

---

## 6. Sisyphus 패턴 구현

### Stop 훅으로 조기 종료 방지

```json
// .claude/settings.json
{
  "hooks": {
    "Stop": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "./scripts/check-todos.sh"
      }]
    }]
  }
}
```

### Todo 체크 스크립트 예시

```bash
#!/bin/bash
# scripts/check-todos.sh
INCOMPLETE=$(grep -c "\[ \]" .claude/todos/current.md 2>/dev/null || echo "0")
if [ "$INCOMPLETE" -gt 0 ]; then
  echo "⚠️ $INCOMPLETE 개의 미완료 항목이 있습니다. 계속 진행하세요."
  exit 1  # 비정상 종료 → Claude가 계속 작업
fi
exit 0  # 정상 종료 → 작업 완료 허용
```

---

## 7. 버전 관리 전략

### Git 추적 여부

| 파일 | Git | 설명 |
|------|-----|------|
| `CLAUDE.md` | ✅ | 팀 공유 |
| `CLAUDE.local.md` | ❌ | 개인 설정 (.gitignore) |
| `.claude/settings.json` | ✅ | 프로젝트 설정 |
| `.claude/settings.local.json` | ❌ | 개인 오버라이드 |
| `.claude/commands/` | ✅ | 공유 명령어 |
| `.claude/agents/` | ✅ | 공유 에이전트 |

### 커밋 컨벤션

```bash
# 설정 변경 커밋 예시
docs(claude): Next.js 16 서버 액션 패턴 추가
docs(claude): Supabase RLS 규칙 rules/로 분리
refactor(claude): CLAUDE.md 3000줄 → 150줄 축소
```

---

## 8. 제1원칙 의사결정 프레임워크

### CLAUDE.md에 추가할 때

✅ **추가해야 할 때**:
- 같은 설명을 Claude에게 3회 이상 반복
- 프로젝트 전체에 적용되는 규칙
- Claude가 일관되게 놓치는 비명시적 패턴
- 린터/포매터로 강제할 수 없는 규칙

### 다른 메커니즘으로 이동할 때

| 상황 | 해결책 |
|------|--------|
| 결정적 실행이 필요 | → Hooks |
| 특정 컨텍스트에서만 적용 | → path-scoped Rules |
| 복잡한 예제가 필요한 패턴 | → Skills |

### 제거해야 할 때

❌ **제거 대상**:
- ESLint, Prettier, TypeScript strict로 강제 가능한 것
- 기존 코드 패턴에서 명확히 드러나는 것
- 더 이상 유효하지 않은 역사적 컨텍스트

---

## 9. 마이그레이션 로드맵

```
Week 1: 분석 & 분리
├── Day 1-2: CLAUDE.md 내용 분류 (범용/앱별/기능별)
├── Day 3-4: apps/*/CLAUDE.md 파일 생성
└── Day 5: 루트 CLAUDE.md 150줄로 축소

Week 2: Rules & Skills
├── Day 1-2: rules/ 파일 paths frontmatter 적용
├── Day 3-4: 복잡한 패턴 skills/로 변환
└── Day 5: 테스트 및 검증

Week 3: Commands & Agents
├── Day 1-2: 명령어 frontmatter 정비
├── Day 3: 에이전트 모델/도구 최적화
└── Day 4-5: Sisyphus Stop 훅 구현
```

---

## 10. 빠른 참조

### 파일 크기 가이드라인

| 파일 | 권장 크기 | 최대 |
|------|-----------|------|
| 루트 CLAUDE.md | 100-150줄 | 300줄 |
| 앱별 CLAUDE.md | 50-100줄 | 200줄 |
| 개별 Rule 파일 | 30-50줄 | 100줄 |
| Skill SKILL.md | 50-150줄 | 300줄 |
| 슬래시 명령어 | 20-50줄 | 100줄 |
| 에이전트 정의 | 20-40줄 | 80줄 |

### 네이밍 컨벤션

- **파일명**: 소문자, 하이픈 구분 (`code-style.md`)
- **에이전트 name**: 소문자, 하이픈 (`code-reviewer`)
- **명령어**: 소문자, 짧고 기억하기 쉽게 (`/qplan`)

---

## 참고 자료

- [Anthropic 공식: Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Claude Code Docs: Memory](https://code.claude.com/docs/en/memory)
- [Claude Code Docs: Slash Commands](https://code.claude.com/docs/en/slash-commands)
- [Claude Code Docs: Subagents](https://code.claude.com/docs/en/sub-agents)
- [HumanLayer: Writing a good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- [Builder.io: Complete Guide to CLAUDE.md](https://www.builder.io/blog/claude-md-guide)
