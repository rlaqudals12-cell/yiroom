# 이룸 문서 인덱스

> **문서 허브** - 모든 프로젝트 문서의 진입점
> **Version**: 2.5 | **Updated**: 2026-01-29

---

## 읽기 순서 가이드

```
신규 개발자/기여자를 위한 권장 순서:

1. FIRST-PRINCIPLES.md     ← 프로젝트 철학, 제1원칙
2. ARCHITECTURE.md         ← 시스템 전체 구조
3. principles/README.md    ← 도메인 원리 개요
4. adr/README.md           ← 기술 결정 개요
5. specs/ 관련 스펙        ← 구현할 기능 상세

P7 워크플로우 순서:
리서치 → 원리 → ADR → 스펙 → 구현
```

---

## 핵심 문서

| 문서 | 설명 | 상태 |
|------|------|------|
| [FIRST-PRINCIPLES.md](./FIRST-PRINCIPLES.md) | **제1원칙** - P0~P8, 모든 작업의 출발점 | ✅ 필독 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 시스템 아키텍처 개요 | ✅ 필독 |
| [IMPLEMENTATION-STATUS.md](./IMPLEMENTATION-STATUS.md) | **구현 현황** - 61 SDD P1/P3 추적, 우선순위 | ✅ NEW |
| [ULTIMATE-FORM.md](./ULTIMATE-FORM.md) | 궁극의 형태 정의 (P1) | ✅ 참조 |
| [DATABASE-SCHEMA.md](./DATABASE-SCHEMA.md) | DB 스키마, RLS 정책 | ✅ 참조 |
| [TECH-DECISIONS.md](./TECH-DECISIONS.md) | 기술 선택 요약 | ✅ 참조 |
| [DEVELOPER-ONBOARDING.md](./DEVELOPER-ONBOARDING.md) | **새 개발자 온보딩** - 24시간 내 첫 PR | ✅ 참조 |

---

## 비즈니스 문서 ⭐ NEW

| 문서 | 설명 | 상태 |
|------|------|------|
| [EXECUTIVE-SUMMARY.md](./EXECUTIVE-SUMMARY.md) | **투자자 1-pager** - 문제/솔루션/비즈니스 모델 | ✅ NEW |
| [GOVERNANCE-FRAMEWORK.md](./GOVERNANCE-FRAMEWORK.md) | **Solo Founder 거버넌스** - FACe, RACI, OKR | ✅ NEW |
| [BUSINESS-MODEL.md](./BUSINESS-MODEL.md) | 4가지 수익 채널, 손익분기점 | ✅ |
| [FINANCIAL-MODEL.md](./FINANCIAL-MODEL.md) | AI/인프라 비용, MAU 시뮬레이션 | ✅ |
| [BUSINESS-METRICS.md](./BUSINESS-METRICS.md) | KPI 정의, CAC/LTV, 리텐션 | ✅ |
| [GOOGLE-STARTUP-PLAN.md](./GOOGLE-STARTUP-PLAN.md) | Google for Startups 계획 | ✅ |
| [GLOBAL-EXPANSION-ROADMAP.md](./GLOBAL-EXPANSION-ROADMAP.md) | 한국→일본→미국 확장 | ✅ |
| [RISK-MATRIX.md](./RISK-MATRIX.md) | 리스크 매트릭스 | ✅ NEW |

---

## 법무/규제 문서 ⭐ NEW

| 문서 | 설명 | 상태 |
|------|------|------|
| [legal/PRIVACY-COMPLIANCE.md](./legal/PRIVACY-COMPLIANCE.md) | 개인정보보호법 준수 가이드 | ✅ |
| [legal/MEDICAL-BOUNDARY.md](./legal/MEDICAL-BOUNDARY.md) | 의료기기 경계 정의 | ✅ |
| [legal/ADVERTISING-DISCLOSURE.md](./legal/ADVERTISING-DISCLOSURE.md) | 광고 표기 가이드 | ✅ |
| [legal/TERMS-OF-SERVICE.md](./legal/TERMS-OF-SERVICE.md) | 이용약관 템플릿 | ✅ |

---

## 운영 문서 ⭐ NEW

| 문서 | 설명 | 상태 |
|------|------|------|
| [ops/LAUNCH-CHECKLIST.md](./ops/LAUNCH-CHECKLIST.md) | 출시 전 체크리스트 | ✅ |
| [ops/INCIDENT-RESPONSE.md](./ops/INCIDENT-RESPONSE.md) | 위기 대응 플레이북 | ✅ |
| [ops/QA-PROCESS.md](./ops/QA-PROCESS.md) | QA 프로세스 가이드 | ✅ |
| [TEST-COVERAGE-STATUS.md](./TEST-COVERAGE-STATUS.md) | **테스트 커버리지 현황** - 506개 테스트, 모듈별 분포 | ✅ NEW |

---

## 문서 카테고리

### 1. 원리 문서 (Principles) - `docs/principles/`

> **P2 원칙**: 원리 없는 구현 금지

| 문서 | 관련 모듈 | 핵심 내용 |
|------|----------|----------|
| [color-science.md](./principles/color-science.md) | PC-1 | Lab 색공간, 웜톤/쿨톤 이론, 4계절 좌표 |
| [skin-physiology.md](./principles/skin-physiology.md) | S-1 | 피부 구조, 붉은기/트러블 정의 |
| [body-mechanics.md](./principles/body-mechanics.md) | C-1 | 골격 비율, 체형 분류 |
| [exercise-physiology.md](./principles/exercise-physiology.md) | W-1 | MET, 근육 역학, 회복 이론 |
| [nutrition-science.md](./principles/nutrition-science.md) | N-1 | BMR/TDEE, 영양소 균형 |
| [image-processing.md](./principles/image-processing.md) | CIE | Laplacian, AWB, 얼굴 각도 |
| [fashion-matching.md](./principles/fashion-matching.md) | 커머스 | 색상 조화, 체형 매칭, 캡슐 옷장 |
| [ai-inference.md](./principles/ai-inference.md) | AI | VLM 프롬프팅, 신뢰도 계산 |
| [security-patterns.md](./principles/security-patterns.md) | Auth | JWT, RLS, OWASP |
| [legal-compliance.md](./principles/legal-compliance.md) | Legal | 개인정보보호법, 의료기기법 |
| [accessibility.md](./principles/accessibility.md) | UX | WCAG 2.1 AA, WAI-ARIA, POUR |

📖 **상세**: [principles/README.md](./principles/README.md)

---

### 2. ADR (Architecture Decision Records) - `docs/adr/`

> **기술 결정 기록** - 왜 이 선택을 했는가?

#### 핵심 ADR

| ADR | 제목 | 관련 원리 |
|-----|------|----------|
| [ADR-001](./adr/ADR-001-core-image-engine.md) | Core Image Engine | image-processing |
| [ADR-003](./adr/ADR-003-ai-model-selection.md) | AI 모델 선택 (Gemini) | ai-inference |
| [ADR-004](./adr/ADR-004-auth-strategy.md) | 인증 전략 (Clerk) | security-patterns |
| [ADR-007](./adr/ADR-007-mock-fallback-strategy.md) | Mock Fallback 전략 | ai-inference |
| [ADR-033](./adr/ADR-033-face-detection-library.md) | 얼굴 감지 라이브러리 | image-processing |

#### 커머스 ADR ⭐ NEW

| ADR | 제목 | 관련 원리 |
|-----|------|----------|
| [ADR-034](./adr/ADR-034-product-color-classification.md) | 상품 색상 자동 분류 | fashion-matching |
| [ADR-035](./adr/ADR-035-smart-link-routing.md) | 스마트 링크 라우팅 | - |

#### 법률/규정 ADR

| ADR | 제목 | 관련 원리 |
|-----|------|----------|
| [ADR-022](./adr/ADR-022-age-verification.md) | 연령 인증 | legal-compliance |
| [ADR-023](./adr/ADR-023-terms-agreement-flow.md) | 약관 동의 플로우 | legal-compliance |
| [ADR-024](./adr/ADR-024-ai-transparency.md) | AI 투명성 | legal-compliance |
| [ADR-025](./adr/ADR-025-audit-logging.md) | 감사 로깅 | security-patterns |

#### 인프라/접근성 ADR ⭐ NEW

| ADR | 제목 | 관련 원리 |
|-----|------|----------|
| [ADR-048](./adr/ADR-048-accessibility-strategy.md) | 접근성 전략 (WCAG 2.1 AA) | accessibility |
| [ADR-049](./adr/ADR-049-cicd-pipeline.md) | CI/CD 파이프라인 | - |
| [ADR-050](./adr/ADR-050-fashion-closet-crossmodule.md) | Fashion-Closet 크로스모듈 | fashion-matching |
| [ADR-051](./adr/ADR-051-2026-ux-trends.md) | 2026 UX 트렌드 | - |

📖 **전체 목록**: [adr/README.md](./adr/README.md)

---

### 3. 스펙 문서 (Specifications) - `docs/specs/`

> **구현 스펙** - 무엇을 어떻게 만들 것인가?

#### Phase 1: 핵심 분석 (PC-1, S-1, C-1)

| 스펙 | 설명 | P3 점수 |
|------|------|---------|
| [SDD-S1-UX-IMPROVEMENT](./specs/SDD-S1-UX-IMPROVEMENT.md) | 피부 분석 UX 개선 | 85점 |
| [SDD-VISUAL-SKIN-REPORT](./specs/SDD-VISUAL-SKIN-REPORT.md) | 시각적 피부 리포트 | 70점 |

#### Phase 2: 이미지 엔진 (CIE)

| 스펙 | 설명 | P3 점수 |
|------|------|---------|
| [SDD-CIE-3-AWB-CORRECTION](./specs/SDD-CIE-3-AWB-CORRECTION.md) | AWB 색보정 | 25점 (planned) |

#### Phase 4: 글로벌 커머스 ⭐ NEW

| 스펙 | 설명 | P3 점수 |
|------|------|---------|
| [SDD-AUTO-COLOR-CLASSIFICATION](./specs/SDD-AUTO-COLOR-CLASSIFICATION.md) | 상품 색상 자동 분류 | 35점 (draft) |
| [SDD-CAPSULE-WARDROBE](./specs/SDD-CAPSULE-WARDROBE.md) | 캡슐 옷장 시스템 | 40점 (draft) |
| [SDD-GLOBAL-PARTNERS-EXPANSION](./specs/SDD-GLOBAL-PARTNERS-EXPANSION.md) | 글로벌 파트너 확장 | 45점 (draft) |

#### 법률/규정

| 스펙 | 설명 | P3 점수 |
|------|------|---------|
| [SDD-N-1-AGE-VERIFICATION](./specs/SDD-N-1-AGE-VERIFICATION.md) | 연령 인증 | 92점 |
| [SDD-AI-TRANSPARENCY](./specs/SDD-AI-TRANSPARENCY.md) | AI 투명성 | 85점 |
| [SDD-AUDIT-LOGGING](./specs/SDD-AUDIT-LOGGING.md) | 감사 로깅 | 95점 |

#### 인프라/데이터

| 스펙 | 설명 | P3 점수 |
|------|------|---------|
| [SDD-HYBRID-DATA-EXTENSION](./specs/SDD-HYBRID-DATA-EXTENSION.md) | 하이브리드 데이터 | 90점 |
| [SDD-DB-MIGRATION-MANAGEMENT](./specs/SDD-DB-MIGRATION-MANAGEMENT.md) | DB 마이그레이션 | 65점 |

#### 인프라/DevOps ⭐ NEW

| 스펙 | 설명 | P3 점수 |
|------|------|---------|
| [SDD-CI-CD-PIPELINE](./specs/SDD-CI-CD-PIPELINE.md) | CI/CD 파이프라인 | ✅ NEW |
| [SDD-MONITORING](./specs/SDD-MONITORING.md) | 모니터링/관측성 | 계획됨 |
| [SDD-ACCESSIBILITY](./specs/SDD-ACCESSIBILITY.md) | 접근성 (WCAG 2.1 AA) | ✅ NEW |

#### 크로스 모듈 ⭐ NEW

| 스펙 | 설명 | P3 점수 |
|------|------|---------|
| [SDD-FASHION-CLOSET-INTEGRATION](./specs/SDD-FASHION-CLOSET-INTEGRATION.md) | Fashion-Closet 통합 | 계획됨 |
| [SDD-2026-UX-TRENDS](./specs/SDD-2026-UX-TRENDS.md) | 2026 UX 트렌드 적용 | 계획됨 |

📖 **전체 목록**: [specs/README.md](./specs/README.md)

---

### 4. 규칙 문서 - `.claude/rules/`

| 문서 | 설명 |
|------|------|
| [00-first-principles.md](../.claude/rules/00-first-principles.md) | 제1원칙 (P0~P8) |
| [code-style.md](../.claude/rules/code-style.md) | 코드 스타일 규칙 |
| [typescript-strict.md](../.claude/rules/typescript-strict.md) | TypeScript 엄격 모드 |
| [react-patterns.md](../.claude/rules/react-patterns.md) | React 패턴 |
| [mobile-patterns.md](../.claude/rules/mobile-patterns.md) | 모바일 패턴 |
| [prompt-engineering.md](../.claude/rules/prompt-engineering.md) | 프롬프트 엔지니어링 |
| [encapsulation.md](../.claude/rules/encapsulation.md) | 모듈 경계 |

📖 **전체 목록**: [.claude/rules/README.md](../.claude/rules/README.md)

---

### 5. 리서치 문서 - `docs/research/`

| 폴더 | 내용 | 파일 수 |
|------|------|---------|
| `claude-ai-research/` | 기술 리서치 (AI, 보안, RAG 등) | 96개 |
| `compass-artifacts/` | 비즈니스 리서치 | 26개 |
| `bundles/` | 리서치 번들 | 다수 |

---

## 문서 현황 요약

| 카테고리 | 문서 수 | 완성도 |
|----------|---------|--------|
| 핵심 문서 | 5 | 100% |
| 비즈니스 | 8 | 100% |
| 법무/규제 | 4 | 100% |
| 운영 | 3 | 100% |
| 원리 | 24 | 95% |
| ADR | 53 | 95% |
| 스펙 | 60 | 90% |
| **총계** | **150+** | **~95%** |

---

## P7 워크플로우 체크리스트

새 기능 구현 전 확인:

```
□ 리서치 완료? → docs/research/claude-ai-research/
□ 원리 문서화? → docs/principles/
□ ADR 작성? → docs/adr/
□ 스펙 확정? → docs/specs/
□ P3 원자 분해? → 스펙 내 "P3 원자 분해" 섹션

하나라도 누락 시 → 해당 단계부터 시작
```

---

## 관련 문서

- [CLAUDE.md](../CLAUDE.md) - Claude Code 지침
- [apps/web/CLAUDE.md](../apps/web/CLAUDE.md) - 웹 앱 규칙
- [.claude/rules/](../.claude/rules/) - 코딩 규칙
- [.claude/agents/](../.claude/agents/) - 전문 에이전트
- [.claude/commands/](../.claude/commands/) - 슬래시 명령어

---

**Author**: Claude Code
**Reviewed by**: -
