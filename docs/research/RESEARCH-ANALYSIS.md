# 리서치 분석 결과 및 액션 플랜

> 분석일: 2026-01-15
> 출처: Claude AI 딥 리서치 2건

---

## ⚠️ 최우선 참조: 제1원칙

**모든 작업 전 [FIRST-PRINCIPLES.md](../FIRST-PRINCIPLES.md) 확인 필수**

| 작업 유형 | 제1원칙 질문 |
|-----------|-------------|
| 기능/도구 추가 | "통합된 자기 이해에 기여하는가?" |
| 구조 변경 | "불필요한 복잡도는 없는가?" |
| 문제 해결 | "근본 원인인가, 증상인가?" |
| 유지/삭제 | "사용되고 있고, 가치가 있는가?" |

---

## 🚨 Critical 발견: CLAUDE.md 300줄 임계점

| 지표 | 권장 | 현재 (이룸) | 영향 |
|------|------|-------------|------|
| CLAUDE.md 길이 | **150-300줄** | 200+줄 | ⚠️ 임계점 근접 |
| 최대 지시 수 | 100-150개 | ? | 확인 필요 |
| .claude/rules/ | 4-6개 | 12개 | ❌ 초과 |

**원리**: Claude Code 시스템 프롬프트가 ~50개 지시 슬롯 사용. 남은 100-150개로 모든 설정 커버해야 함.

---

## 1. CLAUDE.md/규칙 시스템 비교

| 항목 | 현재 (이룸) | 2026 권장 | 조치 |
|------|-------------|----------|------|
| CLAUDE.md 길이 | 200+줄 | 150줄 이하 | ⚠️ 축소 필요 |
| 앱별 CLAUDE.md | 없음 | apps/*/CLAUDE.md | ❌ 생성 필요 |
| rules 파일 수 | 12개 | 4-6개 | ❌ 통합 필요 |
| paths 스코핑 | 미적용 | frontmatter paths | ❌ 적용 필요 |
| commands description | 일부 누락 | 필수 | ⚠️ 점검 필요 |
| agents name/description | 일부 누락 | 필수 | ⚠️ 점검 필요 |

### 권장 rules 구조 (12개 → 6개)

| 파일명 | paths 스코프 | 통합 대상 |
|--------|--------------|----------|
| `code-style.md` | 없음 (항상) | coding-standards.md |
| `git-workflow.md` | 없음 (항상) | (신규) |
| `react-patterns.md` | `**/*.tsx` | (신규) |
| `nextjs-conventions.md` | `apps/web/**` | project-structure.md 일부 |
| `expo-mobile.md` | `apps/mobile/**` | (신규) |
| `supabase-db.md` | `**/db/**` | db-api-sync.md |

### 삭제/통합 대상 (현재 rules)

| 파일 | 조치 | 이유 |
|------|------|------|
| `sisyphus-trigger.md` | → sisyphus.md 통합 | 중복 |
| `ai-code-review.md` | → code-style.md 통합 | 부분 중복 |
| `workflow-roadmap.md` | → docs/ 이동 | 로드맵은 rules 아님 |
| `agent-roadmap.md` | → docs/ 이동 | 로드맵은 rules 아님 |
| `deferred-items-documentation.md` | → docs/ 이동 | 프로세스 문서 |

---

## 2. 코드 품질 도구 비교

| 항목 | 현재 (이룸) | 2026 권장 | 조치 |
|------|-------------|----------|------|
| ESLint 설정 | eslint.config.mjs | flat config ✅ | ✅ 유지 |
| 데드 코드 탐지 | 없음 | Knip | ➕ 추가 |
| 중복 코드 탐지 | 없음 | jscpd | ➕ 추가 |
| ESLint 플러그인 | 기본 | eslint-plugin-sonarjs | ➕ 추가 |
| Import 패턴 | barrel exports | package.json exports | 🔄 변경 검토 |
| Turborepo | 현재 버전 | 2.x (`ui: "tui"`) | ⚠️ 확인 필요 |
| TypeScript 참조 | 현재 방식 | 공유 tsconfig 패키지 | ⚠️ 확인 필요 |
| 테스트 전략 | Pyramid | Trophy (Integration 중심) | ⚠️ 검토 |
| Prettier | 설정됨 | 설정됨 ✅ | ✅ 유지 |
| Husky + lint-staged | 설정됨 | 설정됨 ✅ | ✅ 유지 |
| TypeScript strict | 활성화 | 활성화 ✅ | ✅ 유지 |

### 즉시 적용 가능 도구

```bash
# Day 1: 도구 설치
pnpm add -Dw knip jscpd eslint-plugin-sonarjs

# Day 2: 베이스라인 측정
npx knip --reporter=compact
npx jscpd ./apps ./packages --output ./reports/jscpd
```

---

## 3. 우선순위별 액션 플랜

### P0: Critical (이번 주)

| # | 작업 | 파일 | 예상 시간 |
|---|------|------|----------|
| 1 | CLAUDE.md 150줄로 축소 | CLAUDE.md | 2h |
| 2 | apps/web/CLAUDE.md 생성 | apps/web/CLAUDE.md | 1h |
| 3 | rules 12개 → 6개 통합 | .claude/rules/ | 2h |
| 4 | paths frontmatter 적용 | .claude/rules/*.md | 1h |

### P1: High (다음 주)

| # | 작업 | 파일 | 예상 시간 |
|---|------|------|----------|
| 5 | Knip 설치 및 설정 | knip.json | 30m |
| 6 | jscpd 설치 및 설정 | .jscpd.json | 30m |
| 7 | sonarjs 플러그인 추가 | eslint.config.mjs | 30m |
| 8 | commands description 점검 | .claude/commands/*.md | 1h |
| 9 | agents name/description 점검 | .claude/agents/*.md | 1h |

### P2: Medium (2주 내)

| # | 작업 | 파일 | 예상 시간 |
|---|------|------|----------|
| 10 | CI 파이프라인에 품질 체크 추가 | .github/workflows/ | 1h |
| 11 | turbo.json 2.x 형식 검토 | turbo.json | 30m |
| 12 | barrel exports 제거 검토 | packages/shared/ | 2h |

### P3: Low (보류)

| # | 작업 | 조건 |
|---|------|------|
| 13 | React 19 codemod | forwardRef 사용처 확인 후 |
| 14 | Next.js 16 await params | 점진적 적용 |
| 15 | typescript-config 패키지 분리 | 복잡도 대비 효과 검토 |

---

## 4. 제1원칙 적용 검증

| 작업 | "통합된 자기 이해에 기여?" | "불필요한 복잡도?" | 결정 |
|------|---------------------------|-------------------|------|
| CLAUDE.md 축소 | 간접 기여 (개발 효율) | ❌ 복잡도 감소 | ✅ 진행 |
| rules 통합 | 간접 기여 | ❌ 복잡도 감소 | ✅ 진행 |
| Knip/jscpd 추가 | 간접 기여 (코드 품질) | ⚠️ 도구 추가 | ✅ 진행 |
| barrel exports 제거 | 간접 기여 | ⚠️ 변경 범위 큼 | 🔄 검토 후 |
| typescript-config 분리 | 간접 기여 | ⚠️ 복잡도 증가 | ❌ 보류 |

---

## 5. 참조 자료

### 코드 품질
- [Turborepo 공식 문서](https://turborepo.dev/docs)
- [Knip 문서](https://knip.dev/)
- [jscpd 문서](https://kucherenko.github.io/jscpd/)

### CLAUDE.md/규칙
- [Anthropic: Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [HumanLayer: Writing a good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md)

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-01-15 | 초기 분석 완료 |
