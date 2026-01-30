# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 제1원칙 (최우선)

> **모든 의사결정 전에 [FIRST-PRINCIPLES.md](docs/FIRST-PRINCIPLES.md) 확인**

| 상황 | 질문 |
|------|------|
| 기능 추가 | "통합된 자기 이해에 기여하는가?" |
| 기술 선택 | "불필요한 복잡도는 없는가?" |
| 버그 수정 | "근본 원인인가, 증상인가?" |
| 코드 유지 | "사용되고 있고, 가치가 있는가?" |

---

## 핵심 가치

- **앱 이름**: 이룸 (Yiroom)
- **슬로건**: "온전한 나는?" / "Know yourself, wholly."
- **핵심 철학**: 사용자의 변화를 돕는 통합 웰니스 AI 플랫폼

## 3대 개발 원칙

1. **Spec-First**: 스펙 없는 코드 작성 금지 → `docs/` 확인
2. **Plan-Then-Execute**: 계획 없는 실행 금지
3. **Verify-Loop**: 모든 결과는 `typecheck + lint + test` 통과 필수

## 개발 명령어

```bash
# Turborepo (루트)
npm run dev          # 모든 앱 개발 서버
npm run build        # 모든 앱 빌드
npm run typecheck    # 타입 체크
npm run test         # 전체 테스트
npm run lint         # 린트

# 앱별 명령어 → 각 앱 CLAUDE.md 참조
```

## 모노레포 구조

```
yiroom/
├── apps/web/          # Next.js 웹 앱 → apps/web/CLAUDE.md
├── apps/mobile/       # Expo 앱 → apps/mobile/CLAUDE.md
├── packages/shared/   # 공통 타입/유틸리티
└── docs/              # 설계 문서
```

## 기술 스택 요약

| 앱 | 기술 |
|----|------|
| **웹** | Next.js 16, React 19, Supabase, Clerk, Gemini 3 Flash |
| **모바일** | Expo SDK 54, React Native, NativeWind |
| **공통** | TypeScript, Turborepo, Zod |

> 상세 → [apps/web/CLAUDE.md](apps/web/CLAUDE.md)

## 모듈 현황

| Phase | 모듈 | 상태 |
|-------|------|------|
| 1 | PC-1, S-1, C-1 (퍼스널컬러, 피부, 체형) | ✅ |
| 2 | W-1, N-1, R-1 (운동, 영양, 리포트) | ✅ |
| A-M | 제품DB, 소셜, 어필리에이트, AI상담, 온보딩, 영양고도화 | ✅ |

## 슬래시 명령어

| 명령어 | 용도 |
|--------|------|
| `/qplan` | 계획 분석 및 검토 |
| `/qcode` | 구현 + 테스트 + 포맷팅 |
| `/qcheck` | 코드 품질 검사 |
| `/test` | 테스트 실행 |
| `/review` | 코드 리뷰 |
| `/sisyphus` | 적응형 오케스트레이터 |

## 핵심 규칙

- RLS 정책 필수 (`clerk_user_id` 기반)
- 최상위 컨테이너에 `data-testid` 속성 필수
- 한국어 주석 (복잡한 로직 위에 "왜" 설명)
- UI 텍스트: 자연스럽고 정중한 한국어

## 참조 문서

| 문서 | 내용 |
|------|------|
| [docs/DATABASE-SCHEMA.md](docs/DATABASE-SCHEMA.md) | 테이블 구조, RLS, JSONB |
| [docs/SDD-WORKFLOW.md](docs/SDD-WORKFLOW.md) | Spec-Driven Development |
| [apps/web/CLAUDE.md](apps/web/CLAUDE.md) | 웹 앱 상세 규칙 |
| `.claude/rules/` | 코딩 표준, AI 통합 규칙 |
| `.claude/agents/` | 전문 에이전트 설정 |

## 시지푸스 트리거

> 상세 → `.claude/rules/sisyphus-trigger.md`

**`/sisyphus` 사용**: 4개+ 파일 수정, DB/인증 관련, 새 패턴 도입
**직접 실행**: 1-3개 파일, UI/문서, 검증된 패턴 반복

---

**Version**: 12.0 | **Updated**: 2026-01-15 | CLAUDE.md 150줄 최적화
