# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 제1원칙 (최우선)

> **모든 의사결정 전에 [FIRST-PRINCIPLES.md](docs/FIRST-PRINCIPLES.md) 확인**

| 상황      | 질문                             |
| --------- | -------------------------------- |
| 기능 추가 | "통합된 자기 이해에 기여하는가?" |
| 기술 선택 | "불필요한 복잡도는 없는가?"      |
| 버그 수정 | "근본 원인인가, 증상인가?"       |
| 코드 유지 | "사용되고 있고, 가치가 있는가?"  |

---

## 핵심 가치

- **앱 이름**: 이룸 (Yiroom)
- **슬로건**: "온전한 나를 찾는 여정" / "Know yourself, wholly."
- **궁극의 목적지**: "나를 가장 잘 아는 존재, 그래서 세상과 나를 연결해주는 존재"
- **3단계 진화**: 분석기(현재) → 조언자(다음) → 동반자(궁극)
- **수익 원칙**: 사용자는 영원히 무료. 돈은 기업이 냄. 구독 최소화, 파이 우선.
- **경쟁 포지셔닝**: 전문가 90% 수준을 무료로 즉시 24/7 제공. 진짜 경쟁자는 "아무것도 안 하는 것".

> 상세 → [docs/PRODUCT-PHILOSOPHY.md](docs/PRODUCT-PHILOSOPHY.md)

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

| 앱         | 기술                                                  |
| ---------- | ----------------------------------------------------- |
| **웹**     | Next.js 16, React 19, Supabase, Clerk, Gemini 3 Flash |
| **모바일** | Expo SDK 54, React Native, NativeWind                 |
| **공통**   | TypeScript, Turborepo, Zod                            |

> 상세 → [apps/web/CLAUDE.md](apps/web/CLAUDE.md)

## 모듈 현황

| Phase  | 모듈                                                                      | 상태 |
| ------ | ------------------------------------------------------------------------- | ---- |
| 1      | PC-1, S-1, C-1 (퍼스널컬러, 피부, 체형)                                   | ✅   |
| 2      | W-1, N-1, R-1 (운동, 영양, 리포트)                                        | ✅   |
| A-H    | 제품DB, 소셜, 어필리에이트, AI상담, 온보딩, 영양고도화                    | ✅   |
| I      | 날씨코디, 바코드스캔, 비포애프터, 인벤토리                                | ✅   |
| J      | AI 색상조합, 악세서리, 메이크업 스타일링                                  | ✅   |
| K      | 성별 중립화, 패션 확장, 체형 강화, 레시피                                 | ✅   |
| 특화   | H-1 (헤어), M-1 (메이크업), OH-1 (구강건강)                               | ✅   |
| P3     | 캡슐 에코시스템 5-Phase, 스캔UI, 헤어엔진, 캡슐브릿지                     | ✅   |
| P3+    | Virtual Try-On V2 (립/블러셔/헤어), 모니터링, 홈위젯                      | ✅   |
| 출시   | 소셜로그인, CS위젯, 신고/차단, Dynamic OG                                 | ✅   |
| 철학   | Identity-First Framing, ConnectionAwareness                               | ✅   |
| 모바일 | 웹-모바일 격차 해소 WS-A~D, 온보딩 UX 통일 (4089+ tests)                  | ✅   |
| 만족도 | Phase 1-5 (20WS): 접근성, 다크모드, i18n, 리텐션, 위젯동기화, 전문가모드  | ✅   |
| 고도화 | 16카테고리 S등급: 루틴트래커, 스트레스시각화, 크로스챌린지, 헬스디바이스  | ✅   |
| 쇼핑   | 바코드→구매, 가격알림Cron, VTO→제품매처, 리뷰AI, 올리브영, 쿠폰/프로모션  | ✅   |
| 연결   | 사용자여정 12건 해소, CIE-1 이미지품질, 접근성 aria 보강, 모바일 포팅 3건 | ✅   |
| 출시   | 디자인 리뉴얼(웹↔앱 통일), Expo Go 모노레포 해결, 웹-앱 동기화 95%        | ✅   |
| 고도화 | 6모듈 프롬프트 Level 2(논문 7편), 서버 검증 강화, 성능 -145KB             | ✅   |
| 신규   | Progressive Profiling, 제품매칭카드, 환경조언, 시술추천, 제품효과추적     | ✅   |

## 슬래시 명령어

| 명령어             | 용도                     |
| ------------------ | ------------------------ |
| `/qplan`           | 계획 분석 및 검토        |
| `/qcode`           | 구현 + 테스트 + 포맷팅   |
| `/qcheck`          | 코드 품질 검사           |
| `/test`            | 테스트 실행              |
| `/review`          | 코드 리뷰                |
| `/sisyphus`        | 적응형 오케스트레이터    |
| `/quality-improve` | 모듈 품질 개선 (3-Cycle) |

## 핵심 규칙

- RLS 정책 필수 (`clerk_user_id` 기반)
- 최상위 컨테이너에 `data-testid` 속성 필수
- 한국어 주석 (복잡한 로직 위에 "왜" 설명)
- UI 텍스트: 자연스럽고 정중한 한국어

## 참조 문서

| 문서                                               | 내용                    |
| -------------------------------------------------- | ----------------------- |
| [docs/DATABASE-SCHEMA.md](docs/DATABASE-SCHEMA.md) | 테이블 구조, RLS, JSONB |
| [docs/SDD-WORKFLOW.md](docs/SDD-WORKFLOW.md)       | Spec-Driven Development |
| [apps/web/CLAUDE.md](apps/web/CLAUDE.md)           | 웹 앱 상세 규칙         |
| `.claude/rules/`                                   | 코딩 표준, AI 통합 규칙 |
| `.claude/agents/`                                  | 전문 에이전트 설정      |

## 시지푸스 트리거

> 상세 → `.claude/rules/sisyphus-trigger.md`

**`/sisyphus` 사용**: 4개+ 파일 수정, DB/인증 관련, 새 패턴 도입
**직접 실행**: 1-3개 파일, UI/문서, 검증된 패턴 반복

---

**Version**: 26.0 | **Updated**: 2026-03-26 | Phase 1A~1B 고도화 완료 + 프롬프트 Level 2 + 성능 -145KB + /ux-check v7.0 (23,100+ tests)
