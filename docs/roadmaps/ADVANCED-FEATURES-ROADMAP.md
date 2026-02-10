# 고급 기능 로드맵

> **작성일**: 2026-02-04
> **목표**: AI 자동화, 장기 기억, 개인화 시스템 점진적 도입
> **상태**: 계획 단계

---

## 개요

이 문서는 이룸 프로젝트의 고급 기능 도입 계획을 정의합니다.
앱 출시 (Google Play 2/22) 이후 점진적으로 도입할 기능들입니다.

---

## 우선순위 요약

| 순위  | 기능                  | 타이밍   | 복잡도 | 의존성          |
| ----- | --------------------- | -------- | ------ | --------------- |
| **1** | /wrap-up 세션 메모리  | ✅ 완료  | 낮음   | 없음            |
| **2** | 품질 게이트 CI        | ✅ 완료  | 낮음   | 없음            |
| **3** | 배포 파이프라인       | 2/15 전  | 중간   | EAS 빌드 성공   |
| **4** | MCP 장기 기억         | 3월 이후 | 중간   | 사용자 데이터   |
| **5** | 도메인 전문가         | 3월 이후 | 중간   | principles 문서 |
| **6** | MCP 컨텍스트 모니터링 | 3월 이후 | 중간   | MCP 서버        |
| **7** | 멀티 MCP 조정         | 장기     | 높음   | 4, 5, 6 완료    |

---

## Phase 0: 즉시 적용 ✅

### 1. /wrap-up 세션 메모리

**상태**: ✅ 완료

**위치**: `.claude/commands/wrap-up.md`

**기능**:

- 세션 종료 시 컨텍스트 자동 저장
- 미완료 작업 추적
- 다음 세션 시작 컨텍스트 생성

**사용법**:

```bash
/wrap-up                    # 기본 실행
/wrap-up 모바일 빌드 작업    # 주제 지정
```

### 2. 품질 게이트 자동화

**상태**: ✅ 완료

**위치**: `scripts/quality-gates.js`

**기능**:

- G5 (테스트 존재) 검사
- G6 (워크플로우 순서) 검사
- G7 (모듈 경계) 검사
- typecheck, lint, test 통합

**사용법**:

```bash
node scripts/quality-gates.js          # 전체 검사
node scripts/quality-gates.js --quick  # 빠른 검사
node scripts/quality-gates.js --gate=G5  # 특정 게이트
```

---

## Phase 1: 앱 출시 전 (~ 2/22)

### 3. 배포 파이프라인 확장

**상태**: ⏳ 계획

**목표**: P7 워크플로우에 배포→모니터링 단계 추가

**현재 P7**:

```
리서치 → 원리 → ADR → 스펙 → 구현
```

**확장된 P7**:

```
리서치 → 원리 → ADR → 스펙 → 구현 → 테스트 → 리뷰 → 배포 → 모니터링
                                                              ↓
                                                        피드백 루프
```

**구현 항목**:

- [ ] `/deploy` 명령어 생성
- [ ] 배포 체크리스트 자동화
- [ ] 모니터링 대시보드 연동 (Sentry/Vercel)

---

## Phase 2: 앱 출시 후 (3월~)

### 4. MCP 장기 기억

**상태**: ⏳ 계획

**목표**: 사용자 분석 히스토리 기반 개인화

**아키텍처**:

```
┌─────────────────────────────────────┐
│         사용자 분석 요청             │
└──────────────┬──────────────────────┘
               ▼
┌──────────────────────────────────────┐
│   Memory MCP Server                   │
│   ┌─────────────────────────────────┐│
│   │ Knowledge Graph                 ││
│   │ - 분석 결과 관계                ││
│   │ - 개선 추이                     ││
│   └─────────────────────────────────┘│
│   ┌─────────────────────────────────┐│
│   │ Vector Store (pgvector)         ││
│   │ - 의미적 유사도 검색            ││
│   │ - 패턴 매칭                     ││
│   └─────────────────────────────────┘│
└──────────────┬───────────────────────┘
               ▼
┌──────────────────────────────────────┐
│   Supabase                            │
│   - skin_assessments                  │
│   - personal_color_assessments        │
│   - body_assessments                  │
│   - user_preferences                  │
└──────────────────────────────────────┘
```

**구현 단계**:

1. Supabase pgvector 확장 활성화
2. 분석 결과 임베딩 생성 파이프라인
3. MCP Server 구현 (Node.js)
4. AI 코칭에 히스토리 컨텍스트 주입

**예상 결과**:

```
"지난 3개월간 피부 수분도가 65 → 72로 개선되었네요!
현재 루틴을 유지하시고, 다음 분석에서 확인해볼게요."
```

**참고 자료**:

- [Integrating Agentic RAG with MCP](https://becomingahacker.org/integrating-agentic-rag-with-mcp-servers-technical-implementation-guide-1aba8fd4e442)
- [Knowledge Graph Memory MCP](https://www.pulsemcp.com/servers/modelcontextprotocol-knowledge-graph-memory)

### 5. 도메인 전문가 에이전트

**상태**: ⏳ 계획

**목표**: 분석 품질 향상을 위한 전문 에이전트

**현재 에이전트**:

- `korean-beauty-validator` - K-뷰티 트렌드
- `korean-ux-writer` - 한국어 UX

**추가 예정**:

| 에이전트              | 역할               | 기반 문서                              |
| --------------------- | ------------------ | -------------------------------------- |
| `skin-science-expert` | 피부 생리학 전문가 | `docs/principles/skin-physiology.md`   |
| `color-theory-expert` | 색채학 전문가      | `docs/principles/color-science.md`     |
| `nutrition-expert`    | 영양학 전문가      | `docs/principles/nutrition-science.md` |

**구현 방식**:

```yaml
# .claude/agents/skin-science-expert.yml
name: skin-science-expert
description: 피부 생리학 기반 분석 검증
tools:
  - Read
  - Grep
  - WebSearch
context:
  - docs/principles/skin-physiology.md
  - docs/research/skin-analysis/
triggers:
  - skin_assessment
  - skincare_recommendation
```

---

### 6. MCP 컨텍스트 모니터링

**상태**: ⏳ 계획

**목표**: 세션 컨텍스트 한도 도달 전 자동 /wrap-up 리마인더

**문제점**:

- 현재 Claude Code에 컨텍스트 사용량 API 없음
- 한도 도달 시 컨텍스트 손실 위험

**제안 아키텍처**:

```
┌─────────────────────────────────────┐
│   MCP Context Monitor Server         │
│   ┌─────────────────────────────────┐│
│   │ Token Counter                   ││
│   │ - 메시지 토큰 추정              ││
│   │ - 누적 사용량 추적              ││
│   └─────────────────────────────────┘│
│   ┌─────────────────────────────────┐│
│   │ Alert System                    ││
│   │ - 70% 도달: 리마인더            ││
│   │ - 85% 도달: 강력 권고           ││
│   │ - 95% 도달: 자동 wrap-up        ││
│   └─────────────────────────────────┘│
└──────────────────────────────────────┘
```

**구현 단계**:

1. 토큰 추정 라이브러리 통합 (tiktoken 등)
2. MCP Server로 메시지 모니터링
3. 임계값 도달 시 알림/자동 실행
4. Claude Code 훅 연동

**대안 (단기)**:

- 메시지 카운트 기반 리마인더 (50개마다)
- 시간 기반 리마인더 (30분마다)
- 수동 `/wrap-up` 습관화

---

## Phase 3: 장기 (Q2 2026~)

### 7. 멀티 MCP 조정

**상태**: ⏳ 장기 계획

**목표**: 복잡한 컨텍스트 조합 처리

**아키텍처**:

```
┌─────────────────────────────────────┐
│           MCP Orchestrator           │
│   - 요청 분석                        │
│   - MCP 라우팅                       │
│   - 결과 병합                        │
└───┬───────┬───────┬───────┬─────────┘
    ▼       ▼       ▼       ▼
┌───────┐┌───────┐┌───────┐┌───────────┐
│Memory ││  DB   ││  AI   ││ External  │
│ MCP   ││ MCP   ││ MCP   ││   MCP     │
└───┬───┘└───┬───┘└───┬───┘└─────┬─────┘
    │        │        │          │
 히스토리  Supabase  Gemini   날씨API
                             어필리에이트
```

**유스케이스**:

```
"오늘 날씨가 건조하고 미세먼지가 많네요.
당신의 피부 타입(복합성)과 최근 수분도 추이를 고려하면,
이 수분 크림을 추천드려요. [제품 링크]"
```

**필요 조건**:

- Phase 2의 Memory MCP 완료
- 외부 API 연동 (날씨, 제품 DB)
- Orchestrator 로직 개발

---

## 의존성 그래프

```
Phase 0 (완료)
├── /wrap-up ✅
└── 품질 게이트 ✅

Phase 1 (2월)
└── 배포 파이프라인
    └── EAS 빌드 성공 (의존)

Phase 2 (3월)
├── MCP 장기 기억
│   └── Supabase pgvector
│   └── 사용자 데이터 축적
├── 도메인 전문가
│   └── principles 문서
└── MCP 컨텍스트 모니터링
    └── MCP 서버 기본 구조
    └── 토큰 추정 라이브러리

Phase 3 (Q2)
└── 멀티 MCP
    └── MCP 장기 기억 (의존)
    └── MCP 컨텍스트 모니터링 (의존)
    └── 외부 API 연동
```

---

## 리스크 및 고려사항

### 기술적 리스크

| 리스크            | 영향                | 대응           |
| ----------------- | ------------------- | -------------- |
| MCP 생태계 미성숙 | 라이브러리 불안정   | 자체 구현 백업 |
| pgvector 성능     | 대량 데이터 시 느림 | 인덱스 최적화  |
| 외부 API 의존     | 서비스 중단 시 영향 | Fallback 로직  |

### 비용 고려

| 항목            | 예상 비용                      | 대안     |
| --------------- | ------------------------------ | -------- |
| MCP 서버 호스팅 | Supabase Edge Functions (무료) | -        |
| Vector DB       | Supabase pgvector (무료 tier)  | Pinecone |
| 외부 API        | 날씨 API (무료 tier)           | 캐싱     |

### 개인정보 고려

- GDPR 준수 필요 (EU 사용자 시)
- 분석 데이터 보관 기간 정책
- 사용자 데이터 삭제 요청 처리

---

## 마일스톤

| 날짜       | 마일스톤                  | 상태 |
| ---------- | ------------------------- | ---- |
| 2026-02-04 | Phase 0 완료              | ✅   |
| 2026-02-15 | 배포 파이프라인           | ⏳   |
| 2026-02-22 | Google Play 출시          | ⏳   |
| 2026-03-15 | MCP 장기 기억 POC         | ⏳   |
| 2026-03-31 | 도메인 전문가 v1          | ⏳   |
| 2026-04-15 | MCP 컨텍스트 모니터링 POC | ⏳   |
| 2026-06-30 | 멀티 MCP v1               | ⏳   |

---

## 관련 문서

- [MOBILE-BUILD-PLAN.md](../../apps/mobile/docs/MOBILE-BUILD-PLAN.md) - 앱 빌드 계획
- [cheeky-jingling-tome.md](../../.claude/plans/cheeky-jingling-tome.md) - 100% 완성 계획
- [00-first-principles.md](../../.claude/rules/00-first-principles.md) - 제1원칙
- [agent-roadmap.md](../../.claude/rules/agent-roadmap.md) - 에이전트 로드맵

---

**Version**: 1.0 | **Updated**: 2026-02-04
