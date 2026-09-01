# CLAUDE.md

이 파일은 이룸(Yiroom) 저장소에서 Claude Code가 **어떻게 일하는지**를 정의한다. "무엇을 만들었나"(히스토리)는 `memory/`와 ADR에, 여기엔 표준·명령어·완료 기준만 둔다.

## 제1원칙 (최우선)

> **모든 의사결정 전에 [FIRST-PRINCIPLES.md](docs/FIRST-PRINCIPLES.md) 확인** (P0~P8, Quality Gate G0~G7)

| 상황      | 질문                             |
| --------- | -------------------------------- |
| 기능 추가 | "통합된 자기 이해에 기여하는가?" |
| 기술 선택 | "불필요한 복잡도는 없는가?"      |
| 버그 수정 | "근본 원인인가, 증상인가?"       |
| 코드 유지 | "사용되고 있고, 가치가 있는가?"  |

## 핵심 가치 (제품 판단 기준)

- **이룸 = "나를 다 아는 전속 뷰티팀"** — 시각적 정체성 5축(PC 색·S 피부·C 체형·H 헤어·M 메이크업)을 해석해 세상과 나를 연결.
- **슬로건**: "온전한 나를 찾는 여정" · **진화**: 분석기(현재) → 조언자 → 동반자(궁극).
- **수익 원칙**: 사용자는 영원히 무료, 돈은 기업이 낸다. 구독 최소화.
- **경쟁 포지셔닝**: 전문가 90% 수준을 무료·즉시·24/7. 진짜 경쟁자는 "아무것도 안 하는 것".

> 상세 → [PRODUCT-PHILOSOPHY.md](docs/PRODUCT-PHILOSOPHY.md) · 현재 IA/방향 [ADR-114](docs/adr/ADR-114-beauty-team-ia.md) · 5축 모델 [ADR-098](docs/adr/ADR-098-identity-redefinition-5axis-model.md) · 살아있는 맥락은 Claude Code 메모리(세션 시작 시 자동 로딩)

## 3대 개발 원칙

1. **Spec-First**: 스펙 없는 코드 금지 → `docs/` 확인 (없으면 SDD 먼저)
2. **Plan-Then-Execute**: 계획 없는 실행 금지
3. **Verify-Loop**: 모든 결과는 `typecheck + lint + test` 통과 필수

## 작업 방식 & 완료의 정의 (하드 룰)

> 이 저장소에서 "완료"의 기준. 작업은 여기서 끝나야 한다.

### 종료 전 체크 (Verify-Loop)

- [ ] `typecheck` 통과 (`cd apps/web && npx tsc --noEmit` — Stop 훅이 자동 검사)
- [ ] `lint` 통과
- [ ] 변경 범위의 `test` 통과
- [ ] 변경 코드가 **실제로 동작함을 확인** (타입/테스트 통과 ≠ 동작 확인)
- [ ] 결과를 정직하게 보고 (실패는 실패로, 건너뛴 건 건너뛴 것으로)

### 작업 원칙

- **Plan-Then-Execute**: 계획 없는 실행 금지. 4개+ 파일·DB·인증·새 패턴이면 `/sisyphus`.
- **무관 파일 미변경**: 요청 범위 밖 파일은 건드리지 않는다.
- **스테이징 확인**: `git commit`은 인덱스 전체를 커밋한다. 커밋 전 `git status`로 사용자 병행 작업이 쓸려가지 않는지 확인. (커밋/푸시는 요청 시에만)
- **애매하면 묻는다**: 사용자가 말한 적 없는 선호·요구사항은 지어내지 않는다.

### 환경 (Windows)

- 셸: PowerShell 주력 + Git Bash 병행 (각자 문법). 경로는 상대경로 사용.
- 로컬 AI: `FORCE_MOCK_AI=true`(Mock), prod=false(실 Gemini). 배포: `main` push → Vercel 자동배포.
- 서버 문제 시: `cd apps/web && npm run dev:reset` (포트 정리 + `.next` 삭제 + 재시작). 상세 → `.claude/rules/server-debugging.md`

### 규칙 로딩 (2026-07 재구조화)

- **always-on**(항상 적용, 6개): 제1원칙(00-first-principles)·code-style·git-workflow·doc-sync·security-checklist·design-contracts(설계 계약).
- **경로 스코프**(`paths:` 프론트매터, 23개): 해당 파일을 읽거나 만질 때 자동 로딩. 상세 규칙이 필요하면 대상 파일을 먼저 열람.

## 개발 명령어

```bash
# Turborepo (루트) — 모든 앱 대상
npm run dev          # 개발 서버
npm run build        # 빌드
npm run typecheck    # 타입 체크
npm run test         # 전체 테스트
npm run lint         # 린트
npm run format       # Prettier 포맷
# 앱별 상세 → 각 앱 CLAUDE.md
```

## 모노레포 구조

```
yiroom/
├── apps/web/          # Next.js 웹 앱 → apps/web/CLAUDE.md
├── apps/mobile/       # Expo 앱 → apps/mobile/CLAUDE.md
├── packages/shared/   # 공통 타입/유틸리티 (@yiroom/shared)
└── docs/              # 설계 문서 (principles/ adr/ specs/)
```

## 기술 스택 요약

| 앱         | 기술                                                    |
| ---------- | ------------------------------------------------------- |
| **웹**     | Next.js 16, React 19, Supabase, Clerk, Gemini 3.5 Flash |
| **모바일** | Expo SDK 54, React Native, NativeWind                   |
| **공통**   | TypeScript, Turborepo, Zod                              |

> 상세 → [apps/web/CLAUDE.md](apps/web/CLAUDE.md)

## 슬래시 명령어

| 명령어             | 용도                     |
| ------------------ | ------------------------ |
| `/qplan`           | 계획 분석 및 검토        |
| `/qcode`           | 구현 + 테스트 + 포맷팅   |
| `/qcheck`          | 코드 품질 검사           |
| `/test`            | 테스트 실행              |
| `/review`          | 코드 리뷰                |
| `/sisyphus`        | 적응형 오케스트레이터    |
| `/create-feature`  | 새 기능 SDD 스캐폴딩     |
| `/ux-check`        | UX 체크리스트 점검       |
| `/deploy-check`    | 배포 전 필수 체크        |
| `/standup`         | 일일 현황 요약           |
| `/wrap-up`         | 세션 메모리 관리         |
| `/quality-improve` | 모듈 품질 개선 (3-Cycle) |

## 핵심 규칙

- RLS 정책 필수 (`clerk_user_id` 기반). prod RLS는 `auth.jwt()->>'sub'` 구패턴 — 마이그레이션은 대시보드 SQL Editor 수동 gap-apply (파괴적 `db push` 금지).
- 최상위 컨테이너에 `data-testid` 속성 필수.
- 한국어 주석 (복잡한 로직 위에 "왜" 설명).
- UI 텍스트: 자연스럽고 정중한 한국어.
- 숨김 모듈(W-1 운동·N-1 영양·자세·날씨/피드/배지)은 UI 게이팅·코드 유지 상태 — 임의 재노출 금지 (근거 ADR-098·memory).

## 시지푸스 트리거

> 상세 → `.claude/rules/sisyphus-trigger.md`

- **`/sisyphus` 사용**: 4개+ 파일 수정, DB/인증 관련, 새 패턴 도입.
- **직접 실행**: 1-3개 파일, UI/문서, 검증된 패턴 반복.

## 참조 문서

| 문서                                               | 내용                         |
| -------------------------------------------------- | ---------------------------- |
| [docs/DATABASE-SCHEMA.md](docs/DATABASE-SCHEMA.md) | 테이블 구조, RLS, JSONB      |
| [docs/SDD-WORKFLOW.md](docs/SDD-WORKFLOW.md)       | Spec-Driven Development      |
| [apps/web/CLAUDE.md](apps/web/CLAUDE.md)           | 웹 앱 상세 규칙              |
| `.claude/rules/`                                   | 코딩 표준, AI 통합 규칙      |
| `.claude/agents/`                                  | 전문 에이전트 설정           |
| Claude Code 메모리 (세션 자동 로딩)                | 현재 상태·모듈 현황·의사결정 |

---

**Version**: 30.0 | **Updated**: 2026-07-12 | 탈노이즈 — 모듈 히스토리·정체성 서술·버전 이력을 `memory/`·ADR로 이관, "어떻게 일하나"에 집중
