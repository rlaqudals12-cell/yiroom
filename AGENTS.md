# AGENTS.md — 이룸(Yiroom) AI 코딩 에이전트 공통 규칙

> 이 파일은 OpenAI Codex 등 비-Claude 에이전트용 진입점이다. 정본 규칙은
> [CLAUDE.md](CLAUDE.md)와 `.claude/rules/`에 있으며, 이 파일은 그중 **자동
> 로딩되지 않는 필수 계약**을 인라인한 요약이다.
>
> **정본 서열(충돌 시)**: `.claude/rules/00-first-principles.md` >
> CLAUDE.md > 개별 rules > 이 파일(요약). docs/FIRST-PRINCIPLES.md는
> 00 문서로의 리다이렉트다.

## 시작하기 전에 반드시 읽을 것

1. [CLAUDE.md](CLAUDE.md) — 작업 방식·완료 기준 전체
2. [.claude/rules/00-first-principles.md](.claude/rules/00-first-principles.md) — 제1원칙(P0~P8)
3. 작업 대상 디렉토리에 해당하는 `.claude/rules/*.md` — **Claude와 달리 자동
   로딩되지 않으므로 직접 열어 읽어라** (예: DB 작업 → supabase-db.md,
   API 작업 → api-design.md, 테스트 → testing-patterns.md)

## 완료의 정의 (Verify-Loop — 어길 수 없음)

- `cd apps/web && npx tsc --noEmit` 0 에러 (웹 typecheck는 **항상 전체** — Stop 훅이 강제)
- `cd apps/mobile && npx tsc --noEmit` 0 에러 (모바일 수정 시)
- 변경 파일 eslint 0 error · **테스트는 변경 범위가 최소선**, 4파일+ 대규모
  변경이면 전체 스위트 1회 권장 (문서만 변경 시 테스트 생략 가능)
- 새/변경 로직에는 테스트 필수. 검증 안 한 것을 했다고 보고 금지.
- P7(리서치→원리→ADR→스펙→구현)은 "산출물이 **존재**해야 한다"는 뜻 —
  기존 ADR/스펙이 커버하는 범위의 수정은 그 문서 참조로 충족되며,
  새 도메인/모듈/패턴일 때만 새로 작성한다(doc-sync.md 예외 기준 참조).

## 하드 룰 (전부 실사고 이력 기반)

- **커밋은 요청 시에만.** 커밋 시 반드시 **명시 경로 스테이징**(`git add <파일들>`) —
  `git add -A` 금지 (병행 작업 쓸림 사고 이력).
- **로컬 전용, 절대 커밋 금지**: `apps/web/proxy.ts`의 `/dev` 변경분 ·
  `apps/web/app/dev/` · `.claude/plans/`
- **prod DB는 수동 gap-apply만** (대시보드 SQL Editor). `supabase db push` 금지.
  prod RLS는 `auth.jwt()->>'sub'` 구패턴 (`auth.get_user_id()` 없음).
- **결정론 계약**: 폴백 Mock·분석 경로에 `Math.random()`·`Date.now()` 금지 —
  `apps/web/lib/utils/seeded-random.ts`의 시드 PRNG 사용, 호출부에서
  `buildFallbackSeed(userId, 축, 이미지지문)` 배선 필수 (같은 사진=같은 결과).
- **정직성 계약**: AI 폴백 결과는 `usedFallback: true` + 낮은 신뢰도 표시 필수.
  데이터 지어내기 금지 — 없으면 정직한 빈 상태 + CTA. 외모 채점 금지.
- **웹↔모바일↔DB 3자 계약**: 테이블은 `user_inventory`가 옷장 정본.
  metadata 키는 단수(color/season/occasion)·시즌은 'autumn'(fall 금지).
  모바일은 thin client — 웹 API가 정본, 모바일을 웹에 맞춘다(역방향 금지).
- **옷장 이미지**: 비공개 버킷 — DB에는 경로만 저장, 읽기는
  `lib/inventory/image-url.ts`의 서명 URL 헬퍼 경유. `getPublicUrl` 금지.
- **숨김 모듈**(운동·영양·자세·날씨·피드·배지)은 게이팅 유지 — 임의 재노출 금지.
- 새 API는 `{success, data}` / `{success:false, error:{code, message, userMessage}}`
  봉투 + Zod 검증 + `auth()` 가드 + RLS. userMessage는 정중한 한국어.
- 한국어 주석("왜"를 설명). UI 문구는 자연스럽고 정중한 한국어.
  이모지 무단 추가 금지. 최상위 컨테이너 `data-testid` 필수.

## 병행 작업 경고

Claude Code가 같은 워킹트리에서 백그라운드 에이전트를 돌리는 경우가 있다.
`git status`에 자신이 만들지 않은 변경이 보이면 **건드리지 말고 사용자에게
보고**하라. 같은 파일 동시 편집 = 경합 사고 이력 있음.

## 명령어

```bash
cd apps/web && npm run dev        # 개발 서버 (localhost:3000)
cd apps/web && npx tsc --noEmit   # 웹 타입체크
cd apps/web && npx vitest run <경로>  # 웹 테스트
cd apps/mobile && npx jest <경로>     # 모바일 테스트
```
