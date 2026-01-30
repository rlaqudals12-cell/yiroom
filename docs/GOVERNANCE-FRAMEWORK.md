# 이룸 Solo Founder Governance Framework

> **Version**: 1.0 | **Created**: 2026-01-23
> **Status**: `active`
> **적용 대상**: 1인 창업자 / Pre-seed ~ Series A

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"모든 C-Level 기능이 문서화되어,
1인 → 10인 → 100인 조직으로 확장해도
의사결정 품질이 일관되게 유지되는 상태"
```

| 영역 | 궁극의 형태 |
|------|------------|
| **의사결정** | 모든 결정의 근거가 추적 가능 (ADR, OKR) |
| **위임** | 24시간 내 신규 C-Level 온보딩 가능 |
| **자동화** | 반복 결정은 정책으로 자동 처리 |
| **측정** | 모든 KPI가 실시간 대시보드화 |

### 현재 달성도: **70%**

| 항목 | 목표 | 현재 | 갭 |
|------|------|------|-----|
| 기능 문서화 | 6개 C-Level | 6개 ✅ | - |
| 의사결정 ADR | 100% | 95% | -5% |
| 위임 준비도 | 24시간 온보딩 | 1주 | 개선 필요 |
| KPI 대시보드 | 자동화 | 수동 | 향후 |

### 의도적 제외

| 항목 | 이유 | 재검토 시점 |
|------|------|------------|
| 이사회 구성 | Pre-seed 단계 불필요 | Series A |
| 보상위원회 | 1인 조직 | 5명+ 채용 시 |
| 감사위원회 | 초기 단계 | Series B |
| **구독 결제 시스템** | 어필리에이트 우선 전략 ([ADR-054](./adr/ADR-054-affiliate-first-monetization.md)) | MAU 10,000+ |
| **베타 사용자 확보 캠페인** | MVP 안정화 우선, PMF 검증 후 진행 | MVP 완료 후 |

---

## 1. 목적

```
"C-Level 직함이 아닌 C-Level 기능을 체계화하여,
1인이 모든 의사결정을 수행하되 스케일업 시 즉시 위임 가능한 구조"
```

### 1.1 왜 필요한가? (P0 적용)

| 질문 | 답변 |
|------|------|
| 1인 스타트업에 거버넌스가 필요한가? | **기능**은 필요, **조직**은 불필요 |
| 삭제하면 어떻게 되는가? | 투자 유치 시 거버넌스 질문 대응 불가, 스케일업 시 혼란 |
| 더 단순한 방법은? | 의사결정 원칙 문서화 (최소한의 오버헤드) |

### 1.2 리서치 근거

- **Carta Report 2024**: 솔로 파운더 스타트업 비율 38% (2015년 22.2%에서 증가)
- **PwC 2026 Governance Trends**: AI 활용 데이터 기반 의사결정 강조
- **First Round Review**: 의사결정 시점(WHEN)이 내용(WHAT)보다 중요

---

## 2. Function Accountability Chart (FACe)

> "모든 기능에 책임자가 있어야 한다 - 1인일 때는 모두 창업자"

```
┌─────────────────────────────────────────────────────────────────┐
│                 이룸 Function Accountability Chart               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   CEO 기능 (비전/전략)           현재: 창업자                    │
│   ├── 비전 및 미션 정의          → FIRST-PRINCIPLES.md          │
│   ├── 전략적 의사결정            → BUSINESS-MODEL.md            │
│   ├── 투자자 관계                → GOOGLE-STARTUP-PLAN.md       │
│   └── 파트너십/제휴              → AFFILIATE-INTEGRATION.md     │
│                                                                  │
│   CTO 기능 (기술)                현재: 창업자                    │
│   ├── 기술 비전 및 로드맵        → ARCHITECTURE.md              │
│   ├── 아키텍처 결정              → docs/adr/                    │
│   ├── 기술 스택 선택             → ADR-003, ADR-005             │
│   └── 개발 프로세스              → .claude/rules/               │
│                                                                  │
│   CPO 기능 (제품)                현재: 창업자                    │
│   ├── 제품 로드맵                → ENGINEERING-ROADMAP-v3.md    │
│   ├── 기능 우선순위              → P0-P8 원칙 적용              │
│   ├── UX/UI 방향                 → SDD-*-UX-*.md                │
│   └── 사용자 피드백              → (향후 도입)                   │
│                                                                  │
│   CFO 기능 (재무)                현재: 창업자                    │
│   ├── 재무 모델링                → FINANCIAL-MODEL.md           │
│   ├── 런웨이 관리                → Unit Economics               │
│   ├── 비용 최적화                → API 비용, 인프라 비용        │
│   └── 투자 유치 준비             → GOOGLE-STARTUP-PLAN.md       │
│                                                                  │
│   CMO 기능 (성장)                현재: 창업자 (최소화)           │
│   ├── 성장 지표 정의             → BUSINESS-METRICS.md          │
│   ├── 사용자 획득 전략           → ADR-056 (2026 마케팅 전략)   │
│   ├── 채널 전략                  → ADR-056 (Phase별 채널)       │
│   ├── 콘텐츠 전략                → ADR-056 (콘텐츠 4대 필러)    │
│   └── 브랜드 전략                → (스케일업 단계)              │
│                                                                  │
│   CDO 기능 (데이터)              현재: 창업자                    │
│   ├── 데이터 전략                → personalization-engine.md    │
│   ├── 개인화 엔진                → ADR-036                      │
│   └── 크로스모듈 인사이트        → cross-domain-synergy.md      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 의사결정 프레임워크

### 3.1 결정 유형 분류

| 유형 | 특성 | 접근법 | 시간 |
|------|------|--------|------|
| **Type 1** | 되돌릴 수 없음 | 신중하게, 모든 Gate 통과 | 1일+ |
| **Type 2** | 되돌릴 수 있음 | 빠르게 실행, 결과 관찰 | 즉시~1시간 |

### 3.2 Type 1 결정 (신중)

```
예시:
- 기술 스택 변경
- 비즈니스 모델 피벗
- 주요 파트너십 체결
- 법적 구조 변경
- 핵심 인력 채용

프로세스:
1. 문제 정의 (P0: 요구사항 의심)
2. 대안 탐색 (최소 3개)
3. ADR 작성 (결정 근거 문서화)
4. 24시간 숙려
5. 실행
```

### 3.3 Type 2 결정 (빠르게)

```
예시:
- UI 색상/레이아웃
- 내부 리팩토링
- 문서 구조 변경
- 테스트 방식

프로세스:
1. 15분 분석
2. 실행
3. 결과 관찰
4. 필요시 롤백
```

### 3.4 RICE 우선순위 프레임워크

```
RICE Score = (Reach × Impact × Confidence) / Effort

| 항목 | 정의 | 척도 |
|------|------|------|
| Reach | 영향 받는 사용자 수 | 월간 사용자 수 |
| Impact | 개별 영향도 | 0.25 / 0.5 / 1 / 2 / 3 |
| Confidence | 확신도 | 50% / 80% / 100% |
| Effort | 개발 공수 | person-weeks |
```

---

## 4. 책임 구조 (RACI)

### 4.1 Solo Founder RACI

| 영역 | R (수행) | A (책임) | C (자문) | I (통보) |
|------|---------|---------|---------|---------|
| 기술 결정 | 창업자 | 창업자 | Claude AI | - |
| 제품 결정 | 창업자 | 창업자 | 사용자 피드백 | - |
| 재무 결정 | 창업자 | 창업자 | 멘토/조언자 | 투자자 |
| 법적 결정 | 창업자 | 창업자 | 법률 자문 | - |

### 4.2 AI 자문 활용

```
Claude AI 활용 영역:
- 기술 아키텍처 검토
- 코드 품질 검증
- 문서 작성 및 정리
- 리서치 및 분석
- 테스트 자동화

주의: AI는 "자문(C)" 역할, 최종 "책임(A)"은 항상 창업자
```

---

## 5. OKR 프레임워크

### 5.1 분기별 OKR 구조

```
Objective (목표): 정성적, 영감을 주는 목표
├── Key Result 1: 측정 가능한 결과 (숫자)
├── Key Result 2: 측정 가능한 결과 (숫자)
└── Key Result 3: 측정 가능한 결과 (숫자)
```

### 5.2 2026 Q1 OKR 예시

> **상세 OKR 및 KPI**: [BUSINESS-METRICS.md](./BUSINESS-METRICS.md) 참조

```
O1: MVP 안정화 → KR: 7개 분석 모듈 완료, 테스트 커버리지 80%+
O2: PMF 검증 → KR: 베타 100명, D7 리텐션 30%+
O3: 투자 준비 → KR: 피치덱 완성, 재무 모델 3개 시나리오
```

---

## 6. 지원 구조

### 6.1 비공식 자문단 (Advisory)

| 역할 | 필요 시점 | 보상 |
|------|----------|------|
| 기술 멘토 | 아키텍처 결정 시 | 0.1-0.5% equity |
| 비즈니스 멘토 | 전략 결정 시 | 0.1-0.5% equity |
| 법률 자문 | 계약/규제 이슈 | 시간당 비용 |
| 회계 자문 | 재무/세무 | 월정액 |

### 6.2 Fractional Executive (스케일업 시)

```
시리즈 A 이후 검토:
- Fractional CFO: 재무 전략, 투자 관리
- Fractional CMO: 성장 전략, 마케팅
- Fractional CHRO: 채용, 조직 문화
```

---

## 7. 스케일업 트리거

### 7.1 조직 확장 시점

| 트리거 | 조건 | 액션 |
|--------|------|------|
| **첫 채용** | MAU 10,000+ 또는 시리즈 A | 핵심 엔지니어 |
| **전문 경영인** | MAU 100,000+ 또는 시리즈 B | COO/CFO 검토 |
| **경영진 구성** | MAU 500,000+ | C-Level 팀 구성 |

### 7.2 위임 준비 상태 체크

```
각 기능별 위임 가능 조건:
□ 해당 기능의 의사결정 원칙 문서화
□ 핵심 프로세스 정의
□ 성과 지표 (KPI) 명확화
□ 온보딩 자료 준비
```

---

## 8. 이룸 문서 매핑

### 8.1 C-Level 기능별 문서

| 기능 | 핵심 문서 | 상태 |
|------|----------|------|
| **CEO** | FIRST-PRINCIPLES.md, ULTIMATE-FORM.md, BUSINESS-MODEL.md | ✅ |
| **CTO** | ARCHITECTURE.md, docs/adr/*, .claude/rules/* | ✅ |
| **CPO** | docs/specs/*, ENGINEERING-ROADMAP-v3.md | ✅ |
| **CFO** | FINANCIAL-MODEL.md, BUSINESS-METRICS.md | ✅ |
| **CMO** | BUSINESS-METRICS.md, ADR-056 (마케팅 전략) | ✅ |
| **CDO** | personalization-engine.md, cross-domain-synergy.md | ✅ |

### 8.2 향후 필요 문서

| 문서 | 용도 | 우선순위 | 상태 |
|------|------|----------|------|
| ~~EXECUTIVE-SUMMARY.md~~ | 투자자 1-pager | ~~P1~~ | ✅ 완료 |
| ~~RISK-MATRIX.md~~ | 리스크 관리 | ~~P2~~ | ✅ 완료 |
| **EXIT-STRATEGY.md** | 장기 비전 | P3 | 미작성 |

---

## 9. 정기 리뷰 사이클

### 9.1 리뷰 주기

| 주기 | 내용 | 산출물 |
|------|------|--------|
| **일간** | 태스크 진행 상황 | Todo 업데이트 |
| **주간** | 스프린트 회고 | 주간 리포트 |
| **월간** | KPI 검토 | 메트릭 대시보드 |
| **분기** | OKR 평가, 전략 조정 | 분기 리뷰 |
| **연간** | 비전/전략 재검토 | 연간 계획 |

### 9.2 Solo Founder 번아웃 방지

```
권장 사항:
- 주 1회 "결정 없는 날" (의도적 휴식)
- 중요 결정은 오전에 (의사결정 피로 고려)
- 매일 3가지 우선순위만 설정
- 자동화 가능한 것은 자동화
```

---

## 10. 참고 자료

### 리서치 출처

- [PwC 2026 Corporate Governance Trends](https://www.pwc.com/us/en/services/governance-insights-center/library/corporate-governance-trends.html)
- [First Round Review - 6 Decision-Making Frameworks](https://review.firstround.com/the-6-decision-making-frameworks-that-help-startup-leaders-tackle-tough-calls/)
- [Growth Institute - 4 Decisions to Scale](https://blog.growthinstitute.com/scale-up-blueprint/4-key-decisions-scale-startup)
- [Technori - Solo Founders](https://technori.com/2025/07/22540-solo-founders/ava/)
- [Startup OG - Frameworks for Solo Founders](https://startupog.com/blog/mastering-time-7-essential-frameworks-for-solo-founder-success/)

### 관련 이룸 문서

- [FIRST-PRINCIPLES.md](./FIRST-PRINCIPLES.md) - 제1원칙
- [BUSINESS-MODEL.md](./BUSINESS-MODEL.md) - 비즈니스 모델
- [FINANCIAL-MODEL.md](./FINANCIAL-MODEL.md) - 재무 모델
- [ARCHITECTURE.md](./ARCHITECTURE.md) - 기술 아키텍처

---

**Version**: 1.3 | **Created**: 2026-01-23 | **Updated**: 2026-01-24 | **Author**: Claude Code

### 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.3 | 2026-01-24 | CMO 기능 강화 - ADR-056 마케팅 전략 문서 연결, 채널/콘텐츠 전략 추가 |
| 1.2 | 2026-01-24 | 의도적 제외 항목 추가 (구독 결제 시스템, 베타 캠페인) - ADR-054 참조 |
| 1.1 | 2026-01-23 | P1 궁극의 형태 섹션 추가, OKR 예시 축소, EXECUTIVE-SUMMARY 완료 표시 |
| 1.0 | 2026-01-23 | 초기 버전 |
